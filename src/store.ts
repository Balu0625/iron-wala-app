import {
  DocumentDirectoryPath,
  exists,
  mkdir,
  readFile,
  writeFile,
  unlink,
  moveFile,
} from '@dr.pogodin/react-native-fs';
import { DEFAULT_SETTINGS, Settings } from './config';

export type Role = 'user' | 'assistant';

export type Message = {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;
  stats?: string;
};

export type Chat = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
};

const DATA_DIR = `${DocumentDirectoryPath}/data`;
export const MODELS_DIR = `${DocumentDirectoryPath}/models`;
const SETTINGS_FILE = `${DATA_DIR}/settings.json`;
const CHATS_FILE = `${DATA_DIR}/chats.json`;

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function ensureDirs() {
  for (const dir of [DATA_DIR, MODELS_DIR]) {
    if (!(await exists(dir))) {
      await mkdir(dir);
    }
  }
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    if (!(await exists(path))) {
      return fallback;
    }
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

// Write to a temp file then move, so a crash mid-write never corrupts data.
async function writeJson(path: string, value: unknown) {
  await ensureDirs();
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(value), 'utf8');
  if (await exists(path)) {
    await unlink(path);
  }
  await moveFile(tmp, path);
}

export async function loadSettings(): Promise<Settings> {
  await ensureDirs();
  const saved = await readJson<Partial<Settings>>(SETTINGS_FILE, {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export const saveSettings = (s: Settings) => writeJson(SETTINGS_FILE, s);

export async function loadChats(): Promise<Chat[]> {
  const chats = await readJson<Chat[]>(CHATS_FILE, []);
  return chats.sort((a, b) => b.updatedAt - a.updatedAt);
}

let pending: Chat[] | null = null;
let writing = false;

// Coalesces rapid saves (e.g. while streaming) into sequential writes.
export async function saveChats(chats: Chat[]) {
  pending = chats;
  if (writing) {
    return;
  }
  writing = true;
  try {
    while (pending) {
      const next = pending;
      pending = null;
      await writeJson(CHATS_FILE, next);
    }
  } finally {
    writing = false;
  }
}
