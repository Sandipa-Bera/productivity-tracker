import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const categories = [
  { value: 'data_science', label: 'Data Science' },
  { value: 'college', label: 'College' },
  { value: 'project', label: 'Project' },
  { value: 'government_exam', label: 'Government Exam' },
  { value: 'other', label: 'Other' },
]

const priorities = ['low', 'medium', 'high']

const emptyForm = {
  title: '',
  description: '',
  category: 'data_science',
  priority: 'medium',
  target_minutes: '',
  due_date: '',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTasks()
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

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
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
        target_minutes: form.target_minutes
          ? Number(form.target_minutes)
          : null,
        due_date: form.due_date || null,
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
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (error) {
      setError(error.message)
      return
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              completed_at: new Date().toISOString(),
            }
          : task
      )
    )
  }

  async function deleteTask(taskId) {
    setError('')

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      setError(error.message)
      return
    }

    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  function categoryLabel(value) {
    return (
      categories.find((category) => category.value === value)?.label ||
      value
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="mt-2 text-sm text-gray-400">
          Plan what needs to get done and keep track of your responsibilities.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Create task */}
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
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

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
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Priority
              </label>

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

          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create task'}
          </Button>
        </form>
      </Card>

      {/* Task list */}
      <Card className="card-padding">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your tasks</h2>
            <p className="mt-2 text-sm text-gray-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
              <p className="text-sm text-gray-400">
                No tasks yet.
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Create your first task above.
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-lg border p-4 ${
                  task.status === 'completed'
                    ? 'border-gray-800 opacity-60'
                    : 'border-gray-800'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`font-medium ${
                        task.status === 'completed'
                          ? 'line-through'
                          : ''
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="mt-2 text-sm text-gray-400">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>{categoryLabel(task.category)}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {task.priority} priority
                      </span>

                      {task.target_minutes && (
                        <>
                          <span>•</span>
                          <span>{task.target_minutes} min</span>
                        </>
                      )}

                      {task.due_date && (
                        <>
                          <span>•</span>
                          <span>Due {task.due_date}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {task.status !== 'completed' && (
                      <Button
                        type="button"
                        onClick={() => completeTask(task.id)}
                      >
                        Complete
                      </Button>
                    )}

                    <Button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}