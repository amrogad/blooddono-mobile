import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';

import { useLocation } from '@/hooks/useLocation';
import { distanceKm } from '@/utils/distance';
import { mapHtml, MapPoint } from '@/utils/mapHtml';
import { colors, spacing, radius, fonts, type, shadow } from '@/constants/theme';

export default function FullscreenMap() {
  const { lat, lng, label } = useLocalSearchParams<{ lat: string; lng: string; label: string }>();
  const { coords: me } = useLocation();

  const hospital: MapPoint = { latitude: parseFloat(lat), longitude: parseFloat(lng) };
  const distance = me ? distanceKm(me.latitude, me.longitude, hospital.latitude, hospital.longitude) : null;

  const openInGoogleMaps = () => {
    const dest = `${hospital.latitude},${hospital.longitude}`;
    const origin = me ? `${me.latitude},${me.longitude}` : '';
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: label ?? 'Map', headerShown: true }} />

      <WebView
        key={me ? 'route' : 'hospital'}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html: mapHtml(hospital, me, label ?? 'Location') }}
      />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetRow}>
          <View style={styles.pin}>
            <Feather name="map-pin" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {label ?? 'Location'}
            </Text>
            <Text style={styles.sheetMeta}>
              {distance != null ? `${distance.toFixed(1)} km away · straight-line distance` : 'Tap directions for the route'}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.directions, pressed && { opacity: 0.9 }]}
          onPress={openInGoogleMaps}
          accessibilityRole="button"
          accessibilityLabel="Get directions in Google Maps"
        >
          <Feather name="corner-up-right" size={16} color={colors.white} />
          <Text style={styles.directionsText}>Get directions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    ...shadow.floating,
  },
  handle: { width: 38, height: 4.5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pin: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.crimsonTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { ...type.bodyBold, color: colors.ink },
  sheetMeta: { ...type.small, color: colors.textMuted, marginTop: 2 },
  directions: {
    height: 50,
    borderRadius: radius.card,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15 },
});
