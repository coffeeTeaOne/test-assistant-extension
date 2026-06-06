import { TestStep, RecordingSession } from '../shared/types'
import { generateId } from '../shared/utils'
import {
  saveRecording,
  setCurrentRecording
} from '../storage'
import { sendMessageToTab, getActiveTab, sendRuntimeMessage } from './chrome-utils'

/**
 * Message types for side panel communication
 */
type SidePanelMessageType = 'RECORDING_UPDATED'

interface SidePanelMessage {
  type: SidePanelMessageType
  payload: {
    isRecording: boolean
    steps: TestStep[]
  }
}

export class Recorder {
  private isRecording = false
  private currentSession: RecordingSession | null = null

  async startRecording(): Promise<RecordingSession> {
    this.isRecording = true

    // 读取语言设置（side panel 的 I18nContext 会同步到这里）
    let lang = 'zh'
    try {
      const stored = await chrome.storage.local.get('app_language')
      if (stored.app_language === 'zh' || stored.app_language === 'en') {
        lang = stored.app_language
      }
    } catch { /* ignore */ }

    const prefix = lang === 'en' ? 'Recording' : '录制'
    const locale = lang === 'en' ? 'en-US' : 'zh-CN'

    // 创建新录制会话
    const session: RecordingSession = {
      id: generateId(),
      name: `${prefix}_${new Date().toLocaleString(locale)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: []
    }

    this.currentSession = session
    await setCurrentRecording(session)

    // 通知 content script 开始录制
    try {
      const tab = await getActiveTab()
      if (tab?.id) {
        await sendMessageToTab(tab.id, { type: 'START_RECORDING' })
      }
    } catch (error) {
      console.warn('Failed to notify content script of recording start:', error)
    }

    return session
  }

  async stopRecording(): Promise<RecordingSession | null> {
    this.isRecording = false

    // 通知 content script 停止录制
    try {
      const tab = await getActiveTab()
      if (tab?.id) {
        await sendMessageToTab(tab.id, { type: 'STOP_RECORDING' })
      }
    } catch (error) {
      console.warn('Failed to notify content script of recording stop:', error)
    }

    if (this.currentSession) {
      await saveRecording(this.currentSession)
      const session = this.currentSession
      this.currentSession = null
      await setCurrentRecording(null)
      return session
    }

    return null
  }

  /**
   * Add a step to the current recording session
   * @returns true if step was added, false if not recording
   * @throws Error if step is invalid
   */
  async addStep(step: TestStep): Promise<boolean> {
    // Validate step — 空选择器静默丢弃，不抛错
    if (!step || !step.id || !step.action || !step.target || !step.target.selector) {
      console.warn('Skipping invalid step: missing required fields', step)
      return false
    }

    if (!this.currentSession || !this.isRecording) {
      return false
    }

    this.currentSession.steps.push(step)
    this.currentSession.updatedAt = Date.now()
    await setCurrentRecording(this.currentSession)

    // 通知侧边栏更新
    await this.notifySidePanel({
      type: 'RECORDING_UPDATED',
      payload: {
        isRecording: this.isRecording,
        steps: this.currentSession.steps
      }
    })

    return true
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  getCurrentSteps(): TestStep[] {
    return this.currentSession?.steps || []
  }

  private async notifySidePanel(message: SidePanelMessage): Promise<void> {
    try {
      await sendRuntimeMessage(message)
    } catch (error) {
      console.warn('Failed to notify side panel:', error)
    }
  }
}
