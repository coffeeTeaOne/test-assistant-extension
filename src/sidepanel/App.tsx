import { useState } from 'react'
import TestCaseList from './components/TestCaseList'
import AIChatPanel from './components/AIChatPanel'
import SettingsPanel from './components/SettingsPanel'
import { I18nProvider, useI18n } from '../i18n/I18nContext'

type Tab = 'cases' | 'ai' | 'settings'

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('cases')
  const { t } = useI18n()

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'cases', label: t.tabCases, icon: '📋' },
    { key: 'ai', label: t.tabAI, icon: '💬' },
  ]

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐞</span>
          <span className="font-bold text-sm text-gray-100 leading-tight">{t.appName}</span>
          <span className="text-[10px] text-gray-400 leading-tight">{t.appSubtitle}</span>
        </div>
      </div>

      {/* Tab Navigation + 设置 */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2 text-xs transition-colors ${
            activeTab === 'settings'
              ? 'text-blue-400 bg-gray-700/50'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
          }`}
          title={t.tabSettings}
        >
          ⚙
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'cases' && <TestCaseList />}
        {activeTab === 'ai' && <AIChatPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}
