import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Login from '../login';
import * as authService from '@/services/authService';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

jest.mock('@/services/authService', () => ({
  getSession: jest.fn().mockResolvedValue(null),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

const renderLogin = () =>
  render(
    <ThemeProvider>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </ThemeProvider>,
  );

describe('Login screen', () => {
  beforeEach(() => jest.clearAllMocks());

  test('tapping the donor demo button calls signIn with the donor credentials', async () => {
    (authService.signIn as jest.Mock).mockResolvedValue({ user: { id: 'u1' } });

    renderLogin();

    fireEvent.press(await screen.findByLabelText(/Donor demo account/i));

    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith('donor@blooddono.demo', 'Demo123!');
    });
  });

  test('shows a validation error for an invalid email', async () => {
    renderLogin();

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'not-an-email');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password1');
    fireEvent.press(screen.getByLabelText('Sign in'));

    expect(await screen.findByText(/valid email/i)).toBeTruthy();
    expect(authService.signIn).not.toHaveBeenCalled();
  });
});
