/**
 * PenaltyPage.jsx
 *
 * Shows all tasks that have status = 'penalized'.
 * Allows the user to write and save a penalty/commitment note per task.
 * Notes are stored in tasks.penalty (Supabase), NOT localStorage.
 *
 * Data flow:
 *   Task → "Not Done" clicked → status = 'penalized' (TasksPage)
 *   → navigates here with highlightTaskId in location.state
 *   → user writes note in textarea
 *   → "Save Note" calls UPDATE tasks SET penalty = ? WHERE id = ?
 *   → on reload: SELECT * fetches penalty from Supabase → note persists
 */

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ── Icons ──────────────────────────────────────────────────────────────
function IcFlame() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6
        .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3
        a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}
function IcCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IcArrowLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}
function IcNote() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function IcClock() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function IcSave() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
function IcWarning() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IcPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
// ──────────────────────────────────────────────────────────────────────

export default function PenaltyPage() {
  const location = useLocation()
  const navigate = useNavigate()

  // When arriving from "Not Done" click, highlightTaskId is set in nav state
  const highlightId = location.state?.highlightTaskId ?? null

  // ── State
  const [tasks, setTasks] = useState([])         // tasks with status = 'not_done'
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')  // page-level error

  // penaltyDraft: { [taskId]: string } — the text currently in each textarea
  const [penaltyDraft, setPenaltyDraft] = useState({})

  // saveState: { [taskId]: 'idle' | 'saving' | 'saved' | 'error' }
  const [saveState, setSaveState] = useState({})

  // saveError: { [taskId]: string } — per-task save error message
  const [saveError, setSaveError] = useState({})

  // Ref map for scroll-to-highlight
  const cardRefs = useRef({})

  // ── Load tasks with status = 'not_done' from Supabase
  useEffect(() => {
    loadPenaltyTasks()
  }, [])

  // Scroll to highlighted card after data loads
  useEffect(() => {
    if (highlightId && cardRefs.current[highlightId]) {
      setTimeout(() => {
        cardRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 250)
    }
  }, [tasks, highlightId])

  async function loadPenaltyTasks() {
    setLoading(true)
    setPageError('')

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      setPageError('You must be logged in to view the Penalty Board.')
      setLoading(false)
      return
    }

    // Fetch all tasks with status = penalized for this user
    // SELECT * already includes the penalty column
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'penalized')
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('[PenaltyPage] loadPenaltyTasks error:', error)
      setPageError(`Failed to load penalty tasks: ${error.message}`)
      setLoading(false)
      return
    }

    const fetched = data || []
    setTasks(fetched)

    // Seed the draft from the tasks.penalty value stored in Supabase
    const drafts = {}
    fetched.forEach(t => { drafts[t.id] = t.penalty ?? '' })
    setPenaltyDraft(drafts)

    setLoading(false)
  }

  // ── Save penalty note for a task back to Supabase
  async function savePenaltyNote(taskId) {
    const noteText = penaltyDraft[taskId] ?? ''

    setSaveState(s => ({ ...s, [taskId]: 'saving' }))
    setSaveError(e => ({ ...e, [taskId]: '' }))

    const { error } = await supabase
      .from('tasks')
      .update({ penalty: noteText || null })
      .eq('id', taskId)

    if (error) {
      console.error('[PenaltyPage] savePenaltyNote error:', error)
      setSaveState(s => ({ ...s, [taskId]: 'error' }))
      setSaveError(e => ({ ...e, [taskId]: `Save failed: ${error.message}` }))
      return
    }

    // Update local task list so the saved value is reflected without a reload
    setTasks(current =>
      current.map(t => t.id === taskId ? { ...t, penalty: noteText || null } : t)
    )
    setSaveState(s => ({ ...s, [taskId]: 'saved' }))

    // Reset button back to idle after 2s
    setTimeout(() => setSaveState(s => ({ ...s, [taskId]: 'idle' })), 2000)
  }

  // ── Delete a task
  async function deleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('[PenaltyPage] deleteTask error:', error)
      setPageError(`Delete failed: ${error.message}`)
      return
    }

    setTasks(current => current.filter(t => t.id !== taskId))
    const { [taskId]: _d, ...restDrafts } = penaltyDraft
    const { [taskId]: _s, ...restState } = saveState
    const { [taskId]: _e, ...restErr } = saveError
    setPenaltyDraft(restDrafts)
    setSaveState(restState)
    setSaveError(restErr)
  }

  // ── Mark task back to pending (undo "Not Done")
  async function markBackToPending(taskId) {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'pending', completed_at: null })
      .eq('id', taskId)

    if (error) {
      console.error('[PenaltyPage] markBackToPending error:', error)
      setPageError(`Could not revert task: ${error.message}`)
      return
    }

    setTasks(current => current.filter(t => t.id !== taskId))
    navigate('/tasks')
  }

  // ── Helpers
  function categoryLabel(task) {
    // category is stored as a slug string on the task record
    return task.category
      ? task.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Uncategorised'
  }

  function priorityDot(priority) {
    const map = { high: '#f87171', medium: '#fbbf24', low: '#4ade80' }
    return map[priority] || '#a78bfa'
  }

  function saveButtonLabel(taskId) {
    const s = saveState[taskId] || 'idle'
    if (s === 'saving') return 'Saving…'
    if (s === 'saved') return '✓ Saved'
    if (s === 'error') return 'Retry Save'
    return 'Save Note'
  }

  function saveButtonStyle(taskId) {
    const s = saveState[taskId] || 'idle'
    const base = {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 34, padding: '0 14px', borderRadius: 8,
      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
    }
    if (s === 'saved') return { ...base, background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.40)', color: '#4ade80' }
    if (s === 'error') return { ...base, background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.40)', color: '#f87171' }
    if (s === 'saving') return { ...base, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.28)', color: '#60a5fa', opacity: 0.7, cursor: 'not-allowed' }
    return { ...base, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.28)', color: '#60a5fa' }
  }

  // ── Render
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/tasks')}
          title="Back to Tasks"
          style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          <IcArrowLeft />
        </button>

        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(251,191,36,0.18))',
          border: '1px solid rgba(239,68,68,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171',
        }}>
          <IcFlame />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Penalty Board
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Tasks you didn't complete. Write your commitment note and stay accountable.
          </p>
        </div>
      </div>

      {/* ── Page-level error ── */}
      {pageError && (
        <div style={{
          borderRadius: 10, border: '1px solid rgba(248,113,113,0.35)',
          background: 'rgba(248,113,113,0.08)', padding: '12px 16px',
          fontSize: 14, color: '#fca5a5',
        }}>
          {pageError}
        </div>
      )}

      {/* ── Stats bar ── */}
      {!loading && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
          padding: '14px 18px',
          borderRadius: 12,
          background: tasks.length > 0
            ? 'linear-gradient(120deg, rgba(248,113,113,0.10) 0%, rgba(251,191,36,0.08) 100%)'
            : 'var(--surface-2)',
          border: tasks.length > 0
            ? '1px solid rgba(248,113,113,0.25)'
            : '1px solid var(--border)',
        }}>
          {tasks.length > 0 ? (
            <>
              <span style={{ fontSize: 14, color: '#fca5a5' }}>
                <IcWarning />
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fca5a5' }}>
                {tasks.length} task{tasks.length > 1 ? 's' : ''} marked as Not Done
              </span>
              <span style={{ fontSize: 13, color: 'rgba(252,165,165,0.65)', marginLeft: 4 }}>
                — add a commitment note for each one below.
              </span>
            </>
          ) : (
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              🎉 No tasks marked as Not Done. Great discipline!
            </span>
          )}
        </div>
      )}

      {/* ── Task cards ── */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Loading penalty tasks…
        </div>
      ) : tasks.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          border: '1px dashed var(--border)', borderRadius: 14,
          background: 'var(--surface)',
        }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            No penalised tasks
          </p>
          <p style={{ margin: '8px 0 20px', fontSize: 13, color: 'var(--text-muted)' }}>
            When you click "Not Done" on a task it will appear here.
          </p>
          <button
            onClick={() => navigate('/tasks')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 16px', borderRadius: 9,
              background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.30)',
              color: '#60a5fa', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <IcPlus /> Go to Tasks
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tasks.map(task => {
            const isHighlighted = task.id === highlightId
            const dot = priorityDot(task.priority)
            const draft = penaltyDraft[task.id] ?? ''
            const hasExistingNote = !!task.penalty
            const noteChanged = draft !== (task.penalty ?? '')

            return (
              <div
                key={task.id}
                ref={el => { cardRefs.current[task.id] = el }}
                style={{
                  borderRadius: 14,
                  border: isHighlighted
                    ? '2px solid rgba(248,113,113,0.55)'
                    : '1px solid rgba(248,113,113,0.28)',
                  background: isHighlighted
                    ? 'rgba(248,113,113,0.08)'
                    : 'rgba(248,113,113,0.04)',
                  overflow: 'hidden',
                  boxShadow: isHighlighted ? '0 0 0 4px rgba(248,113,113,0.15)' : 'none',
                  transition: 'box-shadow 0.3s ease',
                }}
              >
                {/* ── Task info header ── */}
                <div style={{ padding: '14px 16px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 650, color: 'var(--text)' }}>
                          {task.title}
                        </h3>
                        <span style={{
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                          background: 'rgba(248,113,113,0.15)',
                          border: '1px solid rgba(248,113,113,0.35)',
                          color: '#f87171', borderRadius: 20, padding: '2px 9px',
                        }}>
                          ❌ Not Done
                        </span>
                        {isHighlighted && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: '#a78bfa',
                            background: 'rgba(167,139,250,0.14)',
                            border: '1px solid rgba(167,139,250,0.28)',
                            borderRadius: 20, padding: '2px 8px',
                          }}>
                            ← Just marked
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {task.description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {categoryLabel(task)}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {task.priority} priority
                        </span>
                        {task.target_minutes && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {task.target_minutes} min target
                          </span>
                        )}
                        {task.due_date && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f87171' }}>
                            <IcClock /> Due {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Header action buttons */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => markBackToPending(task.id)}
                        title="Revert to pending — removes from Penalty Board"
                        style={{
                          height: 30, padding: '0 11px', borderRadius: 7,
                          border: '1px solid rgba(251,191,36,0.30)',
                          background: 'rgba(251,191,36,0.08)',
                          color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        ↩ Undo
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        title="Delete task permanently"
                        style={{
                          height: 30, padding: '0 11px', borderRadius: 7,
                          border: '1px solid rgba(248,113,113,0.25)',
                          background: 'rgba(248,113,113,0.08)',
                          color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Penalty / commitment note area ── */}
                <div style={{
                  margin: '0 16px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(248,113,113,0.22)',
                  background: 'var(--surface-2)',
                  overflow: 'hidden',
                }}>
                  {/* Note header */}
                  <div style={{
                    padding: '9px 12px',
                    borderBottom: '1px solid rgba(248,113,113,0.15)',
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    <span style={{ color: '#fbbf24' }}><IcNote /></span>
                    <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--text-secondary)' }}>
                      {hasExistingNote ? 'Commitment note (saved in Supabase)' : 'Add a penalty / commitment note'}
                    </span>
                    {noteChanged && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 11, color: '#fbbf24',
                        background: 'rgba(251,191,36,0.12)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        borderRadius: 6, padding: '1px 7px', fontWeight: 600,
                      }}>
                        unsaved changes
                      </span>
                    )}
                  </div>

                  {/* Textarea */}
                  <div style={{ position: 'relative' }}>
                    <textarea
                      rows={3}
                      value={draft}
                      onChange={e => setPenaltyDraft(d => ({ ...d, [task.id]: e.target.value }))}
                      placeholder={
                        hasExistingNote
                          ? 'Update your commitment note…'
                          : 'e.g. I will study an extra hour tomorrow. No gaming until the chapter is done.'
                      }
                      style={{
                        width: '100%',
                        borderRadius: 0,
                        border: 'none',
                        borderBottom: '1px solid rgba(248,113,113,0.15)',
                        background: 'transparent',
                        color: 'var(--text)',
                        fontSize: 13,
                        lineHeight: 1.65,
                        padding: '11px 12px',
                        paddingBottom: 44,
                        resize: 'vertical',
                        fontFamily: 'var(--font-family)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.borderBottom = '1px solid rgba(248,113,113,0.50)' }}
                      onBlur={e => { e.target.style.borderBottom = '1px solid rgba(248,113,113,0.15)' }}
                    />

                    {/* Save button — anchored bottom-right inside textarea */}
                    <button
                      onClick={() => savePenaltyNote(task.id)}
                      disabled={saveState[task.id] === 'saving'}
                      style={{
                        ...saveButtonStyle(task.id),
                        position: 'absolute', bottom: 8, right: 8,
                      }}
                    >
                      {saveState[task.id] === 'saved'
                        ? <><IcCheck /> {saveButtonLabel(task.id)}</>
                        : <><IcSave /> {saveButtonLabel(task.id)}</>
                      }
                    </button>
                  </div>

                  {/* Per-task save error */}
                  {saveError[task.id] && (
                    <div style={{
                      padding: '7px 12px', fontSize: 12, color: '#f87171',
                      background: 'rgba(248,113,113,0.08)',
                    }}>
                      ⚠ {saveError[task.id]}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
