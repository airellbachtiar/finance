import { describe, it, expect } from 'vitest'
import { isLikelyInAppBrowser } from './in-app-browser'

const REAL_BROWSERS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

const IN_APP_BROWSERS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0.0.0]',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 Instagram 300.0.0.0',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36; wv)',
]

describe('isLikelyInAppBrowser', () => {
  it.each(REAL_BROWSERS)('does not flag a real mobile/desktop browser: %s', (ua) => {
    expect(isLikelyInAppBrowser(ua)).toBe(false)
  })

  it.each(IN_APP_BROWSERS)('flags a known in-app browser: %s', (ua) => {
    expect(isLikelyInAppBrowser(ua)).toBe(true)
  })
})
