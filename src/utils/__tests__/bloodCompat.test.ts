import { compatibleDonorsFor, canDonate } from '@/utils/bloodCompat';

describe('compatibleDonorsFor', () => {
  it('O- can only receive from O-', () => {
    expect(compatibleDonorsFor('O-')).toEqual(['O-']);
  });

  it('AB+ can receive from every group', () => {
    expect(compatibleDonorsFor('AB+')).toHaveLength(8);
  });

  it('B+ receives from B+, B-, O+, O-', () => {
    expect([...compatibleDonorsFor('B+')].sort()).toEqual(['B+', 'B-', 'O+', 'O-'].sort());
  });

  it('returns nothing for an unknown group', () => {
    expect(compatibleDonorsFor('Z')).toEqual([]);
  });
});

describe('canDonate', () => {
  it('treats O- as a universal donor', () => {
    expect(canDonate('O-', 'AB+')).toBe(true);
    expect(canDonate('O-', 'O+')).toBe(true);
  });

  it('rejects A+ donating to O-', () => {
    expect(canDonate('A+', 'O-')).toBe(false);
  });

  it('handles a missing donor group', () => {
    expect(canDonate(undefined, 'AB+')).toBe(false);
  });
});
