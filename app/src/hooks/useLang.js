import { en } from '../i18n/en'
import { he } from '../i18n/he'

const dicts = { en, he }

export function useLang(lang) {
  const dict = dicts[lang] ?? dicts.en
  const t = (key) => key.split('.').reduce((o, k) => o?.[k], dict) ?? key
  const dir = lang === 'he' ? 'rtl' : 'ltr'
  return { t, dir }
}
