// ──────────────────────────────────────────────
// Tofu Translate — Main Plugin Module
// Core object registered on Zotero 7 startup
// ──────────────────────────────────────────────

var TofuTranslate = {

  // ── Plugin Metadata ──────────────────────────
  id: null,
  version: null,
  rootURI: null,
  initialized: false,

  // ── Preferences shorthands ───────────────────
  get apiKey() {
    return Zotero.Prefs.get("extensions.tofu-translate.apiKey", true);
  },
  get apiBase() {
    return Zotero.Prefs.get("extensions.tofu-translate.apiBase", true);
  },
  get model() {
    return Zotero.Prefs.get("extensions.tofu-translate.model", true);
  },
  get targetLang() {
    return Zotero.Prefs.get("extensions.tofu-translate.targetLang", true);
  },
  get sourceLang() {
    return Zotero.Prefs.get("extensions.tofu-translate.sourceLang", true);
  },
  get chunkSize() {
    return Zotero.Prefs.get("extensions.tofu-translate.chunkSize", true);
  },
  get chunkOverlap() {
    return Zotero.Prefs.get("extensions.tofu-translate.chunkOverlap", true);
  },
  get maxTokens() {
    return Zotero.Prefs.get("extensions.tofu-translate.maxTokens", true);
  },
  get temperature() {
    return Zotero.Prefs.get("extensions.tofu-translate.temperature", true);
  },
  get concurrentChunks() {
    return Zotero.Prefs.get("extensions.tofu-translate.concurrentChunks", true);
  },
  get saveAsNote() {
    return Zotero.Prefs.get("extensions.tofu-translate.saveAsNote", true);
  },
  get debug() {
    return Zotero.Prefs.get("extensions.tofu-translate.debug", true);
  },
  get promptTemplate() {
    let t = Zotero.Prefs.get("extensions.tofu-translate.promptTemplate", true);
    if (!t) {
      t = TofuTranslate._defaultPromptTemplate();
    }
    return t;
  },

  // ── References to created UI elements ────────
  _elements: {},

  // ── Translation Queue ────────────────────────
  _translationQueue: [],
  _translationRunning: false,

  // ── Module references ────────────────────────
  _engine: null,
  _ui: null,

  // ══════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════

  /**
   * Initialize the plugin (called by bootstrap.js startup).
   */
  async init({ id, version, rootURI }) {
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;

    // Load sub-modules
    try {
      Services.scriptloader.loadSubScript(rootURI + "chrome/content/translate-engine.js");
      Services.scriptloader.loadSubScript(rootURI + "chrome/content/translate-ui.js");
    } catch (e) {
      Zotero.debug("Tofu Translate: Failed to load sub-modules — " + e);
      if (e.stack) Zotero.debug(e.stack);
      throw e;
    }

    // Initialize engine
    TofuEngine.init({
      apiKey: this.apiKey,
      apiBase: this.apiBase,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      debug: this.debug,
    });

    // Initialize UI module
    TofuUI.init({
      rootURI: this.rootURI,
      pluginID: this.id,
    });

    this.initialized = true;
    Zotero.debug("Tofu Translate: Initialized v" + version);
  },

  /**
   * Main async entry point (called after init + addToAllWindows).
   */
  async main() {
    // Register preference pane
    this._registerPrefPane();

    // Register reader hooks for PDF translation
    this._registerReaderHooks();
  },

  /**
   * Cleanup on shutdown.
   */
  shutdown() {
    this._elements = {};
    this._translationQueue = [];
    this._translationRunning = false;
    this.initialized = false;
  },

  // ══════════════════════════════════════════════
  // Window Management
  // ══════════════════════════════════════════════

  /**
   * Inject UI into all currently open windows.
   */
  addToAllWindows() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      if (win) this.addToWindow(win);
    }
  },

  /**
   * Inject UI into a specific window.
   */
  addToWindow(window) {
    if (!window) return;
    let doc = window.document;

    // Add stylesheet
    this._injectStylesheet(doc);

    // Add menu items
    this._addMenuItems(doc);

    // Add keyboard shortcuts
    this._addKeyboardShortcuts(window);
  },

  /**
   * Remove UI from all open windows.
   */
  removeFromAllWindows() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let win = enumerator.getNext();
      if (win) this.removeFromWindow(win);
    }
  },

  /**
   * Remove UI from a specific window.
   */
  removeFromWindow(window) {
    if (!window) return;
    let doc = window.document;

    // Remove stylesheet
    let styleEl = doc.getElementById("tofu-translate-stylesheet");
    if (styleEl) styleEl.remove();

    // Remove menu items
    let menu = doc.getElementById("menu_ToolsPopup");
    if (menu) {
      let sep = doc.getElementById("tofu-translate-menu-separator");
      let item = doc.getElementById("tofu-translate-menu");
      if (sep) sep.remove();
      if (item) item.remove();
    }
  },

  // ══════════════════════════════════════════════
  // UI Injection Helpers
  // ══════════════════════════════════════════════

  _injectStylesheet(doc) {
    let link = doc.createElement("link");
    link.id = "tofu-translate-stylesheet";
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = this.rootURI + "chrome/content/style.css";
    doc.documentElement.appendChild(link);
    this._storeElement(link);
  },

  _addMenuItems(doc) {
    let menu = doc.getElementById("menu_ToolsPopup");
    if (!menu) return;

    // Separator
    let sep = doc.createXULElement("menuseparator");
    sep.id = "tofu-translate-menu-separator";
    menu.appendChild(sep);

    // Main menu item
    let menuItem = doc.createXULElement("menu");
    menuItem.id = "tofu-translate-menu";
    menuItem.setAttribute("label", "Tofu 翻译");

    let menuPopup = doc.createXULElement("menupopup");
    menuPopup.id = "tofu-translate-popup";

    // Sub-menu items
    let items = [
      {
        id: "tofu-translate-selected",
        label: "翻译选中条目全文",
        oncommand: "TofuTranslate.translateSelectedItems()",
        accel: "T",
        modifiers: "accel,shift",
      },
      {
        id: "tofu-translate-clipboard",
        label: "翻译剪贴板内容",
        oncommand: "TofuTranslate.translateClipboard()",
      },
      { type: "separator" },
      {
        id: "tofu-translate-settings",
        label: "设置...",
        oncommand:
          "Zotero.openPreferences('tofu-translate-prefs')",
      },
    ];

    for (let cfg of items) {
      if (cfg.type === "separator") {
        menuPopup.appendChild(doc.createXULElement("menuseparator"));
      } else {
        let mi = doc.createXULElement("menuitem");
        mi.id = cfg.id;
        mi.setAttribute("label", cfg.label);
        mi.setAttribute("oncommand", cfg.oncommand);
        if (cfg.accel) {
          mi.setAttribute("acceltext", cfg.accel);
          // Zotero shortcut registration is done separately
        }
        menuPopup.appendChild(mi);
      }
    }

    menuItem.appendChild(menuPopup);
    menu.appendChild(menuItem);
  },

  _addKeyboardShortcuts(window) {
    // Register Ctrl+Shift+T for translate selected
    let keyset = window.document.getElementById("mainKeyset");
    if (!keyset) {
      keyset = window.document.createXULElement("keyset");
      keyset.id = "tofu-translate-keyset";
      window.document.documentElement.appendChild(keyset);
    }

    let key = window.document.createXULElement("key");
    key.id = "tofu-translate-key";
    key.setAttribute("key", "T");
    key.setAttribute("modifiers", "accel,shift");
    key.setAttribute(
      "oncommand",
      "TofuTranslate.translateSelectedItems()"
    );
    keyset.appendChild(key);
    this._storeElement(key);
  },

  _registerPrefPane() {
    try {
      Zotero.PreferencePanes.register({
        pluginID: this.id,
        src: this.rootURI + "chrome/content/translate-prefs.xhtml",
        scripts: [this.rootURI + "chrome/content/translate-prefs.js"],
        stylesheets: [this.rootURI + "chrome/content/style.css"],
        label: "Tofu Translate",
        image: this.rootURI + "icons/icon-32.png",
      });
    } catch (e) {
      Zotero.debug("Tofu Translate: Failed to register prefs pane — " + e);
    }
  },

  _registerReaderHooks() {
    // Hook into PDF reader to add translate button in selection popup
    try {
      Zotero.Reader.registerEventListener(
        "renderTextSelectionPopup",
        (event) => {
          let { reader, doc, params, append } = event;
          TofuUI.addTranslateButtonToPopup(reader, doc, params, append);
        },
        this.id
      );
      this.log("Reader hooks registered");
    } catch (e) {
      this.log("Failed to register reader hooks: " + e);
    }
  },

  _storeElement(el) {
    if (!this._elements[el.id]) {
      this._elements[el.id] = el;
    }
  },

  // ══════════════════════════════════════════════
  // Translation Actions
  // ══════════════════════════════════════════════

  /**
   * Translate currently selected Zotero items (full text).
   */
  async translateSelectedItems() {
    let items = Zotero.getActiveZoteroPane().getSelectedItems();
    if (!items || items.length === 0) {
      TofuUI.showNotification("请先选择一个条目");
      return;
    }

    TofuUI.showProgressDialog("正在准备翻译...");

    try {
      for (let item of items) {
        await this._translateItem(item);
      }
    } catch (e) {
      this.log("Translation error: " + e);
      TofuUI.showNotification("翻译失败: " + e.message);
    } finally {
      TofuUI.hideProgressDialog();
    }
  },

  /**
   * Translate a single Zotero item.
   */
  async _translateItem(item) {
    TofuUI.updateProgress("正在提取文本: " + item.getDisplayTitle());

    // Extract text from item
    let text = await this._extractItemText(item);

    if (!text || text.trim().length === 0) {
      TofuUI.showNotification("未找到可翻译的文本内容");
      return;
    }

    TofuUI.updateProgress(
      `正在翻译 (${text.length} 字符): ` + item.getDisplayTitle()
    );

    // Translate the extracted text
    let translated = await this._translateText(text, item);

    // Show result
    TofuUI.showTranslationResult(item, text, translated);
  },

  /**
   * Extract full text from a Zotero item.
   * Tries: notes → attachments (PDF) → abstract → title
   */
  async _extractItemText(item) {
    let parts = [];
    let itemID = item.id;

    // 1. Title
    let title = item.getField("title");
    if (title) {
      parts.push(`# ${title}\n`);
    }

    // 2. Abstract
    let abstract = item.getField("abstractNote");
    if (abstract) {
      parts.push(abstract);
    }

    // 3. Notes (child notes)
    try {
      let notes = item.getNotes();
      for (let noteID of notes) {
        let note = Zotero.Items.get(noteID);
        if (note) {
          parts.push(note.getNote());
        }
      }
    } catch (e) {
      this.log("Could not read notes: " + e);
    }

    // 4. PDF attachments - extract via fulltext index
    try {
      let attachmentIDs = item.getAttachments();
      for (let attID of attachmentIDs) {
        let att = Zotero.Items.get(attID);
        if (!att || !att.isFileAttachment()) continue;

        let contentType = att.attachmentContentType;
        if (contentType === "application/pdf") {
          // Try to get PDF text via Zotero's fulltext indexing
          let fulltext = await this._extractPDFText(att);
          if (fulltext) {
            parts.push("\n## PDF Content\n" + fulltext);
          }
        }
      }
    } catch (e) {
      this.log("Could not extract PDF text: " + e);
    }

    return parts.join("\n\n");
  },

  /**
   * Extract text from a PDF attachment using Zotero fulltext.
   */
  async _extractPDFText(attachment) {
    try {
      // Use Zotero's fulltext index if available
      let indexedPages = await Zotero.Fulltext.getPages(attachment.id);
      if (indexedPages && indexedPages.totalPages > 0) {
        // indexedPages is { totalPages, pages: [...] }
        let pages = indexedPages.pages || [];
        let text = pages
          .map((p) => (typeof p === "string" ? p : p.text || ""))
          .filter(Boolean)
          .join("\n\n");
        if (text.trim()) return text;
      }
    } catch (e) {
      this.log("Fulltext extraction via getPages failed: " + e);
    }

    // Fallback: try Zotero.Fulltext.getItemContent
    try {
      let content = await Zotero.Fulltext.getItemContent(attachment.id);
      if (content && content.trim()) {
        return content;
      }
    } catch (e) {
      this.log("Fulltext getItemContent failed: " + e);
    }

    return null;
  },

  /**
   * Translate clipboard content.
   */
  async translateClipboard() {
    try {
      let text = "";
      try {
        // Zotero 7+: use the clipboard helper
        let transferable = Cc["@mozilla.org/widget/transferable;1"]
          .createInstance(Ci.nsITransferable);
        transferable.init(null);
        transferable.addDataFlavor("text/unicode");
        Services.clipboard.getData(transferable, Services.clipboard.kGlobalClipboard);
        let data = {};
        transferable.getTransferData("text/unicode", data, {});
        if (data.value) {
          text = data.value.QueryInterface(Ci.nsISupportsString).data;
        }
      } catch (e) {
        this.log("Clipboard read failed: " + e);
      }

      if (!text || !text.trim()) {
        TofuUI.showNotification("剪贴板为空");
        return;
      }

      TofuUI.showProgressDialog("正在翻译剪贴板内容...");
      let translated = await this._translateText(text, null);
      TofuUI.hideProgressDialog();
      TofuUI.showTranslationResult(null, text, translated);
    } catch (e) {
      TofuUI.hideProgressDialog();
      TofuUI.showNotification("翻译失败: " + e.message);
    }
  },

  // ══════════════════════════════════════════════
  // Core Translation Logic
  // ══════════════════════════════════════════════

  /**
   * Translate a block of text using the Tofu API.
   */
  async _translateText(text, item) {
    // Split text into chunks
    let chunks = this._splitTextIntoChunks(text);

    TofuUI.updateProgress(
      `分段翻译中 (共 ${chunks.length} 段)...`
    );

    // Translate chunks
    let translatedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      TofuUI.updateProgress(
        `正在翻译第 ${i + 1}/${chunks.length} 段...`
      );

      let translated = await TofuEngine.translate({
        text: chunk,
        sourceLang: this.sourceLang,
        targetLang: this.targetLang,
        promptTemplate: this.promptTemplate,
        itemContext: item
          ? {
              title: item.getField("title"),
              itemType: Zotero.ItemTypes.getName(item.itemTypeID),
            }
          : null,
      });

      translatedChunks.push(translated);
    }

    // Merge chunks
    return this._mergeTranslatedChunks(translatedChunks);
  },

  /**
   * Split text into manageable chunks for API.
   */
  _splitTextIntoChunks(text) {
    let chunkSize = this.chunkSize;
    let overlap = this.chunkOverlap;
    let chunks = [];

    if (text.length <= chunkSize) {
      return [text];
    }

    // Split by paragraphs first, then combine into chunks
    let paragraphs = text.split(/\n\s*\n/);
    let currentChunk = "";

    for (let para of paragraphs) {
      if (
        currentChunk.length + para.length > chunkSize &&
        currentChunk.length > 0
      ) {
        chunks.push(currentChunk.trim());
        // Keep overlap: last portion of previous chunk
        if (overlap > 0 && currentChunk.length > overlap) {
          currentChunk = currentChunk.slice(-overlap) + "\n\n" + para;
        } else {
          currentChunk = para;
        }
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + para;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  },

  /**
   * Merge translated chunks back into a single text.
   */
  _mergeTranslatedChunks(chunks) {
    // Simple concatenation with double newline
    // (overlap-aware merging could be added here)
    return chunks.join("\n\n");
  },

  // ══════════════════════════════════════════════
  // Prompt Templates
  // ══════════════════════════════════════════════

  _defaultPromptTemplate() {
    return `You are a professional academic translator. Translate the following text from {{sourceLang}} to {{targetLang}}.

Guidelines:
- Preserve the original meaning accurately
- Use proper academic terminology
- Keep formatting (headings, bullet points, citations)
- Translate naturally, not word-for-word
- {{domainContext}}

Text to translate:
{{text}}

Return ONLY the translated text without any additional commentary or explanation.`;
  },

  // ══════════════════════════════════════════════
  // Utilities
  // ══════════════════════════════════════════════

  log(msg) {
    if (this.debug) {
      Zotero.debug("Tofu Translate: " + msg);
    }
  },

  /**
   * Get language name from code.
   */
  getLanguageName(code) {
    const LANGUAGES = {
      auto: "自动检测",
      "zh-CN": "简体中文",
      "zh-TW": "繁體中文",
      en: "English",
      ja: "日本語",
      ko: "한국어",
      fr: "Français",
      de: "Deutsch",
      es: "Español",
      ru: "Русский",
      ar: "العربية",
      pt: "Português",
      it: "Italiano",
      nl: "Nederlands",
      pl: "Polski",
      vi: "Tiếng Việt",
      th: "ไทย",
      tr: "Türkçe",
    };
    return LANGUAGES[code] || code;
  },
};
