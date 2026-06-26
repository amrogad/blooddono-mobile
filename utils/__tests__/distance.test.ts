import { distanceKm } from '../distance';

test('same point is zero', () => {
  expect(distanceKm(30.0, 31.0, 30.0, 31.0)).toBe(0);
});

test('one degree of latitude is ~111 km', () => {
  expect(distanceKm(0, 0, 1, 0)).toBeCloseTo(111, 0);
});

test('one degree of longitude at the equator is ~111 km', () => {
  expect(distanceKm(0, 0, 0, 1)).toBeCloseTo(111, 0);
});
