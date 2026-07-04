import { isEmail, friendlyAuthError, friendlyRequestError } from '@/utils/errors';

describe('isEmail', () => {
  test('accepts a normal address', () => {
    expect(isEmail('donor@blooddono.demo')).toBe(true);
  });

  test('trims surrounding whitespace before checking', () => {
    expect(isEmail('  donor@blooddono.demo  ')).toBe(true);
  });

  test.each(['', 'not-an-email', 'missing@domain', 'a@b', 'a b@c.com'])(
    'rejects %p',
    (value) => {
      expect(isEmail(value)).toBe(false);
    },
  );
});

describe('friendlyAuthError', () => {
  test.each([
    ['Invalid login credentials', 'Email or password is incorrect.'],
    ['Email not confirmed', 'Please confirm your email first.'],
    ['Rate limit exceeded', 'Too many attempts, please wait a moment.'],
    ['Network request failed', 'Network problem, check your connection.'],
  ])('maps %p to a friendly message', (raw, friendly) => {
    expect(friendlyAuthError(raw)).toBe(friendly);
  });

  test('passes an unknown message through unchanged', () => {
    expect(friendlyAuthError('Weird backend error')).toBe('Weird backend error');
  });

  test('falls back when the message is empty', () => {
    expect(friendlyAuthError('')).toBe('Something went wrong. Please try again.');
  });
});

describe('friendlyRequestError', () => {
  test.each([
    ['permission denied for table', "You don't have permission to do this."],
    ['new row violates RLS policy', "You don't have permission to do this."],
    ['duplicate key value', 'That request already exists.'],
    ['Network request failed', 'Network problem, check your connection.'],
  ])('maps %p to a friendly message', (raw, friendly) => {
    expect(friendlyRequestError(raw)).toBe(friendly);
  });

  test('passes an unknown message through unchanged', () => {
    expect(friendlyRequestError('Weird backend error')).toBe('Weird backend error');
  });
});
