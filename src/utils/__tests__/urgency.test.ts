import { getUrgency, formatNeededBy } from '@/utils/urgency';

const NOW = new Date(2026, 6, 9, 12, 0); // 2026-07-09 12:00
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

describe('getUrgency', () => {
  it('flags under 24h as critical', () => {
    expect(getUrgency('2026-07-09', '20:00', NOW).level).toBe('critical');
  });

  it('flags two to three days out as urgent', () => {
    expect(getUrgency('2026-07-11', '12:00', NOW).level).toBe('urgent');
  });

  it('flags more than three days as planned', () => {
    expect(getUrgency('2026-07-20', '12:00', NOW).level).toBe('planned');
  });

  it('flags a passed time as pastdue', () => {
    expect(getUrgency('2026-07-08', '12:00', NOW).level).toBe('pastdue');
  });

  it('groups criticals under today', () => {
    expect(getUrgency('2026-07-09', '20:00', NOW).sectionKey).toBe('today');
  });

  it('groups planned requests under later', () => {
    expect(getUrgency('2026-07-20', '12:00', NOW).sectionKey).toBe('later');
  });
});

describe('formatNeededBy', () => {
  it('says Today for the same day', () => {
    expect(formatNeededBy('2026-07-09', '14:30', NOW)).toBe('Today, 14:30');
  });

  it('says Tomorrow for the next day', () => {
    expect(formatNeededBy('2026-07-10', '09:00', NOW)).toBe('Tomorrow, 09:00');
  });

  it('uses the weekday within the same week', () => {
    const d = new Date(2026, 6, 11);
    expect(formatNeededBy('2026-07-11', '09:00', NOW)).toBe(`${WEEKDAYS[d.getDay()]}, 09:00`);
  });

  it('uses day and month further out', () => {
    expect(formatNeededBy('2026-07-20', '09:00', NOW)).toBe('20 Jul, 09:00');
  });
});
