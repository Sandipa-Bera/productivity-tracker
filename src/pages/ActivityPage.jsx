import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

const DEFAULT_STEP_GOAL = 10000;

function getPercentage(value, goal) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ActivityPage() {
  const { user } = useAuth();

  const [steps, setSteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL);
  const [recentActivity, setRecentActivity] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [stepInput, setStepInput] = useState("");

  useEffect(() => {
    if (!user) return;

    loadActivity();
  }, [user]);

  async function loadActivity() {
    try {
      setLoading(true);
      setError("");

      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);

      const sevenDaysAgoString = sevenDaysAgo
        .toISOString()
        .split("T")[0];

      // Get user's step goal
      const { data: preferences, error: preferencesError } =
        await supabase
          .from("user_preferences")
          .select("daily_step_goal")
          .eq("user_id", user.id)
          .maybeSingle();

      if (preferencesError) {
        throw preferencesError;
      }

      const goal = preferences?.daily_step_goal || DEFAULT_STEP_GOAL;

      setStepGoal(goal);

      // Get recent activity
      const { data: activityData, error: activityError } = await supabase
        .from("daily_activity")
        .select("activity_date, steps, step_goal")
        .eq("user_id", user.id)
        .gte("activity_date", sevenDaysAgoString)
        .lte("activity_date", todayString)
        .order("activity_date", { ascending: false });

      if (activityError) {
        throw activityError;
      }

      setRecentActivity(activityData || []);

      // Find today's activity
      const todayActivity = (activityData || []).find(
        (activity) => activity.activity_date === todayString
      );

      const todaySteps = todayActivity?.steps || 0;

      setSteps(todaySteps);
      setStepInput(String(todaySteps));
    } catch (err) {
      console.error("Error loading activity:", err);
      setError("Unable to load activity data.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSteps() {
    if (!user) return;

    const numericSteps = Number(stepInput);

    if (!Number.isFinite(numericSteps) || numericSteps < 0) {
      setError("Please enter a valid number of steps.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const today = new Date().toISOString().split("T")[0];

      const { error: saveError } = await supabase
        .from("daily_activity")
        .upsert(
          {
            user_id: user.id,
            activity_date: today,
            steps: Math.floor(numericSteps),
            step_goal: stepGoal,
          },
          {
            onConflict: "user_id,activity_date",
          }
        );

      if (saveError) {
        throw saveError;
      }

      setSteps(Math.floor(numericSteps));

      await loadActivity();
    } catch (err) {
      console.error("Error saving steps:", err);
      setError("Unable to save your steps.");
    } finally {
      setSaving(false);
    }
  }

  const percentage = getPercentage(steps, stepGoal);
  const remaining = Math.max(stepGoal - steps, 0);
  const goalCompleted = steps >= stepGoal;

  if (loading) {
    return (
      <div className="min-h-full bg-[#0f1115] text-[#f1f3f5]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-[#1d2129]" />
            <div className="mt-3 h-4 w-64 animate-pulse rounded bg-[#1d2129]" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl border border-[#2a2f38] bg-[#171a21]" />
            <div className="h-72 animate-pulse rounded-2xl border border-[#2a2f38] bg-[#171a21]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#0f1115] text-[#f1f3f5]">
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Activity
          </h1>

          <p className="mt-2 text-sm text-[#9aa1ad]">
            Track your daily walking activity and keep moving toward your goal.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Today's activity */}
          <section className="rounded-2xl border border-[#2a2f38] bg-[#171a21] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#9aa1ad]">
                  Today's walking
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  {steps.toLocaleString()}
                </h2>

                <p className="mt-1 text-sm text-[#6f7785]">
                  of {stepGoal.toLocaleString()} steps
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-xl">
                🚶
              </div>
            </div>

            {/* Progress */}
            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[#9aa1ad]">Daily goal</span>

                <span className="font-semibold text-[#f1f3f5]">
                  {percentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-[#292e37]">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Remaining */}
            <div className="mt-6">
              {goalCompleted ? (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                  <p className="text-sm font-semibold text-green-400">
                    🎉 Daily walking goal completed!
                  </p>

                  <p className="mt-2 text-xs text-green-400/70">
                    Great job keeping yourself active today.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#2a2f38] bg-[#1d2129] px-4 py-3">
                  <p className="text-sm text-[#9aa1ad]">
                    <span className="font-semibold text-[#f1f3f5]">
                      {remaining.toLocaleString()}
                    </span>{" "}
                    steps remaining
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Update steps */}
          <section className="rounded-2xl border border-[#2a2f38] bg-[#171a21] p-6">
            <div>
              <p className="text-sm font-medium text-[#9aa1ad]">
                Update today's steps
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Enter your latest count
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6f7785]">
                For now, steps are entered manually. Wearable and health-data
                integration can be added later.
              </p>
            </div>

            <div className="mt-6">
              <label
                htmlFor="steps"
                className="mb-2 block text-sm font-medium text-[#c5cad2]"
              >
                Steps
              </label>

              <input
                id="steps"
                type="number"
                min="0"
                value={stepInput}
                onChange={(event) => setStepInput(event.target.value)}
                placeholder="e.g. 7500"
                className="h-11 w-full rounded-lg border border-[#2a2f38] bg-[#0f1115] px-3 text-sm text-[#f1f3f5] placeholder:text-[#5f6672] focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={saveSteps}
              disabled={saving}
              className="mt-4 h-11 w-full rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save steps"}
            </button>
          </section>
        </div>

        {/* Recent activity */}
        <section className="mt-5 rounded-2xl border border-[#2a2f38] bg-[#171a21] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Recent activity</h2>

            <p className="mt-2 text-sm text-[#6f7785]">
              Your walking activity over the last 7 days.
            </p>
          </div>

          {recentActivity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2a2f38] bg-[#1d2129] px-5 py-10 text-center">
              <div className="text-2xl">🚶</div>

              <p className="mt-3 text-sm font-medium text-[#f1f3f5]">
                No activity recorded yet
              </p>

              <p className="mt-2 text-sm text-[#6f7785]">
                Enter today's steps above to start building your history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const activityGoal =
                  activity.step_goal || stepGoal;

                const activityPercentage = getPercentage(
                  activity.steps || 0,
                  activityGoal
                );

                const completed =
                  (activity.steps || 0) >= activityGoal;

                return (
                  <div
                    key={activity.activity_date}
                    className="rounded-xl border border-[#222730] bg-[#1d2129] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#f1f3f5]">
                          {formatDate(activity.activity_date)}
                        </p>

                        <p className="mt-2 text-xs text-[#6f7785]">
                          {(activity.steps || 0).toLocaleString()} /{" "}
                          {activityGoal.toLocaleString()} steps
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-semibold ${
                            completed
                              ? "text-green-400"
                              : "text-[#9aa1ad]"
                          }`}
                        >
                          {activityPercentage}%
                        </span>

                        {completed && (
                          <span className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                            Complete
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#292e37]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          completed
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${activityPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Goal information */}
        <section className="mt-5 rounded-2xl border border-[#2a2f38] bg-[#171a21] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#6f7785]">
                Daily step goal
              </p>

              <p className="mt-2 text-2xl font-bold">
                {stepGoal.toLocaleString()}
              </p>
            </div>

            <div className="rounded-lg bg-blue-500/10 px-4 py-3">
              <p className="text-xs text-blue-400">
                Current target
              </p>

              <p className="mt-2 text-sm font-semibold text-blue-400">
                10K walking goal
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}