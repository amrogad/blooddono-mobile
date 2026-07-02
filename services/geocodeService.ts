export type GeocodeResult = { latitude: number; longitude: number };

const fetchOne = async (q: string): Promise<GeocodeResult | null> => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'blooddono-mobile/1.0' },
  });
  if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data.length) return null;
  return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
};

export type HospitalQuery = {
  hospitalName?: string;
  fullAddress?: string;
  city?: string;
  governorate?: string;
};

export const geocodeHospital = async (q: HospitalQuery): Promise<GeocodeResult | null> => {
  const attempts = [
    [q.hospitalName, q.city, q.governorate].filter(Boolean).join(', '),
    [q.hospitalName, q.governorate].filter(Boolean).join(', '),
    [q.city, q.governorate].filter(Boolean).join(', '),
    q.governorate,
  ].filter((s): s is string => !!s && s.trim().length > 0);

  for (const attempt of attempts) {
    const hit = await fetchOne(attempt);
    if (hit) return hit;
  }
  return null;
};
