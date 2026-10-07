# MiniCPM Chat

A personal, fully offline chat app for Android that runs OpenBMB's **MiniCPM5** models on-device with [llama.rn](https://github.com/mybigday/llama.rn) (llama.cpp for React Native).

## Install

1. Open the repo's **Releases** page on your phone and download the latest `MiniCPM-Chat-*.apk`.
2. Open it and allow "Install unknown apps" for your browser or the GitHub app when Android asks.
3. On first launch, pick a model and download it over Wi-Fi:
   - **MiniCPM5 1B** (688 MB): fast, works on most phones.
   - **MiniCPM5 2B** (1.56 GB): smarter, has thinking mode, best with 8 GB+ RAM.

After the download, everything runs on the phone with no internet.

## Features

- Streaming chat with saved history (long-press a chat to delete it)
- Personal system prompt, editable in Settings
- Thinking mode toggle for the 2B model, with collapsible reasoning
- Temperature, reply length and context size controls
- Experimental OpenCL GPU offload for recent Snapdragon phones
- Code blocks and inline code formatting

## Build

GitHub Actions builds a release APK (arm64-v8a) on every push to the `minicpm-chat` branch and publishes it as a GitHub Release. To build locally:

```bash
npm ci
cd android && ./gradlew assembleRelease
```

The APK is signed with the default debug key, which is fine for sideloading but not for the Play Store.

## Project layout

- `App.tsx`: screens (chat, history, settings, models)
- `src/llm.ts`: model download, loading and streaming generation
- `src/store.ts`: settings and chat persistence (JSON files in app storage)
- `src/config.ts`: model list, default system prompt, default settings
