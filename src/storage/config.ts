import { AIConfig, ExportConfig, LoginProfile } from '../shared/types'

const AI_CONFIG_KEY = 'ai_config'
const EXPORT_CONFIG_KEY = 'export_config'
const LOGIN_PROFILES_KEY = 'login_profiles'

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  autoOverwrite: true,
}

/**
 * 获取 AI 配置
 */
export async function getAIConfig(): Promise<AIConfig | null> {
  try {
    const result = await chrome.storage.local.get(AI_CONFIG_KEY)
    return result[AI_CONFIG_KEY] || null
  } catch (error) {
    console.error('Failed to get AI config:', error)
    return null
  }
}

/**
 * 保存 AI 配置
 */
export async function saveAIConfig(config: AIConfig): Promise<void> {
  try {
    await chrome.storage.local.set({ [AI_CONFIG_KEY]: config })
  } catch (error) {
    console.error('Failed to save AI config:', error)
    throw error
  }
}

/**
 * 清除 AI 配置
 */
export async function clearAIConfig(): Promise<void> {
  try {
    await chrome.storage.local.remove(AI_CONFIG_KEY)
  } catch (error) {
    console.error('Failed to clear AI config:', error)
    throw error
  }
}

// ==================== Export Config ====================

/**
 * 获取导出配置
 */
export async function getExportConfig(): Promise<ExportConfig> {
  try {
    const result = await chrome.storage.local.get(EXPORT_CONFIG_KEY)
    return result[EXPORT_CONFIG_KEY] || { ...DEFAULT_EXPORT_CONFIG }
  } catch (error) {
    console.error('Failed to get export config:', error)
    return { ...DEFAULT_EXPORT_CONFIG }
  }
}

/**
 * 保存导出配置
 */
export async function saveExportConfig(config: ExportConfig): Promise<void> {
  try {
    await chrome.storage.local.set({ [EXPORT_CONFIG_KEY]: config })
  } catch (error) {
    console.error('Failed to save export config:', error)
    throw error
  }
}

/**
 * 清除导出配置
 */
export async function clearExportConfig(): Promise<void> {
  try {
    await chrome.storage.local.remove(EXPORT_CONFIG_KEY)
  } catch (error) {
    console.error('Failed to clear export config:', error)
    throw error
  }
}

// ==================== Login Profiles ====================

/**
 * 获取所有登录配置档案
 */
export async function getLoginProfiles(): Promise<LoginProfile[]> {
  try {
    const result = await chrome.storage.local.get(LOGIN_PROFILES_KEY)
    return result[LOGIN_PROFILES_KEY] || []
  } catch (error) {
    console.error('Failed to get login profiles:', error)
    return []
  }
}

/**
 * 保存登录配置档案（追加到列表）
 */
export async function saveLoginProfile(profile: LoginProfile): Promise<void> {
  try {
    const profiles = await getLoginProfiles()
    // 如果同名则覆盖，否则追加
    const existingIndex = profiles.findIndex(p => p.id === profile.id)
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile
    } else {
      profiles.push(profile)
    }
    await chrome.storage.local.set({ [LOGIN_PROFILES_KEY]: profiles })
  } catch (error) {
    console.error('Failed to save login profile:', error)
    throw error
  }
}

/**
 * 删除登录配置档案
 */
export async function deleteLoginProfile(id: string): Promise<void> {
  try {
    const profiles = await getLoginProfiles()
    const filtered = profiles.filter(p => p.id !== id)
    await chrome.storage.local.set({ [LOGIN_PROFILES_KEY]: filtered })
  } catch (error) {
    console.error('Failed to delete login profile:', error)
    throw error
  }
}
