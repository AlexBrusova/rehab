import { en } from '../i18n/en'
import { he } from '../i18n/he'

const dicts = { en, he }

/**
 * @param {string} lang - locale code ('en' | 'he')
 * @returns {{ t: (key: string) => string, dir: 'ltr' | 'rtl' }}
 */
export default function useLang(lang) {
  const dict = dicts[lang] ?? dicts.en
  const t = (key) => {
    const val = key.split('.').reduce((o, k) => o?.[k], dict)
    return typeof val === 'string' ? val : key
  }
  const dir = lang === 'he' ? 'rtl' : 'ltr'
  return { t, dir }
}
