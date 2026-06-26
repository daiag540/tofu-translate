// ──────────────────────────────────────────────
// Default preferences for Tofu Translate
// ──────────────────────────────────────────────

// API Configuration
pref("extensions.tofu-translate.apiKey", "");
pref("extensions.tofu-translate.apiBase", "https://api.siliconflow.cn/v1");
pref("extensions.tofu-translate.model", "Qwen/Qwen2.5-72B-Instruct");

// Translation Settings
pref("extensions.tofu-translate.targetLang", "zh-CN");
pref("extensions.tofu-translate.sourceLang", "auto");
pref("extensions.tofu-translate.chunkSize", 2000);
pref("extensions.tofu-translate.chunkOverlap", 200);
pref("extensions.tofu-translate.maxTokens", 4096);
pref("extensions.tofu-translate.temperature", 0.3);

// Prompt Template
pref("extensions.tofu-translate.promptTemplate", "");

// UI Preferences
pref("extensions.tofu-translate.autoShowPanel", true);
pref("extensions.tofu-translate.saveAsNote", false);
pref("extensions.tofu-translate.showProgressBar", true);
pref("extensions.tofu-translate.concurrentChunks", 1);

// Advanced
pref("extensions.tofu-translate.debug", false);
pref("extensions.tofu-translate.timeout", 120000);
