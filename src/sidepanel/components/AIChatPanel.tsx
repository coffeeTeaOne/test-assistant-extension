import { useState, useRef, useEffect, useCallback } from 'react'
import { AIMessage, AIConfig, ToolDefinition, ToolCall, ToolResult, TestStep } from '../../shared/types'
import { ChatSession, getChatSessions, saveChatSession, deleteChatSession, getActiveSessionId, setActiveSessionId as saveActiveSessionId, generateSessionTitle } from '../../storage/chat'
import { useI18n } from '../../i18n/I18nContext'

// ═══════════════════════════════════════════════════════════════
//  工具定义（Function Calling Schema）
// ═══════════════════════════════════════════════════════════════

const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_page_info',
      description: '获取当前活动标签页的页面信息，包括URL、标题、元素统计、可交互元素列表和表单详情。用于分析页面结构、识别测试点。',
      parameters: {
        type: 'object',
        properties: {
          maxElements: {
            type: 'number',
            description: '最多返回多少个交互元素（默认30，最大50）'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'start_recording',
      description: '开始录制当前页面的用户操作。录制会自动捕获点击、输入、选择等交互步骤。',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'stop_recording',
      description: '停止当前录制，保存录制的测试步骤。',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_recordings',
      description: '获取所有已保存的录制用例列表，包含名称、步骤数、创建时间等信息。',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_recording',
      description: '执行指定的录制用例，会在当前标签页自动重放所有步骤。',
      parameters: {
        type: 'object',
        properties: {
          recording_id: { type: 'string', description: '录制用例的ID（优先使用ID）' },
          recording_name: { type: 'string', description: '录制用例的名称（当没有ID时使用名称匹配）' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_script',
      description: '为指定的录制用例生成 Python 自动化测试脚本（Playwright 或 Selenium）。',
      parameters: {
        type: 'object',
        properties: {
          recording_id: { type: 'string', description: '录制用例ID' },
          framework: { type: 'string', enum: ['playwright', 'selenium'], description: '测试框架，默认playwright' }
        },
        required: ['recording_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'export_json',
      description: '将录制用例导出为JSON配置文件，保存到 pytest 自动化测试项目的 testdata/recordings 目录。',
      parameters: {
        type: 'object',
        properties: {
          recording_id: { type: 'string', description: '录制用例ID' }
        },
        required: ['recording_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'highlight_element',
      description: '在当前页面高亮指定元素，帮助用户定位。支持 CSS 选择器和 XPath。',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS 选择器（可选）' },
          xpath: { type: 'string', description: 'XPath（优先使用，更精确）' },
          label: { type: 'string', description: '高亮标签文字（可选）' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'click_element',
      description: '直接在当前页面点击指定元素。无需录制，即时生效。优先使用 XPath 定位，更精确。你可以先 get_page_info 获取元素信息，再使用 xpath 点击。',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS 选择器（可选）' },
          xpath: { type: 'string', description: 'XPath（优先使用，最精确）' },
          text: { type: 'string', description: '元素的文本内容（辅助定位）' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'input_text',
      description: '直接在当前页面的指定输入框中输入文本。无需录制，即时生效。优先使用 XPath 定位输入框。',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS 选择器（可选）' },
          xpath: { type: 'string', description: 'XPath（优先使用）' },
          text: { type: 'string', description: '要输入的文本内容' }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: '导航到指定 URL。',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '目标 URL' }
        },
        required: ['url']
      }
    }
  }
]

// ═══════════════════════════════════════════════════════════════
//  辅助函数
// ═══════════════════════════════════════════════════════════════

async function getAIConfig(): Promise<AIConfig | null> {
  try {
    const response: any = await chrome.runtime.sendMessage({ type: 'GET_AI_CONFIG' })
    if (response.success && response.data) return response.data
  } catch (e) { /* ignore */ }
  return null
}

async function ensureContentScript(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'PING' })
    return true
  } catch {
    // 从 manifest 动态获取 content script 文件（自动适应构建后的 hash 文件名）
    const manifest = chrome.runtime.getManifest()
    const contentScripts = manifest.content_scripts || []
    const files = contentScripts.flatMap((cs: any) => cs.js || [])

    for (const file of files) {
      try {
        await chrome.scripting.executeScript({ target: { tabId }, files: [file] })
        await new Promise(r => setTimeout(r, 1000))
        try {
          await chrome.tabs.sendMessage(tabId, { type: 'PING' })
          return true
        } catch { /* continue */ }
      } catch { /* continue */ }
    }

    // Fallback: 尝试所有 assets 目录下的 .js 文件（应对 loader + chunk 的情况）
    try {
      const fallbackFiles = ['assets/content.js', 'assets/index.js']
      for (const file of fallbackFiles) {
        try {
          await chrome.scripting.executeScript({ target: { tabId }, files: [file] })
          await new Promise(r => setTimeout(r, 1000))
          try {
            await chrome.tabs.sendMessage(tabId, { type: 'PING' })
            return true
          } catch { /* continue */ }
        } catch { /* continue */ }
      }
    } catch { /* ignore */ }

    return false
  }
}

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id || null
}

// ═══════════════════════════════════════════════════════════════
//  工具执行分发
// ═══════════════════════════════════════════════════════════════

async function executeTool(toolCall: ToolCall, t: any): Promise<ToolResult> {
  const { name } = toolCall.function
  let args: any = {}
  try {
    args = JSON.parse(toolCall.function.arguments || '{}')
  } catch { /* use empty */ }

  const tabId = await getActiveTabId()

  try {
    switch (name) {
      case 'get_page_info': {
        if (!tabId) return { success: false, error: t.noActiveTab }
        const injected = await ensureContentScript(tabId)
        if (!injected) return { success: false, error: t.cannotInjectScript }
        const result = await chrome.tabs.sendMessage(tabId, {
          type: 'GET_PAGE_CONTEXT',
          payload: { maxElements: args.maxElements || 30 }
        })
        return { success: result?.success !== false, data: result }
      }

      case 'start_recording': {
        // 1. background 创建 session
        const bgResult: any = await chrome.runtime.sendMessage({ type: 'START_RECORDING' })
        // 2. content script 开始监听 DOM
        if (tabId) {
          const injected = await ensureContentScript(tabId)
          if (injected) {
            await chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING' })
          }
        }
        return { success: true, data: { session: bgResult?.session, recording: true } }
      }

      case 'stop_recording': {
        const bgResult: any = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' })
        if (tabId) {
          try { await chrome.tabs.sendMessage(tabId, { type: 'STOP_RECORDING' }) } catch { /* ignore */ }
        }
        return { success: true, data: { session: bgResult?.session, stopped: true } }
      }

      case 'get_recordings': {
        const recordings = await chrome.runtime.sendMessage({ type: 'GET_RECORDINGS' })
        return { success: true, data: recordings || [] }
      }

      case 'execute_recording': {
        if (!tabId) return { success: false, error: t.noActiveTab }
        const recordings: any[] = await chrome.runtime.sendMessage({ type: 'GET_RECORDINGS' })
        const recording = recordings.find(r =>
          (args.recording_id && r.id === args.recording_id) ||
          (args.recording_name && r.name === args.recording_name)
        )
        if (!recording) return { success: false, error: `${t.recordingNotFound}: ${args.recording_id || args.recording_name}` }
        if (!recording.steps?.length) return { success: false, error: t.noSteps }

        const hasContentScript = await ensureContentScript(tabId)
        if (!hasContentScript) return { success: false, error: t.cannotInjectScript }

        // 强制导航到起始 URL
        const firstStep = recording.steps[0]
        if (firstStep?.url) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
          const currentUrl = tab?.url || ''
          if (!currentUrl.includes(firstStep.url.split('?')[0])) {
            await chrome.tabs.update(tabId, { url: firstStep.url })
            await new Promise(r => setTimeout(r, 3500))
            const [newTab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (newTab?.id) await ensureContentScript(newTab.id)
          }
        }

        // 逐条执行步骤
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []
        for (let i = 0; i < recording.steps.length; i++) {
          try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!activeTab?.id) throw new Error(t.cannotGetTab)
            const resp = await chrome.tabs.sendMessage(activeTab.id, {
              type: 'EXECUTE_STEP',
              payload: { step: recording.steps[i], stepIndex: i, totalSteps: recording.steps.length, speed: 1200 }
            })
            if (resp?.success) successCount++
            else throw new Error(resp?.error || t.executionFailedShort)
          } catch (err: any) {
            errorCount++
            errors.push(t.stepFailed.replace('{i}', String(i + 1)).replace('{error}', err.message))
          }
          await new Promise(r => setTimeout(r, 300))
        }

        return {
          success: errorCount === 0,
          data: { recordingName: recording.name, total: recording.steps.length, successCount, errorCount, errors: errors.length > 0 ? errors : undefined }
        }
      }

      case 'generate_script': {
        if (!args.recording_id) return { success: false, error: t.missingRecordingId }
        const script = await chrome.runtime.sendMessage({
          type: 'GENERATE_SCRIPT',
          payload: {
            sessionId: args.recording_id,
            framework: args.framework || 'playwright',
            options: {}
          }
        })
        return { success: true, data: script }
      }

      case 'export_json': {
        if (!args.recording_id) return { success: false, error: t.missingRecordingId }
        const result = await chrome.runtime.sendMessage({
          type: 'EXPORT_JSON',
          payload: { sessionId: args.recording_id }
        })
        return { success: true, data: result }
      }

      case 'highlight_element': {
        if (!tabId) return { success: false, error: t.noActiveTab }
        const injected = await ensureContentScript(tabId)
        if (!injected) return { success: false, error: t.cannotInjectScript }
        const result = await chrome.tabs.sendMessage(tabId, {
          type: 'HIGHLIGHT_ELEMENT',
          payload: {
            selector: args.selector,
            xpath: args.xpath,
            label: args.label || t.toolNameHighlight
          }
        })
        return { success: result?.success || false, data: result }
      }

      case 'click_element': {
        if (!tabId) return { success: false, error: t.noActiveTab }
        const hasCS = await ensureContentScript(tabId)
        if (!hasCS) return { success: false, error: t.cannotInjectScript }
        const step: TestStep = {
          id: `ai-click-${Date.now()}`,
          action: 'click',
          target: {
            selector: args.selector || 'body',
            xpath: args.xpath,
            text: args.text,
          },
          timestamp: Date.now(),
          url: '',
        }
        const resp = await chrome.tabs.sendMessage(tabId, {
          type: 'EXECUTE_STEP',
          payload: { step, stepIndex: 0, totalSteps: 1, speed: 1200 }
        })
        return { success: resp?.success || false, data: resp }
      }

      case 'input_text': {
        if (!tabId) return { success: false, error: t.noActiveTab }
        const hasCS = await ensureContentScript(tabId)
        if (!hasCS) return { success: false, error: t.cannotInjectScript }
        const step: TestStep = {
          id: `ai-input-${Date.now()}`,
          action: 'input',
          target: {
            selector: args.selector || 'body',
            xpath: args.xpath,
          },
          value: args.text || '',
          timestamp: Date.now(),
          url: '',
        }
        const resp = await chrome.tabs.sendMessage(tabId, {
          type: 'EXECUTE_STEP',
          payload: { step, stepIndex: 0, totalSteps: 1, speed: 1200 }
        })
        return { success: resp?.success || false, data: resp }
      }

      case 'navigate_to': {
        if (!tabId) return { success: false, error: t.noActiveTab }
        if (!args.url) return { success: false, error: t.missingUrlParam }
        await chrome.tabs.update(tabId, { url: args.url })
        await new Promise(r => setTimeout(r, 3000))
        return { success: true, data: { navigatedTo: args.url } }
      }

      default:
        return { success: false, error: t.unknownTool.replace('{name}', name) }
    }
  } catch (error: any) {
    return { success: false, error: error.message || String(error) }
  }
}

// ═══════════════════════════════════════════════════════════════
//  Markdown 简易渲染
// ═══════════════════════════════════════════════════════════════

function renderMarkdown(text: string): string {
  if (!text) return ''
  let html = escapeHtml(text)
  // 代码块 ```lang\ncode\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 rounded p-2 my-1 overflow-x-auto text-[10px] leading-relaxed"><code>$2</code></pre>')
  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded text-[10px]">$1</code>')
  // 粗体 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
  // 斜体 *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // 列表 - item
  html = html.replace(/^- (.+)$/gm, '<li class="ml-3">$1</li>')
  // 换行
  html = html.replace(/\n/g, '<br>')
  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ═══════════════════════════════════════════════════════════════
//  Markdown 表格解析 → CSV 导出
// ═══════════════════════════════════════════════════════════════

/** 检测文本中是否包含 Markdown 表格 */
function hasMarkdownTable(text: string): boolean {
  const lines = text.split('\n')
  return lines.some(line => /^\s*\|/.test(line))
}

/** 解析 Markdown 表格为二维数组 */
function parseMarkdownTable(text: string): string[][] | null {
  const lines = text.split('\n').filter(line => /^\s*\|/.test(line))
  if (lines.length < 2) return null
  // 过滤掉分隔行（如 | :--- | :--- |）
  const dataLines = lines.filter(line => !/^\s*\|[-:\|\s]*\|\s*$/.test(line))
  if (dataLines.length < 1) return null
  return dataLines.map(line =>
    line
      .split('|')
      .map(cell => cell.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1) // 去掉首尾空单元格
      .map(cell => cell
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/<br\s*\/?>/gi, '\n') // <br> 标签转 CSV 单元格内换行
      )
  )
}

/** 将二维数组导出为 CSV 文件 */
function exportTableToCSV(rows: string[][], filename: string) {
  // CSV 转义：若单元格包含逗号/换行/引号，则整体用引号包裹，内部引号双写
  const escape = (cell: string) => {
    if (/[",\n]/.test(cell)) {
      return '"' + cell.replace(/"/g, '""') + '"'
    }
    return cell
  }
  const csv = rows.map(row => row.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════════════
//  AI API 调用
// ═══════════════════════════════════════════════════════════════

// 解析 DeepSeek DSML 格式的 tool_calls（模型有时以文本标签输出而非标准 JSON）
function parseDsmlToolCalls(content: string): ToolCall[] | undefined {
  if (!content.includes('<|DSML|tool_calls>')) return undefined
  const calls: ToolCall[] = []
  // 匹配每个 invoke 块
  const invokeRegex = /<\|DSML\|invoke name="([^"]+)">([\s\S]*?)<\/\|DSML\|invoke>/g
  let match: RegExpExecArray | null
  let id = 0
  while ((match = invokeRegex.exec(content)) !== null) {
    const name = match[1]
    const paramBlock = match[2]
    const args: Record<string, any> = {}
    // 匹配参数
    const paramRegex = /<\|DSML\|parameter name="([^"]+)"[^>]*>([\s\S]*?)<\/\|DSML\|parameter>/g
    let pMatch: RegExpExecArray | null
    while ((pMatch = paramRegex.exec(paramBlock)) !== null) {
      const pName = pMatch[1]
      const pValue = pMatch[2].trim()
      // 尝试解析为 JSON，失败则保持字符串
      try { args[pName] = JSON.parse(pValue) } catch { args[pName] = pValue }
    }
    calls.push({
      id: `call_${Date.now()}_${id++}`,
      type: 'function',
      function: { name, arguments: JSON.stringify(args) },
    })
  }
  return calls.length > 0 ? calls : undefined
}

async function callAI(
  apiMessages: any[],
  config: AIConfig,
  enableTools: boolean,
  t: any
): Promise<{ content: string | null; tool_calls?: ToolCall[] }> {
  const baseURL = config.baseURL?.replace(/\/$/, '')
  if (!baseURL) {
    throw new Error(t.baseUrlNotConfigured)
  }
  const apiKey = config.apiKey
  const model = config.model || 'gpt-4o'

  const body: any = {
    model,
    messages: apiMessages,
    temperature: 0.5,
    max_tokens: 4000,
  }

  if (enableTools) {
    body.tools = TOOLS
    body.tool_choice = 'auto'
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`API ${response.status}: ${errText}`)
  }

  const json = await response.json()
  const choice = json.choices?.[0]?.message
  if (!choice) throw new Error(t.apiEmptyResponse)

  // 标准 OpenAI function calling 格式
  if (choice.tool_calls && choice.tool_calls.length > 0) {
    return {
      content: choice.content || null,
      tool_calls: choice.tool_calls as ToolCall[],
    }
  }

  // DeepSeek DSML 文本格式兜底解析
  const dsmlCalls = choice.content ? parseDsmlToolCalls(choice.content) : undefined
  if (dsmlCalls) {
    // 过滤掉 content 中的 DSML 标签，保留自然语言部分
    const cleanContent = choice.content
      .replace(/<\|DSML\|tool_calls>[\s\S]*?<\/\|DSML\|tool_calls>/g, '')
      .trim() || null
    return { content: cleanContent, tool_calls: dsmlCalls }
  }

  return {
    content: choice.content || null,
    tool_calls: undefined,
  }
}

// LLM 模式流式输出
async function callAIStream(
  apiMessages: any[],
  config: AIConfig,
  onChunk: (text: string) => void,
  signal: AbortSignal,
  t: any
): Promise<string> {
  const baseURL = config.baseURL?.replace(/\/$/, '')
  if (!baseURL) {
    throw new Error(t.baseUrlNotConfigured)
  }
  const apiKey = config.apiKey
  const model = config.model || 'gpt-4o'

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    throw new Error(`API ${response.status}: ${errText}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  if (!reader) throw new Error('No response body')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'data: [DONE]') continue
      if (!trimmed.startsWith('data: ')) continue

      try {
        const json = JSON.parse(trimmed.slice(6))
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          fullContent += delta
          onChunk(fullContent)
        }
      } catch (e) {
        // ignore malformed JSON
      }
    }
  }

  return fullContent || t.noContent
}

// ═══════════════════════════════════════════════════════════════
//  组件
// ═══════════════════════════════════════════════════════════════

export default function AIChatPanel() {
  const { t } = useI18n()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [isAgentMode, setIsAgentMode] = useState(true)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSessionList, setShowSessionList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, activeTools])

  // 加载历史会话
  useEffect(() => {
    const init = async () => {
      const storedSessions = await getChatSessions()
      setSessions(storedSessions)
      const lastActiveId = await getActiveSessionId()
      if (lastActiveId) {
        const session = storedSessions.find(s => s.id === lastActiveId)
        if (session) {
          setActiveSessionId(lastActiveId)
          setMessages(session.messages)
          return
        }
      }
      // 没有历史会话或上次激活的已删除，创建新会话
      createNewSession(false)
    }
    init()
  }, [])

  // 自动保存当前会话
  useEffect(() => {
    if (!activeSessionId || messages.length === 0 || savingRef.current) return
    const timeout = setTimeout(async () => {
      savingRef.current = true
      const session: ChatSession = {
        id: activeSessionId,
        title: generateSessionTitle(messages),
        messages,
        createdAt: sessions.find(s => s.id === activeSessionId)?.createdAt || Date.now(),
        updatedAt: Date.now(),
      }
      await saveChatSession(session)
      // 刷新本地会话列表
      const updated = await getChatSessions()
      setSessions(updated)
      savingRef.current = false
    }, 500)
    return () => clearTimeout(timeout)
  }, [messages, activeSessionId])

  const createNewSession = async (saveCurrent = true) => {
    if (saveCurrent && activeSessionId && messages.length > 0) {
      const current: ChatSession = {
        id: activeSessionId,
        title: generateSessionTitle(messages),
        messages,
        createdAt: sessions.find(s => s.id === activeSessionId)?.createdAt || Date.now(),
        updatedAt: Date.now(),
      }
      await saveChatSession(current)
    }
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: t.newSessionFallback,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveChatSession(newSession)
    await saveActiveSessionId(newSession.id)
    setActiveSessionId(newSession.id)
    setMessages([])
    setSessions(await getChatSessions())
    setShowSessionList(false)
  }

  const switchSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) return
    // 保存当前
    if (activeSessionId && messages.length > 0) {
      const current: ChatSession = {
        id: activeSessionId,
        title: generateSessionTitle(messages),
        messages,
        createdAt: sessions.find(s => s.id === activeSessionId)?.createdAt || Date.now(),
        updatedAt: Date.now(),
      }
      await saveChatSession(current)
    }
    // 加载目标
    const target = sessions.find(s => s.id === sessionId)
    if (target) {
      await saveActiveSessionId(sessionId)
      setActiveSessionId(sessionId)
      setMessages(target.messages)
    }
    setShowSessionList(false)
    setSessions(await getChatSessions())
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteChatSession(sessionId)
    const updated = await getChatSessions()
    setSessions(updated)
    if (sessionId === activeSessionId) {
      if (updated.length > 0) {
        await switchSession(updated[0].id)
      } else {
        createNewSession(false)
      }
    }
  }

  const buildLLMSystemPrompt = useCallback((): string => {
    return t.llmSystemPrompt
  }, [t.llmSystemPrompt])

  const buildAgentSystemPrompt = useCallback((): string => {
    return t.agentSystemPrompt
  }, [t.agentSystemPrompt])

  // 判断用户消息是否为纯对话（不需要调用工具）
  const isChatOnly = (text: string): boolean => {
    // 包含问号 → 大概率是提问
    if (/[？?]/.test(text)) return true
    // 明显的质疑/询问/对话关键词
    if (/为什么|怎么回事|怎么做到的|怎么做的|解释一下|什么意思|你是谁|你能|你有多少|你觉得|你认为|是否|是不是|好不好|可以吗|怎么样|如何/.test(text)) return true
    // 礼貌用语 / 情绪表达 / 阻止词
    if (/谢谢|你好|嗨|hello|hi|拜拜|再见|好的|知道了|明白了|不用|停|别|等一下|嗯|哦|好吧|哈哈/.test(text)) return true
    return false
  }

  const runAgentLoop = async (userText: string) => {
    setLoading(true)
    setActiveTools([])

    // LLM 模式绝不传 tools；Agent 模式才做意图检测
    const enableToolsForThisTurn = isAgentMode && !isChatOnly(userText)

    // 加载 AI 配置
    let config = await getAIConfig()
    if (!config || !config.apiKey || !config.apiKey.trim()) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-system`,
        role: 'assistant',
        content: '⚠️ 尚未配置 AI API Key。\n\n请前往 **设置** → **AI 配置** 中填写你的 API Key（支持 DeepSeek、OpenAI、Claude 或任何兼容 OpenAI 格式的服务）。\n\n如果没有 API Key，可以前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 免费获取。',
        timestamp: Date.now(),
      }])
      setLoading(false)
      return
    }
    const providerFallbacks: Record<string, { baseURL: string; model: string }> = {
      openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
      claude: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-3-sonnet-20240229' },
      deepseek: { baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
      zhipu: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
      kimi: { baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
      codex: { baseURL: 'https://api.openai.com/v1', model: 'codex' },
      custom: { baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    }
    const fallback = providerFallbacks[config.provider] || providerFallbacks.custom
    if (!config.baseURL) config.baseURL = fallback.baseURL
    if (!config.model) config.model = fallback.model

    // LLM 模式下也获取当前页面基本信息，让 AI 有页面上下文
    let pageContextText = ''
    if (!isAgentMode) {
      try {
        const tabId = await getActiveTabId()
        if (tabId) {
          const hasCS = await ensureContentScript(tabId)
          if (hasCS) {
            const result = await chrome.tabs.sendMessage(tabId, { type: 'GET_PAGE_CONTEXT', payload: { maxElements: 50 } })
            if (result?.success) {
              const interactive = (result.interactiveElements || [])
                .map((el: any, i: number) => `${i + 1}. ${el.tag}${el.text ? ` "${el.text}"` : ''}${el.type ? ` [${el.type}]` : ''}${el.placeholder ? ` placeholder="${el.placeholder}"` : ''}${el.ariaLabel ? ` aria="${el.ariaLabel}"` : ''}`)
                .join('\n')
              const forms = (result.formsDetail || [])
                .map((f: any, i: number) => `表单${i + 1}: ${f.method || 'GET'} ${f.action || ''}\n  ${f.inputs.map((inp: any) => `- ${inp.name || 'unnamed'} [${inp.type}]${inp.placeholder ? ` placeholder="${inp.placeholder}"` : ''}`).join('\n  ')}`)
                .join('\n')
              pageContextText = `\n\n【当前页面信息】\n- URL: ${result.url}\n- 标题: ${result.title}\n- 统计: 表单${result.elements.forms}个 | 输入框${result.elements.inputs}个 | 按钮${result.elements.buttons}个 | 链接${result.elements.links}个\n\n【可交互元素列表（前50个）】\n${interactive || '无'}\n\n【表单详情】\n${forms || '无表单'}\n\n请基于以上页面信息回答用户问题。`
            }
          }
        }
      } catch { /* ignore */ }
    }

    // 构建消息上下文
    const systemPrompt = isAgentMode
      ? buildAgentSystemPrompt()
      : buildLLMSystemPrompt() + pageContextText
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter(m => m.role !== 'system')
        .map(m => {
          const base: any = { role: m.role, content: m.content }
          if (m.role === 'assistant' && m.tool_calls) {
            base.tool_calls = m.tool_calls
          }
          if (m.role === 'tool') {
            base.tool_call_id = m.tool_call_id
          }
          return base
        }),
      { role: 'user', content: userText },
    ]

    try {
      if (!isAgentMode) {
        // ═══ LLM 模式：流式输出 ═══
        abortRef.current = new AbortController()
        setStreamingContent('')

        const fullContent = await callAIStream(
          apiMessages,
          config,
          (text) => setStreamingContent(text),
          abortRef.current.signal,
          t
        )

        const assistantMsg: AIMessage = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, assistantMsg])
        setStreamingContent('')
      } else {
        // ═══ Agent 模式：非流式 + 工具循环 ═══
        const maxLoops = 50
        let loopCount = 0

        while (loopCount < maxLoops) {
          const response = await callAI(apiMessages, config, enableToolsForThisTurn, t)

          const assistantMsg: AIMessage = {
            id: `${Date.now()}-assistant-${loopCount}`,
            role: 'assistant',
            content: response.content || '',
            timestamp: Date.now(),
            tool_calls: response.tool_calls,
          }
          setMessages(prev => [...prev, assistantMsg])
          apiMessages.push({
            role: 'assistant',
            content: response.content || '',
            tool_calls: response.tool_calls,
          })

          if (response.tool_calls && response.tool_calls.length > 0) {
            const toolNames = response.tool_calls.map(tc => tc.function.name)
            setActiveTools(toolNames)

            for (const toolCall of response.tool_calls) {
              const toolResult = await executeTool(toolCall, t)
              const toolResultMsg: AIMessage = {
                id: `${Date.now()}-tool-${toolCall.id}`,
                role: 'tool',
                content: JSON.stringify(toolResult),
                timestamp: Date.now(),
                tool_call_id: toolCall.id,
                tool_name: toolCall.function.name,
              }
              setMessages(prev => [...prev, toolResultMsg])
              apiMessages.push({
                role: 'tool',
                content: JSON.stringify(toolResult),
                tool_call_id: toolCall.id,
              })
            }

            setActiveTools([])
            loopCount++
            continue
          }

          break
        }

        if (loopCount >= maxLoops) {
          setMessages(prev => [...prev, {
            id: `${Date.now()}-system`,
            role: 'assistant',
            content: t.toolLimitReached,
            timestamp: Date.now(),
          }])
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // 用户取消流式输出，保留已生成的内容
        if (streamingContent) {
          setMessages(prev => [...prev, {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: streamingContent + '\n\n[已取消]',
            timestamp: Date.now(),
          }])
        }
      } else {
        console.error('AI error:', error)
        setMessages(prev => [...prev, {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: `❌ 调用失败: ${error.message}`,
          timestamp: Date.now(),
        }])
      }
    } finally {
      setLoading(false)
      setActiveTools([])
      setStreamingContent('')
      abortRef.current = null
    }
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setMessages(prev => [...prev, {
      id: `${Date.now()}-user`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    }])
    setInput('')
    runAgentLoop(userText)
  }

  const handleQuickAction = (type: 'analyze' | 'testcases' | 'optimize') => {
    if (loading) return
    const prompts: Record<string, string> = {
      analyze: t.quickAnalyzePrompt,
      testcases: t.quickTestcasesPrompt,
      optimize: t.quickOptimizePrompt,
    }
    const userText = prompts[type]
    setMessages(prev => [...prev, {
      id: `${Date.now()}-user`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    }])
    runAgentLoop(userText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    abortRef.current?.abort()
    createNewSession(true)
  }

  // 工具名中文映射
  const getToolName = (name: string) => {
    const map: Record<string, string> = {
      get_page_info: t.toolNameGetPageInfo,
      click_element: t.toolNameClick,
      input_text: t.toolNameInput,
      navigate_to: t.toolNameNavigate,
      start_recording: t.toolNameStartRecording,
      stop_recording: t.toolNameStopRecording,
      get_recordings: t.toolNameGetRecordings,
      execute_recording: t.toolNameExecuteRecording,
      generate_script: t.toolNameGenerateScript,
      export_json: t.toolNameExportJson,
      highlight_element: t.toolNameHighlight,
    }
    return map[name] || name
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative px-2 py-1.5 border-b border-gray-700 bg-gray-800">
        {/* 模式切换标签 */}
        <div className="flex items-center gap-1 mb-1.5">
          <button
            onClick={() => {
              if (isAgentMode) {
                setIsAgentMode(false)
                createNewSession(true)
              }
            }}
            className={`flex-1 text-[10px] py-1 rounded transition-colors font-medium ${
              !isAgentMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {t.llmChatLabel}
          </button>
          <button
            onClick={() => {
              if (!isAgentMode) {
                setIsAgentMode(true)
                createNewSession(true)
              }
            }}
            className={`flex-1 text-[10px] py-1 rounded transition-colors font-medium ${
              isAgentMode
                ? 'bg-green-700 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {t.agentChatLabel}
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* 左侧：会话选择 */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={() => setShowSessionList(!showSessionList)}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-300 truncate hover:text-white transition-colors"
              title={t.switchSession}
            >
              <span className="truncate">
                {sessions.find(s => s.id === activeSessionId)?.title || t.newSessionFallback}
              </span>
              <span className="text-[9px]">{showSessionList ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* 右侧：工具状态 + 新建 */}
          <div className="flex items-center gap-1 shrink-0">
            {isAgentMode && activeTools.length > 0 && (
              <span className="text-[9px] text-yellow-400 animate-pulse truncate max-w-[100px]">
                🔧 {activeTools.map(t => getToolName(t)).join(', ')}
              </span>
            )}
            <button
              onClick={() => createNewSession(true)}
              className="text-[10px] text-blue-400 hover:text-blue-300 px-1 py-0.5"
              title={t.createNewSession}
            >
              ＋
            </button>
          </div>
        </div>

        {/* 会话下拉列表 */}
        {showSessionList && (
          <div className="absolute left-2 right-2 top-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-20 max-h-48 overflow-y-auto">
            <div className="px-2 py-1 border-b border-gray-700 flex items-center justify-between">
              <span className="text-[9px] text-gray-500">历史会话 ({sessions.length})</span>
              <button
                onClick={() => createNewSession(true)}
                className="text-[9px] text-blue-400 hover:text-blue-300"
              >
                ＋ 新建
              </button>
            </div>
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => switchSession(session.id)}
                className={`px-2 py-1.5 cursor-pointer flex items-center justify-between group ${
                  session.id === activeSessionId
                    ? 'bg-blue-900/30 border-l-2 border-blue-500'
                    : 'hover:bg-gray-700 border-l-2 border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0 mr-2">
                  <div className="text-[11px] text-gray-300 truncate">{session.title}</div>
                  <div className="text-[9px] text-gray-500">
                    {session.messages.length} 条 · {new Date(session.updatedAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="text-gray-600 hover:text-red-400 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t.deleteSession}
                >
                  🗑
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="px-2 py-2 text-[10px] text-gray-500 text-center">暂无历史会话</div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
            <span className="text-2xl mb-2">🤖</span>
            <p className="font-medium">{isAgentMode ? t.agentWelcomeTitle : t.llmWelcomeTitle}</p>
            <p className="mt-1 text-[10px]">{isAgentMode ? t.agentWelcomeSubtitle : t.llmWelcomeSubtitle}</p>
            <div className="mt-4 space-y-1 text-[10px] text-gray-600">
              <p>• {t.welcomeExample1}</p>
              <p>• {t.welcomeExample2}</p>
              <p>• {t.welcomeExample3}</p>
              <p>• {t.welcomeExample4}</p>
            </div>
            {!isAgentMode && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleQuickAction('analyze')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 disabled:opacity-50 border border-blue-600/40 text-blue-400 rounded text-[10px] transition-colors"
                >
                  📋 {t.quickAnalyze}
                </button>
                <button
                  onClick={() => handleQuickAction('testcases')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-50 border border-green-600/40 text-green-400 rounded text-[10px] transition-colors"
                >
                  📝 {t.quickTestcases}
                </button>
                <button
                  onClick={() => handleQuickAction('optimize')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 disabled:opacity-50 border border-orange-600/40 text-orange-400 rounded text-[10px] transition-colors"
                >
                  💡 {t.quickOptimize}
                </button>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[90%] bg-blue-600 text-white rounded-lg px-3 py-2 text-[11px]">
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-[9px] mt-1 text-blue-200">{new Date(msg.timestamp).toLocaleTimeString('zh-CN')}</div>
                  </div>
                </div>
              )
            }

            if (msg.role === 'tool') {
              const result = (() => {
                try { return JSON.parse(msg.content) } catch { return { data: msg.content } }
              })()
              const isSuccess = result?.success !== false
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className={`max-w-[90%] rounded-lg px-3 py-2 text-[10px] border ${
                    isSuccess
                      ? 'bg-gray-800/80 border-gray-600 text-gray-300'
                      : 'bg-red-900/20 border-red-700 text-red-300'
                  }`}>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[9px]">{isSuccess ? '✅' : '❌'}</span>
                      <span className="font-medium text-[9px] text-gray-400">
                        工具: {getToolName(msg.tool_name || '')}
                      </span>
                    </div>
                    <div className="font-mono text-[9px] whitespace-pre-wrap break-all opacity-80">
                      {typeof result.data === 'object'
                        ? JSON.stringify(result.data, null, 2).slice(0, 800)
                        : (result.data || result.error || msg.content).slice(0, 800)}
                      {(result.data && JSON.stringify(result.data).length > 800) || (result.error && result.error.length > 800) ? '...' : ''}
                    </div>
                  </div>
                </div>
              )
            }

            // assistant
            const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0
            const tableRows = !hasToolCalls && hasMarkdownTable(msg.content) ? parseMarkdownTable(msg.content) : null
            return (
              <div key={msg.id} className="flex justify-start">
                <div className={`max-w-[90%] rounded-lg px-3 py-2 text-[11px] border relative ${
                  hasToolCalls
                    ? 'bg-yellow-900/20 border-yellow-700 text-yellow-200'
                    : 'bg-gray-800 border-gray-700 text-gray-200'
                }`}>
                  {!hasToolCalls && tableRows && (
                    <button
                      onClick={() => {
                        const safeName = msg.content.slice(0, 20).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_') || 'testcases'
                        exportTableToCSV(tableRows, `${safeName}_${Date.now()}.csv`)
                      }}
                      className="mt-2 px-2 py-0.5 bg-green-700/40 hover:bg-green-600/60 text-green-300 rounded text-[9px] transition-colors"
                      title={t.exportCSVTitle}
                    >
                      📥 {t.exportCSV}
                    </button>
                  )}
                  {hasToolCalls ? (
                    <div className="flex items-center gap-1.5">
                      <span className="animate-spin text-xs">⚙️</span>
                      <span className="text-[10px]">
                        正在调用工具: {msg.tool_calls!.map(tc => getToolName(tc.function.name)).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  )}
                  <div className={`text-[9px] mt-1 ${hasToolCalls ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* 流式输出（LLM 模式） */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[90%] bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-[11px] text-gray-200">
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }}
              />
              <div className="text-[9px] mt-1 text-gray-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                生成中...
              </div>
            </div>
          </div>
        )}

        {loading && !streamingContent && activeTools.length === 0 && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-[11px] text-gray-400">
              <span className="animate-pulse">思考中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAgentMode ? '' : t.sendHint}
            rows={2}
            className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[11px] text-gray-200 placeholder-gray-600 outline-none resize-none focus:border-blue-500"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="py-1 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded text-[10px] transition-colors"
            >
              {loading ? '...' : '发送'}
            </button>
            <button
              onClick={clearChat}
              className="py-1 px-2 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded text-[10px] transition-colors"
            >
              清空
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
