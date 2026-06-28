import { createContext } from 'react'
import { vi } from './locales/vi'
import type { Locale } from './types'

export const I18nContext = createContext({ locale: 'vi', t: vi, setLocale: (_: Locale) => {}, toggle: () => {} })
