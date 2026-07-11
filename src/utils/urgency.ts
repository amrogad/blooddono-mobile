import i18n from '@/i18n';

export type UrgencyLevel = 'pastdue' | 'critical' | 'urgent' | 'planned';
export type SectionKey = 'today' | 'week' | 'later';

export type Urgency = {
  level: UrgencyLevel;
  sectionKey: SectionKey;
};

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

  let sectionKey: SectionKey;
  if (hours < 24 || sameDay) sectionKey = 'today';
  else if (hours <= 24 * 7) sectionKey = 'week';
  else sectionKey = 'later';

  return { level, sectionKey };
}

// Just the day portion — "Today", "Tomorrow", a weekday, or "20 Jul".
export function formatDay(date: string, time: string, now: Date = new Date()): string {
  const target = requestDateTime(date, time);
  const dayDiff = Math.round((startOfDay(target) - startOfDay(now)) / 86_400_000);
  const weekdays = i18n.t('date.weekdays', { returnObjects: true }) as string[];
  const months = i18n.t('date.months', { returnObjects: true }) as string[];

  if (dayDiff === 0) return i18n.t('date.today');
  if (dayDiff === 1) return i18n.t('date.tomorrow');
  if (dayDiff > 1 && dayDiff < 7) return weekdays[target.getDay()];
  return `${target.getDate()} ${months[target.getMonth()]}`;
}

// Human "needed by" line — day + time, no raw ISO dates.
export function formatNeededBy(date: string, time: string, now: Date = new Date()): string {
  const target = requestDateTime(date, time);
  const hhmm = `${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`;
  return i18n.t('date.neededBy', { day: formatDay(date, time, now), time: hhmm });
}
