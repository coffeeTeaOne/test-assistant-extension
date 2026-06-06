import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Lang, LocaleMessages } from './locales'
import { locales, getBrowserLang } from './locales'

const LANG_KEY = 'app_language'

interface I18nContextValue {
  lang: Lang
  t: LocaleMessages
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY)
      if (saved === 'zh' || saved === 'en') return saved
    } catch { /* ignore */ }
    return getBrowserLang()
  })

  // 初始化时同步到 chrome.storage.local（供 background 读取）
  useEffect(() => {
    try { chrome.storage.local.set({ [LANG_KEY]: lang }) } catch { /* ignore */ }
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    try { localStorage.setItem(LANG_KEY, newLang) } catch { /* ignore */ }
    try { chrome.storage.local.set({ [LANG_KEY]: newLang }) } catch { /* ignore */ }
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev: Lang) => {
      const next: Lang = prev === 'zh' ? 'en' : 'zh'
      try { localStorage.setItem(LANG_KEY, next) } catch { /* ignore */ }
      try { chrome.storage.local.set({ [LANG_KEY]: next }) } catch { /* ignore */ }
      return next
    })
  }, [])

  const t = locales[lang]

  return (
    <I18nContext.Provider value={{ lang, t, setLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
