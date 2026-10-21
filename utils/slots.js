const TZ = "Africa/Cairo";

export const cairoNow = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
};

export const parseDate = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== dateStr ? null : d;
};

export const isFuture = (dateStr, time) => {
  const now = cairoNow();
  return dateStr > now.date || (dateStr === now.date && time > now.time);
};

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const toTime = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

export const generateSlots = (doctor, dateStr) => {
  const s = doctor.schedule;
  if (!doctor.is_active || !s || !s.start_time || !s.end_time) return [];

  const isDayOff = (doctor.days_off || []).some(
    (d) => new Date(d).toISOString().slice(0, 10) === dateStr
  );
  if (isDayOff) return [];

  const dayOfWeek = new Date(`${dateStr}T00:00:00.000Z`).getUTCDay(); // 0 = الأحد
  if (!(s.working_days || []).includes(dayOfWeek)) return [];

  const step = doctor.slot_duration_minutes || 30;
  const start = toMinutes(s.start_time);
  const end = toMinutes(s.end_time);


  const segments =
    s.break_start && s.break_end
      ? [
          [start, toMinutes(s.break_start)],
          [toMinutes(s.break_end), end],
        ]
      : [[start, end]];

  const slots = [];
  for (const [from, to] of segments) {
    for (let t = from; t + step <= to; t += step) slots.push(toTime(t));
  }
  return slots;
};

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]; // index = getUTCDay
const weekPos = (d) => (d + 1) % 7; // الأسبوع بيبدأ السبت

export const formatTime12 = (t) => {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "م" : "ص";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

const formatDays = (days) => {
  const sorted = [...new Set(days)].sort((a, b) => weekPos(a) - weekPos(b));
  if (sorted.length === 0) return "";
  if (sorted.length === 7) return "كل يوم";

  const isRun = sorted.every((d, i) => i === 0 || weekPos(d) === weekPos(sorted[i - 1]) + 1);
  if (sorted.length >= 3 && isRun) {
    return `من ${DAY_NAMES[sorted[0]]} إلى ${DAY_NAMES[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAY_NAMES[d]).join(" و");
};

export const scheduleSummary = (doctor) => {
  const s = doctor.schedule;
  if (!s || !s.working_days || s.working_days.length === 0 || !s.start_time || !s.end_time) {
    return null;
  }

  const hasBreak = Boolean(s.break_start && s.break_end);
  let text = `${formatDays(s.working_days)}، من ${formatTime12(s.start_time)} إلى ${formatTime12(s.end_time)}`;
  if (hasBreak) {
    text += `، وقت الراحة من ${formatTime12(s.break_start)} إلى ${formatTime12(s.break_end)}`;
  }

  return {
    working_days: [...s.working_days].sort((a, b) => weekPos(a) - weekPos(b)),
    start_time: s.start_time,
    end_time: s.end_time,
    break_time: hasBreak ? { start_time: s.break_start, end_time: s.break_end } : null,
    slot_duration_minutes: doctor.slot_duration_minutes || 30,
    text,
  };
};