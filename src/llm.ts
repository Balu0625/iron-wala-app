import {
  downloadFile,
  exists,
  getFSInfo,
  moveFile,
  stat,
  stopDownload,
  unlink,
} from '@dr.pogodin/react-native-fs';
import { initLlama, LlamaContext } from 'llama.rn';
import { ModelInfo, Settings } from './config';
import { MODELS_DIR, Message } from './store';

export const modelPath = (m: ModelInfo) => `${MODELS_DIR}/${m.file}`;

export async function isDownloaded(m: ModelInfo) {
  const p = modelPath(m);
  if (!(await exists(p))) {
    return false;
  }
  const s = await stat(p);
  // Guard against a truncated file from an interrupted download.
  return Number(s.size) > m.sizeBytes * 0.9;
}

let activeJob: number | null = null;

export async function downloadModel(
  m: ModelInfo,
  onProgress: (fraction: number) => void,
) {
  const info = await getFSInfo();
  if (info.freeSpace < m.sizeBytes * 1.1) {
    throw new Error(
      `Not enough storage. Need about ${m.sizeLabel} free, you have ${(
        info.freeSpace / 1e9
      ).toFixed(1)} GB.`,
    );
  }
  const part = `${modelPath(m)}.part`;
  if (await exists(part)) {
    await unlink(part);
  }
  const job = downloadFile({
    fromUrl: m.url,
    toFile: part,
    progressInterval: 500,
    connectionTimeout: 30000,
    readTimeout: 60000,
    progress: r => {
      const total = r.contentLength > 0 ? r.contentLength : m.sizeBytes;
      onProgress(Math.min(1, r.bytesWritten / total));
    },
  });
  activeJob = job.jobId;
  try {
    const res = await job.promise;
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`Download failed (HTTP ${res.statusCode}).`);
    }
    if (await exists(modelPath(m))) {
      await unlink(modelPath(m));
    }
    await moveFile(part, modelPath(m));
  } catch (e) {
    if (await exists(part)) {
      await unlink(part).catch(() => {});
    }
    throw e;
  } finally {
    activeJob = null;
  }
}

export function cancelDownload() {
  if (activeJob !== null) {
    stopDownload(activeJob);
  }
}

export async function deleteModel(m: ModelInfo) {
  if (await exists(modelPath(m))) {
    await unlink(modelPath(m));
  }
}

let ctx: LlamaContext | null = null;
let loadedKey = '';

export const isLoaded = () => ctx !== null;

export async function loadModel(
  m: ModelInfo,
  s: Settings,
  onProgress?: (p: number) => void,
) {
  const key = `${m.id}|${s.contextSize}|${s.useGpu}`;
  if (ctx && loadedKey === key) {
    return;
  }
  await unloadModel();
  ctx = await initLlama(
    {
      model: `file://${modelPath(m)}`,
      n_ctx: s.contextSize,
      n_batch: 512,
      use_mlock: false,
      n_gpu_layers: s.useGpu ? 99 : 0,
    },
    p => onProgress?.(p / 100),
  );
  loadedKey = key;
}

export async function unloadModel() {
  if (ctx) {
    const c = ctx;
    ctx = null;
    loadedKey = '';
    await c.release().catch(() => {});
  }
}

export type StreamUpdate = { content: string; reasoning: string };

// Keep the most recent turns; ~3.5 chars per token is a safe rough estimate.
function trimHistory(history: Message[], s: Settings) {
  const budget = (s.contextSize - s.maxTokens - 300) * 3.5 - s.systemPrompt.length;
  const kept: Message[] = [];
  let used = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    used += history[i].content.length;
    if (used > budget && kept.length > 0) {
      break;
    }
    kept.unshift(history[i]);
  }
  return kept;
}

export async function generate(
  history: Message[],
  s: Settings,
  m: ModelInfo,
  onUpdate: (u: StreamUpdate) => void,
) {
  if (!ctx) {
    throw new Error('Model is not loaded.');
  }
  const thinking = m.supportsThinking && s.thinking;
  const messages = [
    { role: 'system', content: s.systemPrompt },
    ...trimHistory(history, s).map(x => ({ role: x.role, content: x.content })),
  ];
  let raw = '';
  const res = await ctx.completion(
    {
      messages,
      n_predict: s.maxTokens,
      temperature: s.temperature,
      top_p: s.topP,
      jinja: true,
      enable_thinking: thinking,
      reasoning_format: 'auto',
    },
    data => {
      raw += data.token;
      onUpdate({
        content: data.content ?? raw,
        reasoning: data.reasoning_content ?? '',
      });
    },
  );
  const t = res.timings;
  return {
    content: (res.content || res.text || raw).trim(),
    reasoning: (res.reasoning_content || '').trim(),
    stats: t
      ? `${t.predicted_per_second.toFixed(1)} tok/s · ${t.predicted_n} tokens`
      : '',
  };
}

export async function stopGeneration() {
  await ctx?.stopCompletion();
}
