import { useState, useEffect } from 'react'
import { AIConfig, ExportConfig, LoginProfile, RecordingSession } from '../../shared/types'
import { getLocalExportDir, saveLocalExportDir, clearLocalExportDir } from '../../storage/local-export'
import { useI18n } from '../../i18n/I18nContext'

export default function SettingsPanel() {
  const { t, lang, toggleLang } = useI18n()
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    apiKey: '',
    baseURL: '',
    model: 'gpt-4o',
  })
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    autoOverwrite: true,
  })
  const [loginProfiles, setLoginProfiles] = useState<LoginProfile[]>([])
  const [recordings, setRecordings] = useState<RecordingSession[]>([])
  const [expandedProfileIds, setExpandedProfileIds] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [executingProfileId, setExecutingProfileId] = useState<string | null>(null)
  const [localDirName, setLocalDirName] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
    loadExportConfig()
    loadLoginProfiles()
    loadRecordings()
    loadLocalDir()
  }, [])

  const loadLocalDir = async () => {
    try {
      const handle = await getLocalExportDir()
      if (handle) setLocalDirName(handle.name)
    } catch {
      setLocalDirName(null)
    }
  }

  const selectLocalDir = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker()
      await saveLocalExportDir(dirHandle)
      setLocalDirName(dirHandle.name)
    } catch {
      // 用户取消选择
    }
  }

  const removeLocalDir = async () => {
    await clearLocalExportDir()
    setLocalDirName(null)
  }

  const loadConfig = async () => {
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'GET_AI_CONFIG' })
      if (response.success && response.data) {
        setConfig(response.data)
      }
    } catch (error) {
      console.error('Failed to load AI config:', error)
    }
  }

  const loadExportConfig = async () => {
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'GET_EXPORT_CONFIG' })
      if (response.success && response.data) {
        setExportConfig(response.data)
      }
    } catch (error) {
      console.error('Failed to load export config:', error)
    }
  }

  const loadLoginProfiles = async () => {
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'GET_LOGIN_PROFILES' })
      if (response.success && response.data) {
        setLoginProfiles(response.data)
      }
    } catch (error) {
      console.error('Failed to load login profiles:', error)
    }
  }

  const loadRecordings = async () => {
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'GET_RECORDINGS' })
      if (response.success && response.data) {
        setRecordings(response.data)
      }
    } catch (error) {
      console.error('Failed to load recordings:', error)
    }
  }

  const deleteProfile = async (id: string) => {
    if (!confirm('确定要删除这个登录配置吗？')) return
    try {
      await chrome.runtime.sendMessage({ type: 'DELETE_LOGIN_PROFILE', payload: { id } })
      setLoginProfiles(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Failed to delete login profile:', error)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedProfileIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 获取登录配置对应的原始用例（用于展示完整信息）
  const getSourceRecording = (profile: LoginProfile): RecordingSession | undefined => {
    if (!profile.sourceRecordingId) return undefined
    return recordings.find(r => r.id === profile.sourceRecordingId)
  }

  const ensureContentScript = async (tabId: number): Promise<boolean> => {
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
      return false
    }
  }

  const executeLoginProfile = async (profile: LoginProfile) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      alert(t.switchToTargetTab)
      return
    }
    const hasContentScript = await ensureContentScript(tab.id)
    if (!hasContentScript) {
      alert(t.cannotInjectRetry)
      return
    }

    setExecutingProfileId(profile.id)
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_JSON',
        payload: { steps: profile.steps, speed: 1200 }
      })
      if (response?.success) {
        alert(t.loginSaved.replace('{name}', profile.name))
      } else {
        alert('执行失败: ' + (response?.error || '未知错误'))
      }
    } catch (error: any) {
      alert('执行失败: ' + (error?.message || '请检查扩展是否已刷新'))
    } finally {
      setExecutingProfileId(null)
    }
  }

  const actionLabel = (action: string) => {
    const map: Record<string, string> = { click: t.actionClick, input: t.actionInput, select: t.actionSelect, navigate: t.actionNavigate, wait: t.actionWait }
    return map[action] || action
  }

  const saveConfig = async () => {
    setLoading(true)
    try {
      await chrome.runtime.sendMessage({ type: 'SAVE_AI_CONFIG', payload: config })
      await chrome.runtime.sendMessage({ type: 'SAVE_EXPORT_CONFIG', payload: exportConfig })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateField = <K extends keyof AIConfig>(field: K, value: AIConfig[K]) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const updateExportField = <K extends keyof ExportConfig>(field: K, value: ExportConfig[K]) => {
    setExportConfig(prev => ({ ...prev, [field]: value }))
  }

  const presets: Record<string, { baseURL: string; model: string }> = {
    openai: { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o' },
    claude: { baseURL: 'https://api.anthropic.com/v1', model: 'claude-3-sonnet-20240229' },
    deepseek: { baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
    zhipu: { baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
    kimi: { baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
    codex: { baseURL: 'https://api.openai.com/v1', model: 'codex' },
    custom: { baseURL: '', model: '' },
  }

  const handleProviderChange = (provider: AIConfig['provider']) => {
    const preset = presets[provider]
    setConfig({
      provider,
      apiKey: config.apiKey,
      baseURL: preset.baseURL,
      model: preset.model,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-3">
      {/* ====== 登录配置档案 ====== */}
      <h2 className="text-xs font-medium text-gray-300 mb-3">
        {t.loginProfilesCount.replace('{n}', String(loginProfiles.length))}
      </h2>
      <p className="text-[10px] text-gray-500 mb-2">
        {t.loginProfilesHint}
      </p>

      {loginProfiles.length === 0 ? (
        <div className="text-[10px] text-gray-600 mb-4 p-2 bg-gray-800 rounded border border-gray-700">
          {t.noLoginProfilesHint}
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {loginProfiles.map(profile => {
            const isExpanded = expandedProfileIds.has(profile.id)
            const sourceRecording = getSourceRecording(profile)

            return (
              <div
                key={profile.id}
                className="rounded border border-blue-800 bg-blue-900/10"
              >
                {/* 头部 */}
                <div className="p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                      <span className="shrink-0 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px]">
                        {t.loginConfigLabel}
                      </span>
                      <span className="text-xs font-medium text-blue-300 truncate">
                        {profile.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => executeLoginProfile(profile)}
                        disabled={executingProfileId === profile.id}
                        className={`text-[10px] px-2 py-0.5 rounded text-white transition-colors ${
                          executingProfileId === profile.id
                            ? 'bg-green-600 animate-pulse'
                            : 'bg-green-700 hover:bg-green-600'
                        }`}
                        title={t.executeProfile}
                      >
                        {executingProfileId === profile.id ? t.executingShort : `▶ ${t.executeProfile}`}
                      </button>
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="text-blue-400 hover:text-blue-300 text-[10px]"
                        title={t.deleteTitle}
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* 来源信息 */}
                  {sourceRecording?.steps[0]?.url && (
                    <div className="text-[10px] text-blue-400 mb-1 truncate" title={sourceRecording.steps[0].url}>
                      {sourceRecording.steps[0].url}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{profile.steps.length}{t.stepsLabel}</span>
                    <span>{new Date(profile.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>

                  {/* 展开/折叠 */}
                  <button
                    onClick={() => toggleExpand(profile.id)}
                    className="w-full mt-1 text-[10px] text-gray-500 hover:text-gray-300 py-1 text-center"
                  >
                    {isExpanded ? t.collapseSteps : t.expandSteps}
                  </button>
                </div>

                {/* 步骤详情 */}
                {isExpanded && (
                  <div className="border-t border-blue-800/50 p-2">
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {profile.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="text-[10px] rounded border border-gray-700 bg-gray-800/50 p-1.5"
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-gray-500">#{index + 1}</span>
                            <span className="font-medium text-gray-400">{actionLabel(step.action)}</span>
                          </div>
                          <div className="pl-4 space-y-0.5 text-gray-400">
                            <div className="break-all">
                              <span className="text-gray-600">选择器: </span>
                              <code className="text-gray-300 bg-gray-800 px-1 rounded">{step.target.selector}</code>
                            </div>
                            {step.target.xpath && (
                              <div className="break-all">
                                <span className="text-gray-600">XPath: </span>
                                <code className="text-gray-300 bg-gray-800 px-1 rounded">{step.target.xpath}</code>
                              </div>
                            )}
                            {step.value !== undefined && (
                              <div className="break-all">
                                <span className="text-gray-600">值: </span>
                                <code className="text-yellow-400 bg-gray-800 px-1 rounded">"{step.value}"</code>
                              </div>
                            )}
                            <div className="break-all">
                              <span className="text-gray-600">页面: </span>
                              <span className="text-gray-500">{step.url}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="border-t border-gray-700 mb-4" />

      {/* ====== 语言切换 ====== */}
      <h2 className="text-xs font-medium text-gray-300 mb-3">{t.settingsTitle}</h2>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[10px] text-gray-400">Language / 语言</span>
        <button
          onClick={toggleLang}
          className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors"
        >
          {lang === 'zh' ? '🇨🇳 中文' : '🇺🇸 English'}
        </button>
      </div>
      <div className="border-t border-gray-700 mb-4" />

      {/* ====== 导出配置 ====== */}
      <h2 className="text-xs font-medium text-gray-300 mb-3">{t.exportConfig}</h2>

      <div className="mb-4 flex items-center gap-2">
        <input
          id="autoOverwrite"
          type="checkbox"
          checked={exportConfig.autoOverwrite}
          onChange={(e) => updateExportField('autoOverwrite', e.target.checked)}
          className="w-3 h-3 accent-blue-500"
        />
        <label htmlFor="autoOverwrite" className="text-[10px] text-gray-400 cursor-pointer">
          {t.autoOverwrite}
        </label>
      </div>

      {/* 本地导出目录 */}
      <div className="mb-3">
        <label className="block text-[10px] text-gray-400 mb-1">{t.localExportDir}</label>
        {localDirName ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-green-400">📁 {localDirName}</span>
            <button onClick={removeLocalDir} className="text-[10px] text-red-400 hover:text-red-300">{t.removeDir}</button>
          </div>
        ) : (
          <button
            onClick={selectLocalDir}
            className="text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            📂 {t.selectLocalDir}
          </button>
        )}
        <p className="text-[10px] text-gray-600 mt-1">
          {t.localExportHint}
        </p>
      </div>

      <div className="border-t border-gray-700 mb-4" />

      <div className="border-t border-gray-700 mb-4" />

      {/* ====== AI 配置 ====== */}
      <h2 className="text-xs font-medium text-gray-300 mb-3">{t.aiConfig}</h2>

      {/* Provider */}
      <div className="mb-3">
        <label className="block text-[10px] text-gray-400 mb-1">{t.provider}</label>
        <select
          value={config.provider}
          onChange={(e) => handleProviderChange(e.target.value as AIConfig['provider'])}
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-[11px] text-gray-200 outline-none focus:border-blue-500"
        >
          <option value="openai">{t.openai}</option>
          <option value="claude">{t.claude}</option>
          <option value="deepseek">{t.deepseek}</option>
          <option value="zhipu">{t.zhipu}</option>
          <option value="kimi">{t.kimi}</option>
          <option value="codex">{t.codex}</option>
          <option value="custom">{t.custom}</option>
        </select>
      </div>

      {/* API Key */}
      <div className="mb-3">
        <label className="block text-[10px] text-gray-400 mb-1">{t.apiKey}</label>
        <input
          type="password"
          value={config.apiKey}
          onChange={(e) => updateField('apiKey', e.target.value)}
          placeholder="sk-..."
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-[11px] text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500"
        />
      </div>

      {/* Base URL */}
      <div className="mb-3">
        <label className="block text-[10px] text-gray-400 mb-1">Base URL（可选）</label>
        <input
          type="text"
          value={config.baseURL}
          onChange={(e) => updateField('baseURL', e.target.value)}
          placeholder="https://api.example.com/v1"
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-[11px] text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500"
        />
      </div>

      {/* Model */}
      <div className="mb-4">
        <label className="block text-[10px] text-gray-400 mb-1">{t.model}</label>
        <input
          type="text"
          value={config.model}
          onChange={(e) => updateField('model', e.target.value)}
          placeholder="gpt-4o / claude-3-sonnet / ..."
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-[11px] text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={saveConfig}
        disabled={loading}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors"
      >
        {loading ? t.saving : saved ? t.savedShort : t.save}
      </button>

      {/* Preset Hints */}
      <div className="mt-4 p-2 bg-gray-800 rounded border border-gray-700">
        <h3 className="text-[10px] font-medium text-gray-400 mb-1">{t.configTip}</h3>
        <div className="space-y-1 text-[10px] text-gray-500">
          <p>{t.configTip1}</p>
          <p>{t.configTip2}</p>
        </div>
      </div>
    </div>
  )
}
