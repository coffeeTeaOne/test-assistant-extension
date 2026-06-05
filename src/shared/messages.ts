import { TestStep, RecordingSession, AIMessage, AIConfig, ScriptCode } from './types'

/**
 * Content Script 发送到 Background 的消息类型
 */
export type ContentToBackgroundMessage =
  | { type: 'EVENT_RECORDED'; payload: TestStep }
  | { type: 'GET_PAGE_CONTEXT'; payload: any }
  | { type: 'EXECUTE_STEP'; payload: { step: TestStep; speed: number } }

/**
 * Background 发送到 Content Script 的消息类型
 */
export type BackgroundToContentMessage =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'EXECUTE_STEP'; payload: { step: TestStep; speed: number } }

/**
 * Side Panel 发送到 Background 的消息类型
 */
export type SidePanelToBackgroundMessage =
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'GET_RECORDINGS' }
  | { type: 'SAVE_RECORDING'; payload: RecordingSession }
  | { type: 'DELETE_RECORDING'; payload: { id: string } }
  | { type: 'GENERATE_SCRIPT'; payload: { sessionId: string; framework: 'playwright' | 'selenium' } }
  | { type: 'PLAY_SCRIPT'; payload: { sessionId: string; speed: number } }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'AI_CHAT'; payload: { message: string; context?: any } }
  | { type: 'GET_AI_CONFIG' }
  | { type: 'SAVE_AI_CONFIG'; payload: AIConfig }

/**
 * Background 发送到 Side Panel 的消息类型
 */
export type BackgroundToSidePanelMessage =
  | { type: 'RECORDING_UPDATED'; payload: { isRecording: boolean; steps: TestStep[] } }
  | { type: 'RECORDINGS_LIST'; payload: RecordingSession[] }
  | { type: 'SCRIPT_GENERATED'; payload: { sessionId: string; script: ScriptCode } }
  | { type: 'PLAYBACK_STATUS'; payload: { isPlaying: boolean; currentStep: number; totalSteps: number } }
  | { type: 'AI_RESPONSE'; payload: AIMessage }
  | { type: 'AI_CONFIG'; payload: AIConfig | null }
  | { type: 'ERROR'; payload: { message: string } }
