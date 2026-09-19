import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const priorities = ['low', 'medium', 'high']

const emptyForm = {
  title: '',
  description: '',
  category: 'data_science',
  priority: 'medium',
  target_minutes: '',
  due_date: '',
  penalty: '',
}

// ── Icons ────────────────────────────────────────────────────────────
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IconUndo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}
function IconWarning() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function IconSkull() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="8" />
      <path d="M9 11a3 3 0 1 1 6 0" />
      <line x1="9" y1="17" x2="9" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="15" y1="17" x2="15" y2="21" />
    </svg>
  )
}
function IconXCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}
function IconRepeat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
// ─────────────────────────────────────────────────────────────────────

const TASK_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: '🕐 Pending' },
  { id: 'completed', label: '✅ Completed' },
  { id: 'penalized', label: '❌ Penalized' },
  { id: 'overdue', label: '🔥 Overdue' },
]

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function TasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [repeating, setRepeating] = useState({})

  useEffect(() => {
    loadTasks()
    loadCategories()
  }, [])

  async function loadTasks() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to view tasks.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTasks(data || [])
    }

    setLoading(false)
  }

  async function loadCategories() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (!error && data) {
      setCategories(data)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function createTask(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      setError('Please enter a task title.')
      return
    }

    setSaving(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in.')
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        priority: form.priority,
        target_minutes: form.target_minutes ? Number(form.target_minutes) : null,
        due_date: form.due_date || null,
        penalty: form.penalty.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setTasks((current) => [data, ...current])
      setForm(emptyForm)
    }

    setSaving(false)
  }

  async function completeTask(taskId) {
    setError('')
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taskId)

    if (error) { setError(error.message); return }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, status: 'completed', completed_at: new Date().toISOString() }
          : task
      )
    )
  }

  async function markUndone(taskId) {
    setError('')
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'pending', completed_at: null })
      .eq('id', taskId)

    if (error) { setError(error.message); return }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, status: 'pending', completed_at: null }
          : task
      )
    )
    // Go to Penalty Board — pass taskId so it can highlight the right card
    navigate('/penalties', { state: { highlightTaskId: taskId } })
  }

  async function markNotDone(taskId) {
    setError('')
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'penalized', completed_at: new Date().toISOString() })
      .eq('id', taskId)

    if (error) { setError(error.message); return }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? { ...task, status: 'penalized', completed_at: new Date().toISOString() }
          : task
      )
    )
    // Redirect to Penalty Board — pass taskId so it can highlight the right card
    navigate('/penalties', { state: { highlightTaskId: taskId } })
  }

  async function repeatTask(task) {
    setRepeating((r) => ({ ...r, [task.id]: true }))
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setRepeating((r) => ({ ...r, [task.id]: false })); return }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: task.title,
        description: task.description || null,
        category: task.category,
        priority: task.priority,
        target_minutes: task.target_minutes || null,
        due_date: getTomorrow(),
        penalty: task.penalty || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setTasks((current) => [data, ...current])
      // Switch to All filter so user sees the new task
      setFilter('all')
    }
    setRepeating((r) => ({ ...r, [task.id]: false }))
  }

  async function deleteTask(taskId) {
    setError('')
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) { setError(error.message); return }
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  function categoryLabel(value) {
    const category = categories.find((cat) => cat.slug === value)
    return category?.name || value
  }

  // Derive penalty stats
  const pendingWithPenalty = tasks.filter(
    (t) => t.status === 'pending' && t.penalty
  )
  const overdueWithPenalty = tasks.filter(
    (t) =>
      t.status === 'pending' &&
      t.penalty &&
      t.due_date &&
      new Date(t.due_date) < new Date(new Date().toDateString())
  )

  function isOverdue(task) {
    if (!task.due_date) return false
    return (
      task.status === 'pending' &&
      new Date(task.due_date) < new Date(new Date().toDateString())
    )
  }

  const priorityColors = {
    high: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', dot: '#f87171' },
    medium: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', dot: '#fbbf24' },
    low: { bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)', dot: '#4ade80' },
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'pending') return t.status === 'pending' && !isOverdue(t)
    if (filter === 'completed') return t.status === 'completed'
    if (filter === 'penalized') return t.status === 'penalized'
    if (filter === 'overdue') return isOverdue(t)
    return true
  })

  const filterCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending' && !isOverdue(t)).length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    penalized: tasks.filter((t) => t.status === 'penalized').length,
    overdue: tasks.filter(isOverdue).length,
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="mt-2 text-sm text-gray-400">
          Plan what needs to get done — and set penalties to keep yourself accountable.
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ── Penalty Summary Banner ── */}
      {overdueWithPenalty.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(249,115,22,0.10) 100%)',
            border: '1px solid rgba(239,68,68,0.30)',
            borderRadius: '14px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(239,68,68,0.18)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#f87171',
            }}>
              <IconSkull />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 650, fontSize: 15, color: '#fca5a5' }}>
                ⚠️ {overdueWithPenalty.length} overdue task{overdueWithPenalty.length > 1 ? 's' : ''} with penalties!
              </p>
              <p style={{ margin: '4px 0 12px', fontSize: 13, color: '#fca5a5cc' }}>
                These tasks are past their due date. Face the consequences or complete them now.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overdueWithPenalty.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'rgba(239,68,68,0.10)',
                      border: '1px solid rgba(239,68,68,0.20)',
                      borderRadius: 8, padding: '8px 12px',
                    }}
                  >
                    <span style={{ color: '#f87171' }}><IconWarning /></span>
                    <span style={{ fontSize: 13, color: '#f1f3f5', fontWeight: 500 }}>{t.title}</span>
                    <span style={{ color: '#fca5a5aa', fontSize: 12 }}>→</span>
                    <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>
                      🔥 Penalty: {t.penalty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create task ── */}
      <Card className="card-padding">
        <h2 className="text-lg font-semibold">Create a task</h2>

        <form onSubmit={createTask} className="mt-5 space-y-5">
          <Input
            label="Task title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Complete NumPy practice"
          />

          <div>
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional details..."
              rows="3"
              className="w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-gray-500"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm capitalize outline-none"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Target minutes"
              name="target_minutes"
              type="number"
              min="1"
              value={form.target_minutes}
              onChange={handleChange}
              placeholder="60"
            />

            <Input
              label="Due date"
              name="due_date"
              type="date"
              value={form.due_date}
              onChange={handleChange}
            />
          </div>

          {/* Penalty field */}
          <div
            style={{
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.20)',
              borderRadius: 12,
              padding: '16px 18px',
            }}
          >
            <label
              className="mb-1 block text-sm font-semibold"
              style={{ color: '#fbbf24' }}
            >
              ⚡ Penalty if not done
            </label>
            <p className="mb-3 text-xs" style={{ color: '#a3aab6' }}>
              Set a consequence for yourself if you skip or fail this task. Be brutal — it keeps you honest!
            </p>
            <input
              name="penalty"
              value={form.penalty}
              onChange={handleChange}
              placeholder="e.g. No social media for a day, 20 push-ups, No gaming tonight…"
              className="w-full rounded-lg border border-gray-700 bg-transparent px-3 py-2 text-sm outline-none transition focus:border-yellow-600"
              style={{ color: '#f1f3f5' }}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create task'}
          </Button>
        </form>
      </Card>

      {/* ── Task list ── */}
      <Card className="card-padding">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
          <div>
            <h2 className="text-lg font-semibold">Your tasks</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              {pendingWithPenalty.length > 0 && (
                <span style={{ color: '#fbbf24', fontWeight: 600, marginLeft: 6 }}>
                  · {pendingWithPenalty.length} with penalt{pendingWithPenalty.length > 1 ? 'ies' : 'y'}
                </span>
              )}
            </p>
          </div>

          {/* ── Filter tabs ── */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TASK_FILTERS.map((tab) => {
              const isActive = filter === tab.id
              const tabColors = {
                all: { active: '#60a5fa', bg: 'rgba(96,165,250,0.14)', border: 'rgba(96,165,250,0.35)' },
                pending: { active: '#fbbf24', bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.35)' },
                completed: { active: '#4ade80', bg: 'rgba(74,222,128,0.14)', border: 'rgba(74,222,128,0.35)' },
                penalized: { active: '#f87171', bg: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.35)' },
                overdue: { active: '#fb923c', bg: 'rgba(251,146,60,0.14)', border: 'rgba(251,146,60,0.35)' },
              }
              const c = tabColors[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    height: 32, padding: '0 12px', borderRadius: 8,
                    border: isActive ? `1px solid ${c.border}` : '1px solid var(--border)',
                    background: isActive ? c.bg : 'transparent',
                    color: isActive ? c.active : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {tab.label}
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: isActive ? 'rgba(255,255,255,0.12)' : 'var(--surface-2)',
                    borderRadius: 20, padding: '1px 6px',
                    color: isActive ? c.active : 'var(--text-muted)',
                  }}>
                    {filterCounts[tab.id]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading tasks...</p>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
              <p className="text-sm text-gray-400">
                {tasks.length === 0 ? 'No tasks yet.' : `No ${filter} tasks.`}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {tasks.length === 0 ? 'Create your first task above.' : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const overdue = isOverdue(task)
              const completed = task.status === 'completed'
              const penalized = task.status === 'penalized'
              const pColors = priorityColors[task.priority] || priorityColors.medium

              return (
                <div
                  key={task.id}
                  style={{
                    borderRadius: 12,
                    border: penalized
                      ? '1px solid rgba(248,113,113,0.40)'
                      : completed
                      ? '1px solid rgba(255,255,255,0.06)'
                      : overdue && task.penalty
                      ? '1px solid rgba(239,68,68,0.35)'
                      : task.penalty
                      ? '1px solid rgba(251,191,36,0.25)'
                      : `1px solid ${pColors.border}`,
                    background: penalized
                      ? 'rgba(248,113,113,0.07)'
                      : completed
                      ? 'transparent'
                      : overdue && task.penalty
                      ? 'rgba(239,68,68,0.05)'
                      : task.penalty
                      ? 'rgba(251,191,36,0.04)'
                      : pColors.bg,
                    padding: '16px',
                    opacity: completed ? 0.55 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Priority dot */}
                        <span
                          style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: pColors.dot, flexShrink: 0, marginTop: 1,
                          }}
                        />
                        <h3
                          style={{
                            margin: 0,
                            fontWeight: 600,
                            fontSize: 15,
                            textDecoration: completed ? 'line-through' : 'none',
                            color: (completed || penalized) ? 'var(--text-muted)' : 'var(--text)',
                          }}
                        >
                          {task.title}
                        </h3>

                        {/* Status badges */}
                        {completed && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: '#4ade80',
                            background: 'rgba(74,222,128,0.12)',
                            border: '1px solid rgba(74,222,128,0.25)',
                            borderRadius: 6, padding: '2px 7px',
                          }}>
                            ✓ Done
                          </span>
                        )}
                        {penalized && (
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: '#f87171',
                            background: 'rgba(248,113,113,0.14)',
                            border: '1px solid rgba(248,113,113,0.30)',
                            borderRadius: 6, padding: '2px 7px',
                          }}>
                            ❌ Penalized — Penalty Active
                          </span>
                        )}
                        {overdue && !completed && !penalized && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: '#f87171',
                            background: 'rgba(248,113,113,0.12)',
                            border: '1px solid rgba(248,113,113,0.25)',
                            borderRadius: 6, padding: '2px 7px',
                          }}>
                            Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="mt-2 text-sm text-gray-400">{task.description}</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{categoryLabel(task.category)}</span>
                        <span>•</span>
                        <span className="capitalize">{task.priority} priority</span>
                        {task.target_minutes && (
                          <><span>•</span><span>{task.target_minutes} min</span></>
                        )}
                        {task.due_date && (
                          <><span>•</span>
                          <span style={{ color: overdue ? '#f87171' : undefined }}>
                            Due {task.due_date}
                          </span></>
                        )}
                      </div>

                      {/* Penalty pill */}
                      {task.penalty && (
                        <div
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            marginTop: 10,
                            background: completed
                              ? 'rgba(74,222,128,0.08)'
                              : overdue
                              ? 'rgba(239,68,68,0.12)'
                              : 'rgba(251,191,36,0.10)',
                            border: completed
                              ? '1px solid rgba(74,222,128,0.20)'
                              : overdue
                              ? '1px solid rgba(239,68,68,0.25)'
                              : '1px solid rgba(251,191,36,0.25)',
                            borderRadius: 8, padding: '5px 10px',
                          }}
                        >
                          <span style={{ fontSize: 12 }}>
                            {completed ? '✅' : overdue ? '🔥' : '⚡'}
                          </span>
                          <span
                            style={{
                              fontSize: 12, fontWeight: 600,
                              color: completed ? '#4ade80' : overdue ? '#f87171' : '#fbbf24',
                            }}
                          >
                            {completed ? 'Penalty avoided:' : overdue ? 'PENALTY DUE:' : 'Penalty:'}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: completed ? '#a3aab6' : overdue ? '#fca5a5' : '#e5c46a',
                              textDecoration: completed ? 'line-through' : 'none',
                            }}
                          >
                            {task.penalty}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexShrink: 0, gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                      {/* ── PENDING: Complete + Not Done + Repeat ── */}
                      {task.status === 'pending' && (
                        <>
                          <button
                            onClick={() => completeTask(task.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              height: 34, padding: '0 13px', borderRadius: 8,
                              background: 'rgba(74,222,128,0.12)',
                              border: '1px solid rgba(74,222,128,0.30)',
                              color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,222,128,0.22)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,222,128,0.12)' }}
                          >
                            <IconCheck /> Complete
                          </button>

                          <button
                            onClick={() => markNotDone(task.id)}
                            title="Mark as not done — redirects to Penalty Board"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              height: 34, padding: '0 13px', borderRadius: 8,
                              background: 'rgba(248,113,113,0.10)',
                              border: '1px solid rgba(248,113,113,0.30)',
                              color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.22)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.10)' }}
                          >
                            <IconXCircle /> Not Done →⚡
                          </button>
                        </>
                      )}

                      {/* ── COMPLETED or PENALIZED: Mark Undone (→ Penalties) ── */}
                      {(task.status === 'completed' || task.status === 'penalized') && (
                        <button
                          onClick={() => markUndone(task.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            height: 34, padding: '0 13px', borderRadius: 8,
                            background: 'rgba(251,191,36,0.10)',
                            border: '1px solid rgba(251,191,36,0.28)',
                            color: '#fbbf24', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.20)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.10)' }}
                        >
                          <IconUndo /> Undo →⚡
                        </button>
                      )}

                      {/* ── REPEAT: always shown ── */}
                      <button
                        onClick={() => repeatTask(task)}
                        disabled={!!repeating[task.id]}
                        title="Schedule same task for tomorrow"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          height: 34, padding: '0 13px', borderRadius: 8,
                          background: 'rgba(167,139,250,0.10)',
                          border: '1px solid rgba(167,139,250,0.28)',
                          color: '#a78bfa', fontSize: 12, fontWeight: 600,
                          cursor: repeating[task.id] ? 'not-allowed' : 'pointer',
                          opacity: repeating[task.id] ? 0.6 : 1,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { if (!repeating[task.id]) e.currentTarget.style.background = 'rgba(167,139,250,0.20)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,0.10)' }}
                      >
                        <IconRepeat />
                        {repeating[task.id] ? 'Adding…' : 'Repeat'}
                      </button>

                      {/* ── DELETE ── */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          height: 34, padding: '0 13px', borderRadius: 8,
                          background: 'rgba(248,113,113,0.08)',
                          border: '1px solid rgba(248,113,113,0.20)',
                          color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.18)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
                      >
                        <IconTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}