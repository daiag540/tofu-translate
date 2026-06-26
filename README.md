# Tofu Translate for Zotero

> 🤖 AI 驱动的 Zotero 全文翻译插件 · 支持硅基流动 (Tofu) 大模型 API

[![Zotero 7](https://img.shields.io/badge/Zotero-7-blue)](https://www.zotero.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](#)

## 📖 简介

Tofu Translate 是一款 **Zotero 7 全文翻译插件**，基于硅基流动 (Tofu) 平台的大语言模型 API，为学术文献提供高质量 AI 翻译。

### 为什么选择大模型翻译？

| | 传统翻译 API | 大模型翻译 |
|---|---|---|
| **上下文理解** | 孤立句子 | 段落/全文语境 |
| **学术术语** | 字典式替换 | 领域知识适应 |
| **格式保持** | 丢失 | 保持 LaTeX/引用 |
| **可定制性** | 低 | 高（提示词模板） |

---

## ✨ 功能特性

### 核心翻译
- ✅ **全文翻译** — 一键翻译 Zotero 条目的摘要、笔记、PDF 全文
- ✅ **分段智能翻译** — 自动分段，保持跨段语义连贯
- ✅ **领域术语优化** — 内置 5 大学科领域词典（CS、医学、化学、法律、经济）
- ✅ **原文/译文对照** — 双栏对照视图
- ✅ **保存为笔记** — 翻译结果自动保存到 Zotero 条目
- ✅ **剪贴板翻译** — 快速翻译剪贴板内容

### PDF 阅读器集成
- ✅ **划词翻译** — PDF 阅读器内选中文本即译
- ✅ **弹出式翻译窗口** — 不打断阅读流程

### 大模型特色
- ✅ **硅基流动平台** — 支持 15+ 主流开源模型
- ✅ **OpenAI 兼容** — 兼容任何 OpenAI 接口的服务
- ✅ **自定义提示词** — 完整控制翻译风格和领域偏好
- ✅ **流式输出** — 实时显示翻译进度
- ✅ **连接测试** — 一键验证 API 配置

---

## 🚀 支持的模型

| 模型 | 特点 | 推荐场景 |
|------|------|---------|
| **Qwen2.5 72B** ⭐ | 中文最佳 | 中英互译 |
| **Qwen2.5 32B** | 性能均衡 | 日常翻译 |
| **DeepSeek V3** | 推理强大 | 复杂学术文本 |
| **DeepSeek R1** | 深度推理 | 专业领域精译 |
| **Llama 3.1 405B** | 英文最佳 | 英→其他语言 |
| **GLM-4 9B** | 轻量快速 | 简单段落 |
| **Qwen2.5 7B** | 最快速度 | 短文本快速翻译 |

---

## 📦 安装

### 方法一：直接安装 XPI

1. 下载最新 [`.xpi` 文件](https://github.com/yourname/tofu-translate/releases)
2. Zotero → 工具 → 插件 → 齿轮图标 → `Install Add-on From File...`
3. 选择下载的 `.xpi` 文件
4. 重启 Zotero

### 方法二：开发者模式

```bash
git clone https://github.com/daiag540/tofu-translate.git
cd tofu-translate
node scripts/build.js
# 然后将 build/tofu-translate-1.0.0.xpi 拖入 Zotero
```

---

## ⚙️ 配置

### 1. 获取 API Key

访问 [硅基流动平台](https://cloud.siliconflow.cn/account/ak) 注册并获取 API Key（新用户有免费额度）。

### 2. 配置插件

Zotero → 工具 → Tofu 翻译 → 设置...

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API Key | 硅基流动 API 密钥 | (必填) |
| API Base | API 地址 | `https://api.siliconflow.cn/v1` |
| 模型 | 使用的翻译模型 | Qwen2.5 72B |
| 目标语言 | 翻译的目标语言 | 简体中文 |
| 分段大小 | 每次请求的字符数 | 2000 |
| 最大 Token | API 响应长度上限 | 4096 |

### 3. 测试连接

点击设置页面的 **"测试连接"** 按钮验证配置。

---

## 🎯 使用方式

### 翻译学术条目全文

1. 在 Zotero 库中选择一个条目（最好有 PDF 附件）
2. 右键菜单 → `Tofu 翻译` → `翻译选中条目全文`
3. 或使用快捷键 **Ctrl+Shift+T**
4. 等待翻译完成，结果面板自动弹出

### PDF 阅读器划词翻译

1. 打开 PDF 附件
2. 选中需要翻译的文本
3. 在弹出的菜单中选择 **"🤖 AI 翻译"**

### 剪贴板翻译

1. 复制任意文本
2. 工具菜单 → `Tofu 翻译` → `翻译剪贴板内容`

### 自定义提示词模板

在设置页面可自定义提示词，支持的变量：

| 变量 | 说明 |
|------|------|
| `{{sourceLang}}` | 源语言 |
| `{{targetLang}}` | 目标语言 |
| `{{text}}` | 待翻译文本 |
| `{{domainContext}}` | 领域上下文（自动检测） |

**示例 — 学术精译模板：**
```
你是一位专业的学术翻译专家。请将以下 {{sourceLang}} 文本翻译为 {{targetLang}}。

翻译要求：
1. 保持学术严谨性，准确翻译专业术语
2. 保留所有引用格式 [1], [2] 等
3. 保留 LaTeX 数学公式 $$...$$ 和 $...$
4. 保持原文的段落和层级结构
5. 对于不确定的术语，在括号中保留原文

{{domainContext}}

原文：
{{text}}

只返回翻译结果。
```

---

## 📁 项目结构

```
tofu-translate/
├── manifest.json              # 插件清单
├── bootstrap.js               # 插件入口
├── prefs.js                   # 默认偏好设置
├── updates.json               # 自动更新配置
│
├── chrome/
│   └── content/
│       ├── tofu-translate.js   # 主模块（核心逻辑）
│       ├── translate-engine.js        # 翻译引擎（API 调用）
│       ├── translate-ui.js            # UI 模块（面板/对话框）
│       ├── translate-prefs.xhtml      # 设置面板 UI
│       ├── translate-prefs.js         # 设置面板逻辑
│       └── style.css                  # 样式表
│
├── locale/
│   ├── en-US/tofu-translate.ftl   # 英文
│   └── zh-CN/tofu-translate.ftl   # 中文
│
├── icons/                      # 插件图标
├── scripts/build.js            # 构建脚本
└── README.md
```

---

## 🔧 技术架构

```
┌──────────────────────────────────────────────────────┐
│                    Zotero 7 Client                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ PDF Reader  │  │ Item Pane   │  │  Menu/Tools  │  │
│  │ (划词翻译)   │  │ (全文翻译)   │  │  (剪贴板)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│         │                │                 │          │
│         └────────────────┼─────────────────┘          │
│                          │                             │
│              ┌───────────▼───────────┐                │
│              │  TofuTranslate │                │
│              │     (Core Module)      │                │
│              └───────────┬───────────┘                │
│         ┌────────────────┼────────────────┐           │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐   │
│  │ Text Extract │  │  Prompt     │  │  UI Panel  │   │
│  │ (PDF/Notes)  │  │  Builder    │  │  Manager   │   │
│  └──────┬──────┘  └──────┬──────┘  └────────────┘   │
│         │                │                             │
│         └────────┬───────┘                             │
│                  │                                      │
│        ┌─────────▼─────────┐                          │
│        │  TofuEngine │                          │
│        │  (API Client)      │                          │
│        └─────────┬─────────┘                          │
└──────────────────┼────────────────────────────────────┘
                   │  HTTPS
         ┌─────────▼─────────┐
         │  Tofu API   │
         │  (Qwen/DeepSeek/  │
         │   Llama/GLM...)   │
         └───────────────────┘
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

```bash
# 开发模式
git clone https://github.com/daiag540/tofu-translate.git
cd tofu-translate

# 修改代码后重新构建
node scripts/build.js
```

## 📄 许可证

MIT License — 详见 [LICENSE](LICENSE)

## 🔗 相关链接

- [硅基流动平台](https://siliconflow.cn) — 获取 API Key
- [硅基流动 API 文档](https://docs.siliconflow.cn) — API 参考
- [Zotero 插件开发文档](https://www.zotero.org/support/dev/zotero_7_for_developers)
- [Zotero 中文社区](https://zotero-chinese.com)
