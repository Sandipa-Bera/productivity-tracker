import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const DEFAULT_FOCUS_MINUTES = 50
const MAX_BREAK_MINUTES = 15
// Alarm escalation: volume step every N seconds.
const ALARM_STEP_SECONDS = 5
const ALARM_VOLUME_START = 0.1   // 10 %
const ALARM_VOLUME_STEP  = 0.15  // +15 % per step
const ALARM_VOLUME_MAX   = 1.0   // 100 %

// ─── Alarm pattern generators (each ≤ 5 s long) ─────────────────────────────
// Return { freq, startOffset, duration, type? } descriptors.
// Gain is supplied externally via the master GainNode.

function patternUrgentBeep() {
  // 3 alternating-pitch beeps in ~4.5 s
  const events = []
  for (let i = 0; i < 3; i++) {
    events.push({ freq: i % 2 === 0 ? 1046 : 880, startOffset: i * 1.4, duration: 0.9 })
  }
  return events
}

function patternRisingScale() {
  // C5 → C6 scale in ~2.8 s
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047]
  const events = []
  notes.forEach((freq, i) => {
    events.push({ freq, startOffset: i * 0.32, duration: 0.28 })
  })
  return events
}

function patternPulseWave() {
  // 5 square-wave pulses
  const events = []
  for (let i = 0; i < 5; i++) {
    events.push({ freq: 660, startOffset: i * 0.9, duration: 0.65, type: 'square' })
  }
  return events
}

function patternSOS() {
  // . . .  _ _ _  . . .  (one full pass ~4.5 s)
  const dot = 0.18, dash = 0.54, gap = 0.09, lg = 0.36
  const events = []
  let t = 0
  const sym = (len) => { events.push({ freq: 800, startOffset: t, duration: len }); t += len + gap }
  ;[dot,dot,dot].forEach(sym); t += lg
  ;[dash,dash,dash].forEach(sym); t += lg
  ;[dot,dot,dot].forEach(sym)
  return events
}

function patternFastPing() {
  // 10 descending pings
  const events = []
  for (let i = 0; i < 10; i++) {
    events.push({ freq: 1200 - i * 30, startOffset: i * 0.45, duration: 0.2 })
  }
  return events
}

const ALARM_PATTERNS = [
  patternUrgentBeep,
  patternRisingScale,
  patternPulseWave,
  patternSOS,
  patternFastPing,
]

export default function FocusPage() {
  const [tasks, setTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState('')
  const [sessionType, setSessionType] = useState('focus')

  const [durationMinutes, setDurationMinutes] = useState(
    DEFAULT_FOCUS_MINUTES
  )

  const [status, setStatus] = useState('idle')
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState('')
  const [alarmActive, setAlarmActive] = useState(false)
  const [completedSessionType, setCompletedSessionType] = useState('focus')
  const [alarmVolumePct, setAlarmVolumePct] = useState(ALARM_VOLUME_START)

  const audioContextRef = useRef(null)
  const finishingRef = useRef(false)
  const alarmNodesRef  = useRef([])          // active oscillators
  const masterGainRef  = useRef(null)        // shared GainNode
  const alarmIntervalRef = useRef(null)      // setInterval handle
  const alarmVolumeRef   = useRef(ALARM_VOLUME_START) // current volume (0-1)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, category')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (!error) {
      setTasks(data || [])
    }
  }

  // Keep timer accurate even when switching tabs.
  useEffect(() => {
    if (status !== 'running' || !startedAt) return

    const updateTimer = () => {
      const now = Date.now()

      const currentElapsed =
        elapsedBeforePause +
        Math.floor((now - startedAt) / 1000)

      setElapsedSeconds(currentElapsed)
    }

    updateTimer()

    const interval = setInterval(updateTimer, 500)

    return () => clearInterval(interval)
  }, [status, startedAt, elapsedBeforePause])

  const targetSeconds = durationMinutes * 60

  const remainingSeconds = Math.max(
    targetSeconds - elapsedSeconds,
    0
  )

  const progress = Math.min(
    (elapsedSeconds / targetSeconds) * 100,
    100
  )

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`
  }, [remainingSeconds])

  // Automatically finish when timer reaches zero.
  useEffect(() => {
    if (
      status === 'running' &&
      elapsedSeconds >= targetSeconds &&
      !finishingRef.current
    ) {
      finishSession()
    }
  }, [elapsedSeconds, targetSeconds, status])

  // Create / unlock the browser audio system.
  function prepareAlarm() {
    try {
      if (!audioContextRef.current) {
        const AudioContext =
          window.AudioContext || window.webkitAudioContext

        if (AudioContext) {
          audioContextRef.current = new AudioContext()
        }
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state === 'suspended'
      ) {
        audioContextRef.current.resume()
      }
    } catch {
      // Audio isn't supported; browser notification can still work.
    }
  }

  // Stop all oscillators, clear the interval, disconnect the master gain.
  function stopAlarm() {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current)
      alarmIntervalRef.current = null
    }
    alarmNodesRef.current.forEach((node) => {
      try { node.stop() } catch { /* already finished */ }
    })
    alarmNodesRef.current = []
    if (masterGainRef.current) {
      try { masterGainRef.current.disconnect() } catch { /* ok */ }
      masterGainRef.current = null
    }
    alarmVolumeRef.current = ALARM_VOLUME_START
    setAlarmVolumePct(ALARM_VOLUME_START)
    setAlarmActive(false)
  }

  // Schedule one 5-second batch of oscillators through the master gain.
  function scheduleAlarmBatch(audioContext, masterGain, patternFn) {
    const now = audioContext.currentTime
    const vol = alarmVolumeRef.current
    const events = patternFn()
    const nodes = []

    events.forEach(({ freq, startOffset, duration, type = 'sine' }) => {
      if (startOffset >= ALARM_STEP_SECONDS) return

      const osc  = audioContext.createOscillator()
      const gain = audioContext.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, now + startOffset)

      // Per-note envelope (relative — master gain controls overall loudness)
      gain.gain.setValueAtTime(0.0001, now + startOffset)
      gain.gain.exponentialRampToValueAtTime(vol, now + startOffset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration)

      osc.connect(gain)
      gain.connect(masterGain)

      osc.start(now + startOffset)
      osc.stop(now + startOffset + duration + 0.05)
      nodes.push(osc)
    })

    // Replace tracked nodes (old ones have already stopped by the time next batch fires)
    alarmNodesRef.current = nodes
  }

  // Start the looping, escalating alarm (runs until stopAlarm() is called).
  function playAlarm() {
    try {
      const audioContext = audioContextRef.current
      if (!audioContext) return
      if (audioContext.state === 'suspended') audioContext.resume()

      // Create a master gain node that we'll ramp up over time.
      const masterGain = audioContext.createGain()
      masterGain.gain.setValueAtTime(ALARM_VOLUME_START, audioContext.currentTime)
      masterGain.connect(audioContext.destination)
      masterGainRef.current = masterGain

      // Reset volume tracking.
      alarmVolumeRef.current = ALARM_VOLUME_START
      setAlarmVolumePct(ALARM_VOLUME_START)

      // Pick one random pattern for the whole session.
      const patternFn = ALARM_PATTERNS[Math.floor(Math.random() * ALARM_PATTERNS.length)]

      // Play first batch immediately.
      scheduleAlarmBatch(audioContext, masterGain, patternFn)
      setAlarmActive(true)

      // Every ALARM_STEP_SECONDS: schedule next batch + raise volume.
      alarmIntervalRef.current = setInterval(() => {
        // Escalate volume.
        const next = Math.min(alarmVolumeRef.current + ALARM_VOLUME_STEP, ALARM_VOLUME_MAX)
        alarmVolumeRef.current = next
        setAlarmVolumePct(next)

        // Update master gain smoothly.
        if (masterGainRef.current) {
          masterGainRef.current.gain.linearRampToValueAtTime(
            next,
            audioContext.currentTime + 0.5
          )
        }

        // Schedule next batch.
        scheduleAlarmBatch(audioContext, masterGain, patternFn)
      }, ALARM_STEP_SECONDS * 1000)
    } catch {
      // Ignore audio errors so the session can still be saved.
    }
  }

  // Show browser notification.
  function showNotification(title, body) {
    if (!('Notification' in window)) return

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      })
    }
  }

  async function requestNotificationPermission() {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // User/browser may block permission requests.
      }
    }
  }

  async function startSession() {
    setError('')
    finishingRef.current = false

    prepareAlarm()

    // Ask for notification permission from a user action.
    await requestNotificationPermission()

    let finalDuration = Number(durationMinutes)

    if (sessionType === 'break') {
      finalDuration = Math.min(
        finalDuration,
        MAX_BREAK_MINUTES
      )

      setDurationMinutes(finalDuration)
    }

    setElapsedSeconds(0)
    setElapsedBeforePause(0)
    setStartedAt(Date.now())
    setStatus('running')
  }

  function pauseSession() {
    if (status !== 'running' || !startedAt) return

    const now = Date.now()

    const currentElapsed =
      elapsedBeforePause +
      Math.floor((now - startedAt) / 1000)

    setElapsedBeforePause(currentElapsed)
    setElapsedSeconds(currentElapsed)
    setStartedAt(null)
    setStatus('paused')
  }

  function resumeSession() {
    if (status !== 'paused') return

    prepareAlarm()

    setStartedAt(Date.now())
    setStatus('running')
  }

  async function finishSession() {
    if (status === 'idle' || finishingRef.current) return

    finishingRef.current = true

    const finalDuration = Math.min(
      elapsedSeconds,
      targetSeconds
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in.')
      finishingRef.current = false
      return
    }

    const endTime = new Date().toISOString()

    // Calculate when the session originally started.
    const startTime = new Date(
      Date.now() - finalDuration * 1000
    ).toISOString()

    const { error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        task_id: selectedTask || null,
        started_at: startTime,
        ended_at: endTime,
        duration_seconds: finalDuration,
        session_type: sessionType,
      })

    if (error) {
      setError(error.message)
      finishingRef.current = false
      return
    }

    // 🔔 Remember session type for the alarm overlay label
    setCompletedSessionType(sessionType)

    // 🔔 Alarm
    playAlarm()

    // 🔔 Browser notification
    if (sessionType === 'focus') {
      showNotification(
        'Focus session complete 🎯',
        'Great work! Your focus session has ended. Take a short break.'
      )
    } else {
      showNotification(
        'Break complete ☕',
        'Break is over. Ready to get back to work?'
      )
    }

    resetTimer()
  }

  function resetTimer() {
    setStatus('idle')
    setStartedAt(null)
    setElapsedBeforePause(0)
    setElapsedSeconds(0)
    finishingRef.current = false
  }

  function changeSessionType(type) {
    if (status !== 'idle') return

    setSessionType(type)

    if (type === 'focus') {
      setDurationMinutes(DEFAULT_FOCUS_MINUTES)
    } else {
      setDurationMinutes(MAX_BREAK_MINUTES)
    }
  }

  function handleDurationChange(event) {
    let value = Number(event.target.value)

    if (sessionType === 'break') {
      value = Math.min(value, MAX_BREAK_MINUTES)
    } else {
      value = Math.min(value, 240)
    }

    value = Math.max(value, 1)

    setDurationMinutes(value)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Alarm overlay ── */}
      {alarmActive && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: '2.5rem 3rem',
              borderRadius: '1.25rem',
              background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 0 60px rgba(99,102,241,0.45), 0 0 120px rgba(99,102,241,0.2)',
              maxWidth: '380px',
              width: '90vw',
              animation: 'alarmPulse 1s ease-in-out infinite',
            }}
          >
            <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '0.5rem' }}>
              {completedSessionType === 'focus' ? '🎯' : '☕'}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              {completedSessionType === 'focus' ? 'Focus Complete!' : 'Break Over!'}
            </h2>
            <p style={{ color: '#a5b4fc', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {completedSessionType === 'focus'
                ? 'Great work! Time to take a well-earned break.'
                : 'Ready to dive back in? Let\'s go!'}
            </p>

            {/* Volume escalation bar */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>🔊 Volume</span>
                <span style={{ fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 600 }}>
                  {Math.round(alarmVolumePct * 100)}%
                </span>
              </div>
              <div style={{
                height: '8px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${alarmVolumePct * 100}%`,
                  borderRadius: '999px',
                  background: alarmVolumePct >= 0.8
                    ? 'linear-gradient(90deg,#f97316,#ef4444)'
                    : alarmVolumePct >= 0.5
                    ? 'linear-gradient(90deg,#eab308,#f97316)'
                    : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                  transition: 'width 0.5s ease, background 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>
                Rises every {ALARM_STEP_SECONDS}s until you stop it
              </p>
            </div>
            <button
              id="stop-alarm-btn"
              onClick={stopAlarm}
              style={{
                padding: '0.75rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                color: '#fff',
                boxShadow: '0 0 24px rgba(99,102,241,0.6)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.06)'
                e.currentTarget.style.boxShadow = '0 0 36px rgba(99,102,241,0.85)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 0 24px rgba(99,102,241,0.6)'
              }}
            >
              🔕 Stop Alarm
            </button>
          </div>
        </div>
      )}
      {/* Keyframes injected once */}
      <style>{`
        @keyframes alarmPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(99,102,241,0.45), 0 0 120px rgba(99,102,241,0.2); }
          50%       { box-shadow: 0 0 90px rgba(139,92,246,0.7),  0 0 180px rgba(139,92,246,0.35); }
        }
      `}</style>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Focus
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Work with intention. Track the time you actually spend.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Timer */}
      <Card className="card-padding">
        <div className="text-center">
          {/* Session type */}
          <div className="mx-auto flex w-fit rounded-lg border border-gray-800 p-1">
            <button
              type="button"
              onClick={() => changeSessionType('focus')}
              disabled={status !== 'idle'}
              className={`rounded-md px-4 py-2 text-sm transition ${
                sessionType === 'focus'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Focus
            </button>

            <button
              type="button"
              onClick={() => changeSessionType('break')}
              disabled={status !== 'idle'}
              className={`rounded-md px-4 py-2 text-sm transition ${
                sessionType === 'break'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Break
            </button>
          </div>

          {/* Timer */}
          <div className="mt-10">
            <div className="text-7xl font-semibold tracking-tight tabular-nums sm:text-8xl">
              {formattedTime}
            </div>

            <p className="mt-3 text-sm capitalize text-gray-500">
              {status === 'idle'
                ? `${sessionType} session`
                : status}
            </p>
          </div>

          {/* Progress */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="h-2 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-gray-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex justify-center gap-3">
            {status === 'idle' && (
              <Button
                type="button"
                onClick={startSession}
              >
                Start
              </Button>
            )}

            {status === 'running' && (
              <>
                <Button
                  type="button"
                  onClick={pauseSession}
                >
                  Pause
                </Button>

                <Button
                  type="button"
                  onClick={finishSession}
                >
                  Finish
                </Button>
              </>
            )}

            {status === 'paused' && (
              <>
                <Button
                  type="button"
                  onClick={resumeSession}
                >
                  Resume
                </Button>

                <Button
                  type="button"
                  onClick={finishSession}
                >
                  Finish
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Session settings */}
      <Card className="card-padding">
        <h2 className="text-lg font-semibold">
          Session settings
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Task */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Task
            </label>

            <select
              value={selectedTask}
              onChange={(event) =>
                setSelectedTask(event.target.value)
              }
              disabled={status !== 'idle'}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none"
            >
              <option value="">
                No task selected
              </option>

              {tasks.map((task) => (
                <option
                  key={task.id}
                  value={task.id}
                >
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Duration (minutes)
            </label>

            <input
              type="number"
              min="1"
              max={
                sessionType === 'break'
                  ? MAX_BREAK_MINUTES
                  : 240
              }
              value={durationMinutes}
              onChange={handleDurationChange}
              disabled={status !== 'idle'}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none"
            />

            {sessionType === 'break' && (
              <p className="mt-2 text-xs text-gray-500">
                Breaks are limited to 15 minutes.
              </p>
            )}
          </div>
        </div>
      </Card>


    </div>
  )
}