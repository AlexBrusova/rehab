import { describe, it, expect } from 'vitest'
import { en } from './en.js'
import { he } from './he.js'

function flatKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return typeof v === 'object' && v !== null ? flatKeys(v, key) : [key]
  })
}

function flatEntries(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return typeof v === 'object' && v !== null ? flatEntries(v, key) : [[key, v]]
  })
}

const enKeys = flatKeys(en)
const heKeys = flatKeys(he)

describe('he.js structure matches en.js', () => {
  it('has no missing keys', () => {
    const missing = enKeys.filter(k => !heKeys.includes(k))
    expect(missing, `Missing keys in he.js: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('has no extra keys', () => {
    const extra = heKeys.filter(k => !enKeys.includes(k))
    expect(extra, `Extra keys in he.js: ${extra.join(', ')}`).toHaveLength(0)
  })

  it('has no empty string values', () => {
    const empty = flatEntries(he)
      .filter(([, v]) => typeof v === 'string' && v.trim() === '')
      .map(([k]) => k)
    expect(empty, `Empty values in he.js: ${empty.join(', ')}`).toHaveLength(0)
  })

  it('preserves {placeholder} tokens from en.js', () => {
    const tokenRegex = /\{[^}]+\}/g
    const mismatches = []
    for (const [key, enVal] of flatEntries(en)) {
      const enTokens = enVal.match(tokenRegex) ?? []
      if (enTokens.length === 0) continue
      const heVal = flatEntries(he).find(([k]) => k === key)?.[1] ?? ''
      const heTokens = heVal.match(tokenRegex) ?? []
      const missing = enTokens.filter(t => !heTokens.includes(t))
      if (missing.length) mismatches.push(`${key}: missing ${missing.join(', ')}`)
    }
    expect(mismatches, mismatches.join('\n')).toHaveLength(0)
  })
})
