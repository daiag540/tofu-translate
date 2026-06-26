// ──────────────────────────────────────────────
// Tofu Translate — Preferences Script
// Handles the preferences pane UI logic
// ──────────────────────────────────────────────

var TofuTranslatePrefs = {

  init() {
    // Populate model list
    this._populateModelList();

    // Test connection button
    let testBtn = document.getElementById("tofu-test-connection");
    if (testBtn) {
      testBtn.addEventListener("command", () => this._testConnection());
    }

    // Reset prompt button
    let resetBtn = document.getElementById("tofu-reset-prompt");
    if (resetBtn) {
      resetBtn.addEventListener("command", () => this._resetPrompt());
    }
  },

  _populateModelList() {
    let popup = document.getElementById("tofu-model-popup");
    if (!popup) return;

    // Clear existing items
    while (popup.firstChild) {
      popup.firstChild.remove();
    }

    // Get available models from the engine
    let models = (typeof TofuEngine !== "undefined")
      ? TofuEngine.MODELS
      : [
          { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen2.5 72B (推荐)" },
          { id: "Qwen/Qwen2.5-32B-Instruct", name: "Qwen2.5 32B" },
          { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek V3" },
          { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek R1" },
        ];

    let currentModel = document.getElementById("tofu-model")?.value;

    // Group models by family
    let qwenGroup = models.filter((m) => m.id.includes("Qwen"));
    let deepseekGroup = models.filter((m) => m.id.includes("deepseek"));
    let llamaGroup = models.filter((m) => m.id.includes("llama") || m.id.includes("Llama"));
    let others = models.filter(
      (m) => !qwenGroup.includes(m) && !deepseekGroup.includes(m) && !llamaGroup.includes(m)
    );

    this._addModelGroup(popup, "通义千问 (Qwen)", qwenGroup, currentModel);
    this._addModelGroup(popup, "DeepSeek", deepseekGroup, currentModel);
    this._addModelGroup(popup, "Llama", llamaGroup, currentModel);
    this._addModelGroup(popup, "其他模型", others, currentModel);
  },

  _addModelGroup(popup, label, models, currentModel) {
    if (models.length === 0) return;

    // Group label
    let labelItem = document.createXULElement("menuitem");
    labelItem.setAttribute("label", "── " + label + " ──");
    labelItem.setAttribute("disabled", "true");
    labelItem.setAttribute(
      "style",
      "font-weight: 600; color: #6b7280; font-size: 11px;"
    );
    popup.appendChild(labelItem);

    for (let model of models) {
      let item = document.createXULElement("menuitem");
      item.setAttribute("label", model.name);
      item.setAttribute("value", model.id);
      if (model.id === currentModel) {
        item.setAttribute("selected", "true");
      }
      popup.appendChild(item);
    }

    // Separator
    let sep = document.createXULElement("menuseparator");
    popup.appendChild(sep);
  },

  async _testConnection() {
    let apiKey = document.getElementById("tofu-api-key")?.value || "";
    let apiBase = document.getElementById("tofu-api-base")?.value || "https://api.siliconflow.cn/v1";
    let model = document.getElementById("tofu-model")?.value || "";

    let resultEl = document.getElementById("tofu-test-result");
    let testBtn = document.getElementById("tofu-test-connection");

    if (!apiKey) {
      if (resultEl) {
        resultEl.textContent = "请先填写 API Key";
        resultEl.setAttribute("style", "margin-left: 12px; font-size: 12px; color: #ef4444;");
      }
      return;
    }

    if (testBtn) {
      testBtn.setAttribute("label", "测试中...");
      testBtn.setAttribute("disabled", "true");
    }

    if (resultEl) {
      resultEl.textContent = "正在测试连接...";
      resultEl.setAttribute("style", "margin-left: 12px; font-size: 12px; color: #f59e0b;");
    }

    try {
      let result = await TofuEngine.testConnection(apiKey, apiBase, model);

      if (resultEl) {
        resultEl.textContent = "✅ 连接成功！";
        resultEl.setAttribute("style", "margin-left: 12px; font-size: 12px; color: #10b981;");
      }
    } catch (e) {
      if (resultEl) {
        resultEl.textContent = "❌ 连接失败: " + e.message;
        resultEl.setAttribute("style", "margin-left: 12px; font-size: 12px; color: #ef4444;");
      }
    } finally {
      if (testBtn) {
        testBtn.setAttribute("label", "测试连接");
        testBtn.removeAttribute("disabled");
      }
    }
  },

  _resetPrompt() {
    let promptBox = document.getElementById("tofu-prompt-template");
    if (promptBox) {
      promptBox.value = "";
    }
  },
};

// Initialize when the DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => TofuTranslatePrefs.init());
} else {
  TofuTranslatePrefs.init();
}
