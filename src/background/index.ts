import { Recorder } from './recorder'
import { getRecordings, saveRecording, deleteRecording, getAIConfig, saveAIConfig, getExportConfig, saveExportConfig, getLoginProfiles, saveLoginProfile, deleteLoginProfile } from '../storage'
import { openSidePanel } from './chrome-utils'
import { generateScript, generateJson } from './generator'
import { TestStep } from '../shared/types'

// 全局录制器实例
const recorder = new Recorder()

/**
 * Message types for type-safe message handling
 */
type MessageType =
  | 'EVENT_RECORDED'
  | 'CONTENT_SCRIPT_READY'
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'GET_RECORDINGS'
  | 'SAVE_RECORDING'
  | 'DELETE_RECORDING'
  | 'UPDATE_RECORDING_EXECUTION'
  | 'GET_AI_CONFIG'
  | 'SAVE_AI_CONFIG'
  | 'GET_EXPORT_CONFIG'
  | 'SAVE_EXPORT_CONFIG'
  | 'GET_LOGIN_PROFILES'
  | 'SAVE_LOGIN_PROFILE'
  | 'DELETE_LOGIN_PROFILE'
  | 'GENERATE_SCRIPT'
  | 'EXPORT_JSON'

interface Message {
  type: MessageType
  payload?: any
}

/**
 * Validates message has required payload
 */
function validatePayload(message: Message, required: boolean = true): any {
  if (required && !message.payload) {
    throw new Error(`Message type '${message.type}' requires a payload`)
  }
  return message.payload
}

// 消息路由
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleRequest(message, sender)
    .then(response => sendResponse({ success: true, data: response }))
    .catch(error => sendResponse({ success: false, error: error.message }))

  return true  // 异步响应
})

/**
 * 根据登录配置档案 ID 获取登录步骤
 */
async function getLoginStepsByProfileId(profileId: string): Promise<TestStep[]> {
  if (!profileId) return []
  const profiles = await getLoginProfiles()
  const profile = profiles.find(p => p.id === profileId)
  return profile?.steps || []
}

async function handleRequest(message: Message, _sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    // Content Script 消息
    case 'EVENT_RECORDED': {
      const payload = validatePayload(message)
      await recorder.addStep(payload)
      return { stepAdded: true }
    }

    case 'CONTENT_SCRIPT_READY':
      // Content Script 加载完成
      return { acknowledged: true }

    // 录制控制
    case 'START_RECORDING': {
      const session = await recorder.startRecording()
      return { session }
    }

    case 'STOP_RECORDING': {
      const stopped = await recorder.stopRecording()
      return { session: stopped }
    }

    case 'GET_RECORDINGS':
      return await getRecordings()

    case 'SAVE_RECORDING': {
      const payload = validatePayload(message)
      await saveRecording(payload)
      return { saved: true }
    }

    case 'DELETE_RECORDING': {
      const payload = validatePayload(message)
      if (!payload.id) {
        throw new Error('DELETE_RECORDING requires payload.id')
      }
      await deleteRecording(payload.id)
      return { deleted: true }
    }

    case 'UPDATE_RECORDING_EXECUTION': {
      const payload = validatePayload(message)
      if (!payload.id) {
        throw new Error('UPDATE_RECORDING_EXECUTION requires payload.id')
      }
      const recordings = await getRecordings()
      const recording = recordings.find(r => r.id === payload.id)
      if (!recording) {
        throw new Error('Recording not found')
      }
      recording.lastExecution = payload.lastExecution
      await saveRecording(recording)
      return { updated: true }
    }

    // AI 配置
    case 'GET_AI_CONFIG':
      return await getAIConfig()

    case 'SAVE_AI_CONFIG': {
      const payload = validatePayload(message)
      await saveAIConfig(payload)
      return { saved: true }
    }

    // 导出配置
    case 'GET_EXPORT_CONFIG':
      return await getExportConfig()

    case 'SAVE_EXPORT_CONFIG': {
      const payload = validatePayload(message)
      await saveExportConfig(payload)
      return { saved: true }
    }

    // 登录配置档案
    case 'GET_LOGIN_PROFILES':
      return await getLoginProfiles()

    case 'SAVE_LOGIN_PROFILE': {
      const payload = validatePayload(message)
      await saveLoginProfile(payload)
      return { saved: true }
    }

    case 'DELETE_LOGIN_PROFILE': {
      const payload = validatePayload(message)
      if (!payload.id) throw new Error('DELETE_LOGIN_PROFILE requires payload.id')
      await deleteLoginProfile(payload.id)
      return { deleted: true }
    }

    // 生成测试脚本（Python runner）
    case 'GENERATE_SCRIPT': {
      const recordings = await getRecordings()
      const targetRecording = recordings.find(r => r.id === message.payload.sessionId)
      if (!targetRecording) {
        throw new Error('Recording not found')
      }

      // 如果指定了登录配置档案，前置登录步骤
      let recordingToUse = targetRecording
      if (message.payload.loginProfileId) {
        const loginSteps = await getLoginStepsByProfileId(message.payload.loginProfileId)
        if (loginSteps.length > 0) {
          recordingToUse = { ...targetRecording, steps: [...loginSteps, ...targetRecording.steps] }
        }
      }

      const script = await generateScript(
        recordingToUse,
        message.payload.framework,
        message.payload.options
      )

      targetRecording.generatedScript = script
      await saveRecording(targetRecording)

      return { script }
    }

    // 导出 JSON 步骤文件到指定目录（供 pytest 读取）
    case 'EXPORT_JSON': {
      const payload = validatePayload(message)
      const recordings = await getRecordings()
      const targetRecording = recordings.find(r => r.id === payload.sessionId)
      if (!targetRecording) {
        throw new Error('Recording not found')
      }

      // 如果指定了登录配置档案，前置登录步骤
      let recordingToUse = targetRecording
      if (payload.loginProfileId) {
        const loginSteps = await getLoginStepsByProfileId(payload.loginProfileId)
        if (loginSteps.length > 0) {
          recordingToUse = { ...targetRecording, steps: [...loginSteps, ...targetRecording.steps] }
        }
      }

      // 读取导出配置
      const exportConfig = await getExportConfig()
      const jsonContent = generateJson(recordingToUse)
      // 文件名安全处理：只保留字母数字中文下划线连字符，其他替换为下划线，并去除首尾下划线
      const safeName = targetRecording.name
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/(^_|_$)/g, '')
        || 'recording'
      const filename = `${safeName}.json`

      // 浏览器下载目录直接保存到根目录（本地导出通过 File System Access API 写入指定目录）
      const relativePath = filename

      // 使用 data URL 触发下载
      const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent)

      const downloadId = await chrome.downloads.download({
        url: dataUrl,
        filename: relativePath,
        conflictAction: exportConfig.autoOverwrite ? 'overwrite' : 'uniquify',
        saveAs: false,
      })

      return { downloadId, filename: relativePath, content: jsonContent }
    }

    default:
      throw new Error(`Unknown message type: ${message.type}`)
  }
}

// 插件安装/更新
chrome.runtime.onInstalled.addListener(async (details) => {
  // 设置点击插件图标自动打开 Side Panel（Chrome 114+ 推荐方式）
  try {
    // @ts-ignore - setPanelBehavior may not be in all @types/chrome versions
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  } catch (error) {
    console.error('Failed to set panel behavior:', error)
  }

  if (details.reason === 'install') {
    // 首次安装，尝试打开侧边栏
    try {
      await openSidePanel()
    } catch (error) {
      console.error('Failed to open side panel on install:', error)
    }
  }
})

// 点击插件图标，打开侧边栏（备用方案）
chrome.action.onClicked.addListener(async () => {
  try {
    await openSidePanel()
  } catch (error) {
    console.error('Failed to open side panel on click:', error)
  }
})
