import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { askAssistant, Message } from '@/services/assistantService';
import { useThemedStyles } from '@/providers/ThemeProvider';
import { spacing, radius, fonts, type, shadow } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

export default function Assistant() {
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const { colors, styles } = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const chips = t('assistant.chips', { returnObjects: true }) as string[];

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const errText = t('assistant.error');
      const userMsg: Message = { role: 'user', text: trimmed };
      const validHistory = messages.filter((m) => m.text !== errText);
      const next = [...validHistory, userMsg];
      setMessages(next);
      setInput('');
      setLoading(true);

      try {
        const reply = await askAssistant(next, profile?.blood_group ?? '', profile?.city ?? '');
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', text: errText }]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, profile, t],
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="message-circle" size={18} color={colors.onInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('assistant.title')}</Text>
          <Text style={styles.headerSub}>{t('assistant.subtitle')}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.chips}>
            {chips.map((chip) => (
              <Pressable
                key={chip}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPress={() => send(chip)}
                accessibilityRole="button"
                accessibilityLabel={chip}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </Pressable>
            ))}
          </View>
        }
        ListFooterComponent={
          loading ? (
            <View style={[styles.bubble, styles.aiBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={colors.textMuted} />
            </View>
          ) : null
        }
        renderItem={renderMessage}
      />

      <View style={styles.inputArea}>
        <Text style={styles.disclaimer}>{t('assistant.disclaimer')}</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('assistant.inputPlaceholder')}
            placeholderTextColor={colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            editable={!loading}
            multiline
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || loading) && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel={t('assistant.sendA11y')}
          >
            <Feather name="arrow-up" size={18} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 60,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: -0.3 },
  headerSub: { ...type.small, color: colors.textMuted, marginTop: 1 },
  listContent: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  chips: { gap: spacing.sm, paddingTop: spacing.xl },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPressed: { opacity: 0.7 },
  chipText: { ...type.body, color: colors.text },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  loadingBubble: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  bubbleText: { ...type.body, lineHeight: 22 },
  userText: { color: colors.onPrimary },
  aiText: { color: colors.textBody },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  disclaimer: {
    ...type.small,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingBottom: spacing.xs,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...type.body,
    color: colors.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.border },
  sendButtonPressed: { opacity: 0.8 },
  sendButtonText: { color: colors.white, fontSize: 20, fontFamily: fonts.bold },
});
