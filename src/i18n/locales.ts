export type Lang = 'zh' | 'en'

export interface LocaleMessages {
  // App Header
  appName: string
  appSubtitle: string

  // Tabs
  tabCases: string
  tabAI: string
  tabSettings: string

  // TestCaseList - Recording
  startRecording: string
  stopRecording: string
  clearSteps: string
  recording: string
  stepsRecorded: string
  lastRecording: string
  csErrorTitle: string
  csErrorMsg: string
  refreshPage: string
  liveStepAction: string
  liveStepValue: string

  // TestCaseList - List
  testCases: string
  refresh: string
  searchPlaceholder: string
  allUrls: string
  playwright: string
  selenium: string
  noCases: string
  noCasesHint: string
  noMatch: string
  noMatchHint: string
  generateScript: string
  generating: string
  exportJSON: string
  execute: string
  executing: string
  view: string
  expandDetails: string
  collapseDetails: string
  deleteCase: string
  saveAsLoginProfile: string
  loginProfileBound: string
  selectLoginProfile: string

  // TestCaseList - Step editing
  name: string
  selector: string
  xpath: string
  value: string
  text: string
  ariaLabel: string
  url: string
  empty: string

  // TestCaseList - Alerts & Status
  csErrorMsgTab: string
  csErrorMsgRefresh: string
  saveLoginPrompt: string
  loginSaved: string
  saveLoginFailed: string
  generateScriptFailed: string
  exportSuccessBoth: string
  exportSuccessOne: string
  exportFailed: string
  switchToTargetTab: string
  cannotInjectRetry: string
  executionFailedShort: string
  pageRefreshed: string
  actionClick: string
  actionInput: string
  actionSelect: string
  actionNavigate: string
  actionWait: string
  execSummary: string
  execAllSuccess: string
  saveAsLoginTitle: string
  deleteCaseTitle: string
  stepsCount: string
  noLogin: string
  loginPrefix: string
  running: string
  stop: string
  deleteStepTitle: string
  pageLabel: string
  errorLabel: string

  // Settings
  settingsTitle: string
  exportConfig: string
  autoOverwrite: string
  localExportDir: string
  localExportDirSelected: string
  removeDir: string
  selectLocalDir: string
  localExportHint: string
  aiConfig: string
  provider: string
  baseUrl: string
  apiKey: string
  model: string
  loginProfiles: string
  loginProfilesHint: string
  loginConfig: string
  executeProfile: string
  deleteProfile: string
  save: string
  saved: string
  baseUrlOptional: string
  saving: string
  savedShort: string
  configTip: string
  configTip1: string
  configTip2: string
  loginProfilesCount: string
  noLoginProfiles: string
  noLoginProfilesHint: string
  loginConfigLabel: string
  executingShort: string
  deleteTitle: string
  stepsLabel: string
  collapseSteps: string
  expandSteps: string

  // Settings - providers
  openai: string
  claude: string
  deepseek: string
  zhipu: string
  kimi: string
  codex: string
  custom: string

  // AI Chat
  llmMode: string
  agentMode: string
  newSession: string
  createSession: string
  thinking: string
  toolCall: string
  send: string
  sendHint: string
  noConfig: string
  noConfigHint: string

  // AI Quick Actions
  quickAnalyze: string
  quickTestcases: string
  quickOptimize: string
  quickAnalyzePrompt: string
  quickTestcasesPrompt: string
  quickOptimizePrompt: string

  // AI Welcome
  llmWelcomeTitle: string
  llmWelcomeSubtitle: string
  agentWelcomeTitle: string
  agentWelcomeSubtitle: string
  welcomeExample1: string
  welcomeExample2: string
  welcomeExample3: string
  welcomeExample4: string

  // AI System Prompts
  llmSystemPrompt: string
  agentSystemPrompt: string

  // AI Tool names (UI display)
  toolNameGetPageInfo: string
  toolNameClick: string
  toolNameInput: string
  toolNameNavigate: string
  toolNameStartRecording: string
  toolNameStopRecording: string
  toolNameGetRecordings: string
  toolNameExecuteRecording: string
  toolNameGenerateScript: string
  toolNameExportJson: string
  toolNameHighlight: string

  // AI Status / Errors
  noActiveTab: string
  cannotInjectScript: string
  recordingNotFound: string
  noSteps: string
  cannotGetTab: string
  executionFailed: string
  stepFailed: string
  missingRecordingId: string
  missingUrlParam: string
  unknownTool: string
  baseUrlNotConfigured: string
  apiEmptyResponse: string
  noContent: string
  toolLimitReached: string
  cancelled: string
  toolCallFailed: string
  llmChatLabel: string
  agentChatLabel: string
  switchSession: string
  newSessionFallback: string
  createNewSession: string
  historySessions: string
  newSessionBtn: string
  messagesCount: string
  deleteSession: string
  noHistorySessions: string
  toolResultPrefix: string
  callingTool: string
  clearBtn: string
  noConfigAlert: string

  // Export CSV
  exportCSV: string
  exportCSVTitle: string

  // Script Viewer
  scriptTitle: string
  headlessMode: string
  guiMode: string
  copy: string
  download: string
  close: string

  // pytest
  stepExecutorCannotResolve: string
  triedStrategies: string
  navigateLabel: string
  unsupportedAction: string
  testRecordingExec: string
  stepCountLabel: string
  testCaseComplete: string
}

const zh: LocaleMessages = {
  appName: '七星瓢虫',
  appSubtitle: '测试智能助手V1.0版本',
  tabCases: '用例',
  tabAI: 'AI',
  tabSettings: '设置',

  startRecording: '开始录制',
  stopRecording: '停止录制',
  clearSteps: '清空',
  recording: '录制中...',
  stepsRecorded: '已记录 {n} 个步骤',
  lastRecording: '最后录制:',
  csErrorTitle: '当前页面的录制脚本未加载，请刷新页面后重试',
  csErrorMsg: '无法获取当前标签页',
  refreshPage: '刷新当前页面',
  liveStepAction: '#{i}',
  liveStepValue: '值:',

  testCases: '测试用例',
  refresh: '刷新',
  searchPlaceholder: '搜索用例名称...',
  allUrls: '全部页面 URL',
  playwright: 'Playwright',
  selenium: 'Selenium',
  noCases: '暂无录制用例',
  noCasesHint: '点击上方"开始录制"在页面上操作',
  noMatch: '没有匹配的用例',
  noMatchHint: '请调整搜索条件',
  generateScript: '生成脚本',
  generating: '生成中...',
  exportJSON: 'JSON自动化配置下载',
  execute: '执行',
  executing: '执行中',
  view: '查看',
  expandDetails: '展开步骤详情',
  collapseDetails: '收起详情',
  deleteCase: '删除',
  saveAsLoginProfile: '保存为登录配置',
  loginProfileBound: '已绑定登录配置',
  selectLoginProfile: '选择登录配置',

  name: '名称',
  selector: '选择器',
  xpath: 'XPath',
  value: '值',
  text: '文本',
  ariaLabel: 'ARIA',
  url: 'URL',
  empty: '(空)',

  csErrorMsgTab: '无法获取当前标签页',
  csErrorMsgRefresh: '当前页面的录制脚本未加载，请刷新页面后重试',
  saveLoginPrompt: '请为登录配置命名（如：管理系统登录）',
  loginSaved: '登录配置 "{name}" 已保存',
  saveLoginFailed: '保存登录配置失败',
  generateScriptFailed: '生成脚本失败',
  exportSuccessBoth: '✅ JSON 已导出到两处:\n  ① 浏览器下载目录: {filename}\n  ② 本地目录: {filename}',
  exportSuccessOne: '✅ JSON 已导出: {filename}\n\n请确认 Chrome 下载目录已设为 pytest_automation 工程根目录，或在设置中配置本地导出目录。',
  exportFailed: '导出 JSON 失败',
  switchToTargetTab: '请先切换到目标页面标签',
  cannotInjectRetry: '无法注入页面脚本，请刷新页面后重试',
  executionFailedShort: '执行失败',
  pageRefreshed: '页面已刷新或跳转，脚本断开',
  actionClick: '点击',
  actionInput: '输入',
  actionSelect: '选择',
  actionNavigate: '跳转',
  actionWait: '等待',
  execSummary: '{total}步: {successCount}成功, {errorCount}失败',
  execAllSuccess: '{total}步全部成功',
  saveAsLoginTitle: '保存为登录配置',
  deleteCaseTitle: '删除用例',
  stepsCount: '个步骤',
  noLogin: '不附带登录',
  loginPrefix: '登录:',
  running: '正在执行...',
  stop: '停止',
  deleteStepTitle: '删除步骤',
  pageLabel: '页面',
  errorLabel: '错误:',

  settingsTitle: '设置',
  exportConfig: '导出配置',
  autoOverwrite: '导出时自动覆盖同名文件',
  localExportDir: '本地导出目录（可选）',
  localExportDirSelected: '已选择',
  removeDir: '移除',
  selectLocalDir: '选择本地导出目录',
  localExportHint: '选择后，导出 JSON 时将同时保存到该本地目录和浏览器下载目录。',
  aiConfig: 'AI 配置',
  provider: '提供商',
  baseUrl: 'Base URL',
  apiKey: 'API Key',
  model: '模型',
  loginProfiles: '登录配置档案',
  loginProfilesHint: '在"用例"标签页点击用例右侧的图标即可保存为登录配置。保存后该用例会移至此区域管理。',
  loginConfig: '登录配置',
  executeProfile: '执行',
  deleteProfile: '删除',
  save: '保存配置',
  saved: '已保存',
  baseUrlOptional: 'Base URL（可选）',
  saving: '保存中...',
  savedShort: '✓ 已保存',
  configTip: '配置提示',
  configTip1: '选择上方提供商会自动填充 Base URL 和默认模型，你仍可手动修改。',
  configTip2: '所有提供商均使用 OpenAI 兼容格式（/chat/completions）。',
  loginProfilesCount: '登录配置档案 ({n})',
  noLoginProfiles: '暂无登录配置',
  noLoginProfilesHint: '在"用例"标签页录制登录流程后点击保存',
  loginConfigLabel: '登录配置',
  executingShort: '▶ 执行中...',
  deleteTitle: '删除',
  stepsLabel: '个步骤',
  collapseSteps: '▲ 收起步骤',
  expandSteps: '▼ 展开步骤',

  openai: 'OpenAI (GPT-4o)',
  claude: 'Anthropic (Claude)',
  deepseek: 'DeepSeek',
  zhipu: '智谱 AI (GLM)',
  kimi: 'Kimi (Moonshot)',
  codex: 'OpenAI Codex',
  custom: '自定义 (OpenAI Compatible)',

  llmMode: 'LLM 对话',
  agentMode: 'Agent 对话',
  newSession: '新会话',
  createSession: '创建新会话',
  thinking: '思考中...',
  toolCall: '正在调用工具',
  send: '发送',
  sendHint: '输入问题...',
  noConfig: '未配置 AI',
  noConfigHint: '请先设置 AI 提供商和 API Key',

  quickAnalyze: '分析当前页面功能',
  quickTestcases: '生成功能测试用例',
  quickOptimize: '产品优化建议',
  quickAnalyzePrompt: '请分析当前页面的功能模块，列出每个模块的核心功能、可测试点和风险点。输出结构化的分析结果。',
  quickTestcasesPrompt: '请基于当前页面信息，设计一套完整的功能测试用例。包含正向场景、反向场景、边界条件。请以表格形式输出，每行包含：用例编号、模块、标题、前置条件、测试步骤、预期结果、优先级（P0/P1/P2）。',
  quickOptimizePrompt: '请从以下角度分析当前页面，提出具体的产品优化建议：\n1. 交互体验（操作流程是否顺畅、是否有歧义）\n2. 文案与提示（是否有误导、是否完整）\n3. 可访问性（表单验证、错误提示、加载状态）\n4. 测试可测性（元素定位是否稳定、是否有唯一标识）\n请输出结构化的优化建议，每条建议包含：问题描述、影响、具体改进方案。',

  llmWelcomeTitle: 'LLM 测试顾问',
  llmWelcomeSubtitle: '纯对话模式，解答测试技术问题',
  agentWelcomeTitle: 'Agent 测试助手',
  agentWelcomeSubtitle: '我可以调用工具直接操作页面、执行录制',
  welcomeExample1: '"pytest 怎么参数化测试用例？"',
  welcomeExample2: '"Playwright 和 Selenium 有什么区别？"',
  welcomeExample3: '"帮我 review 这段测试代码"',
  welcomeExample4: '"设计一个登录功能的测试用例"',

  llmSystemPrompt: `你是一位资深的软件测试工程师和技术顾问。你的职责是：
1. 解答软件测试、自动化测试、pytest、Playwright、Selenium 等相关技术问题
2. 分析当前页面功能，识别测试点和风险，输出结构化的功能分析
3. 基于页面信息设计完整的功能测试用例（含正向/反向/边界场景）
4. 从产品体验角度提出优化建议（交互、文案、性能、可访问性等）
5. review 测试代码，指出问题和改进点
6. 讲解测试框架的使用方法和最佳实践

请用中文回答。代码块使用 Python 语法高亮。`,

  agentSystemPrompt: `你是一位专业的软件测试工程师和 Chrome 扩展 AI Agent。你具备以下能力：
1. 分析当前网页结构，识别测试点和风险
2. 直接操作页面元素（点击、输入文本、导航），无需录制即可实时执行
3. 录制用户操作并生成自动化测试脚本
4. 直接执行已录制的测试用例
5. 高亮页面元素辅助定位问题
6. 与用户进行多轮自然语言对话，解答测试相关问题

【什么时候调用工具】只有在用户明确要求"操作页面"、"点击"、"输入"、"搜索"、"执行"、"导航"、"高亮"、"录制"、"生成脚本"、"导出"时，才调用工具。
【什么时候不调用工具】以下情况直接用语言回复，禁止调用任何工具：
- 用户提问、质疑、询问原因（如"为什么"、"怎么回事"、"你怎么做到的"）
- 用户闲聊、打招呼、表达情绪
- 用户要求解释、分析、建议
- 用户说"不用了"、"停"、"先别操作"

请用中文回答。代码块使用 Python 语法高亮。`,

  toolNameGetPageInfo: '获取页面信息',
  toolNameClick: '点击元素',
  toolNameInput: '输入文本',
  toolNameNavigate: '页面导航',
  toolNameStartRecording: '开始录制',
  toolNameStopRecording: '停止录制',
  toolNameGetRecordings: '获取用例列表',
  toolNameExecuteRecording: '执行录制用例',
  toolNameGenerateScript: '生成测试脚本',
  toolNameExportJson: '导出JSON配置',
  toolNameHighlight: '高亮页面元素',

  noActiveTab: '无活动标签页',
  cannotInjectScript: '无法注入页面脚本',
  recordingNotFound: '未找到录制用例',
  noSteps: '该用例没有步骤',
  cannotGetTab: '无法获取当前标签页',
  executionFailed: '执行失败',
  stepFailed: '步骤{i}: {error}',
  missingRecordingId: '缺少 recording_id 参数',
  missingUrlParam: '缺少 url 参数',
  unknownTool: '未知工具: {name}',
  baseUrlNotConfigured: 'Base URL 未配置，请先在设置中选择提供商或手动填写 Base URL',
  apiEmptyResponse: 'API 返回空消息',
  noContent: '（无返回内容）',
  toolLimitReached: '⚠️ 单次回复中工具调用轮数已达上限（50轮）。你可以继续发送新消息，我会基于当前状态继续操作。',
  cancelled: '[已取消]',
  toolCallFailed: '❌ 调用失败: {error}',
  llmChatLabel: '💬 LLM 对话',
  agentChatLabel: '🛠 Agent 对话',
  switchSession: '切换会话',
  newSessionFallback: '新会话',
  createNewSession: '新建会话',
  historySessions: '历史会话 ({n})',
  newSessionBtn: '＋ 新建',
  messagesCount: '{n}条 ·',
  deleteSession: '删除',
  noHistorySessions: '暂无历史会话',
  toolResultPrefix: '工具:',
  callingTool: '正在调用工具:',
  clearBtn: '清空',
  noConfigAlert: '⚠️ 尚未配置 AI API Key。\n\n请前往 **设置** → **AI 配置** 中填写你的 API Key（支持 DeepSeek、OpenAI、Claude 或任何兼容 OpenAI 格式的服务）。\n\n如果没有 API Key，可以前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 免费获取。',

  exportCSV: '可导出 Excel',
  exportCSVTitle: '导出表格为 CSV',

  scriptTitle: '脚本',
  headlessMode: '无头模式',
  guiMode: 'GUI 模式',
  copy: '📋 复制',
  download: '⬇ 下载',
  close: '关闭',

  stepExecutorCannotResolve: '无法解析元素定位器: selector={selector}, xpath={xpath}, text={text}. 尝试过的策略: {errors}',
  triedStrategies: '尝试过的策略',
  navigateLabel: '导航',
  unsupportedAction: '不支持的操作类型: {action}',
  testRecordingExec: '>> 执行录制用例: {name}',
  stepCountLabel: '步骤数: {n}',
  testCaseComplete: '[OK] 用例执行完成: {name}',
}

const en: LocaleMessages = {
  appName: 'Ladybug',
  appSubtitle: 'Test Assistant V1.0',
  tabCases: 'Cases',
  tabAI: 'AI',
  tabSettings: 'Settings',

  startRecording: 'Start Recording',
  stopRecording: 'Stop Recording',
  clearSteps: 'Clear',
  recording: 'Recording...',
  stepsRecorded: '{n} step(s) recorded',
  lastRecording: 'Last recording:',
  csErrorTitle: 'Content script not loaded. Please refresh the page.',
  csErrorMsg: 'Unable to get current tab',
  refreshPage: 'Refresh Page',
  liveStepAction: '#{i}',
  liveStepValue: 'Value:',

  testCases: 'Test Cases',
  refresh: 'Refresh',
  searchPlaceholder: 'Search case name...',
  allUrls: 'All Page URLs',
  playwright: 'Playwright',
  selenium: 'Selenium',
  noCases: 'No recordings yet',
  noCasesHint: 'Click "Start Recording" above to capture actions',
  noMatch: 'No matching cases',
  noMatchHint: 'Please adjust your search criteria',
  generateScript: 'Generate Script',
  generating: 'Generating...',
  exportJSON: 'Export JSON',
  execute: 'Run',
  executing: 'Running',
  view: 'View',
  expandDetails: 'Expand Details',
  collapseDetails: 'Collapse Details',
  deleteCase: 'Delete',
  saveAsLoginProfile: 'Save as Login Profile',
  loginProfileBound: 'Login profile bound',
  selectLoginProfile: 'Select login profile',

  name: 'Name',
  selector: 'Selector',
  xpath: 'XPath',
  value: 'Value',
  text: 'Text',
  ariaLabel: 'ARIA',
  url: 'URL',
  empty: '(empty)',

  csErrorMsgTab: 'Unable to get current tab',
  csErrorMsgRefresh: 'Content script not loaded. Please refresh the page.',
  saveLoginPrompt: 'Please name this login profile (e.g. Admin Login)',
  loginSaved: 'Login profile "{name}" saved',
  saveLoginFailed: 'Failed to save login profile',
  generateScriptFailed: 'Failed to generate script',
  exportSuccessBoth: '✅ JSON exported to both locations:\n  ① Browser downloads: {filename}\n  ② Local directory: {filename}',
  exportSuccessOne: '✅ JSON exported: {filename}\n\nPlease set Chrome download directory to pytest_automation project root, or configure a local export directory in Settings.',
  exportFailed: 'Export JSON failed',
  switchToTargetTab: 'Please switch to the target page tab first',
  cannotInjectRetry: 'Unable to inject content script, please refresh the page',
  executionFailedShort: 'Execution failed',
  pageRefreshed: 'Page refreshed or navigated, script disconnected',
  actionClick: 'Click',
  actionInput: 'Input',
  actionSelect: 'Select',
  actionNavigate: 'Navigate',
  actionWait: 'Wait',
  execSummary: '{total} steps: {successCount} success, {errorCount} failed',
  execAllSuccess: 'All {total} steps passed',
  saveAsLoginTitle: 'Save as Login Profile',
  deleteCaseTitle: 'Delete Case',
  stepsCount: ' step(s)',
  noLogin: 'No login',
  loginPrefix: 'Login:',
  running: 'Running...',
  stop: 'Stop',
  deleteStepTitle: 'Delete Step',
  pageLabel: 'Page',
  errorLabel: 'Error:',

  settingsTitle: 'Settings',
  exportConfig: 'Export Config',
  autoOverwrite: 'Auto-overwrite files with the same name',
  localExportDir: 'Local Export Directory (Optional)',
  localExportDirSelected: 'Selected',
  removeDir: 'Remove',
  selectLocalDir: 'Select Local Export Directory',
  localExportHint: 'When selected, exported JSON will be saved to both the local directory and browser downloads.',
  aiConfig: 'AI Config',
  provider: 'Provider',
  baseUrl: 'Base URL',
  apiKey: 'API Key',
  model: 'Model',
  loginProfiles: 'Login Profiles',
  loginProfilesHint: 'In the "Cases" tab, click the icon next to a case to save it as a login profile. Saved cases will be moved here for management.',
  loginConfig: 'Login Config',
  executeProfile: 'Run',
  deleteProfile: 'Delete',
  save: 'Save Config',
  saved: 'Saved',
  baseUrlOptional: 'Base URL (Optional)',
  saving: 'Saving...',
  savedShort: '✓ Saved',
  configTip: 'Config Tip',
  configTip1: 'Selecting a provider above will auto-fill Base URL and default model, but you can still modify them manually.',
  configTip2: 'All providers use OpenAI-compatible format (/chat/completions).',
  loginProfilesCount: 'Login Profiles ({n})',
  noLoginProfiles: 'No login profiles yet',
  noLoginProfilesHint: 'Record a login flow in the "Cases" tab and save it',
  loginConfigLabel: 'Login Config',
  executingShort: '▶ Running...',
  deleteTitle: 'Delete',
  stepsLabel: ' step(s)',
  collapseSteps: '▲ Collapse Steps',
  expandSteps: '▼ Expand Steps',

  openai: 'OpenAI (GPT-4o)',
  claude: 'Anthropic (Claude)',
  deepseek: 'DeepSeek',
  zhipu: 'Zhipu AI (GLM)',
  kimi: 'Kimi (Moonshot)',
  codex: 'OpenAI Codex',
  custom: 'Custom (OpenAI Compatible)',

  llmMode: 'LLM Chat',
  agentMode: 'Agent Chat',
  newSession: 'New Session',
  createSession: 'Create Session',
  thinking: 'Thinking...',
  toolCall: 'Calling tool',
  send: 'Send',
  sendHint: 'Enter your question...',
  noConfig: 'AI not configured',
  noConfigHint: 'Please set AI provider and API Key first',

  quickAnalyze: 'Analyze Page Features',
  quickTestcases: 'Generate Test Cases',
  quickOptimize: 'Product Optimization Suggestions',
  quickAnalyzePrompt: 'Please analyze the functional modules of the current page, list the core features, test points, and risks for each module. Output a structured analysis.',
  quickTestcasesPrompt: 'Please design a complete set of functional test cases based on the current page information. Include positive scenarios, negative scenarios, and boundary conditions. Please output in table format, each row containing: case ID, module, title, preconditions, test steps, expected results, priority (P0/P1/P2).',
  quickOptimizePrompt: 'Please analyze the current page from the following angles and provide specific product optimization suggestions:\n1. Interaction experience (is the operation flow smooth, is there any ambiguity)\n2. Copywriting and prompts (is there any misleading, is it complete)\n3. Accessibility (form validation, error prompts, loading states)\n4. Testability (is element positioning stable, is there a unique identifier)\nPlease output structured optimization suggestions, each containing: problem description, impact, and specific improvement plan.',

  llmWelcomeTitle: 'LLM Test Advisor',
  llmWelcomeSubtitle: 'Chat mode for test-related questions',
  agentWelcomeTitle: 'Agent Test Assistant',
  agentWelcomeSubtitle: 'I can operate the page and execute recordings via tools',
  welcomeExample1: '"How to parameterize test cases in pytest?"',
  welcomeExample2: '"What is the difference between Playwright and Selenium?"',
  welcomeExample3: '"Review this test code for me"',
  welcomeExample4: '"Design test cases for a login feature"',

  llmSystemPrompt: `You are a senior software testing engineer and technical consultant. Your responsibilities:
1. Answer questions about software testing, automation testing, pytest, Playwright, Selenium, etc.
2. Analyze current page features, identify test points and risks, output structured analysis
3. Design complete functional test cases based on page info (positive/negative/boundary scenarios)
4. Provide product optimization suggestions from UX, copywriting, performance, and accessibility perspectives
5. Review test code and point out issues and improvements
6. Explain testing framework usage and best practices

Please answer in English. Use Python syntax highlighting for code blocks.`,

  agentSystemPrompt: `You are a professional software testing engineer and Chrome extension AI Agent. Your capabilities:
1. Analyze current webpage structure and identify test points and risks
2. Directly operate page elements (click, input text, navigate) without recording
3. Record user actions and generate automated test scripts
4. Directly execute saved test cases
5. Highlight page elements to assist with locating issues
6. Engage in multi-turn natural language conversations about testing

【When to call tools】Only call tools when the user explicitly requests to "operate page", "click", "input", "search", "execute", "navigate", "highlight", "record", "generate script", or "export".
【When NOT to call tools】Reply directly without calling any tools in these cases:
- User asks questions, expresses doubts, or asks for reasons (e.g. "why", "how", "what happened")
- User chats, greets, or expresses emotions
- User asks for explanations, analysis, or suggestions
- User says "no", "stop", "don't do that"

Please answer in English.`,

  toolNameGetPageInfo: 'Get Page Info',
  toolNameClick: 'Click Element',
  toolNameInput: 'Input Text',
  toolNameNavigate: 'Navigate',
  toolNameStartRecording: 'Start Recording',
  toolNameStopRecording: 'Stop Recording',
  toolNameGetRecordings: 'Get Recordings',
  toolNameExecuteRecording: 'Execute Recording',
  toolNameGenerateScript: 'Generate Script',
  toolNameExportJson: 'Export JSON',
  toolNameHighlight: 'Highlight Element',

  noActiveTab: 'No active tab',
  cannotInjectScript: 'Unable to inject content script',
  recordingNotFound: 'Recording not found',
  noSteps: 'This recording has no steps',
  cannotGetTab: 'Unable to get current tab',
  executionFailed: 'Execution failed',
  stepFailed: 'Step {i}: {error}',
  missingRecordingId: 'Missing recording_id parameter',
  missingUrlParam: 'Missing url parameter',
  unknownTool: 'Unknown tool: {name}',
  baseUrlNotConfigured: 'Base URL not configured. Please select a provider or manually fill in Base URL in Settings.',
  apiEmptyResponse: 'API returned empty message',
  noContent: '(No content)',
  toolLimitReached: '⚠️ Tool call rounds reached the limit (50). You can send a new message and I will continue based on current state.',
  cancelled: '[Cancelled]',
  toolCallFailed: '❌ Call failed: {error}',
  llmChatLabel: '💬 LLM Chat',
  agentChatLabel: '🛠 Agent Chat',
  switchSession: 'Switch Session',
  newSessionFallback: 'New Session',
  createNewSession: 'Create New Session',
  historySessions: 'History Sessions ({n})',
  newSessionBtn: '＋ New',
  messagesCount: '{n} msg ·',
  deleteSession: 'Delete',
  noHistorySessions: 'No history sessions',
  toolResultPrefix: 'Tool:',
  callingTool: 'Calling tool:',
  clearBtn: 'Clear',
  noConfigAlert: '⚠️ AI API Key not configured yet.\n\nPlease go to **Settings** → **AI Config** to fill in your API Key (supports DeepSeek, OpenAI, Claude, or any OpenAI-compatible service).\n\nIf you do not have an API Key, you can get one for free at [DeepSeek Platform](https://platform.deepseek.com/).',

  exportCSV: 'Export to Excel',
  exportCSVTitle: 'Export table as CSV',

  scriptTitle: 'Script',
  headlessMode: 'Headless',
  guiMode: 'GUI Mode',
  copy: '📋 Copy',
  download: '⬇ Download',
  close: 'Close',

  stepExecutorCannotResolve: 'Cannot resolve element locator: selector={selector}, xpath={xpath}, text={text}. Tried strategies: {errors}',
  triedStrategies: 'Tried strategies',
  navigateLabel: 'Navigate',
  unsupportedAction: 'Unsupported action type: {action}',
  testRecordingExec: '>> Execute recording: {name}',
  stepCountLabel: 'Steps: {n}',
  testCaseComplete: '[OK] Test case completed: {name}',
}

export const locales: Record<Lang, LocaleMessages> = { zh, en }

export function getBrowserLang(): Lang {
  const lang = navigator.language.toLowerCase()
  return lang.startsWith('zh') ? 'zh' : 'en'
}
