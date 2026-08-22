import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { RequestDraftCard } from '@/components/RequestDraftCard';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import * as donationService from '@/services/donationService';
import type { RequestDraft } from '@/services/donationService';

const session = {
  user: { id: 'donor-1', email: 'donor@blooddono.demo' },
};

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
  getSession: jest.fn().mockResolvedValue({ user: { id: 'donor-1', email: 'donor@blooddono.demo' } }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/services/donationService', () => ({
  createDonationRequest: jest.fn(),
}));

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ data: { display_name: 'Demo Donor' } }),
}));

// Has to carry the mock prefix: jest.mock factories are hoisted above the
// consts in this file, and jest only lets a factory close over names it can see.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const createRequest = donationService.createDonationRequest as jest.Mock;

// A draft as the edge function hands it over: already validated, already shaped
// like the request columns.
const draft: RequestDraft = {
  recipient_name: 'Mona Fahmy',
  blood_group: 'O-',
  hospital_name: 'Wadi El Nil Hospital',
  recipient_governorate: 'Cairo',
  recipient_city: 'Nasr City',
  full_address: '12 Abbas El Akkad St',
  donation_date: '2027-08-24',
  donation_time: '14:30',
  request_message: 'Two units needed before surgery.',
};

const onPosted = jest.fn();
const onDiscard = jest.fn();

const renderCard = (postedId?: string) =>
  render(
    <ThemeProvider>
      <AuthProvider>
        <RequestDraftCard
          draft={draft}
          postedId={postedId}
          onPosted={onPosted}
          onDiscard={onDiscard}
        />
      </AuthProvider>
    </ThemeProvider>,
  );

describe('RequestDraftCard', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows the drafted request so it can be checked before posting', async () => {
    renderCard();

    expect(await screen.findByText('Mona Fahmy')).toBeTruthy();
    expect(screen.getByText('O-')).toBeTruthy();
    expect(screen.getByText(/Wadi El Nil Hospital/)).toBeTruthy();
    expect(screen.getByText('Two units needed before surgery.')).toBeTruthy();
    expect(createRequest).not.toHaveBeenCalled();
  });

  // The model proposes the row; the requester comes from the session, so the
  // insert lands under the same policy as the form.
  test('stamps the signed-in user onto the row rather than trusting the draft', async () => {
    createRequest.mockResolvedValue({ id: 'req-1' });
    renderCard();

    fireEvent.press(await screen.findByLabelText('Confirm and post'));

    await waitFor(() => expect(createRequest).toHaveBeenCalled());
    expect(createRequest).toHaveBeenCalledWith({
      ...draft,
      requester_id: session.user.id,
      requester_name: 'Demo Donor',
      requester_email: session.user.email,
    });
    expect(onPosted).toHaveBeenCalledWith('req-1');
  });

  test('confirms once even when the button is pressed twice', async () => {
    let resolvePost: (row: { id: string }) => void = () => {};
    createRequest.mockReturnValue(new Promise((r) => { resolvePost = r; }));
    renderCard();

    const confirm = await screen.findByLabelText('Confirm and post');
    fireEvent.press(confirm);
    fireEvent.press(confirm);
    resolvePost({ id: 'req-1' });

    await waitFor(() => expect(onPosted).toHaveBeenCalledTimes(1));
    expect(createRequest).toHaveBeenCalledTimes(1);
  });

  // The posted state lives on the message, not in this component, because a
  // recycled FlatList row would otherwise offer to post the same request again.
  test('offers a link instead of a confirm button once it has been posted', async () => {
    renderCard('req-1');

    expect(await screen.findByText('Your request is live.')).toBeTruthy();
    expect(screen.queryByLabelText('Confirm and post')).toBeNull();

    fireEvent.press(screen.getByLabelText('View'));
    expect(mockPush).toHaveBeenCalledWith('/request/req-1');
  });

  test('keeps the draft on screen to retry when the insert fails', async () => {
    createRequest.mockRejectedValue(new Error('RLS'));
    renderCard();

    fireEvent.press(await screen.findByLabelText('Confirm and post'));

    await waitFor(() =>
      expect(
        screen.getByText('Could not post that. Try again, or open it in the full form.'),
      ).toBeTruthy(),
    );
    expect(onPosted).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Confirm and post')).toBeTruthy();
  });

  test('discards the draft without posting it', async () => {
    renderCard();

    fireEvent.press(await screen.findByLabelText('Discard this draft'));

    expect(onDiscard).toHaveBeenCalled();
    expect(createRequest).not.toHaveBeenCalled();
  });

  // The card is deliberately read-only, so the way out of a typo is the form the
  // draft columns already match.
  test('hands the draft to the full form when a field needs editing', async () => {
    renderCard();

    fireEvent.press(await screen.findByLabelText('Open in the full form'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/create', params: { ...draft } });
    expect(createRequest).not.toHaveBeenCalled();
  });
});
