import { useSyncExternalStore } from 'react'

// Site language: Portuguese by default, English from the US flag on the desk.
// ?lang=en|pt forces one (handy for links); the visitor's last choice is
// remembered in this browser.
const KEY = 'dellanio.lang'
const LANGS = ['pt', 'en']

function initial() {
  if (typeof location === 'undefined') return 'pt' // node (game tests)
  const forced = new URLSearchParams(location.search).get('lang')
  if (LANGS.includes(forced)) return forced
  try {
    const saved = localStorage.getItem(KEY)
    if (LANGS.includes(saved)) return saved
  } catch {
    // storage blocked: keep the default
  }
  return 'pt'
}

let lang = initial()
const listeners = new Set()
const applyDocument = () => {
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR'
}
applyDocument()

export const getLang = () => lang

// Subscribe to language changes; returns the unsubscribe function.
export const onLang = (listener) => (listeners.add(listener), () => listeners.delete(listener))

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return
  lang = next
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // storage blocked: the choice lasts for this visit only
  }
  applyDocument()
  listeners.forEach((l) => l(lang))
}

export const useLang = () => useSyncExternalStore(onLang, getLang)

// Pick the string for the current language.
export const tr = (pt, en) => (lang === 'en' ? en : pt)
