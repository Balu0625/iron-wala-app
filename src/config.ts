export type ModelId = 'minicpm5-1b' | 'minicpm5-2b';

export type ModelInfo = {
  id: ModelId;
  name: string;
  file: string;
  url: string;
  sizeLabel: string;
  sizeBytes: number;
  note: string;
  supportsThinking: boolean;
};

const HF = 'https://huggingface.co/openbmb';

export const MODELS: ModelInfo[] = [
  {
    id: 'minicpm5-1b',
    name: 'MiniCPM5 1B',
    file: 'MiniCPM5-1B-Q4_K_M.gguf',
    url: `${HF}/MiniCPM5-1B-GGUF/resolve/main/MiniCPM5-1B-Q4_K_M.gguf`,
    sizeLabel: '688 MB',
    sizeBytes: 688_000_000,
    note: 'Fast. Runs on most phones (4 GB+ RAM).',
    supportsThinking: false,
  },
  {
    id: 'minicpm5-2b',
    name: 'MiniCPM5 2B',
    file: 'MiniCPM5-2B-Q4_K_M.gguf',
    url: `${HF}/MiniCPM5-2B-GGUF/resolve/main/MiniCPM5-2B-Q4_K_M.gguf`,
    sizeLabel: '1.56 GB',
    sizeBytes: 1_560_000_000,
    note: 'Smarter, supports thinking mode. Best with 8 GB+ RAM.',
    supportsThinking: true,
  },
];

export const getModel = (id: ModelId) =>
  MODELS.find(m => m.id === id) ?? MODELS[0];

export const DEFAULT_SYSTEM_PROMPT = `You are Balu's personal offline assistant, running fully on his phone.

About Balu:
- Balasubrahmanyeswara Rao Maddala ("Balu"), based in Vijayawada, Andhra Pradesh, India.
- AI / Python engineer (~2 years) working in healthcare IT. Core skills: Python backends, FastAPI/Django-style services, GenAI and LLM integration, OCR pipelines, Azure.
- Builds side projects like a local Python engine that turns images + narration into YouTube videos, and portable agent skills for coding agents.
- Long-term goal: work at an AI-native product company.

How to help:
- Be direct and practical. Lead with the answer, then short reasoning.
- For code, prefer Python and give runnable snippets.
- Keep answers short on a phone screen unless asked to go deeper.
- If you are unsure or something may be outdated, say so plainly; you have no internet access.`;

export type Settings = {
  modelId: ModelId;
  systemPrompt: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  contextSize: number;
  thinking: boolean;
  useGpu: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  modelId: 'minicpm5-1b',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 1024,
  contextSize: 4096,
  thinking: false,
  useGpu: false,
};
