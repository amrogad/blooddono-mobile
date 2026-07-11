import en from '@/i18n/en.json';
import ar from '@/i18n/ar.json';

const flatten = (o: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

describe('translation resources', () => {
  test('en and ar have identical key sets', () => {
    const enKeys = flatten(en as Record<string, unknown>).sort();
    const arKeys = flatten(ar as Record<string, unknown>).sort();
    expect(arKeys).toEqual(enKeys);
  });
});
