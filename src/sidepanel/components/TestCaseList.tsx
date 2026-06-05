import { useState, useEffect, useCallback, useRef } from 'react'
import { RecordingSession, ScriptCode, StepExecutionResult, LoginProfile, TestStep } from '../../shared/types'
import ScriptViewer from './ScriptViewer'
import { getLocalExportDir } from '../../storage/local-export'

export default function TestCaseList() {
  // ========== 录制控制状态（从 RecorderPanel 迁移）==========
  const [isRecording, setIsRecording] = useState(false)
  const [liveSteps, setLiveSteps] = useState<TestStep[]>([])
  const [liveSessionName, setLiveSessionName] = useState('')
  const [csError, setCsError] = useState<string | null>(null)

  // ========== 用例库状态（原有）==========
  const [recordings, setRecordings] = useState<RecordingSession[]>([])
  const [selectedRecording, setSelectedRecording] = useState<RecordingSession | null>(null)
  const [script, setScript] = useState<ScriptCode | null>(null)
  const [loading, setLoading] = useState(false)
  const [framework, setFramework] = useState<'playwright' | 'selenium'>('playwright')

  // 执行状态
  const [executing, setExecuting] = useState(false)
  const [execRecordingId, setExecRecordingId] = useState<string | null>(null)
  const [currentStepResults, setCurrentStepResults] = useState<StepExecutionResult[]>([])
  const abortExecRef = useRef(false)

  // 展开的用例ID集合
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // 编辑状态
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // 登录配置档案列表
  const [loginProfiles, setLoginProfiles] = useState<LoginProfile[]>([])
  // 每个用例选择的登录配置档案ID（recordingId -> profileId）
  const [selectedLoginProfileMap, setSelectedLoginProfileMap] = useState<Map<string, string>>(new Map())

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [filterUrl, setFilterUrl] = useState('')

  // ========== 录制控制函数 ==========
  const checkContentScript = async (): Promise<boolean> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) { setCsError('无法获取当前标签页'); return false }
      await chrome.tabs.sendMessage(tab.id, { type: 'PING' })
      setCsError(null)
      return true
    } catch {
      setCsError('当前页面的录制脚本未加载，请刷新页面后重试')
      return false
    }
  }

  const refreshPage = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) { await chrome.tabs.reload(tab.id); setCsError(null) }
  }

  const startRecording = useCallback(async () => {
    const ok = await checkContentScript()
    if (!ok) return
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'START_RECORDING' })
      if (response.success && response.data.session) {
        setIsRecording(true)
        setLiveSteps([])
        setLiveSessionName(response.data.session.name)
      }
    } catch (error) { console.error('Failed to start recording:', error) }
  }, [])

  const loadRecordings = useCallback(async () => {
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'GET_RECORDINGS' })
      if (response.success) {
        const sorted = [...response.data].sort((a: RecordingSession, b: RecordingSession) => b.createdAt - a.createdAt)
        setRecordings(sorted)
      }
    } catch (error) { console.error('Failed to load recordings:', error) }
  }, [])

  const stopRecording = useCallback(async () => {
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' })
      if (response.success) {
        setIsRecording(false)
        setLiveSteps([])
        setLiveSessionName('')
        loadRecordings()
      }
    } catch (error) { console.error('Failed to stop recording:', error) }
  }, [loadRecordings])

  const clearSteps = useCallback(() => { setLiveSteps([]) }, [])

  useEffect(() => { loadRecordings() }, [loadRecordings])

  // 监听录制更新
  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === 'RECORDING_UPDATED') {
        setIsRecording(message.payload.isRecording)
        setLiveSteps(message.payload.steps)
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  // ========== 用例管理（原有）==========
  const deleteRecording = useCallback(async (id: string) => {
    try {
      await chrome.runtime.sendMessage({ type: 'DELETE_RECORDING', payload: { id } })
      setRecordings(prev => prev.filter(r => r.id !== id))
      if (selectedRecording?.id === id) { setSelectedRecording(null); setScript(null) }
    } catch (error) { console.error('Failed to delete recording:', error) }
  }, [selectedRecording])

  const deleteStep = useCallback(async (recordingId: string, stepId: string) => {
    try {
      const recording = recordings.find(r => r.id === recordingId)
      if (!recording) return
      const updatedSteps = recording.steps.filter(s => s.id !== stepId)
      const updatedRecording = { ...recording, steps: updatedSteps, updatedAt: Date.now() }
      await chrome.runtime.sendMessage({ type: 'SAVE_RECORDING', payload: updatedRecording })
      setRecordings(prev => prev.map(r => r.id === recordingId ? updatedRecording : r))
      if (selectedRecording?.id === recordingId) setSelectedRecording(updatedRecording)
    } catch (error) { console.error('Failed to delete step:', error) }
  }, [recordings, selectedRecording])

  const updateRecordingName = useCallback(async (recordingId: string, newName: string) => {
    try {
      const recording = recordings.find(r => r.id === recordingId)
      if (!recording) return
      const updatedRecording = { ...recording, name: newName, updatedAt: Date.now() }
      await chrome.runtime.sendMessage({ type: 'SAVE_RECORDING', payload: updatedRecording })
      setRecordings(prev => prev.map(r => r.id === recordingId ? updatedRecording : r))
      if (selectedRecording?.id === recordingId) setSelectedRecording(updatedRecording)
    } catch (error) { console.error('Failed to update recording name:', error) }
  }, [recordings, selectedRecording])

  const updateStepField = useCallback(async (recordingId: string, stepId: string, fieldPath: string, newValue: string) => {
    try {
      const recording = recordings.find(r => r.id === recordingId)
      if (!recording) return
      const updatedSteps = recording.steps.map(s => {
        if (s.id !== stepId) return s
        const updated = { ...s, target: { ...s.target } }
        if (fieldPath === 'selector') updated.target.selector = newValue
        else if (fieldPath === 'xpath') updated.target.xpath = newValue
        else if (fieldPath === 'text') updated.target.text = newValue
        else if (fieldPath === 'aria') updated.target.aria = newValue
        else if (fieldPath === 'value') (updated as any).value = newValue
        else if (fieldPath === 'url') (updated as any).url = newValue
        return updated
      })
      const updatedRecording = { ...recording, steps: updatedSteps, updatedAt: Date.now() }
      await chrome.runtime.sendMessage({ type: 'SAVE_RECORDING', payload: updatedRecording })
      setRecordings(prev => prev.map(r => r.id === recordingId ? updatedRecording : r))
      if (selectedRecording?.id === recordingId) setSelectedRecording(updatedRecording)
    } catch (error) { console.error('Failed to update step field:', error) }
  }, [recordings, selectedRecording])

  const startEdit = (key: string, value: string) => { setEditingKey(key); setEditingValue(value) }
  const commitEdit = (recordingId: string, stepId: string, fieldPath: string) => {
    if (editingKey) updateStepField(recordingId, stepId, fieldPath, editingValue)
    setEditingKey(null); setEditingValue('')
  }
  const cancelEdit = () => { setEditingKey(null); setEditingValue('') }

  // ========== 登录配置（原有）==========
  const loadLoginProfiles = useCallback(async () => {
    try {
      const response: any = await chrome.runtime.sendMessage({ type: 'GET_LOGIN_PROFILES' })
      if (response.success && response.data) { setLoginProfiles(response.data) }
    } catch (error) { console.error('Failed to load login profiles:', error) }
  }, [])

  useEffect(() => { loadLoginProfiles() }, [loadLoginProfiles])

  const getLoginProfileForRecording = (recordingId: string) => loginProfiles.find(p => p.sourceRecordingId === recordingId)

  const saveAsLoginProfile = useCallback(async (recording: RecordingSession) => {
    const name = prompt('请为登录配置命名（如：管理系统登录）', recording.name)
    if (!name || !name.trim()) return
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_LOGIN_PROFILE',
        payload: { id: crypto.randomUUID(), name: name.trim(), steps: recording.steps, createdAt: Date.now(), sourceRecordingId: recording.id },
      })
      alert(`登录配置 "${name.trim()}" 已保存`)
      loadLoginProfiles()
    } catch (error) { console.error('Failed to save login profile:', error); alert('保存登录配置失败') }
  }, [loadLoginProfiles])

  const selectLoginProfile = (recordingId: string, profileId: string) => {
    setSelectedLoginProfileMap(prev => {
      const next = new Map(prev)
      if (profileId) next.set(recordingId, profileId)
      else next.delete(recordingId)
      return next
    })
  }

  // ========== 脚本与导出（原有）==========
  const generateScript = useCallback(async (recording: RecordingSession) => {
    setLoading(true)
    try {
      const response: any = await chrome.runtime.sendMessage({
        type: 'GENERATE_SCRIPT',
        payload: { sessionId: recording.id, framework, loginProfileId: selectedLoginProfileMap.get(recording.id) || '' }
      })
      if (response.success) { setScript(response.data.script); setSelectedRecording(recording); loadRecordings() }
      else { alert('生成脚本失败: ' + (response.error || '未知错误')) }
    } catch (error: any) { alert('生成脚本失败: ' + (error?.message || '请检查扩展是否已刷新')) }
    finally { setLoading(false) }
  }, [framework, loadRecordings, selectedLoginProfileMap])

  const exportJson = useCallback(async (recording: RecordingSession) => {
    try {
      const response: any = await Promise.race([
        chrome.runtime.sendMessage({ type: 'EXPORT_JSON', payload: { sessionId: recording.id, loginProfileId: selectedLoginProfileMap.get(recording.id) || '' } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('导出超时')), 5000))
      ])
      if (response?.success) {
        const filename = response.data?.filename || ''
        const content = response.data?.content || ''

        // 同时写入本地目录（如果已配置）
        let localSaved = false
        try {
          const localDir = await getLocalExportDir()
          if (localDir && content) {
            const fileHandle = await localDir.getFileHandle(filename, { create: true })
            const writable = await fileHandle.createWritable()
            await writable.write(content)
            await writable.close()
            localSaved = true
          }
        } catch (localErr: any) {
          console.warn('本地导出失败:', localErr)
        }

        const msg = localSaved
          ? `✅ JSON 已导出到两处:\n  ① 浏览器下载目录: ${filename}\n  ② 本地目录: ${filename}`
          : `✅ JSON 已导出: ${filename}\n\n请确认 Chrome 下载目录已设为 pytest_automation 工程根目录，或在设置中配置本地导出目录。`
        alert(msg)
      }
      else { alert('导出 JSON 失败: ' + (response?.error || '未知错误')) }
    } catch (error: any) { alert('导出 JSON 失败: ' + (error?.message || '请检查扩展是否已刷新')) }
  }, [selectedLoginProfileMap])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ========== 执行（原有）==========
  const ensureContentScript = async (tabId: number): Promise<boolean> => {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'PING' })
      return true
    } catch {
      const manifest = chrome.runtime.getManifest()
      const files = (manifest.content_scripts || []).flatMap((cs: any) => cs.js || [])
      for (const file of files) {
        try {
          await chrome.scripting.executeScript({ target: { tabId }, files: [file] })
          await new Promise(r => setTimeout(r, 1000))
          try { await chrome.tabs.sendMessage(tabId, { type: 'PING' }); return true } catch { }
        } catch { }
      }
      return false
    }
  }

  const saveExecutionResult = async (recordingId: string, result: RecordingSession['lastExecution']) => {
    try { await chrome.runtime.sendMessage({ type: 'UPDATE_RECORDING_EXECUTION', payload: { id: recordingId, lastExecution: result } }) }
    catch (e) { console.error('Failed to save execution result:', e) }
  }

  const executeRecording = useCallback(async (recording: RecordingSession) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) { alert('请先切换到目标页面标签'); return }
    const hasContentScript = await ensureContentScript(tab.id)
    if (!hasContentScript) { alert('无法注入页面脚本，请刷新页面后重试'); return }

    const firstStep = recording.steps[0]
    if (firstStep?.url && tab.id) {
      try {
        const currentUrl = tab.url || ''
        const targetUrl = firstStep.url
        if (!currentUrl.includes(targetUrl.split('?')[0])) {
          await chrome.tabs.update(tab.id, { url: targetUrl })
          await new Promise(r => setTimeout(r, 3000))
          const [newTab] = await chrome.tabs.query({ active: true, currentWindow: true })
          if (newTab?.id) await ensureContentScript(newTab.id)
        }
      } catch { }
    }

    setExecuting(true)
    setExecRecordingId(recording.id)
    setCurrentStepResults(recording.steps.map((_, i) => ({ stepIndex: i, status: 'pending' })))
    setExpandedIds(prev => new Set(prev).add(recording.id))
    abortExecRef.current = false

    let successCount = 0, errorCount = 0
    const stepResults: StepExecutionResult[] = []

    try {
      for (let i = 0; i < recording.steps.length; i++) {
        if (abortExecRef.current) break
        const step = recording.steps[i]
        setCurrentStepResults(prev => prev.map(r => r.stepIndex === i ? { ...r, status: 'running' } : r))
        await new Promise(r => setTimeout(r, 200))
        let result: StepExecutionResult = { stepIndex: i, status: 'pending' }
        try {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
          if (!activeTab?.id) throw new Error('无法获取当前标签页')
          const response = await chrome.tabs.sendMessage(activeTab.id, { type: 'EXECUTE_STEP', payload: { step, stepIndex: i, totalSteps: recording.steps.length, speed: 1200 } })
          if (response?.success) {
            successCount++
            result = { stepIndex: i, status: 'success', executedAt: Date.now() }
          } else {
            errorCount++
            result = { stepIndex: i, status: 'error', message: response?.error || '执行失败', executedAt: Date.now() }
          }
          setCurrentStepResults(prev => prev.map(r => r.stepIndex === i ? result : r))
        } catch (err: any) {
          errorCount++
          const msg = err.message?.includes('Could not establish connection') ? '页面已刷新或跳转，脚本断开' : err.message
          result = { stepIndex: i, status: 'error', message: msg, executedAt: Date.now() }
          setCurrentStepResults(prev => prev.map(r => r.stepIndex === i ? result : r))
        }
        stepResults.push(result)
        if (!abortExecRef.current) await new Promise(r => setTimeout(r, 400))
      }
    } finally {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (activeTab?.id) await chrome.tabs.sendMessage(activeTab.id, { type: 'CLEAR_HIGHLIGHT' }).catch(() => {})
      } catch (e) { }
      const finalResult = { executedAt: Date.now(), successCount, errorCount, stepResults: stepResults.length > 0 ? stepResults : currentStepResults }
      await saveExecutionResult(recording.id, finalResult)
      setRecordings(prev => prev.map(r => r.id === recording.id ? { ...r, lastExecution: finalResult } : r))
      setExecuting(false)
      setExecRecordingId(null)
    }
  }, [currentStepResults])

  const stopExecution = useCallback(() => {
    abortExecRef.current = true
    setExecuting(false)
    setExecRecordingId(null)
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHT' }).catch(() => {})
    })
  }, [])

  // ========== 辅助函数（原有）==========
  const getStepCount = (recording: RecordingSession) => recording.steps.length
  const actionLabel = (action: string) => {
    const map: Record<string, string> = { click: '点击', input: '输入', select: '选择', navigate: '跳转', wait: '等待' }
    return map[action] || action
  }
  const getExecutionResults = (recording: RecordingSession): StepExecutionResult[] | null => {
    if (execRecordingId === recording.id && currentStepResults.length > 0) return currentStepResults
    if (recording.lastExecution?.stepResults) return recording.lastExecution.stepResults
    return null
  }
  const getExecSummary = (recording: RecordingSession): string | null => {
    if (execRecordingId === recording.id) return null
    if (recording.lastExecution) {
      const { successCount, errorCount } = recording.lastExecution
      const total = successCount + errorCount
      return errorCount > 0 ? `${total}步: ${successCount}成功, ${errorCount}失败` : `${total}步全部成功`
    }
    return null
  }

  const renderEditableField = (recordingId: string, stepId: string | null, fieldPath: string, label: string, value: string | undefined, codeStyle = false) => {
    const key = stepId ? `${stepId}:${fieldPath}` : `${recordingId}:${fieldPath}`
    const displayValue = value || ''
    if (editingKey === key) {
      return (
        <div className="flex items-center gap-1" key={key}>
          <span className="text-gray-500 min-w-[3em]">{label}:</span>
          <input autoFocus className={`flex-1 min-w-0 bg-gray-900 border border-blue-500 rounded px-1 py-0.5 text-[10px] text-gray-200 outline-none ${codeStyle ? 'font-mono' : ''}`} value={editingValue} onChange={e => setEditingValue(e.target.value)}
            onBlur={() => {
              if (stepId) commitEdit(recordingId, stepId, fieldPath)
              else if (fieldPath === 'name') updateRecordingName(recordingId, editingValue)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (stepId) commitEdit(recordingId, stepId, fieldPath)
                else if (fieldPath === 'name') updateRecordingName(recordingId, editingValue)
              } else if (e.key === 'Escape') cancelEdit()
            }}
          />
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1 cursor-pointer hover:text-blue-300" key={key} onClick={() => startEdit(key, displayValue)}>
        <span className="text-gray-500 min-w-[3em]">{label}:</span>
        <span className={`text-gray-300 truncate ${codeStyle ? 'font-mono text-[9px]' : ''} ${!value ? 'text-gray-600 italic' : ''}`}>{displayValue || '(空)'}</span>
      </div>
    )
  }

  const getActionLabelForLive = (action: string) => {
    const labels: Record<string, string> = { click: '点击', input: '输入', select: '选择', navigate: '导航', wait: '等待' }
    return labels[action] || action
  }

  const getTargetSummary = (step: TestStep) => {
    if (step.target.text) return step.target.text
    if (step.target.aria) return step.target.aria
    const sel = step.target.selector
    return sel.length > 40 ? sel.substring(0, 40) + '...' : sel
  }

  // 计算筛选后的用例列表
  const allUrls = Array.from(new Set(recordings.flatMap(r => r.steps.map(s => s.url).filter(Boolean)))).sort()
  const filteredRecordings = recordings
    .filter(r => !getLoginProfileForRecording(r.id))
    .filter(r => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(r => !filterUrl || r.steps.some(s => s.url === filterUrl))

  return (
    <div className="flex flex-col h-full">
      {/* 录制控制区（新增） */}
      <div className="p-3 border-b border-gray-700 shrink-0">
        <div className="flex gap-2 mb-2">
          {!isRecording ? (
            <button onClick={startRecording} className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> 开始录制
            </button>
          ) : (
            <button onClick={stopRecording} className="flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs font-medium transition-colors">⏹ 停止录制</button>
          )}
          <button onClick={clearSteps} disabled={liveSteps.length === 0} className="py-2 px-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-gray-300 rounded text-xs transition-colors">清空</button>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            录制中... 已记录 {liveSteps.length} 个步骤
          </div>
        )}
        {liveSessionName && !isRecording && <div className="text-xs text-gray-400 mt-1">最后录制: {liveSessionName}</div>}
        {csError && (
          <div className="mt-2 p-2 bg-red-900/30 border border-red-800 rounded text-[11px]">
            <p className="text-red-400 mb-1">⚠️ {csError}</p>
            <button onClick={refreshPage} className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] transition-colors">🔄 刷新当前页面</button>
          </div>
        )}
        {/* 实时步骤预览 */}
        {liveSteps.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
            {liveSteps.map((step, i) => (
              <div key={step.id} className="p-1.5 bg-gray-800 rounded border border-gray-700 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-blue-400">#{i + 1} {getActionLabelForLive(step.action)}</span>
                  <span className="text-gray-500">{new Date(step.timestamp).toLocaleTimeString('zh-CN')}</span>
                </div>
                <div className="text-gray-300 truncate">{getTargetSummary(step)}</div>
                {step.value && <div className="text-gray-400">值: {step.value.length > 20 ? step.value.substring(0, 20) + '...' : step.value}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 用例列表头部（原有） */}
      <div className="p-3 border-b border-gray-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-200">测试用例 ({filteredRecordings.length})</h2>
          <button onClick={loadRecordings} className="text-gray-500 hover:text-gray-300 text-xs p-1" title="刷新">🔄</button>
        </div>
        {/* 搜索和筛选 */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 搜索用例名称..."
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-gray-300 placeholder-gray-500 outline-none focus:border-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={filterUrl}
              onChange={e => setFilterUrl(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-gray-300 outline-none focus:border-blue-500"
            >
              <option value="">📍 全部页面 URL</option>
              {allUrls.map(url => (
                <option key={url} value={url}>{url.replace(/^https?:\/\//, '').substring(0, 40)}{url.replace(/^https?:\/\//, '').length > 40 ? '...' : ''}</option>
              ))}
            </select>
            {filterUrl && (
              <button onClick={() => setFilterUrl('')} className="text-gray-500 hover:text-gray-300 text-xs px-1">✕</button>
            )}
          </div>
        </div>
        <div className="mt-2">
          <select value={framework} onChange={e => setFramework(e.target.value as 'playwright' | 'selenium')} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-gray-300 outline-none focus:border-blue-500">
            <option value="playwright">Playwright</option>
            <option value="selenium">Selenium</option>
          </select>
        </div>
      </div>

      {/* 用例列表（原有扁平列表） */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
            <span className="text-2xl mb-2">📋</span>
            <p>{searchQuery || filterUrl ? '没有匹配的用例' : '暂无录制用例'}</p>
            <p className="mt-1">{searchQuery || filterUrl ? '请调整搜索条件' : '点击上方"开始录制"在页面上操作'}</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredRecordings.map((recording) => {
              const isExpanded = expandedIds.has(recording.id)
              const execResults = getExecutionResults(recording)
              const execSummary = getExecSummary(recording)
              const isExecutingThis = execRecordingId === recording.id
              return (
                <div key={recording.id} className={`rounded border transition-colors ${selectedRecording?.id === recording.id ? 'bg-gray-700 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}>
                  <div className="p-2">
                    <div className="flex items-center justify-between mb-1">
                      {renderEditableField(recording.id, null, 'name', '名称', recording.name)}
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => executeRecording(recording)} disabled={executing} className={`text-[10px] px-2 py-0.5 rounded text-white transition-colors ${isExecutingThis ? 'bg-green-600 animate-pulse' : 'bg-green-700 hover:bg-green-600 disabled:opacity-50'}`} title="执行用例">{isExecutingThis ? '▶' : '▶ 执行'}</button>
                        <button onClick={() => saveAsLoginProfile(recording)} className="text-gray-500 hover:text-blue-400 text-[10px]" title="保存为登录配置">💾</button>
                        <button onClick={() => deleteRecording(recording.id)} className="text-blue-400 hover:text-blue-300 text-[10px]" title="删除用例">🗑</button>
                      </div>
                    </div>
                    {recording.steps[0]?.url && <div className="text-[10px] text-blue-400 mb-1 truncate" title={recording.steps[0].url}>{recording.steps[0].url}</div>}
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                      <span>{getStepCount(recording)} 个步骤</span>
                      <span>{new Date(recording.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {execSummary && <div className={`text-[10px] mb-2 px-2 py-1 rounded ${execSummary.includes('失败') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>{execSummary}</div>}
                    {loginProfiles.length > 0 && (
                      <div className="mb-1.5">
                        <select value={selectedLoginProfileMap.get(recording.id) || ''} onChange={e => selectLoginProfile(recording.id, e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-gray-300 outline-none focus:border-blue-500">
                          <option value="">不附带登录</option>
                          {loginProfiles.map(p => <option key={p.id} value={p.id}>登录: {p.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <button onClick={() => generateScript(recording)} disabled={loading || executing} className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-[10px] transition-colors">{loading && selectedRecording?.id === recording.id ? '生成中...' : '生成脚本'}</button>
                      <button onClick={() => exportJson(recording)} disabled={executing} className="flex-1 py-1 px-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded text-[10px] transition-colors">JSON自动化配置下载</button>
                      {recording.generatedScript && <button onClick={() => { setScript(recording.generatedScript!); setSelectedRecording(recording) }} className="py-1 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors">查看</button>}
                    </div>
                    <button onClick={() => toggleExpand(recording.id)} className="w-full mt-1 text-[10px] text-gray-500 hover:text-gray-300 py-1 text-center">{isExpanded ? '▲ 收起详情' : '▼ 展开步骤详情'}</button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-700 p-2">
                      {isExecutingThis && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-blue-400 animate-pulse">正在执行...</span>
                          <button onClick={stopExecution} className="text-[10px] text-red-400 hover:text-red-300">⏹ 停止</button>
                        </div>
                      )}
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {recording.steps.map((step, index) => {
                          const result = execResults?.find(r => r.stepIndex === index)
                          const status = result?.status || 'pending'
                          return (
                            <div key={step.id} className={`text-[10px] rounded border p-1.5 ${status === 'running' ? 'border-blue-500 bg-blue-900/20' : status === 'success' ? 'border-green-600 bg-green-900/10' : status === 'error' ? 'border-red-600 bg-red-900/10' : 'border-gray-700 bg-gray-800/50'}`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-mono text-gray-500">#{index + 1}</span>
                                <span>{status === 'pending' ? '○' : status === 'running' ? '▶' : status === 'success' ? '✅' : '❌'}</span>
                                <span className={`font-medium ${status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : status === 'running' ? 'text-blue-400' : 'text-gray-400'}`}>{actionLabel(step.action)}</span>
                                {result?.executedAt && <span className="text-gray-600 ml-auto">{new Date(result.executedAt).toLocaleTimeString('zh-CN')}</span>}
                                {!isExecutingThis && <button onClick={() => deleteStep(recording.id, step.id)} className="text-gray-600 hover:text-red-400 ml-1" title="删除步骤">✕</button>}
                              </div>
                              <div className="pl-4 space-y-0.5">
                                {renderEditableField(recording.id, step.id, 'selector', '选择器', step.target.selector, true)}
                                {renderEditableField(recording.id, step.id, 'xpath', 'XPath', step.target.xpath, true)}
                                {step.value !== undefined && renderEditableField(recording.id, step.id, 'value', '值', step.value, true)}
                                {renderEditableField(recording.id, step.id, 'text', '文本', step.target.text)}
                                {renderEditableField(recording.id, step.id, 'aria', 'ARIA', step.target.aria)}
                                {renderEditableField(recording.id, step.id, 'url', '页面', step.url)}
                              </div>
                              {result?.message && status === 'error' && <div className="mt-1 pl-4 text-red-400 text-[10px] break-all border-t border-red-900/30 pt-1">错误: {result.message}</div>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Script Viewer Modal */}
      {script && selectedRecording && (
        <ScriptViewer script={script} recordingName={selectedRecording.name} onClose={() => { setScript(null); setSelectedRecording(null) }} />
      )}
    </div>
  )
}
