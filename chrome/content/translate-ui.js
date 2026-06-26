// ──────────────────────────────────────────────
// Tofu Translate — UI Module
// Translation panels, dialogs, notifications
// ──────────────────────────────────────────────

var TofuUI = {

  _config: {},
  _progressDialog: null,
  _resultPanel: null,

  // ══════════════════════════════════════════════
  // Init
  // ══════════════════════════════════════════════

  init(config) {
    this._config = config;
  },

  // ══════════════════════════════════════════════
  // Progress Dialog
  // ══════════════════════════════════════════════

  showProgressDialog(message) {
    this.hideProgressDialog();

    let win = this._getActiveWindow();
    if (!win) return;

    let doc = win.document;

    // Create overlay
    let overlay = doc.createXULElement("vbox");
    overlay.id = "tofu-translate-overlay";
    overlay.setAttribute(
      "style",
      `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.3); z-index: 99999;
      display: flex; align-items: center; justify-content: center;
    `
    );

    // Dialog box
    let dialog = doc.createXULElement("vbox");
    dialog.setAttribute(
      "style",
      `
      background: #fff; border-radius: 8px; padding: 24px 32px;
      min-width: 360px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    `
    );

    // Spinner
    let spinner = doc.createXULElement("html:div");
    spinner.setAttribute(
      "style",
      `
      width: 40px; height: 40px; border: 4px solid #e5e7eb;
      border-top-color: #3b82f6; border-radius: 50%;
      animation: tofu-spin 0.8s linear infinite;
    `
    );

    // Add animation style
    let style = doc.createElement("style");
    style.textContent = `
      @keyframes tofu-spin {
        to { transform: rotate(360deg); }
      }
    `;
    dialog.appendChild(style);

    // Message
    let msgEl = doc.createXULElement("description");
    msgEl.id = "tofu-translate-progress-msg";
    msgEl.setAttribute(
      "style",
      "font-size: 14px; color: #374151; text-align: center;"
    );
    msgEl.textContent = message;

    // Cancel button
    let cancelBtn = doc.createXULElement("button");
    cancelBtn.setAttribute("label", "取消");
    cancelBtn.setAttribute(
      "style",
      `
      padding: 6px 24px; border: 1px solid #d1d5db;
      border-radius: 6px; background: #fff; color: #374151;
      cursor: pointer; font-size: 13px;
    `
    );
    cancelBtn.addEventListener("click", () => {
      this.hideProgressDialog();
    });

    dialog.appendChild(spinner);
    dialog.appendChild(msgEl);
    dialog.appendChild(cancelBtn);
    overlay.appendChild(dialog);

    doc.documentElement.appendChild(overlay);
    this._progressDialog = overlay;
  },

  updateProgress(message) {
    if (!this._progressDialog) return;
    let msgEl = this._progressDialog.querySelector(
      "#tofu-translate-progress-msg"
    );
    if (msgEl) {
      msgEl.textContent = message;
    }
  },

  hideProgressDialog() {
    if (this._progressDialog) {
      this._progressDialog.remove();
      this._progressDialog = null;
    }
  },

  // ══════════════════════════════════════════════
  // Translation Result Panel
  // ══════════════════════════════════════════════

  /**
   * Show translation result in a side panel.
   */
  showTranslationResult(item, originalText, translatedText) {
    let win = this._getActiveWindow();
    if (!win) return;

    let doc = win.document;

    // Remove existing panel
    this._removeResultPanel();

    // Create panel container
    let panel = doc.createXULElement("vbox");
    panel.id = "tofu-translate-result-panel";
    panel.setAttribute(
      "style",
      `
      position: fixed; top: 0; right: 0; bottom: 0; width: 480px;
      background: #ffffff; z-index: 99990; box-shadow: -2px 0 16px rgba(0,0,0,0.1);
      display: flex; flex-direction: column; overflow: hidden;
    `
    );

    // ── Header ──
    let header = doc.createXULElement("hbox");
    header.setAttribute(
      "style",
      `
      padding: 12px 16px; border-bottom: 1px solid #e5e7eb;
      background: #f8fafc; display: flex; align-items: center;
      justify-content: space-between; flex-shrink: 0;
    `
    );

    let titleEl = doc.createXULElement("description");
    let titleStr = item
      ? "翻译结果: " + item.getDisplayTitle()
      : "剪贴板翻译结果";
    titleEl.textContent = titleStr;
    titleEl.setAttribute(
      "style",
      "font-size: 14px; font-weight: 600; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;"
    );

    let closeBtn = doc.createXULElement("button");
    closeBtn.setAttribute("label", "✕");
    closeBtn.setAttribute(
      "style",
      `
      width: 28px; height: 28px; border: none; background: transparent;
      color: #6b7280; cursor: pointer; font-size: 16px; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
    `
    );
    closeBtn.addEventListener("click", () => this._removeResultPanel());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // ── Toolbar ──
    let toolbar = doc.createXULElement("hbox");
    toolbar.setAttribute(
      "style",
      `
      padding: 8px 16px; border-bottom: 1px solid #e5e7eb;
      background: #f9fafb; display: flex; gap: 8px; flex-shrink: 0;
    `
    );

    let copyBtn = doc.createXULElement("button");
    copyBtn.setAttribute("label", "复制全部");
    copyBtn.setAttribute(
      "style",
      "padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px;"
    );
    copyBtn.addEventListener("click", () => {
      Services.clipboard.helper.copyString(translatedText);
      this.showNotification("已复制到剪贴板");
    });

    let saveBtn = null;
    if (item) {
      saveBtn = doc.createXULElement("button");
      saveBtn.setAttribute("label", "保存为笔记");
      saveBtn.setAttribute(
        "style",
        "padding: 4px 12px; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px;"
      );
      saveBtn.addEventListener("click", async () => {
        await this._saveTranslationAsNote(item, originalText, translatedText);
      });
    }

    toolbar.appendChild(copyBtn);
    if (saveBtn) toolbar.appendChild(saveBtn);

    // ── Content Area (tabs) ──
    let tabBar = doc.createXULElement("hbox");
    tabBar.setAttribute(
      "style",
      "display: flex; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;"
    );

    let contentArea = doc.createXULElement("deck");
    contentArea.id = "tofu-translate-content-deck";
    contentArea.setAttribute(
      "style",
      "flex: 1; overflow: hidden;"
    );

    // Tab: Translation Only
    let tab1 = this._createTab(doc, "仅译文", true);
    tab1.addEventListener("click", () => {
      contentArea.selectedIndex = 0;
      this._updateTabStyles(tabBar);
    });

    // Tab: Side by Side
    let tab2 = this._createTab(doc, "对照", false);
    tab2.addEventListener("click", () => {
      contentArea.selectedIndex = 1;
      this._updateTabStyles(tabBar);
    });

    tabBar.appendChild(tab1);
    tabBar.appendChild(tab2);
    this._updateTabStyles(tabBar);

    // Page 1: Translation only
    let page1 = doc.createXULElement("vbox");
    page1.setAttribute("style", "flex: 1; overflow: auto;");

    let transContent = doc.createXULElement("description");
    transContent.setAttribute(
      "style",
      "padding: 16px; font-size: 14px; line-height: 1.7; color: #1f2937; white-space: pre-wrap;"
    );
    transContent.textContent = translatedText;
    page1.appendChild(transContent);

    // Page 2: Side by side
    let page2 = doc.createXULElement("vbox");
    page2.setAttribute(
      "style",
      "flex: 1; overflow: auto;"
    );

    // Side-by-side uses a CSS grid
    let grid = doc.createXULElement("html:div");
    let gridStyle =
      "display: grid; grid-template-columns: 1fr 1fr; height: 100%;";
    grid.setAttribute("style", gridStyle);

    let origCol = doc.createXULElement("html:div");
    origCol.setAttribute(
      "style",
      "padding: 16px; font-size: 13px; line-height: 1.7; color: #6b7280; white-space: pre-wrap; border-right: 1px solid #e5e7eb; overflow: auto;"
    );
    origCol.textContent = originalText;

    let transCol = doc.createXULElement("html:div");
    transCol.setAttribute(
      "style",
      "padding: 16px; font-size: 14px; line-height: 1.7; color: #1f2937; white-space: pre-wrap; overflow: auto;"
    );
    transCol.textContent = translatedText;

    grid.appendChild(origCol);
    grid.appendChild(transCol);
    page2.appendChild(grid);

    contentArea.appendChild(page1);
    contentArea.appendChild(page2);
    contentArea.selectedIndex = 0;

    // ── Assemble ──
    panel.appendChild(header);
    panel.appendChild(toolbar);
    panel.appendChild(tabBar);
    panel.appendChild(contentArea);

    doc.documentElement.appendChild(panel);
    this._resultPanel = panel;
  },

  _createTab(doc, label, active) {
    let tab = doc.createXULElement("description");
    tab.textContent = label;
    tab.setAttribute(
      "style",
      "padding: 8px 16px; cursor: pointer; font-size: 13px; border-bottom: 2px solid " +
        (active ? "#3b82f6" : "transparent") +
        "; color: " +
        (active ? "#3b82f6" : "#6b7280") +
        ";"
    );
    return tab;
  },

  _updateTabStyles(tabBar) {
    // Simple style update could be added for tab switching
    // For now, CSS handles active state via classes
  },

  _removeResultPanel() {
    if (this._resultPanel) {
      this._resultPanel.remove();
      this._resultPanel = null;
    }
  },

  // ══════════════════════════════════════════════
  // Save Translation as Note
  // ══════════════════════════════════════════════

  async _saveTranslationAsNote(item, originalText, translatedText) {
    try {
      let note = new Zotero.Item("note");
      note.parentID = item.id;
      note.setNote(
        "<h2>AI Translation (Tofu)</h2>\n\n" +
          "<h3>Translated Text</h3>\n" +
          "<blockquote>" +
          translatedText.replace(/\n/g, "<br>") +
          "</blockquote>\n\n" +
          "<h3>Original Text</h3>\n" +
          "<blockquote>" +
          originalText.replace(/\n/g, "<br>") +
          "</blockquote>"
      );
      await note.saveTx();
      this.showNotification("翻译已保存为笔记");
    } catch (e) {
      this.showNotification("保存失败: " + e.message);
    }
  },

  // ══════════════════════════════════════════════
  // Notification
  // ══════════════════════════════════════════════

  showNotification(message, type = "info") {
    // Use Zotero's native notification when available
    try {
      let ps = Services.prompt;
      // Silent notification: just log
      Zotero.log("Tofu Translate: " + message);
    } catch (e) {
      // Fallback
    }

    // Also show a brief toast-like notification
    let win = this._getActiveWindow();
    if (!win) return;

    let doc = win.document;
    let existing = doc.getElementById("tofu-translate-toast");
    if (existing) existing.remove();

    let toast = doc.createXULElement("hbox");
    toast.id = "tofu-translate-toast";
    toast.setAttribute(
      "style",
      `
      position: fixed; bottom: 24px; right: 24px; z-index: 100000;
      background: ${type === "error" ? "#ef4444" : "#10b981"};
      color: #fff; padding: 10px 20px; border-radius: 6px;
      font-size: 13px; box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      max-width: 400px; word-wrap: break-word;
    `
    );

    let msgEl = doc.createXULElement("description");
    msgEl.textContent = message;
    msgEl.setAttribute("style", "color: #fff;");
    toast.appendChild(msgEl);

    doc.documentElement.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3000);
  },

  // ══════════════════════════════════════════════
  // Reader Popup Integration
  // ══════════════════════════════════════════════

  /**
   * Add "Translate" button to PDF text selection popup.
   */
  addTranslateButtonToPopup(reader, doc, params, append) {
    let container = doc.createElement("div");
    container.setAttribute("style", "margin-top: 4px;");

    let button = doc.createElement("button");
    button.textContent = "🤖 AI 翻译";
    button.setAttribute(
      "style",
      `
      padding: 4px 10px; background: #3b82f6; color: #fff;
      border: none; border-radius: 4px; cursor: pointer;
      font-size: 12px; margin-right: 4px;
    `
    );
    button.addEventListener("click", async () => {
      let text = params.text || params.annotation?.text;
      if (!text) return;

      button.textContent = "翻译中...";
      button.disabled = true;

      try {
        let translated = await TofuEngine.translate({
          text: text,
          sourceLang: TofuTranslate.sourceLang,
          targetLang: TofuTranslate.targetLang,
          promptTemplate: TofuTranslate.promptTemplate,
          itemContext: null,
        });

        // Show result in a tooltip-like popup
        this._showReaderTranslationPopup(doc, translated);
      } catch (e) {
        this.showNotification("翻译失败: " + e.message, "error");
      } finally {
        button.textContent = "🤖 AI 翻译";
        button.disabled = false;
      }
    });

    container.appendChild(button);
    append(container);
  },

  _showReaderTranslationPopup(doc, text) {
    let existing = doc.getElementById("tofu-reader-translation");
    if (existing) existing.remove();

    let popup = doc.createElement("div");
    popup.id = "tofu-reader-translation";
    popup.setAttribute(
      "style",
      `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #fff; border-radius: 8px; padding: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2); z-index: 10000;
      max-width: 600px; max-height: 400px; overflow: auto;
    `
    );

    let header = doc.createElement("div");
    header.setAttribute(
      "style",
      "display: flex; justify-content: space-between; margin-bottom: 12px;"
    );

    let title = doc.createElement("span");
    title.textContent = "AI 翻译结果";
    title.setAttribute(
      "style",
      "font-weight: 600; font-size: 14px; color: #1f2937;"
    );

    let close = doc.createElement("span");
    close.textContent = "✕";
    close.setAttribute(
      "style",
      "cursor: pointer; color: #6b7280; font-size: 16px;"
    );
    close.addEventListener("click", () => popup.remove());

    header.appendChild(title);
    header.appendChild(close);

    let content = doc.createElement("div");
    content.textContent = text;
    content.setAttribute(
      "style",
      "font-size: 14px; line-height: 1.7; color: #1f2937; white-space: pre-wrap;"
    );

    popup.appendChild(header);
    popup.appendChild(content);
    doc.body.appendChild(popup);

    // Click outside to close
    setTimeout(() => {
      doc.addEventListener(
        "click",
        function handler(e) {
          if (!popup.contains(e.target)) {
            popup.remove();
            doc.removeEventListener("click", handler);
          }
        },
        { once: false }
      );
    }, 100);
  },

  // ══════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════

  _getActiveWindow() {
    let win = Services.wm.getMostRecentWindow("navigator:browser");
    if (!win) {
      // Try Zotero's main window
      let windows = Zotero.getMainWindows();
      if (windows.length > 0) win = windows[0];
    }
    return win;
  },
};
