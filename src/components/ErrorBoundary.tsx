import { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { lightColors, spacing, radius, fonts, type } from '@/constants/theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

// A render error anywhere below this used to take the whole app down with it:
// React unmounts the tree, and on a release build that is the app closing on
// somebody, with nothing to read and nowhere to go.
//
// Deliberately a plain class with no hooks and no providers. Whatever broke may
// well have been a provider, so this cannot depend on theme, locale or query
// context to render. That is also why the copy is English only and the colours
// come straight from the light palette: a fallback that needs i18n to draw
// itself is a fallback that can fail the same way twice.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Something broke</Text>
        <Text style={styles.body}>
          The app hit an error it could not recover from. Trying again usually clears it.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => this.setState({ error: null })}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
        {__DEV__ && <Text style={styles.detail}>{error.message}</Text>}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: lightColors.background,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: lightColors.ink },
  body: { ...type.body, color: lightColors.textBody, textAlign: 'center' },
  button: {
    marginTop: spacing.md,
    height: 44,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control,
    backgroundColor: lightColors.primary,
  },
  buttonText: { ...type.body, fontFamily: fonts.bold, color: lightColors.onPrimary },
  pressed: { opacity: 0.8 },
  detail: { ...type.small, color: lightColors.textMuted, marginTop: spacing.md, textAlign: 'center' },
});
