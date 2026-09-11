import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import ProgressBar from '../components/ui/ProgressBar'

function getDateString(date) {
  return date.toISOString().split('T')[0]
}

function getLastSevenDays() {
  const days = []

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    days.push({
      date: getDateString(date),
      label: date.toLocaleDateString('en-US', {
        weekday: 'short',
      }),
    })
  }

  return days
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState([])

  const [todaySteps, setTodaySteps] = useState(0)
  const [stepGoal, setStepGoal] = useState(10000)

  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0)
  const [studyGoal, setStudyGoal] = useState(120)

  const [todayTasksCompleted, setTodayTasksCompleted] = useState(0)
  const [todayTasksTotal, setTodayTasksTotal] = useState(0)

  const [weeklyStudyMinutes, setWeeklyStudyMinutes] = useState(0)
  const [weeklyTasksCompleted, setWeeklyTasksCompleted] = useState(0)
  const [weeklyFocusSessions, setWeeklyFocusSessions] = useState(0)

  const [streak, setStreak] = useState(0)

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const days = getLastSevenDays()
    const today = days[days.length - 1].date

    // Preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('daily_step_goal, daily_study_goal_minutes')
      .eq('user_id', user.id)
      .maybeSingle()

    const currentStepGoal =
      preferences?.daily_step_goal || 10000

    const currentStudyGoal =
      preferences?.daily_study_goal_minutes || 120

    setStepGoal(currentStepGoal)
    setStudyGoal(currentStudyGoal)

    // Activity
    const { data: activity } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', user.id)
      .gte('activity_date', days[0].date)
      .lte('activity_date', today)
      .order('activity_date', { ascending: true })

    const activityMap = new Map(
      (activity || []).map((item) => [
        item.activity_date,
        item,
      ])
    )

    setTodaySteps(activityMap.get(today)?.steps || 0)

    // Focus sessions
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', weekStart.toISOString())
      .order('started_at', { ascending: true })

    const focusSessions = (sessions || []).filter(
      (session) => session.session_type === 'focus'
    )

    const todaySessions = focusSessions.filter(
      (session) =>
        getDateString(new Date(session.started_at)) === today
    )

    const todayStudy = todaySessions.reduce(
      (total, session) =>
        total + (session.duration_seconds || 0),
      0
    )

    const weeklyStudy = focusSessions.reduce(
      (total, session) =>
        total + (session.duration_seconds || 0),
      0
    )

    setTodayStudyMinutes(Math.floor(todayStudy / 60))
    setWeeklyStudyMinutes(Math.floor(weeklyStudy / 60))
    setWeeklyFocusSessions(focusSessions.length)

    // Tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)

    const completedTasks = (tasks || []).filter(
      (task) => task.status === 'completed'
    )

    const todayCompleted = completedTasks.filter(
      (task) =>
        task.completed_at &&
        getDateString(new Date(task.completed_at)) === today
    )

    setTodayTasksCompleted(todayCompleted.length)

    const todayTasks = (tasks || []).filter(
      (task) =>
        task.due_date === today ||
        (
          task.created_at &&
          getDateString(new Date(task.created_at)) === today
        )
    )

    setTodayTasksTotal(todayTasks.length)

    const weekCompleted = completedTasks.filter(
      (task) =>
        task.completed_at &&
        new Date(task.completed_at) >= weekStart
    )

    setWeeklyTasksCompleted(weekCompleted.length)

    // Build weekly display
    const week = days.map((day) => {
      const dayActivity = activityMap.get(day.date)

      const daySessions = focusSessions.filter(
        (session) =>
          getDateString(new Date(session.started_at)) ===
          day.date
      )

      const dayStudySeconds = daySessions.reduce(
        (total, session) =>
          total + (session.duration_seconds || 0),
        0
      )

      const dayCompletedTasks = completedTasks.filter(
        (task) =>
          task.completed_at &&
          getDateString(new Date(task.completed_at)) ===
            day.date
      ).length

      return {
        ...day,
        steps: dayActivity?.steps || 0,
        studyMinutes: Math.floor(dayStudySeconds / 60),
        tasksCompleted: dayCompletedTasks,
      }
    })

    setWeeklyData(week)

    // Streak
    let currentStreak = 0

    for (let i = days.length - 1; i >= 0; i -= 1) {
      const day = week[i]

      const productive =
        day.steps >= currentStepGoal ||
        day.studyMinutes >= currentStudyGoal ||
        day.tasksCompleted > 0

      if (!productive) break

      currentStreak += 1
    }

    setStreak(currentStreak)

    setLoading(false)
  }

  const stepPercentage = Math.min(
    100,
    Math.round((todaySteps / stepGoal) * 100)
  )

  const studyPercentage = Math.min(
    100,
    Math.round((todayStudyMinutes / studyGoal) * 100)
  )

  const taskPercentage =
    todayTasksTotal > 0
      ? Math.min(
          100,
          Math.round(
            (todayTasksCompleted / todayTasksTotal) * 100
          )
        )
      : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Progress
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            See how you're progressing over time.
          </p>
        </div>

        <Card>
          <p className="text-sm text-slate-400">
            Loading progress...
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
          Progress
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          See how you're progressing over time.
        </p>
      </div>

      {/* Today's overview */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="card-padding">
          <p className="text-sm text-slate-400">
            Today's steps
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {todaySteps.toLocaleString()}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            / {stepGoal.toLocaleString()}
          </p>

          <div className="mt-4">
            <ProgressBar value={stepPercentage} />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {stepPercentage}% complete
          </p>
        </Card>

        <Card className="card-padding">
          <p className="text-sm text-slate-400">
            Today's study
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {todayStudyMinutes}m
          </p>

          <p className="mt-1 text-sm text-slate-500">
            / {studyGoal}m goal
          </p>

          <div className="mt-4">
            <ProgressBar value={studyPercentage} />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {studyPercentage}% complete
          </p>
        </Card>

        <Card className="card-padding">
          <p className="text-sm text-slate-400">
            Tasks completed
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {todayTasksCompleted}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            / {todayTasksTotal} today
          </p>

          <div className="mt-4">
            <ProgressBar value={taskPercentage} />
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {taskPercentage}% complete
          </p>
        </Card>
      </div>

      {/* Streak */}
      <Card className="card-padding">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Current streak
            </p>

            <p className="mt-2 text-3xl font-semibold">
              🔥 {streak} {streak === 1 ? 'day' : 'days'}
            </p>
          </div>

          <p className="max-w-xs text-right text-sm text-slate-500">
            Keep making progress each day to maintain your streak.
          </p>
        </div>
      </Card>

      {/* Weekly summary */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="card-padding">
          <p className="text-sm text-slate-400">
            Study this week
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {weeklyStudyMinutes}m
          </p>
        </Card>

        <Card className="card-padding">
          <p className="text-sm text-slate-400">
            Tasks completed
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {weeklyTasksCompleted}
          </p>
        </Card>

        <Card className="card-padding">
          <p className="text-sm text-slate-400">
            Focus sessions
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {weeklyFocusSessions}
          </p>
        </Card>
      </div>

      {/* Weekly history */}
      <Card className="card-padding">
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold">
              Last 7 days
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Your daily activity at a glance.
            </p>
          </div>

          <div className="space-y-5">
            {weeklyData.map((day) => {
              const stepsPercent = Math.min(
                100,
                Math.round(
                  (day.steps / stepGoal) * 100
                )
              )

              return (
                <div key={day.date}>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {day.label}
                      </span>

                      <span className="ml-2 text-xs text-slate-500">
                        {day.date}
                      </span>
                    </div>

                    <span className="text-xs text-slate-500">
                      {day.steps.toLocaleString()} steps
                    </span>
                  </div>

                  <ProgressBar value={stepsPercent} />

                  <div className="mt-3 flex gap-4 text-xs text-slate-500">
                    <span>
                      📚 {day.studyMinutes}m study
                    </span>

                    <span>
                      ✓ {day.tasksCompleted} tasks
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}