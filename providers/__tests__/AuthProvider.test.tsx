import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthProvider';
import * as authService from '../../services/authService';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

jest.mock('../../services/authService', () => ({
  getSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

function Probe() {
  const { session, loading } = useAuth();
  return <Text>{loading ? 'loading' : session ? session.user.id : 'none'}</Text>;
}

test('exposes the session once loaded', async () => {
  (authService.getSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

  expect(await screen.findByText('u1')).toBeTruthy();
});
