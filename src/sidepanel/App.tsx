import { useState } from 'react'
import TestCaseList from './components/TestCaseList'
import AIChatPanel from './components/AIChatPanel'
import SettingsPanel from './components/SettingsPanel'

type Tab = 'cases' | 'ai' | 'settings'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('cases')

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'cases', label: '用例', icon: '📋' },
    { key: 'ai', label: 'AI', icon: '💬' },
  ]

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐞</span>
          <div className="flex flex-col">
            <h1 className="font-bold text-sm text-gray-100 leading-tight">七星瓢虫</h1>
            <span className="text-[10px] text-gray-400 leading-tight">测试智能助手V1.0版本</span>
          </div>
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
          title="设置"
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
