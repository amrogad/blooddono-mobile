import { Image, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

import { colors } from '@/constants/theme';
import avatarPlaceholder from '@/assets/images/avatar-placeholder.png';

export function Avatar({
  uri,
  size = 44,
  style,
}: {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={uri ? { uri } : avatarPlaceholder}
      style={[{ width: size, height: size, borderRadius: size / 2 }, styles.base, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface },
});
