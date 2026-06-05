/**
 * 录制的测试步骤
 */
export interface TestStep {
  /** 步骤唯一标识符 */
  id: string
  /** 操作类型 */
  action: 'click' | 'input' | 'select' | 'navigate' | 'wait'
  /** 目标元素信息 */
  target: {
    /** CSS 选择器 */
    selector: string
    /** XPath 备用选择器 */
    xpath?: string
    /** ARIA 标签 */
    aria?: string
    /** 元素文本内容 */
    text?: string
  }
  /** 输入值（仅用于 input 操作） */
  value?: string
  /** 操作时间戳 */
  timestamp: number
  /** 当前页面 URL */
  url: string
}

/**
 * 步骤执行结果
 */
export interface StepExecutionResult {
  stepIndex: number
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  executedAt?: number
}

/**
 * 录制会话
 */
export interface RecordingSession {
  /** 会话唯一标识符 */
  id: string
  /** 会话名称 */
  name: string
  /** 创建时间戳 */
  createdAt: number
  /** 更新时间戳 */
  updatedAt: number
  /** 录制的测试步骤列表 */
  steps: TestStep[]
  /** 生成的脚本代码（可选） */
  generatedScript?: ScriptCode
  /** 最近一次执行结果（可选） */
  lastExecution?: {
    executedAt: number
    successCount: number
    errorCount: number
    stepResults: StepExecutionResult[]
  }
}

/**
 * 生成的脚本代码
 */
export interface ScriptCode {
  /** 脚本语言 */
  language: 'python'
  /** 测试框架 */
  framework: 'playwright' | 'selenium'
  /** 运行模式 */
  mode: 'gui' | 'headless'
  /** 生成的代码内容 */
  code: string
  /** 生成时间戳 */
  generatedAt: number
}

/**
 * 导出配置
 */
export interface ExportConfig {
  /** 导出时自动覆盖同名文件 */
  autoOverwrite: boolean
}

/**
 * 登录配置档案（从录制步骤保存而来）
 */
export interface LoginProfile {
  /** 档案唯一标识 */
  id: string
  /** 档案名称（如"管理系统登录"） */
  name: string
  /** 录制的登录步骤 */
  steps: TestStep[]
  /** 创建时间 */
  createdAt: number
  /** 来源用例ID（方便在用例列表中标识） */
  sourceRecordingId?: string
}

/**
 * AI 配置
 */
export interface AIConfig {
  /** AI 服务提供商 */
  provider: 'openai' | 'claude' | 'deepseek' | 'zhipu' | 'kimi' | 'codex' | 'custom'
  /** API 密钥 */
  apiKey: string
  /** 自定义 API 基础 URL（可选） */
  baseURL?: string
  /** 模型名称 */
  model: string
}

/**
 * AI 对话消息
 */
export interface AIMessage {
  /** 消息唯一标识符 */
  id: string
  /** 消息角色 */
  role: 'user' | 'assistant' | 'system' | 'tool'
  /** 消息内容 */
  content: string
  /** 消息时间戳 */
  timestamp: number
  /** 工具调用（仅 assistant） */
  tool_calls?: ToolCall[]
  /** 工具调用ID（仅 tool 角色） */
  tool_call_id?: string
  /** 工具名称（仅 tool 角色，用于UI展示） */
  tool_name?: string
}

/**
 * 工具定义（Function Calling Schema）
 */
export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required?: string[]
    }
  }
}

/**
 * AI 返回的工具调用请求
 */
export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/**
 * 工具执行结果
 */
export interface ToolResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * 页面上下文（用于 AI 分析）
 */
export interface PageContext {
  /** 页面 URL */
  url: string
  /** 页面标题 */
  title: string
  /** 页面元素统计 */
  elements: {
    /** 表单数量 */
    forms: number
    /** 输入框数量 */
    inputs: number
    /** 按钮数量 */
    buttons: number
    /** 链接数量 */
    links: number
  }
  /** 页面关键交互元素列表 */
  interactiveElements?: {
    tag: string
    text: string
    selector: string
    xpath: string
    type?: string
    placeholder?: string
    ariaLabel?: string
  }[]
  /** 表单详情 */
  formsDetail?: {
    action?: string
    method?: string
    inputs: { name?: string; type?: string; placeholder?: string; selector: string }[]
  }[]
}
