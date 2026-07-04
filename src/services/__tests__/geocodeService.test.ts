import { geocodeHospital } from '@/services/geocodeService';

const okJson = (body: unknown) => ({ ok: true, json: async () => body });

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  (globalThis as { fetch: unknown }).fetch = fetchMock;
});

describe('geocodeHospital', () => {
  test('returns coordinates from the first query that hits', async () => {
    fetchMock.mockResolvedValue(okJson([{ lat: '30.1', lon: '31.2' }]));

    const result = await geocodeHospital({
      hospitalName: 'Kasr Al Ainy',
      city: 'Cairo',
      governorate: 'Cairo',
    });

    expect(result).toEqual({ latitude: 30.1, longitude: 31.2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain(encodeURIComponent('Kasr Al Ainy, Cairo, Cairo'));
  });

  test('falls back to the next query when an attempt returns no match', async () => {
    fetchMock
      .mockResolvedValueOnce(okJson([])) // hospital + city + gov: miss
      .mockResolvedValueOnce(okJson([{ lat: '29.9', lon: '31.0' }])); // hospital + gov: hit

    const result = await geocodeHospital({
      hospitalName: 'Clinic',
      city: 'Giza',
      governorate: 'Giza',
    });

    expect(result).toEqual({ latitude: 29.9, longitude: 31.0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('returns null when every attempt misses', async () => {
    fetchMock.mockResolvedValue(okJson([]));
    const result = await geocodeHospital({ hospitalName: 'Nowhere', governorate: 'Cairo' });
    expect(result).toBeNull();
  });

  test('throws when the geocoder responds with an error status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429 });
    await expect(geocodeHospital({ governorate: 'Cairo' })).rejects.toThrow('Geocode failed (429)');
  });

  test('queries with just the governorate when nothing else is provided', async () => {
    fetchMock.mockResolvedValue(okJson([{ lat: '31', lon: '30' }]));
    await geocodeHospital({ governorate: 'Alexandria' });
    expect(fetchMock.mock.calls[0][0]).toContain(encodeURIComponent('Alexandria'));
  });
});
