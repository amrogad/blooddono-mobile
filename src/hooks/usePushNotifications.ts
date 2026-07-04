import { useEffect } from 'react';

import { registerForPushNotificationsAsync } from '@/services/pushNotifications';
import { savePushToken } from '@/services/profileService';

// Registers the signed-in donor for push and stores their token once per session.
export function usePushNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    let active = true;
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token && active) return savePushToken(userId, token);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);
}
