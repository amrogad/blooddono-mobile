import { Image, type StyleProp, type ImageStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
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
  const { colors } = useTheme();
  return (
    <Image
      source={uri ? { uri } : avatarPlaceholder}
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surface }, style]}
    />
  );
}
