// ──────────────────────────────────────────────
// Tofu Translate — Translation Engine
// OpenAI-compatible API client for Tofu
// ──────────────────────────────────────────────

var TofuEngine = {

  // ── Configuration ─────────────────────────
  _config: {},

  // ── Available models ──────────────────────
  MODELS: [
    { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen2.5 72B (推荐)", type: "chat" },
    { id: "Qwen/Qwen2.5-32B-Instruct", name: "Qwen2.5 32B", type: "chat" },
    { id: "Qwen/Qwen2.5-14B-Instruct", name: "Qwen2.5 14B", type: "chat" },
    { id: "Qwen/Qwen2.5-7B-Instruct", name: "Qwen2.5 7B (快速)", type: "chat" },
    { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3", type: "chat" },
    { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1 (深度推理)", type: "chat" },
    { id: "Pro/deepseek-ai/DeepSeek-R1", name: "DeepSeek R1 Pro", type: "chat" },
    { id: "Pro/deepseek-ai/DeepSeek-V3", name: "DeepSeek V3 Pro", type: "chat" },
    { id: "meta-llama/Meta-Llama-3.1-405B-Instruct", name: "Llama 3.1 405B", type: "chat" },
    { id: "meta-llama/Meta-Llama-3.1-70B-Instruct", name: "Llama 3.1 70B", type: "chat" },
    { id: "THUDM/glm-4-9b-chat", name: "GLM-4 9B", type: "chat" },
    { id: "01-ai/Yi-1.5-34B-Chat", name: "Yi 1.5 34B", type: "chat" },
    { id: "internlm/internlm2_5-20b-chat", name: "InternLM2.5 20B", type: "chat" },
    { id: "google/gemma-2-27b-it", name: "Gemma 2 27B", type: "chat" },
    { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral 8x7B", type: "chat" },
  ],

  // ── Domain-specific glossary for academic translation ──
  DOMAIN_GLOSSARY: {
    general: {
      "machine learning": "机器学习",
      "deep learning": "深度学习",
      "neural network": "神经网络",
      "natural language processing": "自然语言处理",
      "reinforcement learning": "强化学习",
      "supervised learning": "监督学习",
      "unsupervised learning": "无监督学习",
      "transfer learning": "迁移学习",
      "attention mechanism": "注意力机制",
      "transformer": "Transformer 模型",
    },
    medical: {
      "randomized controlled trial": "随机对照试验",
      "meta-analysis": "荟萃分析",
      "systematic review": "系统综述",
      "odds ratio": "比值比",
      "confidence interval": "置信区间",
      "hazard ratio": "风险比",
    },
    chemistry: {
      "aqueous solution": "水溶液",
      "catalyst": "催化剂",
      "precipitate": "沉淀物",
      "oxidation": "氧化反应",
      "reduction": "还原反应",
      "chromatography": "色谱法",
      "spectroscopy": "光谱学",
    },
    law: {
      "statute": "成文法",
      "precedent": "判例",
      "jurisdiction": "管辖权",
      "tort": "侵权行为",
      "plaintiff": "原告",
      "defendant": "被告",
      "injunction": "禁令",
      "arbitration": "仲裁",
    },
    economics: {
      "gross domestic product": "国内生产总值",
      "inflation rate": "通货膨胀率",
      "monetary policy": "货币政策",
      "fiscal policy": "财政政策",
      "supply chain": "供应链",
      "market capitalization": "市值",
      "liquidity": "流动性",
    },
  },

  // ══════════════════════════════════════════════
  // Initialization
  // ══════════════════════════════════════════════

  init(config) {
    this._config = Object.assign({}, config);
  },

  // ══════════════════════════════════════════════
  // Core Translation
  // ══════════════════════════════════════════════

  /**
   * Translate text using Tofu API.
   *
   * @param {Object} options
   * @param {string} options.text - Text to translate
   * @param {string} options.sourceLang - Source language code
   * @param {string} options.targetLang - Target language code
   * @param {string} options.promptTemplate - Custom prompt template
   * @param {Object} options.itemContext - Zotero item context {title, itemType}
   * @returns {Promise<string>} Translated text
   */
  async translate(options) {
    let { text, sourceLang, targetLang, promptTemplate, itemContext } = options;

    if (!text || !text.trim()) {
      return "";
    }

    // Read current settings from preferences
    let apiKey = Zotero.Prefs.get(
      "extensions.tofu-translate.apiKey",
      true
    );
    let apiBase = Zotero.Prefs.get(
      "extensions.tofu-translate.apiBase",
      true
    );
    let model = Zotero.Prefs.get(
      "extensions.tofu-translate.model",
      true
    );
    let maxTokens = Zotero.Prefs.get(
      "extensions.tofu-translate.maxTokens",
      true
    );
    let temperature = Zotero.Prefs.get(
      "extensions.tofu-translate.temperature",
      true
    );

    if (!apiKey) {
      throw new Error("请先在设置中配置 API Key");
    }

    // Build the prompt
    let prompt = this._buildPrompt({
      text,
      sourceLang,
      targetLang,
      promptTemplate,
      itemContext,
    });

    // Build request body (OpenAI-compatible)
    let body = {
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are a professional academic translator. Always output only the translated text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      stream: false,
    };

    // Log request in debug mode
    this._log("Translating chunk (" + text.length + " chars)...");
    this._log("Model: " + model);
    this._log("API: " + apiBase + "/chat/completions");

    // Make API request
    let response = await this._callAPI(apiBase, apiKey, body);

    // Parse response
    let translated = this._parseResponse(response);

    return translated;
  },

  /**
   * Translate text with streaming (for real-time display).
   */
  async translateStream(options, onChunk) {
    let { text, sourceLang, targetLang, promptTemplate, itemContext } = options;

    let apiKey = Zotero.Prefs.get(
      "extensions.tofu-translate.apiKey",
      true
    );
    let apiBase = Zotero.Prefs.get(
      "extensions.tofu-translate.apiBase",
      true
    );
    let model = Zotero.Prefs.get(
      "extensions.tofu-translate.model",
      true
    );
    let maxTokens = Zotero.Prefs.get(
      "extensions.tofu-translate.maxTokens",
      true
    );
    let temperature = Zotero.Prefs.get(
      "extensions.tofu-translate.temperature",
      true
    );

    if (!apiKey) {
      throw new Error("请先在设置中配置 API Key");
    }

    let prompt = this._buildPrompt({
      text,
      sourceLang,
      targetLang,
      promptTemplate,
      itemContext,
    });

    let body = {
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You are a professional academic translator. Always output only the translated text.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      stream: true,
    };

    return await this._callAPIStream(apiBase, apiKey, body, onChunk);
  },

  // ══════════════════════════════════════════════
  // Prompt Building
  // ══════════════════════════════════════════════

  _buildPrompt(options) {
    let { text, sourceLang, targetLang, promptTemplate, itemContext } = options;

    if (!promptTemplate) {
      promptTemplate = this._defaultTemplate();
    }

    let domainContext = "";
    if (itemContext) {
      domainContext =
        'This text is from an academic paper titled "' +
        itemContext.title +
        '".';
      // Detect domain from title keywords
      let domain = this._detectDomain(itemContext.title);
      if (domain) {
        domainContext +=
          "\nUse the following domain-specific translations when applicable:\n" +
          this._formatGlossary(domain);
      }
    }

    // Replace template variables
    let prompt = promptTemplate
      .replace(/\{\{sourceLang\}\}/g, this._langName(sourceLang))
      .replace(/\{\{targetLang\}\}/g, this._langName(targetLang))
      .replace(/\{\{text\}\}/g, text)
      .replace(/\{\{domainContext\}\}/g, domainContext);

    // Inject academic glossary
    if (!promptTemplate.includes("{{glossary}}")) {
      let glossary = this._formatGlossary("general");
      if (glossary) {
        prompt +=
          "\n\nFor reference, here are domain-specific translations:\n" +
          glossary;
      }
    }

    return prompt;
  },

  _defaultTemplate() {
    return `You are a professional academic translator. Translate the following text from {{sourceLang}} to {{targetLang}}.

Guidelines:
- Preserve the original meaning accurately
- Use proper academic terminology
- Keep all formatting (headings, bullet points, citations, LaTeX)
- Translate naturally, not word-for-word
- {{domainContext}}

Text to translate:
{{text}}

Return ONLY the translated text without any additional commentary, explanations, or meta-commentary. Do not add notes, disclaimers, or prefixes.`;
  },

  _langName(code) {
    const MAP = {
      auto: "auto-detect",
      "zh-CN": "Simplified Chinese (简体中文)",
      "zh-TW": "Traditional Chinese (繁體中文)",
      en: "English",
      ja: "Japanese",
      ko: "Korean",
      fr: "French",
      de: "German",
      es: "Spanish",
      ru: "Russian",
      ar: "Arabic",
      pt: "Portuguese",
      it: "Italian",
    };
    return MAP[code] || code;
  },

  _detectDomain(title) {
    if (!title) return null;
    let lower = title.toLowerCase();

    const DOMAIN_KEYWORDS = {
      medical: [
        "cancer", "disease", "patient", "clinical", "surgery", "therapy",
        "diagnosis", "treatment", "trial", "hospital", "drug", "pharmac",
        "cell", "gene", "protein", "molecular", "tumor", "carcinoma",
      ],
      chemistry: [
        "chemistry", "synthesis", "compound", "reaction", "catalyst",
        "molecule", "polymer", "oxidation", "element", "solution",
      ],
      computer_science: [
        "algorithm", "neural", "learning", "network", "computing",
        "database", "software", "programming", "architecture", "dataset",
        "model", "transformer", "attention", "token", "embedding",
      ],
      economics: [
        "econom", "market", "finance", "trade", "growth", "inflation",
        "monetary", "fiscal", "investment", "stock", "bond",
      ],
      law: [
        "law", "legal", "court", "justice", "rights", "regulation",
        "statute", "constitution", "criminal", "civil",
      ],
    };

    for (let [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      for (let kw of keywords) {
        if (lower.includes(kw)) return domain;
      }
    }

    return "general";
  },

  _formatGlossary(domain) {
    let glossary = this.DOMAIN_GLOSSARY[domain];
    if (!glossary) return "";

    return Object.entries(glossary)
      .map(([en, zh]) => `- "${en}" → "${zh}"`)
      .join("\n");
  },

  // ══════════════════════════════════════════════
  // API Communication
  // ══════════════════════════════════════════════

  async _callAPI(baseURL, apiKey, body) {
    let url = baseURL.replace(/\/+$/, "") + "/chat/completions";
    let jsonBody = JSON.stringify(body);

    this._log("Request URL: " + url);

    let response = await this._fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: jsonBody,
    });

    if (!response.ok) {
      let errorText = await response.text();
      this._log("API Error: " + response.status + " - " + errorText);

      // Parse error
      try {
        let errorJSON = JSON.parse(errorText);
        throw new Error(
          "API Error [" + response.status + "]: " + (errorJSON.error?.message || errorText)
        );
      } catch (e) {
        if (e.message.startsWith("API Error")) throw e;
        throw new Error(
          "HTTP Error " + response.status + ": " + errorText.substring(0, 200)
        );
      }
    }

    return await response.json();
  },

  /**
   * Streaming API call using fetch + ReadableStream.
   */
  async _callAPIStream(baseURL, apiKey, body, onChunk) {
    let url = baseURL.replace(/\/+$/, "") + "/chat/completions";
    let jsonBody = JSON.stringify(body);

    let response = await this._fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: jsonBody,
    });

    if (!response.ok) {
      let errorText = await response.text();
      throw new Error("API Error: " + response.status + " - " + errorText);
    }

    // Read the stream
    let reader = response.body.getReader();
    let decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      let { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (let line of lines) {
        if (line.startsWith("data: ")) {
          let data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            let parsed = JSON.parse(data);
            let content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              if (onChunk) onChunk(content, fullText);
            }
          } catch (e) {
            // Skip malformed JSON lines
          }
        }
      }
    }

    return fullText;
  },

  /**
   * Compatibility wrapper for fetch (Zotero uses XHR natively).
   */
  async _fetch(url, options) {
    return new Promise((resolve, reject) => {
      try {
        let xhr = Components.classes[
          "@mozilla.org/xmlextras/xmlhttprequest;1"
        ].createInstance(Components.interfaces.nsIXMLHttpRequest);

        xhr.open(options.method || "GET", url, true);
        xhr.timeout = Zotero.Prefs.get(
          "extensions.tofu-translate.timeout",
          true
        );

        // Set headers
        if (options.headers) {
          for (let [key, value] of Object.entries(options.headers)) {
            // Skip forbidden headers in XHR
            if (
              [
                "host",
                "origin",
                "referer",
                "user-agent",
                "content-length",
              ].includes(key.toLowerCase())
            ) {
              continue;
            }
            xhr.setRequestHeader(key, value);
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              ok: true,
              status: xhr.status,
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              text: () => Promise.resolve(xhr.responseText),
              body: xhr.responseText
                ? {
                    getReader: () => {
                      let encoder = new TextEncoder();
                      let data = encoder.encode(xhr.responseText);
                      let done = false;
                      return {
                        read: () => {
                          if (done)
                            return Promise.resolve({ done: true, value: null });
                          done = true;
                          return Promise.resolve({ done: false, value: data });
                        },
                      };
                    },
                  }
                : null,
            });
          } else {
            resolve({
              ok: false,
              status: xhr.status,
              json: () => {
                try {
                  return Promise.resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                  return Promise.reject(e);
                }
              },
              text: () => Promise.resolve(xhr.responseText),
            });
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error"));
        };

        xhr.ontimeout = () => {
          reject(new Error("Request timed out"));
        };

        xhr.send(options.body || null);
      } catch (e) {
        reject(e);
      }
    });
  },

  /**
   * Parse API response to extract translated text.
   */
  _parseResponse(json) {
    if (!json || !json.choices || json.choices.length === 0) {
      throw new Error("API returned empty response");
    }

    let content = json.choices[0].message?.content;
    if (!content) {
      throw new Error("API response missing content");
    }

    return content.trim();
  },

  /**
   * Test API connection with a simple translation.
   */
  async testConnection(apiKey, apiBase, model) {
    if (!apiKey || !apiBase || !model) {
      throw new Error("请填写完整的 API 配置");
    }

    let body = {
      model: model,
      messages: [
        {
          role: "user",
          content:
            'Translate "Hello World" to Chinese. Reply with ONLY the translation.',
        },
      ],
      max_tokens: 50,
      temperature: 0,
    };

    let response = await this._callAPI(apiBase, apiKey, body);
    let text = this._parseResponse(response);
    return text;
  },

  // ══════════════════════════════════════════════
  // Utilities
  // ══════════════════════════════════════════════

  _log(msg) {
    if (
      Zotero.Prefs.get("extensions.tofu-translate.debug", true)
    ) {
      Zotero.debug("Tofu Translate Engine: " + msg);
    }
  },
};
