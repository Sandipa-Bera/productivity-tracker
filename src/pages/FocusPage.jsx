import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const DEFAULT_FOCUS_MINUTES = 50
const MAX_BREAK_MINUTES = 15

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

  const audioContextRef = useRef(null)
  const finishingRef = useRef(false)

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

  // Play a simple built-in alarm using Web Audio API.
  function playAlarm() {
    try {
      const audioContext = audioContextRef.current

      if (!audioContext) return

      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      const now = audioContext.currentTime

      // Three short beeps.
      ;[0, 0.45, 0.9].forEach((offset) => {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(
          880,
          now + offset
        )

        gain.gain.setValueAtTime(
          0.0001,
          now + offset
        )

        gain.gain.exponentialRampToValueAtTime(
          0.3,
          now + offset + 0.02
        )

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + offset + 0.25
        )

        oscillator.connect(gain)
        gain.connect(audioContext.destination)

        oscillator.start(now + offset)
        oscillator.stop(now + offset + 0.3)
      })
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