# Chrome Web Store 上架资料清单

## 1. 开发者账号
- 访问 https://chrome.google.com/webstore/devconsole
- 使用 Google 账号登录
- 支付一次性 $5 注册费

## 2. 扩展基本信息

| 字段 | 内容 |
|------|------|
| **名称** | Ladybug - Test Assistant（七星瓢虫） |
| **版本** | 1.0.0 |
| **简短描述**（≤132字符） | Record web actions and auto-generate Python test scripts with AI assistant |
| **分类** | Developer Tools |
| **语言** | 支持英文、中文 |

## 3. 详细描述（Detailed Description）

```
🐞 Ladybug is a powerful Chrome extension for test automation developers.

Core Features:
• Record & Replay — Click "Start Recording" and perform actions on any webpage. Ladybug captures every click, input, and navigation automatically.
• Script Generation — One-click generate production-ready Python test scripts using Playwright + pytest framework.
• AI Test Assistant — Built-in LLM chat powered by your own API key (OpenAI, Claude, DeepSeek, etc.) to analyze pages, generate test cases, and provide optimization suggestions.
• Login Profiles — Save frequently-used login flows and attach them to any test case for automatic execution.
• JSON Export — Export recorded steps as structured JSON for CI/CD integration.
• Local-First — All data stays in your browser. No external servers, no data leaks.

Perfect for:
- QA engineers building automated regression suites
- Developers writing end-to-end tests
- Teams adopting Playwright for browser automation

Supported Framework: Playwright (Python)
Supported Models: OpenAI GPT-4o, Claude, DeepSeek, Zhipu GLM, Moonshot Kimi, and any OpenAI-compatible API.

Privacy: All recordings and configurations are stored locally in your browser. AI API calls are made directly from your browser to the endpoint you configure.
```

## 4. 隐私政策 URL

```
https://coffeeteaone.github.io/test-assistant-extension/privacy.html
```

> ⚠️ **重要**：需要先启用 GitHub Pages 才能访问此 URL。步骤见下方「部署隐私政策」。

## 5. 权限说明（Chrome Web Store 审核用）

| 权限 | 用途 |
|------|------|
| `storage` | 本地保存录制用例、AI 配置、登录配置档案 |
| `sidePanel` | 在浏览器右侧提供操作面板 |
| `activeTab` | 在当前标签页注入录制和回放脚本 |
| `scripting` | 执行页面元素的高亮、点击、输入等操作 |
| `downloads` | 将录制的 JSON 步骤文件导出到本地磁盘 |
| `<all_urls>` | 支持在任意网页上进行录制和回放操作 |

## 6. 截图（Screenshots）

已生成 5 张 1280×800 截图：

| 文件名 | 内容 |
|--------|------|
| `screenshot-1-recording.png` | 录制界面 + 实时步骤 |
| `screenshot-2-cases.png` | 用例列表 + 步骤详情 |
| `screenshot-3-ai.png` | AI 对话面板 + 快捷按钮 |
| `screenshot-4-script.png` | 生成的 Python 脚本 |
| `screenshot-5-settings.png` | 设置页面 + 登录配置档案 |

## 7. 宣传图（Promotional Images）

| 类型 | 尺寸 | 文件名 |
|------|------|--------|
| 小宣传图 | 440×280 | `promo-small-440x280.png` |

> 大宣传图（1400×560）可选，不上传不影响审核。

## 8. 图标（Icons）

| 尺寸 | 文件 |
|------|------|
| 16×16 | `public/icons/icon16.png` |
| 48×48 | `public/icons/icon48.png` |
| 128×128 | `public/icons/icon128.png` |

## 9. 部署隐私政策（GitHub Pages）

1. 推送 `privacy.html` 到仓库（已完成 ✅）
2. 打开仓库 GitHub 页面 → Settings → Pages
3. Source 选择 "Deploy from a branch"
4. Branch 选择 `master` / `main`，文件夹选择 `/ (root)`
5. 等待 1-2 分钟，访问 `https://coffeeteaone.github.io/test-assistant-extension/privacy.html` 确认可访问

## 10. 打包上传

```bash
npm run build
cd dist
zip -r ../ladybug-v1.0.0.zip .
```

然后在 Chrome Web Store Developer Dashboard：
1. 点击「新建项目」→ 上传 `.zip` 包
2. 填写商店信息（名称、描述、分类、隐私政策 URL）
3. 上传截图和宣传图
4. 提交审核

审核通常需要 1-3 个工作日。
