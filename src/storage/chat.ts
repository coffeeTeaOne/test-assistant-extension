import { AIMessage } from '../shared/types'

export interface ChatSession {
  id: string
  title: string
  messages: AIMessage[]
  createdAt: number
  updatedAt: number
}

const CHAT_SESSIONS_KEY = 'ai_chat_sessions'
const ACTIVE_SESSION_ID_KEY = 'ai_chat_active_session_id'

export async function getChatSessions(): Promise<ChatSession[]> {
  const result = await chrome.storage.local.get(CHAT_SESSIONS_KEY)
  return (result[CHAT_SESSIONS_KEY] || []).sort((a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt)
}

export async function saveChatSession(session: ChatSession): Promise<void> {
  const sessions = await getChatSessions()
  const index = sessions.findIndex(s => s.id === session.id)
  if (index >= 0) {
    sessions[index] = session
  } else {
    sessions.push(session)
  }
  await chrome.storage.local.set({ [CHAT_SESSIONS_KEY]: sessions })
}

export async function deleteChatSession(id: string): Promise<void> {
  const sessions = await getChatSessions()
  await chrome.storage.local.set({
    [CHAT_SESSIONS_KEY]: sessions.filter(s => s.id !== id)
  })
}

export async function getActiveSessionId(): Promise<string | null> {
  const result = await chrome.storage.local.get(ACTIVE_SESSION_ID_KEY)
  return result[ACTIVE_SESSION_ID_KEY] || null
}

export async function setActiveSessionId(id: string | null): Promise<void> {
  await chrome.storage.local.set({ [ACTIVE_SESSION_ID_KEY]: id })
}

export function generateSessionTitle(messages: AIMessage[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (firstUserMsg) {
    const text = firstUserMsg.content.trim()
    return text.length > 20 ? text.slice(0, 20) + '...' : text
  }
  return '新会话'
}
