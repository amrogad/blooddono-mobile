export type UrgencyLevel = 'pastdue' | 'critical' | 'urgent' | 'planned';
export type SectionKey = 'today' | 'week' | 'later';

export type Urgency = {
  level: UrgencyLevel;
  label: string;
  sectionKey: SectionKey;
  sectionLabel: string;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function requestDateTime(date: string, time: string): Date {
  const [y, m, d] = (date ?? '').split('-').map(Number);
  const [hh = 0, mm = 0] = (time ?? '').split(':').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, hh, mm);
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function getUrgency(date: string, time: string, now: Date = new Date()): Urgency {
  const target = requestDateTime(date, time);
  const hours = (target.getTime() - now.getTime()) / 3_600_000;
  const sameDay = startOfDay(target) === startOfDay(now);

  let level: UrgencyLevel;
  if (hours < 0) level = 'pastdue';
  else if (hours < 24) level = 'critical';
  else if (hours <= 72) level = 'urgent';
  else level = 'planned';

  const label =
    level === 'pastdue' ? 'Overdue' : level === 'critical' ? 'Critical' : level === 'urgent' ? 'Urgent' : 'Planned';

  let sectionKey: SectionKey;
  if (hours < 24 || sameDay) sectionKey = 'today';
  else if (hours <= 24 * 7) sectionKey = 'week';
  else sectionKey = 'later';
  const sectionLabel = sectionKey === 'today' ? 'Today' : sectionKey === 'week' ? 'This week' : 'Later';

  return { level, label, sectionKey, sectionLabel };
}

// Human "needed by" line — no raw ISO dates.
export function formatNeededBy(date: string, time: string, now: Date = new Date()): string {
  const target = requestDateTime(date, time);
  const hhmm = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
  const dayDiff = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);

  let day: string;
  if (dayDiff === 0) day = 'Today';
  else if (dayDiff === 1) day = 'Tomorrow';
  else if (dayDiff > 1 && dayDiff < 7) day = WEEKDAYS[target.getDay()];
  else day = `${target.getDate()} ${MONTHS[target.getMonth()]}`;

  return `${day}, ${hhmm}`;
}
