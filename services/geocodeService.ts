export type GeocodeResult = { latitude: number; longitude: number };

export const geocodeAddress = async (query: string): Promise<GeocodeResult | null> => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'blooddono-mobile/1.0' },
  });
  if (!res.ok) throw new Error(`Geocode failed (${res.status})`);
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data.length) return null;
  return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
};
