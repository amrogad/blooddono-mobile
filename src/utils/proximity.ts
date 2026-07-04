type Located = { recipient_governorate: string; recipient_city: string };

export function proximityScore(
  item: Located,
  homeGovernorate?: string | null,
  homeCity?: string | null,
): number {
  if (!homeGovernorate) return 2;
  if (item.recipient_governorate === homeGovernorate && item.recipient_city === homeCity) return 0;
  if (item.recipient_governorate === homeGovernorate) return 1;
  return 2;
}

export function sortByProximity<T extends Located>(
  items: T[],
  homeGovernorate?: string | null,
  homeCity?: string | null,
): T[] {
  return [...items].sort(
    (a, b) =>
      proximityScore(a, homeGovernorate, homeCity) - proximityScore(b, homeGovernorate, homeCity),
  );
}
