import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import { chatWithAI, getChatHistory, clearChatHistory, triggerLearning, getExtensions, toggleExtension } from '../src/api';
import { useAppLauncher } from '../src/useAppLauncher';

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  model?: string;
}

interface Extension {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  enabled: boolean;
  config?: any;
}

const MODEL_BADGE: Record<string, { label: string; color: string; icon: string }> = {
  claude: { label: 'Claude', color: Colors.brand.primary, icon: 'zap' },
  mistral: { label: 'Mistral', color: Colors.status.warning, icon: 'sun' },
  local: { label: 'Local', color: Colors.status.error, icon: 'hard-drive' },
};

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [showExtensionsMenu, setShowExtensionsMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appLauncher = useAppLauncher();

  const loadHistory = useCallback(async () => {
    try {
      const data = await getChatHistory('default', 500);
      setMessages(data || []);
    } catch (e) {
      console.log('History error:', e);
    }
    setInitialLoading(false);
  }, []);

  const loadExtensions = useCallback(async () => {
    try {
      const data = await getExtensions();
      setExtensions(data || []);
    } catch (e) {
      console.log('Extensions error:', e);
    }
  }, []);

  useEffect(() => { 
    loadHistory();
    loadExtensions();
  }, [loadHistory, loadExtensions]);

  const copyMessage = async (text: string, id: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      Alert.alert('Erreur', 'Impossible de copier le texte.');
    }
  };

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
        model: res.model || 'claude',
      };
      setMessages((prev) => [...prev, aiMsg]);
      
      // Handle actions executed (including app launches)
      if (res.actions_executed && res.actions_executed.length > 0) {
        const actionsSummary = res.actions_executed
          .filter((a: any) => a.success)
          .map((a: any) => a.message)
          .join('\n');
        
        // Check if there's a launch_app action
        const launchAction = res.actions_executed.find((a: any) => a.type === 'launch_app' && a.success);
        if (launchAction && launchAction.package_name) {
          // Extract app name from the message
          const appNameMatch = launchAction.message.match(/lancement: (.+)/i);
          if (appNameMatch) {
            const appName = appNameMatch[1];
            setTimeout(() => {
              appLauncher.openApp(appName);
            }, 500);
          }
        }
        
        if (actionsSummary) {
          const actionMsg: Message = {
            id: `action-${Date.now()}`,
            role: 'system',
            content: `Actions executees:\n${actionsSummary}`,
            timestamp: new Date().toISOString(),
            model: 'system',
          };
          setMessages((prev) => [...prev, actionMsg]);
        }
      }
    } catch (e: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Erreur de connexion. Veuillez reessayer.',
        timestamp: new Date().toISOString(),
        model: 'local',
      };
      setMessages((prev) => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const handleClear = () => {
    Alert.alert('Effacer l\'historique', 'Voulez-vous supprimer toutes les conversations ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer', style: 'destructive',
        onPress: async () => {
          await clearChatHistory().catch(() => {});
          setMessages([]);
        },
      },
    ]);
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

  const handleToggleExtension = async (extId: string) => {
    try {
      const res = await toggleExtension(extId);
      setExtensions((prev) =>
        prev.map((ext) => (ext.id === extId ? { ...ext, enabled: res.enabled } : ext))
      );
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier l\'extension.');
    }
  };

  const getExtensionIcon = (iconName: string): any => {
    const iconMap: Record<string, any> = {
      smartphone: 'smartphone',
      terminal: 'terminal',
      brain: 'cpu',
      camera: 'camera',
      settings: 'settings',
      zap: 'zap',
    };
    return iconMap[iconName] || 'box';
  };

  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isAtBottom = contentOffset.y >= (contentSize.height - layoutMeasurement.height - 50);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // User is scrolling up (not at bottom)
    if (!isAtBottom) {
      setIsUserScrolling(true);
    } else {
      // User reached bottom, wait a bit before re-enabling auto-scroll
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 500);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const isSystem = item.role === 'system';
    const badge = item.model ? MODEL_BADGE[item.model] : null;
    const isCopied = copiedId === item.id;

    if (isSystem) {
      return (
        <View style={s.systemRow}>
          <View style={s.systemBubble}>
            <Feather name="check-circle" size={12} color={Colors.status.success} />
            <Text style={s.systemText}>{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View testID={`msg-${item.id}`} style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowAI]}>
        {!isUser && (
          <View style={[s.avatarAI, badge && { borderColor: badge.color, borderWidth: 1.5 }]}>
            <Feather name="cpu" size={16} color={badge?.color || Colors.brand.primary} />
          </View>
        )}
        <View style={{ maxWidth: '78%' }}>
          {/* Model badge for AI messages */}
          {!isUser && badge && badge.label !== 'Claude' && (
            <View style={[s.modelBadge, { backgroundColor: badge.color + '20' }]}>
              <Feather name={badge.icon as any} size={10} color={badge.color} />
              <Text style={[s.modelText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          )}
          <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
            <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextAI]}>
              {item.content}
            </Text>
            <View style={s.bubbleFooter}>
              <Text style={s.bubbleTime}>
                {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>
              <TouchableOpacity
                testID={`copy-${item.id}`}
                onPress={() => copyMessage(item.content, item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={isCopied ? 'check' : 'copy'}
                  size={13}
                  color={isCopied ? Colors.status.success : Colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Assistant ARIA</Text>
          <Text style={s.headerSub}>{knowledgeCount} connaissances | Mode debride</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity 
            testID="toolbox-btn" 
            onPress={() => setShowExtensionsMenu(!showExtensionsMenu)} 
            style={s.headerBtn}
          >
            <Feather name="package" size={20} color={Colors.brand.secondary} />
          </TouchableOpacity>
          <TouchableOpacity testID="learn-btn-assistant" onPress={handleLearn} style={s.headerBtn}>
            <Feather name="book-open" size={20} color={Colors.brand.secondary} />
          </TouchableOpacity>
          <TouchableOpacity testID="clear-chat-btn" onPress={handleClear} style={s.headerBtn}>
            <Feather name="trash-2" size={20} color={Colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Extensions Toolbox Menu */}
      {showExtensionsMenu && (
        <View style={s.extensionsMenu}>
          <View style={s.extensionsHeader}>
            <Feather name="package" size={18} color={Colors.brand.primary} />
            <Text style={s.extensionsTitle}>Boîte à outils</Text>
            <TouchableOpacity onPress={() => setShowExtensionsMenu(false)}>
              <Feather name="x" size={18} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={s.extensionsList} showsVerticalScrollIndicator={false}>
            {extensions.map((ext) => (
              <TouchableOpacity
                key={ext.id}
                testID={`ext-${ext.id}`}
                style={[s.extensionItem, !ext.enabled && s.extensionItemDisabled]}
                onPress={() => handleToggleExtension(ext.id)}
              >
                <View style={[s.extensionIcon, { backgroundColor: ext.enabled ? Colors.brand.primary + '20' : Colors.bg.tertiary }]}>
                  <Feather 
                    name={getExtensionIcon(ext.icon)} 
                    size={16} 
                    color={ext.enabled ? Colors.brand.primary : Colors.text.tertiary} 
                  />
                </View>
                <View style={s.extensionContent}>
                  <Text style={[s.extensionName, !ext.enabled && s.extensionNameDisabled]}>
                    {ext.name}
                  </Text>
                  <Text style={s.extensionDesc}>{ext.description}</Text>
                </View>
                <View style={[s.extensionToggle, ext.enabled && s.extensionToggleActive]}>
                  {ext.enabled && <View style={s.extensionToggleDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
              Je suis ARIA, votre assistant IA debride. Je peux automatiser, analyser et optimiser votre appareil.
              {'\n\n'}3 niveaux d'IA: Claude (principal) → Mistral (fallback) → Mode local
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.chatList}
            onContentSizeChange={() => {
              // Only auto-scroll if user is not manually scrolling
              if (!isUserScrolling) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
            onScroll={handleScroll}
            scrollEventThrottle={400}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={s.inputBar}>
          {loading && (
            <View style={s.typingRow}>
              <ActivityIndicator size="small" color={Colors.brand.primary} />
              <Text style={s.typingText}>ARIA reflechit...</Text>
            </View>
          )}
          <View style={s.inputRow}>
            <TextInput
              testID="chat-input"
              style={s.input}
              placeholder="Ecrire un message..."
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Sp.xl, paddingVertical: Sp.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
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
  modelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: Rad.full,
    alignSelf: 'flex-start', marginBottom: 3,
  },
  modelText: { fontSize: 9, fontWeight: '700' },
  bubble: { padding: Sp.lg, borderRadius: Rad.xl },
  bubbleUser: { backgroundColor: Colors.brand.primary, borderBottomRightRadius: Sp.xs },
  bubbleAI: {
    backgroundColor: Colors.bg.secondary, borderBottomLeftRadius: Sp.xs,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  bubbleText: { fontSize: Fs.base, lineHeight: 22 },
  bubbleTextUser: { color: Colors.brand.fg },
  bubbleTextAI: { color: Colors.text.primary },
  bubbleFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Sp.xs,
  },
  bubbleTime: { fontSize: Fs.xs, color: Colors.text.tertiary },
  systemRow: { alignItems: 'center', marginVertical: Sp.sm },
  systemBubble: {
    flexDirection: 'row', alignItems: 'center', gap: Sp.xs,
    backgroundColor: Colors.status.success + '15',
    paddingHorizontal: Sp.md, paddingVertical: Sp.xs,
    borderRadius: Rad.full,
  },
  systemText: { fontSize: Fs.xs, color: Colors.status.success },
  inputBar: {
    borderTopWidth: 1, borderTopColor: Colors.border.subtle,
    paddingHorizontal: Sp.lg, paddingVertical: Sp.sm,
    paddingBottom: Platform.OS === 'ios' ? Sp.lg : Sp.sm,
    backgroundColor: Colors.bg.primary,
  },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.sm, paddingVertical: Sp.xs },
  typingText: { fontSize: Fs.xs, color: Colors.brand.primary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Sp.sm },
  input: {
    flex: 1, backgroundColor: Colors.bg.secondary, borderRadius: Rad.xl,
    paddingHorizontal: Sp.lg, paddingVertical: Sp.md,
    color: Colors.text.primary, fontSize: Fs.base, maxHeight: 120,
    borderWidth: 1, borderColor: Colors.border.subtle,
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
    justifyContent: 'center', alignItems: 'center', marginBottom: Sp.xl,
  },
  emptyTitle: { fontSize: Fs.xxl, fontWeight: '800', color: Colors.text.primary, marginBottom: Sp.sm },
  emptyText: { fontSize: Fs.base, color: Colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  
  // Extensions Menu
  extensionsMenu: {
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    maxHeight: 300,
  },
  extensionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.sm,
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  extensionsTitle: {
    flex: 1,
    fontSize: Fs.base,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  extensionsList: {
    maxHeight: 240,
  },
  extensionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.md,
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  extensionItemDisabled: {
    opacity: 0.5,
  },
  extensionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extensionContent: {
    flex: 1,
  },
  extensionName: {
    fontSize: Fs.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  extensionNameDisabled: {
    color: Colors.text.tertiary,
  },
  extensionDesc: {
    fontSize: Fs.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  extensionToggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.bg.tertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  extensionToggleActive: {
    backgroundColor: Colors.brand.primary,
    alignItems: 'flex-end',
  },
  extensionToggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.brand.fg,
  },
});
