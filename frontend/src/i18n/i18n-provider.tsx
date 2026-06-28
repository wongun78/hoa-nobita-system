import { useEffect, useMemo, useState } from 'react'
import { ko } from './locales/ko'
import { vi } from './locales/vi'
import { I18nContext } from './i18n-context'
import type { Locale } from './types'

const dictionaries = { vi, ko }

type I18nProviderProps = Readonly<{ children: React.ReactNode }>

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>((localStorage.getItem('locale') as Locale) || 'vi')
  useEffect(() => {
    localStorage.setItem('locale', locale)
    document.documentElement.lang = locale
  }, [locale])
  const value = useMemo(() => ({ locale, t: dictionaries[locale], setLocale, toggle: () => setLocale(locale === 'vi' ? 'ko' : 'vi') }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
