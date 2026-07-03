import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { useLocation } from '@/hooks/useLocation';
import { distanceKm } from '@/utils/distance';
import { colors, spacing, radius, fonts } from '@/constants/theme';

export default function FullscreenMap() {
  const { lat, lng, label } = useLocalSearchParams<{ lat: string; lng: string; label: string }>();
  const { coords: me } = useLocation();
  const mapRef = useRef<MapView>(null);

  const hospital = { latitude: parseFloat(lat), longitude: parseFloat(lng) };

  const fit = () => {
    const points = me ? [hospital, me] : [hospital];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 100, bottom: 140, left: 80, right: 80 },
      animated: true,
    });
  };

  useEffect(() => {
    if (me) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const distance = me ? distanceKm(me.latitude, me.longitude, hospital.latitude, hospital.longitude) : null;

  const openInGoogleMaps = () => {
    const dest = `${hospital.latitude},${hospital.longitude}`;
    const origin = me ? `${me.latitude},${me.longitude}` : '';
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: label ?? 'Map', headerShown: true }} />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        onMapReady={fit}
        showsUserLocation
      >
        <Marker coordinate={hospital} title={label} pinColor={colors.primary} />
        {me && <Marker coordinate={me} title="You" pinColor="#1e90ff" />}
        {me && (
          <Polyline coordinates={[me, hospital]} strokeColor={colors.primary} strokeWidth={3} />
        )}
      </MapView>

      {distance != null && (
        <View style={styles.distanceChip}>
          <Text style={styles.distanceText}>{distance.toFixed(1)} km away</Text>
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        onPress={openInGoogleMaps}
        accessibilityRole="button"
        accessibilityLabel="Open directions in Google Maps"
      >
        <Text style={styles.fabText}>Open in Google Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  distanceChip: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  distanceText: { fontFamily: fonts.semibold, color: colors.primary, fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.black,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16 },
});
