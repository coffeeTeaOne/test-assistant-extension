import { ScriptCode } from '../../shared/types'
import { useI18n } from '../../i18n/I18nContext'

interface ScriptViewerProps {
  script: ScriptCode
  recordingName: string
  onClose: () => void
}

export default function ScriptViewer({ script, recordingName, onClose }: ScriptViewerProps) {
  const { t } = useI18n()
  const copyToClipboard = () => {
    navigator.clipboard.writeText(script.code)
  }

  const downloadScript = () => {
    const blob = new Blob([script.code], { type: 'text/x-python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test_${recordingName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.py`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800">
        <div>
          <h3 className="text-xs font-medium text-gray-200">
            {script.framework === 'playwright' ? 'Playwright' : 'Selenium'} {t.scriptTitle}
          </h3>
          <p className="text-[10px] text-gray-400">
            {recordingName} · {script.mode === 'headless' ? t.headlessMode : t.guiMode}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={copyToClipboard}
            className="py-1 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors"
          >
            {t.copy}
          </button>
          <button
            onClick={downloadScript}
            className="py-1 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors"
          >
            {t.download}
          </button>
          <button
            onClick={onClose}
            className="py-1 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-[10px] transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="flex-1 overflow-auto p-3">
        <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap break-all">
          {script.code}
        </pre>
      </div>
    </div>
  )
}
