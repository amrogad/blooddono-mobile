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

import { useAuth } from '@/providers/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { askAssistant, Message } from '@/services/assistantService';
import { BrandHeader } from '@/components/BrandHeader';
import { colors, spacing, radius, fonts, type, shadow } from '@/constants/theme';

const CHIPS = [
  'I got a tattoo 2 weeks ago, can I donate?',
  'I take blood pressure meds, am I eligible?',
  'How long after a cold can I donate?',
  'What should I eat before donating?',
];

export default function Assistant() {
  const { session } = useAuth();
  const { data: profile } = useProfile(session?.user.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { role: 'user', text: trimmed };
      const validHistory = messages.filter((m) => m.text !== 'Something went wrong. Try again.');
      const next = [...validHistory, userMsg];
      setMessages(next);
      setInput('');
      setLoading(true);

      try {
        const reply = await askAssistant(next, profile?.blood_group ?? '', profile?.city ?? '');
        setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Something went wrong. Try again.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, profile],
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
      <BrandHeader title="Eligibility assistant" subtitle="Ask anything about donating" />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.chips}>
            {CHIPS.map((chip) => (
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
        <Text style={styles.disclaimer}>Informational only — not medical advice</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask a question..."
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
            accessibilityLabel="Send message"
          >
            <Feather name="arrow-up" size={18} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
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
  userText: { color: colors.white },
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
