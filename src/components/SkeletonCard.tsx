import { useEffect, useState } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/providers/ThemeProvider';

export function SkeletonCard() {
  const { styles } = useThemedStyles(makeStyles);
  const [shimmer] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.9, 0.4] });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Animated.View style={[styles.pill, { opacity }]} />
        <Animated.View style={[styles.badge, { opacity }]} />
      </View>
      <Animated.View style={[styles.line, { width: '55%', opacity }]} />
      <Animated.View style={[styles.line, { width: '75%', opacity, marginTop: 4 }]} />
      <View style={styles.divider} />
      <Animated.View style={[styles.line, { width: '40%', opacity, height: 10 }]} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.card,
      padding: spacing.lg,
      gap: 4,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    pill: { width: 56, height: 26, borderRadius: radius.pill, backgroundColor: colors.surface },
    badge: { width: 90, height: 20, borderRadius: radius.pill, backgroundColor: colors.surface },
    line: { height: 14, borderRadius: 4, backgroundColor: colors.surface },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  });
