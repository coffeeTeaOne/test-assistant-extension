import { RecordingSession, TestStep } from '../shared/types'

const RECORDINGS_KEY = 'recordings'
const CURRENT_RECORDING_KEY = 'current_recording'

/**
 * 获取所有录制的会话列表
 * @returns 录制会话数组
 */
export async function getRecordings(): Promise<RecordingSession[]> {
  try {
    const result = await chrome.storage.local.get(RECORDINGS_KEY)
    return result[RECORDINGS_KEY] || []
  } catch (error) {
    console.error('Failed to get recordings:', error)
    return []
  }
}

/**
 * 保存或更新录制会话
 * @param session 要保存的录制会话
 */
export async function saveRecording(session: RecordingSession): Promise<void> {
  try {
    const recordings = await getRecordings()
    const index = recordings.findIndex(r => r.id === session.id)

    if (index >= 0) {
      recordings[index] = session
    } else {
      recordings.push(session)
    }

    await chrome.storage.local.set({ [RECORDINGS_KEY]: recordings })
  } catch (error) {
    console.error('Failed to save recording:', error)
    throw error
  }
}

/**
 * 删除指定的录制会话
 * @param id 要删除的录制会话 ID
 */
export async function deleteRecording(id: string): Promise<void> {
  try {
    const recordings = await getRecordings()
    const filtered = recordings.filter(r => r.id !== id)
    await chrome.storage.local.set({ [RECORDINGS_KEY]: filtered })
  } catch (error) {
    console.error('Failed to delete recording:', error)
    throw error
  }
}

/**
 * 获取当前正在录制的会话
 * @returns 当前录制会话，如果没有则返回 null
 */
export async function getCurrentRecording(): Promise<RecordingSession | null> {
  try {
    const result = await chrome.storage.local.get(CURRENT_RECORDING_KEY)
    return result[CURRENT_RECORDING_KEY] || null
  } catch (error) {
    console.error('Failed to get current recording:', error)
    return null
  }
}

/**
 * 设置当前正在录制的会话
 * @param session 要设置的录制会话，传入 null 则清除当前录制
 */
export async function setCurrentRecording(session: RecordingSession | null): Promise<void> {
  try {
    if (session) {
      await chrome.storage.local.set({ [CURRENT_RECORDING_KEY]: session })
    } else {
      await chrome.storage.local.remove(CURRENT_RECORDING_KEY)
    }
  } catch (error) {
    console.error('Failed to set current recording:', error)
    throw error
  }
}

/**
 * 向当前录制会话添加一个测试步骤
 * @param step 要添加的测试步骤
 */
export async function addStepToRecording(step: TestStep): Promise<void> {
  try {
    const session = await getCurrentRecording()
    if (!session) return

    session.steps.push(step)
    session.updatedAt = Date.now()
    await setCurrentRecording(session)
  } catch (error) {
    console.error('Failed to add step to recording:', error)
    throw error
  }
}
