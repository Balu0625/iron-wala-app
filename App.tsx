import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  DEFAULT_SYSTEM_PROMPT,
  getModel,
  ModelId,
  MODELS,
  Settings,
} from './src/config';
import {
  cancelDownload,
  deleteModel,
  downloadModel,
  generate,
  isDownloaded,
  isLoaded,
  loadModel,
  stopGeneration,
  unloadModel,
} from './src/llm';
import {
  Chat,
  loadChats,
  loadSettings,
  Message,
  saveChats,
  saveSettings,
  uid,
} from './src/store';
import { C } from './src/theme';

type Screen = 'chat' | 'history' | 'settings' | 'models';
type ModelStatus = 'idle' | 'missing' | 'loading' | 'ready' | 'error';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const [booted, setBooted] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>('chat');
  const [status, setStatus] = useState<ModelStatus>('idle');
  const [loadPct, setLoadPct] = useState(0);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const chatsRef = useRef<Chat[]>([]);
  chatsRef.current = chats;

  const updateChats = useCallback((next: Chat[], persist = true) => {
    chatsRef.current = next;
    setChats(next);
    if (persist) {
      saveChats(next);
    }
  }, []);

  const prepareModel = useCallback(async (s: Settings) => {
    const m = getModel(s.modelId);
    setError('');
    if (!(await isDownloaded(m))) {
      await unloadModel();
      setStatus('missing');
      return;
    }
    setStatus('loading');
    setLoadPct(0);
    try {
      await loadModel(m, s, setLoadPct);
      setStatus('ready');
    } catch (e: any) {
      setStatus('error');
      setError(
        `Couldn't load ${m.name}: ${e?.message ?? e}. ` +
          'Try the 1B model, a smaller context size, or turn GPU off.',
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      const c = await loadChats();
      setSettings(s);
      updateChats(c, false);
      setBooted(true);
      const downloaded = await isDownloaded(getModel(s.modelId));
      if (!downloaded) {
        setStatus('missing');
        setScreen('models');
        return;
      }
      prepareModel(s);
    })();
  }, [prepareModel, updateChats]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'chat') {
        setScreen('chat');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

  const changeSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings(prev => {
        if (!prev) {
          return prev;
        }
        const next = { ...prev, ...patch };
        saveSettings(next);
        const reload =
          patch.modelId !== undefined ||
          patch.contextSize !== undefined ||
          patch.useGpu !== undefined;
        if (reload) {
          prepareModel(next);
        }
        return next;
      });
    },
    [prepareModel],
  );

  const current = chats.find(c => c.id === chatId) ?? null;

  const send = useCallback(
    async (text: string) => {
      if (!settings || generating || !isLoaded()) {
        return;
      }
      const model = getModel(settings.modelId);
      const userMsg: Message = { id: uid(), role: 'user', content: text };
      const botMsg: Message = { id: uid(), role: 'assistant', content: '' };

      let id = chatId;
      let list = chatsRef.current;
      if (!id || !list.find(c => c.id === id)) {
        id = uid();
        list = [
          {
            id,
            title: text.slice(0, 48),
            updatedAt: Date.now(),
            messages: [],
          },
          ...list,
        ];
        setChatId(id);
      }
      const history = [
        ...(list.find(c => c.id === id)?.messages ?? []),
        userMsg,
      ];
      // Always patch the latest list so edits elsewhere (e.g. deletes) aren't lost.
      const patchChat = (msgs: Message[], persist: boolean) => {
        updateChats(
          chatsRef.current
            .map(c =>
              c.id === id ? { ...c, messages: msgs, updatedAt: Date.now() } : c,
            )
            .sort((a, b) => b.updatedAt - a.updatedAt),
          persist,
        );
      };
      chatsRef.current = list;
      patchChat([...history, botMsg], true);
      setGenerating(true);

      let last = 0;
      try {
        const res = await generate(history, settings, model, u => {
          const now = Date.now();
          if (now - last < 60) {
            return;
          }
          last = now;
          patchChat(
            [
              ...history,
              { ...botMsg, content: u.content, reasoning: u.reasoning },
            ],
            false,
          );
        });
        patchChat(
          [
            ...history,
            {
              ...botMsg,
              content: res.content || '(no response)',
              reasoning: res.reasoning || undefined,
              stats: res.stats,
            },
          ],
          true,
        );
      } catch (e: any) {
        patchChat(
          [...history, { ...botMsg, content: `⚠️ ${e?.message ?? e}` }],
          true,
        );
      } finally {
        setGenerating(false);
      }
    },
    [chatId, generating, settings, updateChats],
  );

  if (!booted || !settings) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fill,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {screen === 'chat' && (
        <ChatScreen
          chat={current}
          settings={settings}
          status={status}
          loadPct={loadPct}
          error={error}
          generating={generating}
          onSend={send}
          onStop={stopGeneration}
          onNew={() => setChatId(null)}
          onOpen={setScreen}
          onToggleThinking={() =>
            changeSettings({ thinking: !settings.thinking })
          }
          onRetry={() => prepareModel(settings)}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen
          chats={chats}
          activeId={chatId}
          onBack={() => setScreen('chat')}
          onPick={id => {
            setChatId(id);
            setScreen('chat');
          }}
          onDelete={id => {
            updateChats(chatsRef.current.filter(c => c.id !== id));
            if (id === chatId) {
              setChatId(null);
            }
          }}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onChange={changeSettings}
          onBack={() => setScreen('chat')}
          onModels={() => setScreen('models')}
        />
      )}
      {screen === 'models' && (
        <ModelsScreen
          settings={settings}
          onBack={() => setScreen('chat')}
          onUse={(id: ModelId) => {
            if (id === settings.modelId) {
              prepareModel(settings);
            } else {
              changeSettings({ modelId: id });
            }
            setScreen('chat');
          }}
          onDeleted={(id: ModelId) => {
            if (id === settings.modelId) {
              prepareModel(settings);
            }
          }}
        />
      )}
    </View>
  );
}

/* ---------------------------------- Chat --------------------------------- */

function ChatScreen(props: {
  chat: Chat | null;
  settings: Settings;
  status: ModelStatus;
  loadPct: number;
  error: string;
  generating: boolean;
  onSend: (t: string) => void;
  onStop: () => void;
  onNew: () => void;
  onOpen: (s: Screen) => void;
  onToggleThinking: () => void;
  onRetry: () => void;
}) {
  const { chat, settings, status, generating } = props;
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);
  const model = getModel(settings.modelId);
  const messages = chat?.messages ?? [];
  const canSend = status === 'ready' && !generating && text.trim().length > 0;

  const submit = () => {
    if (!canSend) {
      return;
    }
    props.onSend(text.trim());
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <View style={styles.header}>
        <HeaderButton label="☰" onPress={() => props.onOpen('history')} />
        <Pressable
          style={styles.headerTitleWrap}
          onPress={() => props.onOpen('models')}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chat?.title ?? 'New chat'}
          </Text>
          <Text style={styles.headerSub}>
            {model.name} · {statusLabel(status, props.loadPct)}
          </Text>
        </Pressable>
        <HeaderButton label="＋" onPress={props.onNew} />
        <HeaderButton label="⚙" onPress={() => props.onOpen('settings')} />
      </View>

      {status === 'error' || status === 'missing' ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {status === 'missing'
              ? `${model.name} isn't downloaded yet.`
              : props.error}
          </Text>
          <Pressable
            style={styles.bannerBtn}
            onPress={() =>
              status === 'missing' ? props.onOpen('models') : props.onRetry()
            }
          >
            <Text style={styles.bannerBtnText}>
              {status === 'missing' ? 'Get model' : 'Retry'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {messages.length === 0 ? (
        <View style={[styles.fill, styles.center, styles.pad]}>
          <Text style={styles.hello}>Hi Balu 👋</Text>
          <Text style={styles.helloSub}>
            Everything runs on your phone. No internet, no cloud.
          </Text>
          {status === 'ready' &&
            [
              'Explain Python async vs threads in 5 lines',
              'Write a FastAPI endpoint that accepts a PDF upload',
              'Give me a 30-second YouTube script hook about local AI',
            ].map(s => (
              <Pressable
                key={s}
                style={styles.suggestion}
                onPress={() => props.onSend(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.fill}
          contentContainerStyle={styles.list}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item, index }) => (
            <Bubble
              msg={item}
              streaming={
                generating &&
                index === messages.length - 1 &&
                item.role === 'assistant'
              }
            />
          )}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View style={styles.composer}>
        {model.supportsThinking && (
          <Pressable
            onPress={props.onToggleThinking}
            style={[styles.chip, settings.thinking && styles.chipOn]}
          >
            <Text
              style={[styles.chipText, settings.thinking && styles.chipTextOn]}
            >
              💭 Think
            </Text>
          </Pressable>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={
              status === 'ready' ? 'Message' : 'Waiting for the model…'
            }
            placeholderTextColor={C.muted}
            multiline
          />
          {generating ? (
            <Pressable style={[styles.send, styles.stop]} onPress={props.onStop}>
              <Text style={styles.sendText}>■</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.send, !canSend && styles.sendOff]}
              onPress={submit}
              disabled={!canSend}
            >
              <Text style={styles.sendText}>↑</Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function statusLabel(s: ModelStatus, pct: number) {
  switch (s) {
    case 'ready':
      return 'ready';
    case 'loading':
      return `loading ${Math.round(pct * 100)}%`;
    case 'missing':
      return 'not downloaded';
    case 'error':
      return 'error';
    default:
      return '…';
  }
}

function Bubble({ msg, streaming }: { msg: Message; streaming: boolean }) {
  const [showThoughts, setShowThoughts] = useState(false);
  const mine = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleBot]}>
        {!!msg.reasoning && (
          <Pressable onPress={() => setShowThoughts(v => !v)}>
            <Text style={styles.thoughtToggle}>
              {showThoughts ? '▾ Hide thinking' : '▸ Show thinking'}
            </Text>
            {showThoughts && (
              <Text style={styles.thought} selectable>
                {msg.reasoning}
              </Text>
            )}
          </Pressable>
        )}
        {msg.content ? (
          <RichText text={msg.content} />
        ) : streaming ? (
          <Text style={styles.muted}>
            {msg.reasoning ? 'Thinking…' : '…'}
          </Text>
        ) : null}
        {!!msg.stats && <Text style={styles.stats}>{msg.stats}</Text>}
      </View>
    </View>
  );
}

// Minimal formatting: fenced code blocks, inline `code` and **bold**.
function RichText({ text }: { text: string }) {
  const parts = text.split(/```/);
  return (
    <View>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const body = part.replace(/^[^\n]*\n/, '');
          return (
            <ScrollView
              key={i}
              horizontal
              style={styles.codeBlock}
              contentContainerStyle={styles.codeInner}
            >
              <Text style={styles.code} selectable>
                {body.replace(/\n$/, '')}
              </Text>
            </ScrollView>
          );
        }
        if (!part.trim()) {
          return null;
        }
        const tokens = part.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/);
        return (
          <Text key={i} style={styles.msgText} selectable>
            {tokens.map((t, j) =>
              t.startsWith('`') && t.endsWith('`') && t.length > 2 ? (
                <Text key={j} style={styles.inlineCode}>
                  {t.slice(1, -1)}
                </Text>
              ) : t.startsWith('**') && t.endsWith('**') && t.length > 4 ? (
                <Text key={j} style={styles.bold}>
                  {t.slice(2, -2)}
                </Text>
              ) : (
                t
              ),
            )}
          </Text>
        );
      })}
    </View>
  );
}

/* -------------------------------- History -------------------------------- */

function HistoryScreen(props: {
  chats: Chat[];
  activeId: string | null;
  onBack: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.fill}>
      <SubHeader title="Chats" onBack={props.onBack} />
      {props.chats.length === 0 ? (
        <View style={[styles.fill, styles.center]}>
          <Text style={styles.muted}>No chats yet.</Text>
        </View>
      ) : (
        <FlatList
          data={props.chats}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.pad}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.card,
                item.id === props.activeId && styles.cardActive,
              ]}
              onPress={() => props.onPick(item.id)}
              onLongPress={() =>
                Alert.alert('Delete chat?', item.title, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => props.onDelete(item.id),
                  },
                ])
              }
            >
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSub}>
                {item.messages.length} messages ·{' '}
                {new Date(item.updatedAt).toLocaleString()}
              </Text>
            </Pressable>
          )}
          ListFooterComponent={
            <Text style={[styles.muted, styles.footnote]}>
              Long-press a chat to delete it.
            </Text>
          }
        />
      )}
    </View>
  );
}

/* -------------------------------- Settings ------------------------------- */

function SettingsScreen(props: {
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  onBack: () => void;
  onModels: () => void;
}) {
  const s = props.settings;
  const [prompt, setPrompt] = useState(s.systemPrompt);
  const dirty = prompt !== s.systemPrompt;

  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <SubHeader title="Settings" onBack={props.onBack} />
      <ScrollView contentContainerStyle={styles.pad}>
        <Pressable style={styles.card} onPress={props.onModels}>
          <Text style={styles.cardTitle}>Model: {getModel(s.modelId).name}</Text>
          <Text style={styles.cardSub}>Download, switch or delete models →</Text>
        </Pressable>

        <Text style={styles.label}>Personal instructions (system prompt)</Text>
        <TextInput
          style={styles.promptInput}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.row}>
          <SmallButton
            label="Save prompt"
            disabled={!dirty}
            onPress={() => props.onChange({ systemPrompt: prompt })}
          />
          <SmallButton
            label="Reset to default"
            onPress={() => {
              setPrompt(DEFAULT_SYSTEM_PROMPT);
              props.onChange({ systemPrompt: DEFAULT_SYSTEM_PROMPT });
            }}
          />
        </View>

        <Stepper
          label="Temperature"
          value={s.temperature}
          display={s.temperature.toFixed(1)}
          step={0.1}
          min={0}
          max={1.5}
          onChange={v => props.onChange({ temperature: round1(v) })}
        />
        <Choice
          label="Max reply length (tokens)"
          value={s.maxTokens}
          options={[256, 512, 1024, 2048]}
          onChange={v => props.onChange({ maxTokens: v })}
        />
        <Choice
          label="Context size (tokens) — bigger uses more RAM"
          value={s.contextSize}
          options={[2048, 4096, 8192]}
          onChange={v => props.onChange({ contextSize: v })}
        />
        <Toggle
          label="Thinking mode (2B only)"
          hint="Reasons before answering. Slower, better for hard questions."
          value={s.thinking}
          onChange={v => props.onChange({ thinking: v })}
        />
        <Toggle
          label="GPU acceleration (experimental)"
          hint="Uses OpenCL on recent Snapdragon phones. Turn off if loading fails."
          value={s.useGpu}
          onChange={v => props.onChange({ useGpu: v })}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/* --------------------------------- Models -------------------------------- */

function ModelsScreen(props: {
  settings: Settings;
  onBack: () => void;
  onUse: (id: ModelId) => void;
  onDeleted: (id: ModelId) => void;
}) {
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<ModelId | null>(null);
  const [pct, setPct] = useState(0);

  const refresh = useCallback(async () => {
    const out: Record<string, boolean> = {};
    for (const m of MODELS) {
      out[m.id] = await isDownloaded(m);
    }
    setHave(out);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const download = async (id: ModelId) => {
    const m = getModel(id);
    setBusy(id);
    setPct(0);
    try {
      await downloadModel(m, setPct);
      await refresh();
      props.onUse(id);
    } catch (e: any) {
      Alert.alert('Download stopped', String(e?.message ?? e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.fill}>
      <SubHeader title="Models" onBack={props.onBack} />
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[styles.muted, styles.footnote]}>
          Models download once from Hugging Face, then work fully offline. Use
          Wi-Fi and keep the app open while downloading.
        </Text>
        {MODELS.map(m => {
          const active = m.id === props.settings.modelId;
          const downloading = busy === m.id;
          return (
            <View key={m.id} style={[styles.card, active && styles.cardActive]}>
              <Text style={styles.cardTitle}>
                {m.name} {active ? '· in use' : ''}
              </Text>
              <Text style={styles.cardSub}>
                {m.sizeLabel} · {m.note}
              </Text>
              {downloading && (
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${pct * 100}%` }]}
                  />
                </View>
              )}
              <View style={styles.row}>
                {downloading ? (
                  <SmallButton
                    label={`Cancel (${Math.round(pct * 100)}%)`}
                    onPress={cancelDownload}
                  />
                ) : have[m.id] ? (
                  <>
                    <SmallButton
                      label={active ? 'Reload' : 'Use this'}
                      onPress={() => props.onUse(m.id)}
                    />
                    <SmallButton
                      label="Delete"
                      danger
                      onPress={() =>
                        Alert.alert(`Delete ${m.name}?`, 'You can download it again later.', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              if (active) {
                                await unloadModel();
                              }
                              await deleteModel(m);
                              await refresh();
                              props.onDeleted(m.id);
                            },
                          },
                        ])
                      }
                    />
                  </>
                ) : (
                  <SmallButton
                    label={`Download ${m.sizeLabel}`}
                    disabled={busy !== null}
                    onPress={() => download(m.id)}
                  />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ------------------------------ Small pieces ----------------------------- */

function HeaderButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.headerBtn} onPress={onPress} hitSlop={8}>
      <Text style={styles.headerBtnText}>{label}</Text>
    </Pressable>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <HeaderButton label="‹" onPress={onBack} />
      <Text style={[styles.headerTitle, styles.headerTitleWrap]}>{title}</Text>
    </View>
  );
}

function SmallButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[
        styles.smallBtn,
        props.danger && styles.smallBtnDanger,
        props.disabled && styles.sendOff,
      ]}
    >
      <Text style={[styles.smallBtnText, props.danger && { color: C.danger }]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

function Toggle(props: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={[styles.card, styles.toggleRow]}>
      <View style={styles.fill}>
        <Text style={styles.cardTitle}>{props.label}</Text>
        <Text style={styles.cardSub}>{props.hint}</Text>
      </View>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ true: C.accentDim, false: C.border }}
        thumbColor={props.value ? C.accent : C.muted}
      />
    </View>
  );
}

function Choice(props: {
  label: string;
  value: number;
  options: number[];
  onChange: (v: number) => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.row}>
        {props.options.map(o => (
          <Pressable
            key={o}
            onPress={() => props.onChange(o)}
            style={[styles.chip, o === props.value && styles.chipOn]}
          >
            <Text style={[styles.chipText, o === props.value && styles.chipTextOn]}>
              {o}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Stepper(props: {
  label: string;
  value: number;
  display: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const { value, step, min, max } = props;
  return (
    <View>
      <Text style={styles.label}>{props.label}</Text>
      <View style={styles.row}>
        <SmallButton
          label="−"
          disabled={value <= min}
          onPress={() => props.onChange(Math.max(min, value - step))}
        />
        <Text style={styles.stepValue}>{props.display}</Text>
        <SmallButton
          label="+"
          disabled={value >= max}
          onPress={() => props.onChange(Math.min(max, value + step))}
        />
      </View>
    </View>
  );
}

/* --------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { padding: 16, gap: 12 },
  muted: { color: C.muted },
  footnote: { fontSize: 13, lineHeight: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  headerTitleWrap: { flex: 1, paddingHorizontal: 8 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '600' },
  headerSub: { color: C.muted, fontSize: 12, marginTop: 2 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: { color: C.text, fontSize: 22 },
  banner: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.surface2,
    gap: 10,
  },
  bannerText: { color: C.text, fontSize: 14, lineHeight: 20 },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  bannerBtnText: { color: C.bg, fontWeight: '700' },
  hello: { color: C.text, fontSize: 26, fontWeight: '700' },
  helloSub: {
    color: C.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  suggestion: {
    alignSelf: 'stretch',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  suggestionText: { color: C.text, fontSize: 14 },
  list: { padding: 12, gap: 10 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '88%', borderRadius: 18, padding: 12, gap: 6 },
  bubbleMine: { backgroundColor: C.userBubble, borderBottomRightRadius: 6 },
  bubbleBot: {
    backgroundColor: C.surface,
    borderBottomLeftRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  msgText: { color: C.text, fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: '700' },
  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: C.surface2,
    color: C.accent,
    fontSize: 13,
  },
  codeBlock: {
    backgroundColor: '#0A0E0C',
    borderRadius: 10,
    marginVertical: 4,
  },
  codeInner: { padding: 10 },
  code: { fontFamily: 'monospace', color: '#CFE8DC', fontSize: 13, lineHeight: 19 },
  thoughtToggle: { color: C.accent, fontSize: 13, fontWeight: '600' },
  thought: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    fontStyle: 'italic',
  },
  stats: { color: C.muted, fontSize: 11 },
  composer: {
    padding: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    backgroundColor: C.surface,
    color: C.text,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stop: { backgroundColor: C.danger },
  sendOff: { opacity: 0.35 },
  sendText: { color: C.bg, fontSize: 20, fontWeight: '800' },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipOn: { backgroundColor: C.accentDim, borderColor: C.accent },
  chipText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: C.accent },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardActive: { borderColor: C.accent },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  cardSub: { color: C.muted, fontSize: 13, lineHeight: 18 },
  label: { color: C.muted, fontSize: 13, marginTop: 8, marginBottom: 6 },
  promptInput: {
    minHeight: 220,
    backgroundColor: C.surface,
    color: C.text,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 8 },
  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.accentDim,
  },
  smallBtnDanger: { backgroundColor: '#3A1F1B' },
  smallBtnText: { color: C.accent, fontWeight: '600', fontSize: 14 },
  stepValue: { color: C.text, fontSize: 16, minWidth: 40, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.surface2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { height: 6, backgroundColor: C.accent },
});
