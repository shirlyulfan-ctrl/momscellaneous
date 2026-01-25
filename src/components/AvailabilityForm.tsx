import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Recurrence = "none" | "daily" | "weekly";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Expand a single "template" window into concrete slots for next N days
function expandSlots(params: {
  start: Date;
  end: Date;
  recurrence: Recurrence;
  weekdays: number[];
  daysAhead: number;
}) {
  const { start, end, recurrence, weekdays, daysAhead } = params;

  // duration in ms (handles overnight too, if you ever allow it)
  const durationMs = end.getTime() - start.getTime();
  if (!Number.isFinite(durationMs) || durationMs <= 0) return [];

  const out: { start_at: string; end_at: string }[] = [];

  const baseStart = start;
  const baseEnd = end;

  const today = startOfDay(new Date());
  const limit = addDays(today, daysAhead);

  // For daily/weekly, we use the "time of day" from the chosen start/end
  const startH = baseStart.getHours();
  const startM = baseStart.getMinutes();
  const endH = baseEnd.getHours();
  const endM = baseEnd.getMinutes();

  for (let day = startOfDay(today); day <= limit; day = addDays(day, 1)) {
    const dow = day.getDay(); // 0-6

    if (recurrence === "none") {
      // just the one original slot
      out.push({ start_at: baseStart.toISOString(), end_at: baseEnd.toISOString() });
      break;
    }

    if (recurrence === "weekly" && !weekdays.includes(dow)) continue;

    // create slot on this date with the chosen times
    const slotStart = new Date(day);
    slotStart.setHours(startH, startM, 0, 0);

    const slotEnd = new Date(day);
    slotEnd.setHours(endH, endM, 0, 0);

    // only include future-ish slots
    if (slotEnd.getTime() <= Date.now()) continue;

    out.push({ start_at: slotStart.toISOString(), end_at: slotEnd.toISOString() });
  }

  return out;
}

export default function AvailabilityForm({ providerId }: { providerId: string }) {
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const windowInvalid = useMemo(() => {
    if (!startDateTime || !endDateTime) return false;
    return new Date(endDateTime).getTime() <= new Date(startDateTime).getTime();
  }, [startDateTime, endDateTime]);

  const toggleWeekday = (d: number) => {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const onSave = async () => {
    setMsg(null);

    if (!startDateTime || !endDateTime) {
      setMsg("Please choose a start and end time.");
      return;
    }
    if (windowInvalid) {
      setMsg("End time must be after start time.");
      return;
    }
    if (recurrence === "weekly" && weekdays.length === 0) {
      setMsg("Pick at least one weekday for weekly recurrence.");
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // Expand into real slots for next 56 days (8 weeks)
    const slots = expandSlots({
      start,
      end,
      recurrence,
      weekdays,
      daysAhead: 56,
    });

    if (slots.length === 0) {
      setMsg("No availability slots were generated (check your times).");
      return;
    }

    setSaving(true);

    // Insert concrete slots into provider_availability
    const payload = slots.map((s) => ({
      provider_id: providerId,
      start_at: s.start_at,
      end_at: s.end_at,
      is_recurring: recurrence !== "none",
      recurrence,
      weekdays: recurrence === "weekly" ? weekdays : null,
      timezone: "America/New_York",
    }));

    const { error } = await supabase.from("provider_availability").insert(payload);

    if (error) {
      console.error(error);
      setMsg("Failed to save availability. Check console + Supabase table/permissions.");
    } else {
      setMsg(`Saved ${payload.length} availability slots.`);
      setStartDateTime("");
      setEndDateTime("");
    }

    setSaving(false);
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-xl font-semibold text-foreground mb-4">Set Availability</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <div className="text-sm text-muted-foreground">Start</div>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full bg-muted rounded-xl px-4 py-3 outline-none"
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-muted-foreground">End</div>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full bg-muted rounded-xl px-4 py-3 outline-none"
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="text-sm text-muted-foreground mb-2">Recurring</div>
        <div className="flex flex-wrap gap-2">
          {(["none", "daily", "weekly"] as Recurrence[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRecurrence(r)}
              className={`px-3 py-2 rounded-xl border ${
                recurrence === r ? "border-primary" : "border-border"
              }`}
            >
              {r === "none" ? "One-time" : r === "daily" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>
      </div>

      {recurrence === "weekly" && (
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">Weekdays</div>
          <div className="flex flex-wrap gap-2">
            {weekdayLabels.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleWeekday(idx)}
                className={`px-3 py-2 rounded-xl border ${
                  weekdays.includes(idx) ? "border-primary" : "border-border"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {msg && (
        <div className={`mt-4 text-sm ${windowInvalid ? "text-destructive" : "text-muted-foreground"}`}>
          {msg}
        </div>
      )}

      <div className="mt-5">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save Availability"}
        </Button>
      </div>
    </div>
  );
}
