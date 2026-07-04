import { proximityScore, sortByProximity } from '@/utils/proximity';

const req = (gov: string, city: string) => ({
  recipient_governorate: gov,
  recipient_city: city,
});

describe('proximityScore', () => {
  test('0 when governorate and city both match home', () => {
    expect(proximityScore(req('Cairo', 'Nasr City'), 'Cairo', 'Nasr City')).toBe(0);
  });

  test('1 when only the governorate matches', () => {
    expect(proximityScore(req('Cairo', 'Maadi'), 'Cairo', 'Nasr City')).toBe(1);
  });

  test('2 when the governorate differs', () => {
    expect(proximityScore(req('Giza', 'Dokki'), 'Cairo', 'Nasr City')).toBe(2);
  });

  test('2 when the donor has no home governorate set', () => {
    expect(proximityScore(req('Cairo', 'Nasr City'), null, null)).toBe(2);
  });
});

describe('sortByProximity', () => {
  test('orders same-city first, then same-governorate, then the rest', () => {
    const items = [req('Giza', 'Dokki'), req('Cairo', 'Maadi'), req('Cairo', 'Nasr City')];
    const sorted = sortByProximity(items, 'Cairo', 'Nasr City');
    expect(sorted.map((i) => i.recipient_city)).toEqual(['Nasr City', 'Maadi', 'Dokki']);
  });

  test('does not mutate the input array', () => {
    const items = [req('Giza', 'Dokki'), req('Cairo', 'Nasr City')];
    const before = [...items];
    sortByProximity(items, 'Cairo', 'Nasr City');
    expect(items).toEqual(before);
  });

  test('keeps the original order when no home is set', () => {
    const items = [req('Giza', 'Dokki'), req('Cairo', 'Maadi')];
    const sorted = sortByProximity(items, null, null);
    expect(sorted.map((i) => i.recipient_governorate)).toEqual(['Giza', 'Cairo']);
  });
});
