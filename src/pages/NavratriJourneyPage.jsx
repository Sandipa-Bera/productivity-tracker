import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

import {
  ChevronLeft,
  ChevronRight,
  Activity,
  BookOpen,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  Plus,
  X,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Save
} from 'lucide-react'


/* =========================================================
   CONSTANTS
========================================================= */

const TASK_CATEGORIES = [
  { value: 'data_science', label: 'Data Science' },
  { value: 'college', label: 'College' },
  { value: 'project', label: 'Project' },
  { value: 'government_exam', label: 'Government Exam' },
  { value: 'other', label: 'Other' }
]

const EMPTY_JOURNEY = {
  title: '',
  description: '',
  start_date: '',
  target_date: '',
  task_categories: []
}


/* =========================================================
   DATE HELPERS
========================================================= */

/*
  IMPORTANT:
  YYYY-MM-DD values are treated as calendar dates, not timestamps.
  This prevents the India/IST timezone bug where Day 5 becomes Day 6.
*/

function getDateString(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getTodayString() {
  return getDateString(new Date())
}

function parseDateString(dateString) {
  if (!dateString) return null

  const [year, month, day] = dateString.split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function formatDate(dateString) {
  const date = parseDateString(dateString)

  if (!date || Number.isNaN(date.getTime())) {
    return dateString || ''
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatLongDate(dateString) {
  const date = parseDateString(dateString)

  if (!date || Number.isNaN(date.getTime())) {
    return dateString || ''
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0

  const start = parseDateString(startDate)
  const end = parseDateString(endDate)

  if (!start || !end) return 0

  const startDay = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  )

  const endDay = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  )

  return Math.round(
    (endDay - startDay) / (1000 * 60 * 60 * 24)
  ) + 1
}

function getJourneyDay(startDate, currentDate) {
  if (!startDate || !currentDate) return 0

  const start = parseDateString(startDate)
  const current = parseDateString(currentDate)

  if (!start || !current) return 0

  const startDay = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  )

  const currentDay = Date.UTC(
    current.getFullYear(),
    current.getMonth(),
    current.getDate()
  )

  return Math.round(
    (currentDay - startDay) / (1000 * 60 * 60 * 24)
  ) + 1
}

function formatNumber(value) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0'
  }

  return number.toLocaleString()
}


/* =========================================================
   COMPONENT
========================================================= */

export default function NavratriJourneyPage() {

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [journeys, setJourneys] = useState([])
  const [expandedJourneyId, setExpandedJourneyId] = useState(null)
  const [showAddJourney, setShowAddJourney] = useState(false)
  const [editingJourneyId, setEditingJourneyId] = useState(null)
  const [journeyForm, setJourneyForm] = useState(EMPTY_JOURNEY)

  const [journeyData, setJourneyData] = useState({})

  /*
    KEY FORMAT:
    journeyId:YYYY-MM-DD

    Example:
    abc123:2026-09-05
  */
  const [dailyNotes, setDailyNotes] = useState({})

  const [currentMonth, setCurrentMonth] = useState(new Date())

  /*
    One selected date per journey.
    Example:
    {
      "journey-id": "2026-09-05"
    }
  */
  const [selectedDates, setSelectedDates] = useState({})


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadJourneys()
  }, [])


  /* =========================================================
     LOAD JOURNEYS
  ========================================================= */

  async function loadJourneys() {

    try {

      setLoading(true)
      setError('')

      const {
        data: {
          user
        }
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUser(user)

      const {
        data,
        error: journeysError
      } = await supabase
        .from('journeys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: true
        })

      if (journeysError) {
        throw journeysError
      }

      const loadedJourneys = data || []

      setJourneys(loadedJourneys)

      if (
        loadedJourneys.length > 0 &&
        !expandedJourneyId
      ) {

        const firstJourney = loadedJourneys[0]

        setExpandedJourneyId(firstJourney.id)

        const firstMonth = parseDateString(
          firstJourney.start_date
        )

        if (firstMonth) {
          setCurrentMonth(firstMonth)
        }

        /*
          IMPORTANT:
          Always load details including diary notes.
        */
        await loadJourneyDetails(
          firstJourney,
          user
        )
      }

    } catch (err) {

      console.error(
        'Error loading journeys:',
        err
      )

      setError(
        'Unable to load journeys.'
      )

    } finally {

      setLoading(false)

    }
  }


  /* =========================================================
     LOAD JOURNEY DETAILS
  ========================================================= */

  async function loadJourneyDetails(
    journey,
    currentUser = user
  ) {

    if (!journey || !currentUser) return

    try {

      setError('')


      /* =====================================================
         LOAD DIARY NOTES
      ===================================================== */

      const {
        data: notes,
        error: notesError
      } = await supabase
        .from('journey_daily_notes')
        .select(
          'journey_id, journey_date, note'
        )
        .eq(
          'journey_id',
          journey.id
        )
        .eq(
          'user_id',
          currentUser.id
        )

      if (notesError) {
        console.error(
          'Notes loading error:',
          notesError
        )
      }

      /*
        IMPORTANT:
        Do NOT convert journey_date through new Date().
        Supabase returns the PostgreSQL DATE as YYYY-MM-DD.

        We store it exactly as returned.
      */

      const notesMap = {}

        ; (notes || []).forEach((row) => {

          if (!row.journey_date) {
            return
          }

          const dateKey = String(
            row.journey_date
          ).slice(0, 10)

          const key =
            `${journey.id}:${dateKey}`

          notesMap[key] =
            row.note ?? ''

        })

      /*
        Merge loaded notes into existing state.

        This is important because notes from another journey
        should not disappear when another journey is opened.
      */
      setDailyNotes((prev) => ({
        ...prev,
        ...notesMap
      }))


      /* =====================================================
         TASKS
      ===================================================== */

      const {
        data: tasks,
        error: tasksError
      } = await supabase
        .from('tasks')
        .select(
          'id, category, status, completed_at, created_at'
        )
        .eq(
          'user_id',
          currentUser.id
        )

      if (tasksError) {
        console.error(
          'Task loading error:',
          tasksError
        )
      }


      /* =====================================================
         FOCUS SESSIONS
      ===================================================== */

      const {
        data: sessions,
        error: sessionsError
      } = await supabase
        .from('focus_sessions')
        .select(
          'id, started_at, duration_seconds, session_type'
        )
        .eq(
          'user_id',
          currentUser.id
        )

      if (sessionsError) {
        console.error(
          'Focus session loading error:',
          sessionsError
        )
      }


      /* =====================================================
         WALKING
      ===================================================== */

      const {
        data: activity,
        error: activityError
      } = await supabase
        .from('daily_activity')
        .select(
          'activity_date, steps'
        )
        .eq(
          'user_id',
          currentUser.id
        )

      if (activityError) {
        console.error(
          'Activity loading error:',
          activityError
        )
      }


      /* =====================================================
         CREATE DATE MAP
      ===================================================== */

      const dataMap = {}

      const start =
        parseDateString(
          journey.start_date
        )

      const end =
        parseDateString(
          journey.target_date
        )

      if (!start || !end) {
        return
      }

      for (
        let date = new Date(start);
        date <= end;
        date.setDate(
          date.getDate() + 1
        )
      ) {

        const dateString =
          getDateString(date)

        dataMap[dateString] = {
          tasksCompleted: 0,
          studyMinutes: 0,
          steps: 0,
          focusSessions: 0
        }
      }


      /* =====================================================
         PROCESS TASKS
      ===================================================== */

      const allowedCategories =
        journey.task_categories || []

        ; (tasks || []).forEach((task) => {

          if (
            task.status !== 'completed' ||
            !task.completed_at
          ) {
            return
          }

          if (
            !allowedCategories.includes(
              task.category
            )
          ) {
            return
          }

          const completedDate =
            new Date(
              task.completed_at
            )

          if (
            Number.isNaN(
              completedDate.getTime()
            )
          ) {
            return
          }

          const dateString =
            getDateString(
              completedDate
            )

          if (
            dataMap[dateString]
          ) {

            dataMap[
              dateString
            ].tasksCompleted += 1

          }

        })


        /* =====================================================
           PROCESS FOCUS SESSIONS
        ===================================================== */

        ; (sessions || []).forEach((session) => {

          if (!session.started_at) {
            return
          }

          const sessionDate =
            new Date(
              session.started_at
            )

          if (
            Number.isNaN(
              sessionDate.getTime()
            )
          ) {
            return
          }

          const dateString =
            getDateString(
              sessionDate
            )

          if (
            !dataMap[dateString]
          ) {
            return
          }

          const durationSeconds =
            Number(
              session.duration_seconds
            ) || 0

          if (
            session.session_type ===
            'focus'
          ) {

            dataMap[
              dateString
            ].studyMinutes +=
              Math.floor(
                durationSeconds / 60
              )

            dataMap[
              dateString
            ].focusSessions += 1

          }

        })


        /* =====================================================
           PROCESS WALKING
        ===================================================== */

        ; (activity || []).forEach((item) => {

          const dateString =
            String(
              item.activity_date
            ).slice(0, 10)

          if (
            dataMap[dateString]
          ) {

            dataMap[
              dateString
            ].steps =
              Number(
                item.steps
              ) || 0

          }

        })


      setJourneyData((prev) => ({
        ...prev,
        [journey.id]: dataMap
      }))

    } catch (err) {

      console.error(
        'Error loading journey details:',
        err
      )

      setError(
        'Unable to load journey activity.'
      )
    }
  }


  /* =========================================================
     ADD / UPDATE JOURNEY
  ========================================================= */

  async function saveJourney() {

    if (!user) return

    if (
      !journeyForm.title.trim()
    ) {

      setError(
        'Please enter a journey title.'
      )

      return
    }

    if (
      !journeyForm.start_date ||
      !journeyForm.target_date
    ) {

      setError(
        'Please select both dates.'
      )

      return
    }

    if (
      journeyForm.start_date >
      journeyForm.target_date
    ) {

      setError(
        'Target date must be after the start date.'
      )

      return
    }

    try {

      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {

        title:
          journeyForm.title.trim(),

        description:
          journeyForm.description.trim(),

        start_date:
          journeyForm.start_date,

        target_date:
          journeyForm.target_date,

        task_categories:
          journeyForm.task_categories,

        status: 'active'

      }

      if (editingJourneyId) {

        const {
          data,
          error: updateError
        } = await supabase
          .from('journeys')
          .update(payload)
          .eq(
            'id',
            editingJourneyId
          )
          .eq(
            'user_id',
            user.id
          )
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        setJourneys((prev) =>
          prev.map((journey) =>
            journey.id ===
              editingJourneyId
              ? data
              : journey
          )
        )

        if (
          expandedJourneyId ===
          editingJourneyId
        ) {

          await loadJourneyDetails(
            data
          )
        }

        setSuccess(
          'Journey updated.'
        )

      } else {

        const {
          data,
          error: insertError
        } = await supabase
          .from('journeys')
          .insert({
            ...payload,
            user_id: user.id
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        setJourneys((prev) => [
          ...prev,
          data
        ])

        setExpandedJourneyId(
          data.id
        )

        const newMonth =
          parseDateString(
            data.start_date
          )

        if (newMonth) {
          setCurrentMonth(
            newMonth
          )
        }

        /*
          Explicitly pass user because setUser()
          is asynchronous.
        */
        await loadJourneyDetails(
          data,
          user
        )

        setSuccess(
          'Journey created.'
        )
      }

      setJourneyForm(
        EMPTY_JOURNEY
      )

      setShowAddJourney(false)
      setEditingJourneyId(null)

    } catch (err) {

      console.error(
        'Error saving journey:',
        err
      )

      setError(
        'Unable to save journey.'
      )

    } finally {

      setSaving(false)

    }
  }


  /* =========================================================
     DELETE JOURNEY
  ========================================================= */

  async function deleteJourney(
    journeyId
  ) {

    if (!user) return

    const confirmed =
      window.confirm(
        'Delete this journey and all of its diary notes?'
      )

    if (!confirmed) return

    try {

      setError('')

      const {
        error: deleteError
      } = await supabase
        .from('journeys')
        .delete()
        .eq(
          'id',
          journeyId
        )
        .eq(
          'user_id',
          user.id
        )

      if (deleteError) {
        throw deleteError
      }

      setJourneys((prev) =>
        prev.filter(
          (journey) =>
            journey.id !== journeyId
        )
      )

      setJourneyData((prev) => {

        const copy = {
          ...prev
        }

        delete copy[journeyId]

        return copy
      })

      setDailyNotes((prev) => {

        const copy = {
          ...prev
        }

        Object.keys(copy).forEach((key) => {

          if (
            key.startsWith(
              `${journeyId}:`
            )
          ) {
            delete copy[key]
          }

        })

        return copy
      })

      setSelectedDates((prev) => {

        const copy = {
          ...prev
        }

        delete copy[journeyId]

        return copy
      })

      if (
        expandedJourneyId ===
        journeyId
      ) {

        setExpandedJourneyId(null)

      }

      setSuccess(
        'Journey deleted.'
      )

    } catch (err) {

      console.error(
        'Error deleting journey:',
        err
      )

      setError(
        'Unable to delete journey.'
      )
    }
  }


  /* =========================================================
     EDIT JOURNEY
  ========================================================= */

  function startEditingJourney(
    journey
  ) {

    setEditingJourneyId(
      journey.id
    )

    setJourneyForm({

      title:
        journey.title || '',

      description:
        journey.description || '',

      start_date:
        journey.start_date || '',

      target_date:
        journey.target_date || '',

      task_categories:
        journey.task_categories || []

    })

    setShowAddJourney(true)
  }


  /* =========================================================
     TOGGLE JOURNEY
  ========================================================= */

  async function toggleJourney(
    journey
  ) {

    const isOpening =
      expandedJourneyId !==
      journey.id

    if (isOpening) {

      setExpandedJourneyId(
        journey.id
      )

      const journeyMonth =
        parseDateString(
          journey.start_date
        )

      if (journeyMonth) {
        setCurrentMonth(
          journeyMonth
        )
      }

      /*
        Always load journey details when opening.
        This guarantees diary notes are restored
        from Supabase even after page refresh.
      */
      await loadJourneyDetails(
        journey
      )

    } else {

      setExpandedJourneyId(null)

    }
  }


  /* =========================================================
     SAVE NOTE
  ========================================================= */

  async function saveDailyNote(
    journeyId,
    date,
    noteText
  ) {

    if (
      !user ||
      !journeyId ||
      !date
    ) {
      return
    }

    try {

      setSaving(true)
      setError('')
      setSuccess('')

      /*
        Keep date as YYYY-MM-DD string.
      */
      const dateKey =
        String(date).slice(0, 10)

      const note =
        (noteText ?? '').trimEnd()

      const {
        error: noteError
      } = await supabase
        .from('journey_daily_notes')
        .upsert(
          {
            journey_id:
              journeyId,

            user_id:
              user.id,

            journey_date:
              dateKey,

            note,

            updated_at:
              new Date().toISOString()

          },
          {
            onConflict:
              'user_id,journey_id,journey_date'
          }
        )

      if (noteError) {

        console.error(
          'Failed to save diary note:',
          noteError
        )

        throw noteError
      }

      /*
        CRITICAL FIX:
        Update the exact local state key immediately.
      */
      const key =
        `${journeyId}:${dateKey}`

      setDailyNotes((prev) => ({
        ...prev,
        [key]: note
      }))

      setSuccess(
        'Note saved.'
      )

    } catch (err) {

      console.error(
        'Error saving note:',
        err
      )

      setError(
        'Unable to save note.'
      )

    } finally {

      setSaving(false)

    }
  }


  /* =========================================================
     SELECT DATE
  ========================================================= */

  function selectDate(
    journeyId,
    date
  ) {

    /*
      date is already YYYY-MM-DD.
      Keep it exactly as a string.
    */
    const dateKey =
      String(date).slice(0, 10)

    setSelectedDates((prev) => ({
      ...prev,
      [journeyId]:
        dateKey
    }))

  }


  /* =========================================================
     DAY STATUS
  ========================================================= */

  function getDayStatus(
    journey,
    date
  ) {

    const dateString =
      getDateString(date)

    const today =
      getTodayString()

    if (
      dateString <
      journey.start_date
    ) {
      return 'outside'
    }

    if (
      dateString >
      journey.target_date
    ) {
      return 'future'
    }

    if (
      dateString >
      today
    ) {
      return 'future'
    }

    if (
      dateString ===
      today
    ) {
      return 'today'
    }

    const data =
      journeyData[
      journey.id
      ]?.[
      dateString
      ]

    if (!data) {
      return 'no-activity'
    }

    const hasActivity =
      Number(
        data.tasksCompleted
      ) > 0 ||
      Number(
        data.studyMinutes
      ) > 0 ||
      Number(
        data.steps
      ) > 0 ||
      Number(
        data.focusSessions
      ) > 0

    return hasActivity
      ? 'completed'
      : 'no-activity'
  }


  /* =========================================================
     SELECTABLE DATE
  ========================================================= */

  function isDateSelectable(
    journey,
    date
  ) {

    const dateString =
      getDateString(date)

    const today =
      getTodayString()

    return (
      dateString >=
      journey.start_date &&
      dateString <=
      journey.target_date &&
      dateString <=
      today
    )
  }


  /* =========================================================
     DAY CLASS
  ========================================================= */

  function getDayClass(
    status,
    selectable,
    selected
  ) {

    const base =
      'h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium transition-colors'

    /*
      Selected state is intentionally kept exactly
      as the existing UI requested.
    */
    const selectedClass =
      selected
        ? 'outline outline-2 outline-offset-2 outline-white'
        : ''

    if (!selectable) {

      return `${base} cursor-not-allowed ${selectedClass} bg-gray-900/50 text-gray-600 border border-gray-800`

    }

    switch (status) {

      case 'today':

        return `${base} cursor-pointer ${selectedClass} bg-blue-500 text-white border border-blue-400`

      case 'completed':

        return `${base} cursor-pointer ${selectedClass} bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30`

      case 'no-activity':

        return `${base} cursor-pointer ${selectedClass} bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700`

      default:

        return `${base} cursor-pointer ${selectedClass} bg-gray-800 text-gray-400 border border-gray-700`

    }
  }


  /* =========================================================
     CALENDAR
  ========================================================= */

  function renderCalendar(
    journey
  ) {

    const year =
      currentMonth.getFullYear()

    const month =
      currentMonth.getMonth()

    const firstDay =
      new Date(
        year,
        month,
        1
      )

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      )

    const startingDay =
      firstDay.getDay()

    const totalDays =
      lastDay.getDate()

    const days = []

    for (
      let i = 0;
      i < startingDay;
      i++
    ) {

      days.push(
        <div
          key={`empty-${i}`}
          className="h-9 sm:h-10"
        />
      )
    }

    const selectedDate =
      selectedDates[
      journey.id
      ]

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {

      const date =
        new Date(
          year,
          month,
          day
        )

      const dateString =
        getDateString(date)

      const status =
        getDayStatus(
          journey,
          date
        )

      const selectable =
        isDateSelectable(
          journey,
          date
        )

      const selected =
        selectedDate ===
        dateString

      days.push(

        <button
          type="button"
          key={dateString}
          disabled={!selectable}
          onClick={() => {

            if (selectable) {

              selectDate(
                journey.id,
                dateString
              )

            }

          }}
          className={getDayClass(
            status,
            selectable,
            selected
          )}
          aria-label={`Day ${day}`}
        >
          {day}
        </button>

      )
    }

    return days
  }


  /* =========================================================
     SELECTED DAY DATA
  ========================================================= */

  function getSelectedDayData(
    journey
  ) {

    const selectedDate =
      selectedDates[
      journey.id
      ]

    if (!selectedDate) {
      return null
    }

    const data =
      journeyData[
      journey.id
      ]?.[
      selectedDate
      ] || {
        tasksCompleted: 0,
        studyMinutes: 0,
        steps: 0,
        focusSessions: 0
      }

    const journeyDay =
      getJourneyDay(
        journey.start_date,
        selectedDate
      )

    const studyProgress =
      Math.min(
        100,
        Math.round(
          (
            Number(
              data.studyMinutes
            ) / 120
          ) * 100
        )
      )

    const stepProgress =
      Math.min(
        100,
        Math.round(
          (
            Number(
              data.steps
            ) / 10000
          ) * 100
        )
      )

    const taskProgress =
      Math.min(
        100,
        Math.round(
          (
            Number(
              data.tasksCompleted
            ) / 3
          ) * 100
        )
      )

    const overallProgress =
      Math.round(
        (
          studyProgress +
          stepProgress +
          taskProgress
        ) / 3
      )

    /*
      CRITICAL:
      Read the diary using the exact same key
      used when saving/loading.
    */
    const noteKey =
      `${journey.id}:${selectedDate}`

    const note =
      dailyNotes[noteKey] ?? ''

    return {

      date:
        selectedDate,

      journeyDay,

      tasksCompleted:
        Number(
          data.tasksCompleted
        ) || 0,

      studyMinutes:
        Number(
          data.studyMinutes
        ) || 0,

      steps:
        Number(
          data.steps
        ) || 0,

      focusSessions:
        Number(
          data.focusSessions
        ) || 0,

      overallProgress,

      studyProgress,

      stepProgress,

      taskProgress,

      note

    }
  }


  /* =========================================================
     JOURNEY HEALTH
  ========================================================= */

  function getJourneyHealth(
    journey
  ) {

    const totalDays =
      getDaysBetween(
        journey.start_date,
        journey.target_date
      )

    if (
      totalDays <= 0
    ) {
      return null
    }

    const today =
      getTodayString()

    const journeyDay =
      getJourneyDay(
        journey.start_date,
        today
      )

    const daysElapsed =
      Math.min(
        Math.max(
          journeyDay,
          0
        ),
        totalDays
      )

    const expectedProgress =
      totalDays > 0
        ? Math.round(
          (
            daysElapsed /
            totalDays
          ) * 100
        )
        : 0

    let totalDailyProgress = 0
    let daysWithActivity = 0
    let daysWithoutActivity = 0

    const start =
      parseDateString(
        journey.start_date
      )

    const end =
      parseDateString(
        journey.target_date
      )

    const todayDate =
      parseDateString(
        today
      )

    const dataMap =
      journeyData[
      journey.id
      ] || {}

    if (!start || !end || !todayDate) {
      return null
    }

    for (
      let date = new Date(start);

      date <= end &&
      date <= todayDate;

      date.setDate(
        date.getDate() + 1
      )
    ) {

      const dateString =
        getDateString(date)

      const data =
        dataMap[
        dateString
        ] || {
          tasksCompleted: 0,
          studyMinutes: 0,
          steps: 0,
          focusSessions: 0
        }

      const studyProgress =
        Math.min(
          100,
          Math.round(
            (
              Number(
                data.studyMinutes
              ) / 120
            ) * 100
          )
        )

      const stepProgress =
        Math.min(
          100,
          Math.round(
            (
              Number(
                data.steps
              ) / 10000
            ) * 100
          )
        )

      const taskProgress =
        Math.min(
          100,
          Math.round(
            (
              Number(
                data.tasksCompleted
              ) / 3
            ) * 100
          )
        )

      const dailyProgress =
        Math.round(
          (
            studyProgress +
            stepProgress +
            taskProgress
          ) / 3
        )

      totalDailyProgress +=
        dailyProgress

      const hasActivity =
        Number(
          data.tasksCompleted
        ) > 0 ||
        Number(
          data.studyMinutes
        ) > 0 ||
        Number(
          data.steps
        ) > 0 ||
        Number(
          data.focusSessions
        ) > 0

      if (hasActivity) {
        daysWithActivity += 1
      } else {
        daysWithoutActivity += 1
      }
    }

    const actualProgress =
      daysElapsed > 0
        ? Math.round(
          totalDailyProgress /
          daysElapsed
        )
        : 0

    const difference =
      actualProgress -
      expectedProgress

    let status =
      'On Track'

    if (
      difference >= 5
    ) {
      status =
        'Ahead'
    } else if (
      difference <= -5
    ) {
      status =
        'Behind'
    }

    const averageActiveDayProgress =
      daysWithActivity > 0
        ? Math.round(
          totalDailyProgress /
          daysWithActivity
        )
        : 0

    return {

      expectedProgress,

      actualProgress,

      difference,

      status,

      daysElapsed,

      totalDays,

      daysWithActivity,

      daysWithoutActivity,

      averageActiveDayProgress

    }
  }


  /* =========================================================
     JOURNEY SUMMARY
  ========================================================= */

  function getJourneySummary(
    journey
  ) {

    const totalDays =
      getDaysBetween(
        journey.start_date,
        journey.target_date
      )

    const today =
      getTodayString()

    const rawDay =
      getJourneyDay(
        journey.start_date,
        today
      )

    const currentDay =
      Math.min(
        Math.max(
          rawDay,
          0
        ),
        totalDays
      )

    const elapsedDays =
      Math.min(
        Math.max(
          rawDay,
          0
        ),
        totalDays
      )

    const daysRemaining =
      Math.max(
        0,
        totalDays -
        elapsedDays
      )

    const dataMap =
      journeyData[
      journey.id
      ] || {}

    let totalStudyMinutes = 0
    let totalTasksCompleted = 0
    let totalSteps = 0
    let totalFocusSessions = 0

    Object.entries(
      dataMap
    ).forEach(
      ([date, data]) => {

        if (
          date <=
          getTodayString()
        ) {

          totalStudyMinutes +=
            Number(
              data.studyMinutes
            ) || 0

          totalTasksCompleted +=
            Number(
              data.tasksCompleted
            ) || 0

          totalSteps +=
            Number(
              data.steps
            ) || 0

          totalFocusSessions +=
            Number(
              data.focusSessions
            ) || 0

        }
      }
    )

    return {

      totalDays,

      currentDay,

      elapsedDays,

      daysRemaining,

      totalStudyMinutes,

      totalTasksCompleted,

      totalSteps,

      totalFocusSessions

    }
  }


  /* =========================================================
     TOGGLE CATEGORY
  ========================================================= */

  function toggleCategory(
    category
  ) {

    setJourneyForm(
      (prev) => {

        const exists =
          prev.task_categories.includes(
            category
          )

        return {

          ...prev,

          task_categories:
            exists
              ? prev.task_categories.filter(
                (item) =>
                  item !== category
              )
              : [
                ...prev.task_categories,
                category
              ]

        }
      }
    )
  }


  /* =========================================================
     OPEN ADD FORM
  ========================================================= */

  function openAddJourney() {

    setEditingJourneyId(null)

    setJourneyForm({
      ...EMPTY_JOURNEY
    })

    setError('')
    setSuccess('')
    setShowAddJourney(true)
  }


  /* =========================================================
     CLOSE FORM
  ========================================================= */

  function closeJourneyForm() {

    setShowAddJourney(false)
    setEditingJourneyId(null)

    setJourneyForm({
      ...EMPTY_JOURNEY
    })
  }


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {

    return (

      <div className="space-y-6">

        <div>

          <h1 className="text-2xl font-semibold">
            Journeys
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Track the things that matter to you.
          </p>

        </div>

        <Card className="card-padding">

          <p className="text-sm text-gray-400">
            Loading journeys...
          </p>

        </Card>

      </div>

    )
  }


  /* =========================================================
     MAIN UI
  ========================================================= */

  return (

    <div className="space-y-5 pb-8">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-gray-900">

              <CalendarDays
                size={19}
                className="text-blue-400"
              />

            </div>

            <div>

              <h1 className="text-2xl font-semibold">
                Journeys
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Track your progress one day at a time.
              </p>

            </div>

          </div>

        </div>

        <Button
          onClick={
            openAddJourney
          }
        >

          <Plus
            size={17}
          />

          Add Journey

        </Button>

      </div>


      {/* ===================================================
          MESSAGES
      =================================================== */}

      {error && (

        <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">

          {error}

        </div>

      )}

      {success && (

        <div className="rounded-lg border border-green-900 bg-green-950/20 px-4 py-3 text-sm text-green-300">

          {success}

        </div>

      )}


      {/* ===================================================
          ADD / EDIT JOURNEY FORM
      =================================================== */}

      {showAddJourney && (

        <Card className="card-padding">

          <div className="flex items-start justify-between gap-4">

            <div>

              <h2 className="text-lg font-semibold">

                {editingJourneyId
                  ? 'Edit Journey'
                  : 'Add Journey'}

              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create a focused space for one goal or phase.
              </p>

            </div>

            <button
              type="button"
              onClick={
                closeJourneyForm
              }
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              aria-label="Close"
            >

              <X
                size={18}
              />

            </button>

          </div>


          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <div className="sm:col-span-2">

              <label className="mb-2 block text-sm font-medium">
                Journey Title
              </label>

              <Input
                value={
                  journeyForm.title
                }
                onChange={(e) =>
                  setJourneyForm(
                    (prev) => ({
                      ...prev,
                      title:
                        e.target.value
                    })
                  )
                }
                placeholder="Data Science Journey"
              />

            </div>


            <div className="sm:col-span-2">

              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <Input
                value={
                  journeyForm.description
                }
                onChange={(e) =>
                  setJourneyForm(
                    (prev) => ({
                      ...prev,
                      description:
                        e.target.value
                    })
                  )
                }
                placeholder="What are you trying to achieve?"
              />

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium">
                Start Date
              </label>

              <Input
                type="date"
                value={
                  journeyForm.start_date
                }
                onChange={(e) =>
                  setJourneyForm(
                    (prev) => ({
                      ...prev,
                      start_date:
                        e.target.value
                    })
                  )
                }
              />

            </div>


            <div>

              <label className="mb-2 block text-sm font-medium">
                Target Date
              </label>

              <Input
                type="date"
                value={
                  journeyForm.target_date
                }
                onChange={(e) =>
                  setJourneyForm(
                    (prev) => ({
                      ...prev,
                      target_date:
                        e.target.value
                    })
                  )
                }
              />

            </div>

          </div>


          <div className="mt-5">

            <p className="text-sm font-medium">
              Count these task categories
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Only selected categories contribute to this journey.
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

              {TASK_CATEGORIES.map(
                (category) => {

                  const selected =
                    journeyForm.task_categories.includes(
                      category.value
                    )

                  return (

                    <button
                      type="button"
                      key={
                        category.value
                      }
                      onClick={() =>
                        toggleCategory(
                          category.value
                        )
                      }
                      className={[
                        'rounded-lg border px-3 py-3 text-left text-sm transition-colors',
                        selected
                          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                          : 'border-gray-800 bg-gray-900/30 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                      ].join(' ')}
                    >

                      <div className="flex items-center justify-between gap-3">

                        <span>
                          {category.label}
                        </span>

                        {selected && (

                          <CheckCircle
                            size={16}
                            className="text-blue-400"
                          />

                        )}

                      </div>

                    </button>

                  )
                }
              )}

            </div>

          </div>


          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">

            <Button
              variant="ghost"
              onClick={
                closeJourneyForm
              }
            >
              Cancel
            </Button>

            <Button
              onClick={
                saveJourney
              }
              disabled={saving}
            >

              <Save
                size={16}
              />

              {saving
                ? 'Saving...'
                : editingJourneyId
                  ? 'Update Journey'
                  : 'Create Journey'}

            </Button>

          </div>

        </Card>

      )}


      {/* ===================================================
          EMPTY STATE
      =================================================== */}

      {journeys.length === 0 && (

        <Card className="card-padding">

          <div className="py-8 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-gray-800 bg-gray-900">

              <Target
                size={21}
                className="text-blue-400"
              />

            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No journeys yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Create a journey for something you want to
              consistently work toward.
            </p>

            <div className="mt-5">

              <Button
                onClick={
                  openAddJourney
                }
              >

                <Plus
                  size={17}
                />

                Create your first journey

              </Button>

            </div>

          </div>

        </Card>

      )}


      {/* ===================================================
          JOURNEY LIST
      =================================================== */}

      <div className="space-y-3">

        {journeys.map(
          (journey) => {

            const expanded =
              expandedJourneyId ===
              journey.id

            const health =
              getJourneyHealth(
                journey
              )

            const summary =
              getJourneySummary(
                journey
              )

            const selectedDayData =
              expanded
                ? getSelectedDayData(
                  journey
                )
                : null

            return (

              <Card
                key={
                  journey.id
                }
                className="overflow-hidden"
              >

                {/* =================================================
                    COMPACT JOURNEY HEADER
                ================================================= */}

                <button
                  type="button"
                  onClick={() =>
                    toggleJourney(
                      journey
                    )
                  }
                  className="w-full px-4 py-4 text-left sm:px-5"
                >

                  <div className="flex items-start gap-3">

                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-800 bg-gray-900">

                      <Target
                        size={17}
                        className="text-blue-400"
                      />

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="truncate font-semibold">
                          {journey.title}
                        </h2>

                        {journey.status ===
                          'active' && (

                            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[11px] text-green-400">
                              Active
                            </span>

                          )}

                      </div>

                      <p className="mt-1 text-xs text-gray-500">

                        {formatDate(
                          journey.start_date
                        )}

                        {' → '}

                        {formatDate(
                          journey.target_date
                        )}

                      </p>

                    </div>

                    <div className="flex shrink-0 items-center gap-3">

                      <div className="hidden text-right sm:block">

                        <p className="text-sm font-semibold">
                          {health?.actualProgress || 0}%
                        </p>

                        <p className="text-[11px] text-gray-500">
                          progress
                        </p>

                      </div>

                      {expanded
                        ? (
                          <ChevronUp
                            size={18}
                            className="text-gray-500"
                          />
                        )
                        : (
                          <ChevronDown
                            size={18}
                            className="text-gray-500"
                          />
                        )}

                    </div>

                  </div>


                  <div className="mt-3 sm:hidden">

                    <div className="flex items-center justify-between text-[11px]">

                      <span className="text-gray-500">
                        Progress
                      </span>

                      <span className="text-gray-300">
                        {health?.actualProgress || 0}%
                      </span>

                    </div>

                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-800">

                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${health?.actualProgress || 0}%`
                        }}
                      />

                    </div>

                  </div>

                </button>


                {/* =================================================
                    EXPANDED JOURNEY
                ================================================= */}

                {expanded && (

                  <div className="border-t border-gray-800 px-4 py-4 sm:px-5 sm:py-5">

                    {/* DESCRIPTION / ACTIONS */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        {journey.description && (

                          <p className="text-sm text-gray-400">
                            {journey.description}
                          </p>

                        )}

                        <p className="mt-1 text-xs text-gray-500">

                          {summary.currentDay > 0
                            ? `Day ${summary.currentDay} of ${summary.totalDays}`
                            : 'Journey has not started yet'}

                        </p>

                      </div>

                      <div className="flex items-center gap-1">

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            startEditingJourney(
                              journey
                            )
                          }
                        >

                          <Pencil
                            size={15}
                          />

                          Edit

                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            deleteJourney(
                              journey.id
                            )
                          }
                        >

                          <Trash2
                            size={15}
                            className="text-red-400"
                          />

                          Delete

                        </Button>

                      </div>

                    </div>


                    {/* SUMMARY */}

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">

                      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">

                        <p className="text-[11px] text-gray-500">
                          Days Left
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {summary.daysRemaining}
                        </p>

                      </div>

                      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">

                        <p className="text-[11px] text-gray-500">
                          Study
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {summary.totalStudyMinutes}m
                        </p>

                      </div>

                      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">

                        <p className="text-[11px] text-gray-500">
                          Tasks
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {summary.totalTasksCompleted}
                        </p>

                      </div>

                      <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-3">

                        <p className="text-[11px] text-gray-500">
                          Steps
                        </p>

                        <p className="mt-1 text-lg font-semibold">
                          {formatNumber(
                            summary.totalSteps
                          )}
                        </p>

                      </div>

                    </div>


                    {/* JOURNEY HEALTH */}

                    {health && (

                      <div className="mt-4 rounded-lg border border-gray-800 bg-gray-900/20 p-4">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div>

                            <div className="flex items-center gap-2">

                              <Activity
                                size={16}
                                className="text-blue-400"
                              />

                              <h3 className="text-sm font-semibold">
                                Journey Health
                              </h3>

                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              Expected vs your actual consistency.
                            </p>

                          </div>

                          <div
                            className={[
                              'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',

                              health.status ===
                                'Ahead'
                                ? 'border-green-500/30 bg-green-500/10 text-green-400'

                                : health.status ===
                                  'Behind'
                                  ? 'border-red-500/30 bg-red-500/10 text-red-400'

                                  : 'border-gray-700 bg-gray-800 text-gray-300'
                            ].join(' ')}
                          >

                            {health.status ===
                              'Ahead' && (
                                <TrendingUp
                                  size={13}
                                />
                              )}

                            {health.status ===
                              'Behind' && (
                                <TrendingDown
                                  size={13}
                                />
                              )}

                            {health.status ===
                              'On Track' && (
                                <Minus
                                  size={13}
                                />
                              )}

                            {health.status}

                          </div>

                        </div>


                        <div className="mt-4 grid gap-3 sm:grid-cols-2">

                          <div>

                            <div className="flex justify-between text-xs">

                              <span className="text-gray-500">
                                Expected
                              </span>

                              <span className="text-gray-300">
                                {health.expectedProgress}%
                              </span>

                            </div>

                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-800">

                              <div
                                className="h-full rounded-full bg-gray-500"
                                style={{
                                  width: `${health.expectedProgress}%`
                                }}
                              />

                            </div>

                          </div>


                          <div>

                            <div className="flex justify-between text-xs">

                              <span className="text-gray-500">
                                Actual
                              </span>

                              <span className="text-gray-300">
                                {health.actualProgress}%
                              </span>

                            </div>

                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-800">

                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${health.actualProgress}%`
                                }}
                              />

                            </div>

                          </div>

                        </div>


                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">

                          <span>
                            {health.daysWithActivity} active days
                          </span>

                          <span>
                            {health.daysWithoutActivity} inactive days
                          </span>

                          <span>
                            Difference:{' '}
                            <strong
                              className={
                                health.difference > 0
                                  ? 'text-green-400'
                                  : health.difference < 0
                                    ? 'text-red-400'
                                    : 'text-gray-300'
                              }
                            >
                              {health.difference > 0
                                ? '+'
                                : ''}
                              {health.difference}%
                            </strong>
                          </span>

                        </div>

                      </div>

                    )}


                    {/* CALENDAR */}

                    <div className="mt-4 rounded-lg border border-gray-800 p-3 sm:p-4">

                      <div className="flex items-center justify-between gap-2">

                        <div>

                          <h3 className="text-sm font-semibold">
                            Journey Calendar
                          </h3>

                          <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
                            Select a day to view activity and notes.
                          </p>

                        </div>

                        <div className="flex items-center gap-1">

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {

                              const next =
                                new Date(
                                  currentMonth
                                )

                              next.setMonth(
                                next.getMonth() - 1
                              )

                              setCurrentMonth(
                                next
                              )

                            }}
                          >

                            <ChevronLeft
                              size={15}
                            />

                          </Button>

                          <span className="min-w-[100px] text-center text-xs font-medium sm:min-w-[130px]">

                            {currentMonth.toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                year: 'numeric'
                              }
                            )}

                          </span>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {

                              const next =
                                new Date(
                                  currentMonth
                                )

                              next.setMonth(
                                next.getMonth() + 1
                              )

                              setCurrentMonth(
                                next
                              )

                            }}
                          >

                            <ChevronRight
                              size={15}
                            />

                          </Button>

                        </div>

                      </div>


                      <div className="mt-4">

                        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">

                          {[
                            'S',
                            'M',
                            'T',
                            'W',
                            'T',
                            'F',
                            'S'
                          ].map(
                            (
                              day,
                              index
                            ) => (

                              <div
                                key={`${day}-${index}`}
                                className="text-center text-[10px] font-medium text-gray-600 sm:text-xs"
                              >
                                {day}
                              </div>

                            )
                          )}

                        </div>


                        <div className="grid grid-cols-7 gap-1 sm:gap-2">

                          {renderCalendar(
                            journey
                          )}

                        </div>

                      </div>


                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-gray-500">

                        <span className="flex items-center gap-1.5">

                          <span className="h-2.5 w-2.5 rounded bg-blue-500" />

                          Today

                        </span>

                        <span className="flex items-center gap-1.5">

                          <span className="h-2.5 w-2.5 rounded bg-green-500/50" />

                          Activity

                        </span>

                        <span className="flex items-center gap-1.5">

                          <span className="h-2.5 w-2.5 rounded bg-gray-700" />

                          No activity

                        </span>

                      </div>

                    </div>


                    {/* SELECTED DAY */}

                    {selectedDayData && (

                      <div className="mt-4 rounded-lg border border-gray-800 p-4">

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <p className="text-xs text-gray-500">
                              Day {selectedDayData.journeyDay}
                            </p>

                            <h3 className="mt-0.5 font-semibold">
                              {formatLongDate(
                                selectedDayData.date
                              )}
                            </h3>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDates(
                                (prev) => ({
                                  ...prev,
                                  [journey.id]:
                                    null
                                })
                              )
                            }
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-200"
                          >

                            <X
                              size={16}
                            />

                          </button>

                        </div>


                        {/* STATS */}

                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">

                          <div className="rounded-lg border border-gray-800 p-3">

                            <p className="text-[11px] text-gray-500">
                              Progress
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              {selectedDayData.overallProgress}%
                            </p>

                          </div>

                          <div className="rounded-lg border border-gray-800 p-3">

                            <p className="text-[11px] text-gray-500">
                              Tasks
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              {selectedDayData.tasksCompleted}
                            </p>

                          </div>

                          <div className="rounded-lg border border-gray-800 p-3">

                            <p className="text-[11px] text-gray-500">
                              Study
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              {selectedDayData.studyMinutes}m
                            </p>

                          </div>

                          <div className="rounded-lg border border-gray-800 p-3">

                            <p className="text-[11px] text-gray-500">
                              Steps
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                              {formatNumber(
                                selectedDayData.steps
                              )}
                            </p>

                          </div>

                        </div>


                        {/* =================================================
                            DAILY NOTE / DIARY
                        ================================================= */}

                        <div className="mt-4 border-t border-gray-800 pt-4">

                          <div className="flex items-center gap-2">

                            <BookOpen
                              size={15}
                              className="text-blue-400"
                            />

                            <h3 className="text-sm font-medium">
                              Daily Note
                            </h3>

                          </div>


                          <textarea
                            value={
                              dailyNotes[
                              `${journey.id}:${selectedDayData.date}`
                              ] ?? ''
                            }
                            onChange={(e) => {

                              const key =
                                `${journey.id}:${selectedDayData.date}`

                              const text =
                                e.target.value

                              setDailyNotes(
                                (prev) => ({
                                  ...prev,
                                  [key]:
                                    text
                                })
                              )

                            }}
                            onBlur={() => {

                              const key =
                                `${journey.id}:${selectedDayData.date}`

                              /*
                                Read the latest local value.
                                This avoids relying on stale state.
                              */
                              const currentNote =
                                dailyNotes[key] ?? ''

                              saveDailyNote(
                                journey.id,
                                selectedDayData.date,
                                currentNote
                              )

                            }}
                            placeholder="How was today? Add a short note, achievement, problem, reflection..."
                            rows={3}
                            className="mt-3 w-full resize-none rounded-lg border border-gray-800 bg-gray-900/30 px-3 py-2.5 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-gray-600"
                          />


                          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                            <p className="text-[11px] text-gray-600">
                              Auto-saved when you leave the field, or press Save Note.
                            </p>


                            <Button
                              size="sm"
                              onClick={() => {

                                const key =
                                  `${journey.id}:${selectedDayData.date}`

                                const currentNote =
                                  dailyNotes[key] ?? ''

                                saveDailyNote(
                                  journey.id,
                                  selectedDayData.date,
                                  currentNote
                                )

                              }}
                              disabled={
                                saving
                              }
                            >

                              <Save
                                size={14}
                              />

                              {saving
                                ? 'Saving...'
                                : 'Save Note'}

                            </Button>

                          </div>

                        </div>

                      </div>

                    )}

                  </div>

                )}

              </Card>

            )

          }
        )}

      </div>

    </div>

  )
}