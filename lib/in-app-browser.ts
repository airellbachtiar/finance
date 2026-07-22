// In-app browsers (the built-in WebView inside chat/social apps) block Google's
// OAuth consent screen outright ("Error 403: disallowed_useragent") — this is
// Google policy, not something fixable from our side. These are the most common
// culprits for links shared in a family chat.
const IN_APP_BROWSER_PATTERNS = [
  /FBAN|FBAV/i, // Facebook
  /Instagram/i,
  /Line\//i, // LINE
  /MicroMessenger/i, // WeChat
  /TikTok/i,
  /Twitter/i,
  /\bwv\b/i, // generic Android WebView marker
]

export function isLikelyInAppBrowser(userAgent: string): boolean {
  return IN_APP_BROWSER_PATTERNS.some((pattern) => pattern.test(userAgent))
}
