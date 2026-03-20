import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import { chatWithAI, getChatHistory, clearChatHistory, triggerLearning } from '../src/api';

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getChatHistory();
      setMessages(data || []);
    } catch (e) {
      console.log('History error:', e);
    }
    setInitialLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setLoading(true);

    try {
      const res = await chatWithAI(trimmed);
      setKnowledgeCount(res.knowledge_count || 0);
      const aiMsg: Message = {
        id: res.message_id,
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Erreur de connexion. Veuillez réessayer.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const handleClear = () => {
    Alert.alert(
      'Effacer l\'historique',
      'Voulez-vous supprimer toutes les conversations ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await clearChatHistory().catch(() => {});
            setMessages([]);
          },
        },
      ],
    );
  };

  const handleLearn = async () => {
    try {
      const res = await triggerLearning();
      Alert.alert('Apprentissage', `${res.learnings_extracted} connaissances extraites.`);
      setKnowledgeCount((prev) => prev + (res.learnings_extracted || 0));
    } catch {
      Alert.alert('Erreur', 'Impossible d\'extraire les apprentissages.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        testID={`msg-${item.id}`}
        style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowAI]}
      >
        {!isUser && (
          <View style={s.avatarAI}>
            <Feather name="cpu" size={16} color={Colors.brand.primary} />
          </View>
        )}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
          <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAI]}>
            {item.content}
          </Text>
          <Text style={s.bubbleTime}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Assistant ARIA</Text>
          <Text style={s.headerSub}>{knowledgeCount} connaissances acquises</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity testID="learn-btn-assistant" onPress={handleLearn} style={s.headerBtn}>
            <Feather name="book-open" size={20} color={Colors.brand.secondary} />
          </TouchableOpacity>
          <TouchableOpacity testID="clear-chat-btn" onPress={handleClear} style={s.headerBtn}>
            <Feather name="trash-2" size={20} color={Colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {initialLoading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Feather name="message-circle" size={48} color={Colors.brand.primary} />
            </View>
            <Text style={s.emptyTitle}>Bonjour !</Text>
            <Text style={s.emptyText}>
              Je suis ARIA, votre assistant intelligent. Posez-moi une question sur votre appareil ou demandez-moi d'automatiser une tâche.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        <View style={s.inputBar}>
          {loading && (
            <View style={s.typingRow}>
              <ActivityIndicator size="small" color={Colors.brand.primary} />
              <Text style={s.typingText}>ARIA réfléchit...</Text>
            </View>
          )}
          <View style={s.inputRow}>
            <TextInput
              testID="chat-input"
              style={s.input}
              placeholder="Écrire un message..."
              placeholderTextColor={Colors.text.tertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              editable={!loading}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              testID="send-btn"
              style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!input.trim() || loading}
            >
              <Feather name="send" size={20} color={Colors.brand.fg} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: { fontSize: Fs.xl, fontWeight: '800', color: Colors.text.primary },
  headerSub: { fontSize: Fs.xs, color: Colors.brand.primary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: Sp.sm },
  headerBtn: { padding: Sp.sm, borderRadius: Rad.sm },
  chatList: { paddingHorizontal: Sp.lg, paddingTop: Sp.md, paddingBottom: Sp.md },
  msgRow: { marginBottom: Sp.md, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  avatarAI: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg.tertiary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Sp.sm,
  },
  bubble: { maxWidth: '78%', padding: Sp.lg, borderRadius: Rad.xl },
  bubbleUser: {
    backgroundColor: Colors.brand.primary,
    borderBottomRightRadius: Sp.xs,
  },
  bubbleAI: {
    backgroundColor: Colors.bg.secondary,
    borderBottomLeftRadius: Sp.xs,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  bubbleText: { fontSize: Fs.base, lineHeight: 22 },
  bubbleTextUser: { color: Colors.brand.fg },
  bubbleTextAI: { color: Colors.text.primary },
  bubbleTime: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: Sp.xs, alignSelf: 'flex-end' },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    paddingHorizontal: Sp.lg,
    paddingVertical: Sp.sm,
    paddingBottom: Platform.OS === 'ios' ? Sp.lg : Sp.sm,
    backgroundColor: Colors.bg.primary,
  },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.sm, paddingVertical: Sp.xs },
  typingText: { fontSize: Fs.xs, color: Colors.brand.primary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Sp.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Rad.xl,
    paddingHorizontal: Sp.lg,
    paddingVertical: Sp.md,
    color: Colors.text.primary,
    fontSize: Fs.base,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Sp.xxxl },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(93,138,168,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Sp.xl,
  },
  emptyTitle: { fontSize: Fs.xxl, fontWeight: '800', color: Colors.text.primary, marginBottom: Sp.sm },
  emptyText: { fontSize: Fs.base, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
});
