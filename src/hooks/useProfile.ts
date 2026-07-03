import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/services/profileService';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId as string),
    enabled: !!userId,
  });
}
