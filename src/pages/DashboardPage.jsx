import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    setUser(user)

    const today = new Date().toISOString().split('T')[0]

    const [tasksResult, activityResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false }),

      supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .maybeSingle(),
    ])

    if (!tasksResult.error) {
      setTasks(tasksResult.data || [])
    }

    if (!activityResult.error) {
      setActivity(activityResult.data)
    }

    setLoading(false)
  }

  const stepGoal = activity?.step_goal || 10000
  const steps = activity?.steps || 0
  const stepPercentage = Math.min(
    Math.round((steps / stepGoal) * 100),
    100
  )

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'there'

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Loading your day...
          </p>
        </div>

        <Card>
          <p className="text-sm text-gray-400">
            Loading your productivity data...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Good to see you, {displayName} 👋
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Here&apos;s what your day looks like.
        </p>
      </div>

      {/* Top overview */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Steps */}
        <Card className="card-padding">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Walking</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {steps.toLocaleString()}
              </h2>
            </div>

            <span className="text-sm text-gray-400">
              {stepPercentage}%
            </span>
          </div>

          <div className="mt-5">
            <ProgressBar value={stepPercentage} />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            {Math.max(stepGoal - steps, 0).toLocaleString()} steps remaining
          </p>
        </Card>

        {/* Tasks */}
        <Card className="card-padding">
          <p className="text-sm text-gray-400">Pending tasks</p>

          <h2 className="mt-2 text-2xl font-semibold">
            {tasks.length}
          </h2>

          <p className="mt-3 text-xs text-gray-500">
            Tasks waiting for you today
          </p>
        </Card>

        {/* Study */}
        <Card className="card-padding">
          <p className="text-sm text-gray-400">Study goal</p>

          <h2 className="mt-2 text-2xl font-semibold">
            0 min
          </h2>

          <p className="mt-3 text-xs text-gray-500">
            Start a focus session to track your study time.
          </p>
        </Card>
      </div>

      {/* Today's tasks */}
      <Card className="card-padding">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Today&apos;s tasks</h2>
            <p className="mt-2 text-sm text-gray-400">
              Your current responsibilities.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center">
              <p className="text-sm text-gray-400">
                No pending tasks 🎉
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Your task list is clear for now.
              </p>
            </div>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">
                    {task.title}
                  </h3>

                  <p className="mt-2 text-xs capitalize text-gray-500">
                    {task.category?.replaceAll('_', ' ')}
                  </p>
                </div>

                <span className="ml-4 shrink-0 text-xs capitalize text-gray-400">
                  {task.priority}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick actions */}
      <Card className="card-padding">
        <h2 className="text-lg font-semibold">Quick actions</h2>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/tasks"
            className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm transition hover:bg-gray-800"
          >
            Add task
          </a>

          <a
            href="/focus"
            className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm transition hover:bg-gray-800"
          >
            Start focus
          </a>

          <a
            href="/activity"
            className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm transition hover:bg-gray-800"
          >
            Update steps
          </a>
        </div>
      </Card>
    </div>
  )
}