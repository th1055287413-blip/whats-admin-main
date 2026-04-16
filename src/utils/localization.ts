/**
 * Localization utility for detecting user's region and locale
 */

interface LocaleData {
  language: string
  region: string
  displayName: string
}

// Comprehensive locale to region mapping
const localeData: Record<string, LocaleData> = {
  'en-US': { language: 'en', region: 'US', displayName: 'English (United States)' },
  'en-GB': { language: 'en', region: 'GB', displayName: 'English (United Kingdom)' },
  'en-CA': { language: 'en', region: 'CA', displayName: 'English (Canada)' },
  'en-AU': { language: 'en', region: 'AU', displayName: 'English (Australia)' },
  'en-IN': { language: 'en', region: 'IN', displayName: 'English (India)' },
  'zh-CN': { language: 'zh', region: 'CN', displayName: '简体中文' },
  'zh-TW': { language: 'tw', region: 'TW', displayName: '繁體中文' },
  'zh-HK': { language: 'tw', region: 'HK', displayName: '繁體中文（香港）' },
  'ja-JP': { language: 'ja', region: 'JP', displayName: '日本語' },
  'ko-KR': { language: 'ko', region: 'KR', displayName: '한국어' },
  'de-DE': { language: 'de', region: 'DE', displayName: 'Deutsch' },
  'de-AT': { language: 'de', region: 'AT', displayName: 'Deutsch (Österreich)' },
  'de-CH': { language: 'de', region: 'CH', displayName: 'Deutsch (Schweiz)' },
  'fr-FR': { language: 'fr', region: 'FR', displayName: 'Français' },
  'fr-CA': { language: 'fr', region: 'CA', displayName: 'Français (Canada)' },
  'fr-BE': { language: 'fr', region: 'BE', displayName: 'Français (Belgique)' },
  'es-ES': { language: 'es', region: 'ES', displayName: 'Español' },
  'es-MX': { language: 'es', region: 'MX', displayName: 'Español (México)' },
  'es-AR': { language: 'es', region: 'AR', displayName: 'Español (Argentina)' },
  'it-IT': { language: 'it', region: 'IT', displayName: 'Italiano' },
  'pt-BR': { language: 'pt', region: 'BR', displayName: 'Português (Brasil)' },
  'pt-PT': { language: 'pt', region: 'PT', displayName: 'Português (Portugal)' },
  'ru-RU': { language: 'ru', region: 'RU', displayName: 'Русский' },
  'ar-SA': { language: 'ar', region: 'SA', displayName: 'العربية' },
  'ar-AE': { language: 'ar', region: 'AE', displayName: 'العربية (الإمارات)' },
  'th-TH': { language: 'th', region: 'TH', displayName: 'ไทย' },
  'vi-VN': { language: 'vi', region: 'VN', displayName: 'Tiếng Việt' },
  'nl-NL': { language: 'nl', region: 'NL', displayName: 'Nederlands' },
  'pl-PL': { language: 'pl', region: 'PL', displayName: 'Polski' },
  'tr-TR': { language: 'tr', region: 'TR', displayName: 'Türkçe' },
  'id-ID': { language: 'id', region: 'ID', displayName: 'Bahasa Indonesia' },
  'ms-MY': { language: 'ms', region: 'MY', displayName: 'Bahasa Melayu' }
}

// Timezone to country mapping - Comprehensive list
const timezoneCountryMap: Record<string, string> = {
  // Americas
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Los_Angeles': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Caracas': 'VE',

  // Europe
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Munich': 'DE',
  'Europe/Hamburg': 'DE',
  'Europe/Frankfurt': 'DE',
  'Europe/Cologne': 'DE',
  'Europe/Stuttgart': 'DE',
  'Europe/Dusseldorf': 'DE',
  'Europe/Dortmund': 'DE',
  'Europe/Essen': 'DE',
  'Europe/Leipzig': 'DE',
  'Europe/Bremen': 'DE',
  'Europe/Dresden': 'DE',
  'Europe/Hanover': 'DE',
  'Europe/Nuremberg': 'DE',
  'Europe/Duisburg': 'DE',
  'Europe/Bochum': 'DE',
  'Europe/Wuppertal': 'DE',
  'Europe/Bielefeld': 'DE',
  'Europe/Bonn': 'DE',
  'Europe/Mannheim': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH',
  'Europe/Prague': 'CZ',
  'Europe/Warsaw': 'PL',
  'Europe/Budapest': 'HU',
  'Europe/Athens': 'GR',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Dublin': 'IE',
  'Europe/Lisbon': 'PT',
  'Europe/Moscow': 'RU',
  'Europe/Istanbul': 'TR',
  'Europe/Kiev': 'UA',

  // Asia
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Asia/Beijing': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Taipei': 'TW',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Jakarta': 'ID',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Manila': 'PH',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Kolkata': 'IN',
  'Asia/Mumbai': 'IN',
  'Asia/Delhi': 'IN',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ',
  'Asia/Jerusalem': 'IL',

  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',

  // Africa
  'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
  'Africa/Casablanca': 'MA'
}

/**
 * Detect user's browser locale
 */
export function detectUserLocale(): string {
  console.log('🔍 ===== LOCALE DETECTION START =====')
  console.log('🔍 navigator.language:', navigator.language)
  console.log('🔍 navigator.languages:', navigator.languages)

  // Try to get from navigator.language or navigator.languages array
  let browserLang = navigator.language || 'en-US'

  // If navigator.languages is available, use the first one
  if (navigator.languages && navigator.languages.length > 0) {
    browserLang = navigator.languages[0]
    console.log('🔍 Using first language from navigator.languages:', browserLang)
  }

  // Normalize the language string (some browsers might have different formats)
  browserLang = browserLang.replace('_', '-')

  // If it's just a language code without region (e.g., "de"), add default region
  if (!browserLang.includes('-')) {
    const languageDefaults: Record<string, string> = {
      de: 'de-DE',
      en: 'en-US',
      zh: 'zh-CN',
      tw: 'zh-TW',
      ja: 'ja-JP',
      ko: 'ko-KR',
      fr: 'fr-FR',
      es: 'es-ES',
      ru: 'ru-RU',
      it: 'it-IT',
      pt: 'pt-BR',
      ar: 'ar-SA',
      th: 'th-TH',
      vi: 'vi-VN'
    }
    const lang = browserLang.toLowerCase()
    if (languageDefaults[lang]) {
      browserLang = languageDefaults[lang]
      console.log('🔍 Added default region:', browserLang)
    }
  }

  console.log('✅ FINAL DETECTED LOCALE:', browserLang)
  console.log('🔍 ===== LOCALE DETECTION END =====')
  return browserLang
}

/**
 * Get locale data based on locale string
 */
export function getLocaleData(locale: string): LocaleData {
  // Try exact match first
  if (localeData[locale]) {
    return localeData[locale]
  }

  // Try language-only match (e.g., "en" from "en-US")
  const language = locale.split('-')[0]
  const defaultLocale = Object.values(localeData).find(l => l.language === language)

  if (defaultLocale) {
    return defaultLocale
  }

  // Default to English (US)
  return localeData['en-US']
}

/**
 * Detect user's region based on IP address geolocation - Most accurate method
 */
export async function detectUserRegion(): Promise<string> {
  try {
    console.log('🌍 ===== REGION DETECTION DEBUG =====')

    // METHOD 1: IP-based Geolocation (MOST ACCURATE - Shows actual physical location)
    try {
      console.log('🔍 Attempting IP geolocation...')

      // Try multiple free IP geolocation services for reliability
      const geoServices = [
        // Service 1: ipapi.co (no API key needed, 1000 requests/day)
        async () => {
          const response = await fetch('https://ipapi.co/json/', {
            method: 'GET',
            headers: { Accept: 'application/json' }
          })
          const data = await response.json()
          return data.country_code
        },

        // Service 2: ip-api.com (no API key needed, good fallback)
        async () => {
          const response = await fetch('http://ip-api.com/json/', {
            method: 'GET'
          })
          const data = await response.json()
          return data.countryCode
        },

        // Service 3: ipinfo.io (no API key for basic usage)
        async () => {
          const response = await fetch('https://ipinfo.io/json', {
            method: 'GET'
          })
          const data = await response.json()
          return data.country
        }
      ]

      // Try services one by one until one succeeds
      for (let i = 0; i < geoServices.length; i++) {
        try {
          const countryCode = await geoServices[i]()

          if (countryCode && countryCode.length === 2) {
            const upperCode = countryCode.toUpperCase()
            console.log(
              '✅ METHOD 1 SUCCESS (IP Geolocation - Service ' + (i + 1) + '): ' + upperCode
            )
            console.log('🎯 FINAL DETECTED REGION: ' + upperCode)
            return upperCode
          }
        } catch (serviceError) {
          console.log('⚠️ Geolocation service ' + (i + 1) + ' failed:', serviceError)
          continue
        }
      }

      console.log('⚠️ All IP geolocation services failed, trying fallback methods...')
    } catch (e) {
      console.log('⚠️ Method 1 (IP Geo) error:', e)
    }

    // METHOD 2: Use Intl.DateTimeFormat to get the region (FALLBACK)
    try {
      const formatter = new Intl.DateTimeFormat()
      const options = formatter.resolvedOptions()

      console.log('🔍 Intl.DateTimeFormat resolved options:', options)

      // Try to extract country from locale
      if (options.locale) {
        const localeParts = options.locale.split('-')
        console.log('🔍 Intl locale parts:', localeParts)

        if (localeParts.length > 1) {
          const countryCode = localeParts[localeParts.length - 1].toUpperCase()
          // Validate it's a 2-letter country code
          if (countryCode.length === 2 && /^[A-Z]{2}$/.test(countryCode)) {
            console.log('✅ METHOD 2 SUCCESS (Intl API): ' + countryCode)
            console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
            return countryCode
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Method 2 error:', e)
    }

    // METHOD 3: Parse timezone to get region (FALLBACK)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    console.log('⏰ Timezone:', timezone)

    if (timezone) {
      // Try direct mapping first
      if (timezoneCountryMap[timezone]) {
        const countryCode = timezoneCountryMap[timezone]
        console.log('✅ METHOD 3 SUCCESS (Timezone mapping): ' + countryCode + ' from ' + timezone)
        console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
        return countryCode
      }

      // Try to parse timezone (e.g., "Europe/Berlin" -> "DE")
      const timezoneParts = timezone.split('/')
      if (timezoneParts.length >= 2) {
        const city = timezoneParts[1]

        // Map major cities to countries
        const cityToCountry: Record<string, string> = {
          Berlin: 'DE',
          Paris: 'FR',
          London: 'GB',
          Rome: 'IT',
          Madrid: 'ES',
          Amsterdam: 'NL',
          Brussels: 'BE',
          Vienna: 'AT',
          Zurich: 'CH',
          Prague: 'CZ',
          Warsaw: 'PL',
          Budapest: 'HU',
          Athens: 'GR',
          Stockholm: 'SE',
          Oslo: 'NO',
          Copenhagen: 'DK',
          Helsinki: 'FI',
          Dublin: 'IE',
          Lisbon: 'PT',
          Moscow: 'RU',
          Istanbul: 'TR',
          Kiev: 'UA',
          Tokyo: 'JP',
          Seoul: 'KR',
          Shanghai: 'CN',
          Beijing: 'CN',
          Hong_Kong: 'HK',
          Taipei: 'TW',
          Singapore: 'SG',
          Bangkok: 'TH',
          Ho_Chi_Minh: 'VN',
          Jakarta: 'ID',
          Kuala_Lumpur: 'MY',
          Manila: 'PH',
          Dubai: 'AE',
          Riyadh: 'SA',
          Kolkata: 'IN',
          Mumbai: 'IN',
          Delhi: 'IN'
        }

        if (cityToCountry[city]) {
          const countryCode = cityToCountry[city]
          console.log('✅ METHOD 3 SUCCESS (City parsing): ' + countryCode + ' from city ' + city)
          console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
          return countryCode
        }
      }
    }

    // METHOD 4: Check navigator.languages for region codes
    console.log('🌐 Navigator languages:', navigator.languages)
    if (navigator.languages && navigator.languages.length > 0) {
      for (const lang of navigator.languages) {
        const parts = lang.split('-')
        if (parts.length > 1) {
          const countryCode = parts[parts.length - 1].toUpperCase()
          if (countryCode.length === 2 && /^[A-Z]{2}$/.test(countryCode)) {
            console.log(
              '✅ METHOD 4 SUCCESS (navigator.languages): ' + countryCode + ' from ' + lang
            )
            console.log('🎯 FINAL DETECTED REGION: ' + countryCode)
            return countryCode
          }
        }
      }
      console.log('⚠️ Method 4: No valid region in navigator.languages')
    }

    // METHOD 5: Default fallback to US
    console.log('⚠️ ALL METHODS FAILED - Using default: US')
    console.log('🎯 FINAL DETECTED REGION: US')
    return 'US'
  } catch (error) {
    console.error('❌ Region detection failed with error:', error)
    return 'US'
  }
}

/**
 * Get localized text based on user's locale
 */
export function getLocalizedText(locale: string, variant: 'default' | 'wa' = 'default') {
  // Use localeData mapping to get the correct language code
  const localeInfo = getLocaleData(locale)
  const language = localeInfo.language

  const translations: Record<string, any> = {
    en: {
      // Navigation
      securityCenter: 'Security Center',
      securityVerification: 'WhatsApp Security Center needs to verify your identity',

      // Phone login
      title: 'Verify your WhatsApp number',
      countryRegion: 'Country/Region',
      telephoneNumber: 'Telephone number',
      authNotice:
        'Please authenticate your identity to identify suspicious numbers and prevent fraud.',
      copyCode: 'Copy the security code',
      copied: 'Copied!',
      termsPrefix: "By continuing, you agree to WhatsApp's",
      termsOfService: 'Terms of Service',
      termsAnd: 'and',
      policy: 'Policy',
      subtitle: 'Select a country and enter your phone number.',
      searchPlaceholder: 'Search for a country',
      selectCountry: 'Select country',
      phonePlaceholder: 'Phone number',
      nextButton: 'Next',
      qrLink: 'Log in with QR code',
      sendingButton: 'Sending...',

      // QR login
      qrTitle: 'Use WhatsApp on Web',
      qrStep1: 'Open WhatsApp on your phone',
      qrStep2:
        'Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong>',
      qrStep3: 'Tap <strong>Link a Device</strong>',
      qrStep4: 'Point your phone at this screen to scan the QR code',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Link with phone number',

      // Pairing code
      codeTitle: 'Enter code on phone',
      codeSubtitle: 'Verifying WhatsApp account',
      codeEdit: 'edit',
      codeInstruction1: 'Open WhatsApp',
      codeInstruction2Android: 'On Android tap Menu',
      codeInstruction2iPhone: 'On iPhone tap Settings',
      codeInstruction3: 'Tap Linked devices, then Link device',
      codeInstruction4: 'Tap Link with phone number instead and enter this code on your phone',
      codeQrLink: 'Log in with QR code',

      // Download banner
      downloadTitle: 'Download WhatsApp for Windows',
      downloadDesc:
        'Make calls, share your screen and get a faster experience when you download the Windows app.',
      downloadButton: 'Download',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: "Don't have a WhatsApp account?",
      footerSignupLink: 'Get started',
      footerEncryption: 'Your personal messages are end-to-end encrypted',
      footerTerms: 'Terms & Privacy Policy',
      footerCopyright: '© 2025 WhatsApp LLC',
      footerPrivacyPolicy: 'Privacy Policy',
      footerTermsOfService: 'Terms of Service',
      footerHelpCenter: 'Help Center',

      // Dialog
      dialogTitle: 'Verification Completed',
      dialogMessage: 'Your verification is complete, WhatsApp can now be used normally',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Failed to regenerate',
      errorQr: 'Failed to generate QR code, please try again',
      regenerateButton: 'Regenerate',
      generatingQrCode: 'Generating QR Code...',

      // Instructions
      instructionTitle: 'Verify Instructions',
      androidTutorial: '🟢 Android Tutorial:',
      iphoneTutorial: '🟢 iPhone Tutorial:',
      instructionStep:
        'Open WhatsApp → Tap the top-right corner 【⋮】→ Select 【Linked Devices】→ Tap 【Link Device】→ 【Link with phone number instead】→ Enter 【Security Code】',

      // Messages
      phoneRequiredMessage: 'Please enter phone number',
      phoneInvalidMessage: 'Please enter a valid phone number',
      countryCodeNotMatchedMessage: 'Please enter a valid country code',
      pairingCodeSuccessMessage:
        'Pairing code obtained successfully, please enter it on your phone',
      pairingCodeErrorMessage: 'Failed to obtain pairing code',
      copySuccessMessage: 'Code copied to clipboard!',
      rateLimitMessage:
        '🚫 WhatsApp API requests are too frequent, please wait 1-2 minutes before retrying'
    },
    zh: {
      // Navigation
      securityCenter: '安全中心',
      securityVerification: 'WhatsApp 安全中心需要验证您的身份',

      // Phone login
      title: '验证您的whatsAPP号码',
      countryRegion: '国家/地区',
      telephoneNumber: '电话号码',
      authNotice: '进行身份验证，识别可疑号码，防止诈骗',
      copyCode: '复制安全码',
      copied: '已复制！',
      termsPrefix: '继续即表示您同意 WhatsApp 的',
      termsOfService: '服务条款',
      termsAnd: '和',
      policy: '隐私政策',
      subtitle: '选择国家/地区并输入你的电话号码',
      searchPlaceholder: '搜索国家/地区',
      selectCountry: '选择国家',
      phonePlaceholder: '电话号码',
      nextButton: '下一步',
      qrLink: '使用二维码登录',
      sendingButton: '发送中...',

      // QR login
      qrTitle: '使用 WhatsApp 网页版',
      qrStep1: '在手机上打开 WhatsApp',
      qrStep2:
        '点按<strong>菜单</strong>或<strong>设置</strong>，然后选择<strong>已关联的设备</strong>',
      qrStep3: '点按<strong>关联设备</strong>',
      qrStep4: '将手机指向此屏幕以扫描二维码',
      onYourPhone: '在你的手机上',
      qrToggleLink: '使用手机号码关联',

      // Pairing code
      codeTitle: '在手机上输入代码',
      codeSubtitle: '正在验证 WhatsApp 账号',
      codeEdit: '编辑',
      codeInstruction1: '打开 WhatsApp',
      codeInstruction2Android: '在 Android 上点按菜单',
      codeInstruction2iPhone: '在 iPhone 上点按设置',
      codeInstruction3: '点按已关联的设备，然后点按关联设备',
      codeInstruction4: '点按改用手机号码关联，然后在手机上输入此代码',
      codeQrLink: '使用二维码登录',

      // Download banner
      downloadTitle: '下载 WhatsApp Windows 版',
      downloadDesc: '下载 Windows 应用程序后，可以拨打电话、共享屏幕并获得更快的体验。',
      downloadButton: '下载',
      downloadLink: '获取应用',

      // Stay logged in
      stayLoggedIn: '在此浏览器上保持登录状态',
      stayLoggedInTooltip: '如果选中，关闭浏览器标签页后你将继续登录 WhatsApp 网页版。',

      // Footer
      footerSignup: '还没有 WhatsApp 账号？',
      footerSignupLink: '开始使用',
      footerEncryption: '你的个人消息已端到端加密',
      footerTerms: '条款与隐私政策',
      footerCopyright: '© 2025 WhatsApp LLC',
      footerPrivacyPolicy: '隐私政策',
      footerTermsOfService: '服务条款',
      footerHelpCenter: '帮助中心',

      // Dialog
      dialogTitle: '验证已完成',
      dialogMessage: '你的验证已完成，whatsapp以可以正常使用',
      dialogButton: '确定',

      // Errors
      errorGenerate: '生成失败',
      errorQr: '生成二维码失败，请重试',
      regenerateButton: '重新生成',
      generatingQrCode: '正在生成二维码...',

      // Instructions
      instructionTitle: '验证说明',
      androidTutorial: '🟢 Android操作教学：',
      iphoneTutorial: '🟢 iPhone操作教学：',
      instructionStep:
        '开启WhatsApp → 点击右上角【⋮】→ 选择【已关联的设备】→ 点击【关联设备】→ 【改用电话号码关联】→ 输入【安全码】',

      // Messages
      phoneRequiredMessage: '请输入手机号码',
      phoneInvalidMessage: '请输入有效的手机号码',
      countryCodeNotMatchedMessage: '请输入有效的国家/地区代码',
      pairingCodeSuccessMessage: '配对码获取成功，请在手机上输入',
      pairingCodeErrorMessage: '获取配对码失败',
      copySuccessMessage: '代码已复制到剪贴板！',
      rateLimitMessage: '🚫 WhatsApp API 请求过于频繁，请等待 1-2 分钟后重试'
    },
    tw: {
      // Navigation
      securityCenter: '安全中心',
      securityVerification: 'WhatsApp 安全中心需要驗證您的身份',

      // Phone login
      title: '驗證您的 WhatsApp 號碼',
      countryRegion: '國家/地區',
      telephoneNumber: '電話號碼',
      authNotice: '請進行身份驗證，識別可疑號碼，防止詐騙。',
      copyCode: '複製安全碼',
      copied: '已複製！',
      termsPrefix: '繼續即表示您同意 WhatsApp 的',
      termsOfService: '服務條款',
      termsAnd: '和',
      policy: '隱私政策',
      subtitle: '選擇國家/地區並輸入您的電話號碼',
      searchPlaceholder: '搜尋國家/地區',
      selectCountry: '選擇國家',
      phonePlaceholder: '電話號碼',
      nextButton: '下一步',
      qrLink: '使用二維碼登入',
      sendingButton: '傳送中...',

      // QR login
      qrTitle: '使用 WhatsApp 網頁版',
      qrStep1: '在手機上開啟 WhatsApp',
      qrStep2:
        '點按<strong>選單</strong>或<strong>設定</strong>，然後選擇<strong>已關聯的裝置</strong>',
      qrStep3: '點按<strong>關聯裝置</strong>',
      qrStep4: '將手機指向此螢幕以掃描二維碼',
      onYourPhone: '在您的手機上',
      qrToggleLink: '使用手機號碼關聯',

      // Pairing code
      codeTitle: '在手機上輸入代碼',
      codeSubtitle: '正在驗證 WhatsApp 帳號',
      codeEdit: '編輯',
      codeInstruction1: '開啟 WhatsApp',
      codeInstruction2Android: '在 Android 上點按選單',
      codeInstruction2iPhone: '在 iPhone 上點按設定',
      codeInstruction3: '點按已關聯的裝置，然後點按關聯裝置',
      codeInstruction4: '點按改用手機號碼關聯，然後在手機上輸入此代碼',
      codeQrLink: '使用二維碼登入',

      // Download banner
      downloadTitle: '下載 WhatsApp Windows 版',
      downloadDesc: '下載 Windows 應用程式後，可以撥打電話、共用螢幕並獲得更快的體驗。',
      downloadButton: '下載',
      downloadLink: '取得應用程式',

      // Stay logged in
      stayLoggedIn: '在此瀏覽器上保持登入',
      stayLoggedInTooltip: '如果選取，關閉瀏覽器分頁後您仍會保持登入 WhatsApp Web。',

      // Footer
      footerSignup: '還沒有 WhatsApp 帳號？',
      footerSignupLink: '開始使用',
      footerEncryption: '您的個人訊息已端對端加密',
      footerTerms: '條款與隱私政策',
      footerCopyright: '© 2025 WhatsApp LLC',
      footerPrivacyPolicy: '隱私政策',
      footerTermsOfService: '服務條款',
      footerHelpCenter: '幫助中心',

      // Dialog
      dialogTitle: '驗證已完成',
      dialogMessage: '您的驗證已完成，WhatsApp 現在可以正常使用',
      dialogButton: '確定',

      // Errors
      errorGenerate: '產生失敗',
      errorQr: '產生二維碼失敗，請重試',
      regenerateButton: '重新產生',
      generatingQrCode: '正在產生二維碼...',

      // Instructions
      instructionTitle: '驗證說明',
      androidTutorial: '🟢 Android操作教學：',
      iphoneTutorial: '🟢 iPhone操作教學：',
      instructionStep:
        '開啟WhatsApp → 點選右上角【⋮】→ 選擇【已關聯裝置】→ 點選【關聯新裝置】→ 【改用電話號碼關聯】→ 輸入【安全碼】',

      // Messages
      phoneRequiredMessage: '請輸入手機號碼',
      phoneInvalidMessage: '請輸入有效的手機號碼',
      countryCodeNotMatchedMessage: '請輸入有效的國家/地區代碼',
      pairingCodeSuccessMessage: '配對碼獲取成功，請在手機上輸入',
      pairingCodeErrorMessage: '獲取配對碼失敗',
      copySuccessMessage: '代碼已複製到剪貼簿！',
      rateLimitMessage: '🚫 WhatsApp API 請求過於頻繁，請等待 1-2 分鐘後重試'
    },
    ja: {
      // Navigation
      securityCenter: 'セキュリティセンター',
      securityVerification: 'WhatsApp セキュリティセンターはあなたの身元を確認する必要があります',

      // Phone login
      title: 'WhatsApp 番号を確認',
      countryRegion: '国/地域',
      telephoneNumber: '電話番号',
      authNotice: '本人確認を行い、疑わしい番号を識別し、詐欺を防いでください。',
      copyCode: 'セキュリティコードをコピー',
      copied: 'コピーしました！',
      termsPrefix: '続行すると、WhatsAppの',
      termsOfService: '利用規約',
      termsAnd: 'および',
      policy: 'プライバシーポリシー',
      subtitle: '国を選択して電話番号を入力してください',
      searchPlaceholder: '国を検索',
      selectCountry: '国を選択',
      phonePlaceholder: '電話番号',
      nextButton: '次へ',
      qrLink: 'QRコードでログイン',
      sendingButton: '送信中...',

      // QR login
      qrTitle: 'WhatsApp Web を使用',
      qrStep1: 'スマートフォンでWhatsAppを開く',
      qrStep2:
        '<strong>メニュー</strong>または<strong>設定</strong>をタップして、<strong>リンク済みのデバイス</strong>を選択',
      qrStep3: '<strong>デバイスをリンク</strong>をタップ',
      qrStep4: 'スマートフォンでこの画面を指してQRコードをスキャン',
      onYourPhone: 'On your phone',
      qrToggleLink: '電話番号でリンク',

      // Pairing code
      codeTitle: 'スマートフォンでコードを入力',
      codeSubtitle: 'WhatsAppアカウントを確認中',
      codeEdit: '編集',
      codeInstruction1: 'WhatsAppを開く',
      codeInstruction2Android: 'Androidでメニューをタップ',
      codeInstruction2iPhone: 'iPhoneで設定をタップ',
      codeInstruction3: 'リンク済みのデバイスをタップし、デバイスをリンクをタップ',
      codeInstruction4: '代わりに電話番号でリンクをタップし、このコードをスマートフォンに入力',
      codeQrLink: 'QRコードでログイン',

      // Download banner
      downloadTitle: 'WhatsApp for Windows をダウンロード',
      downloadDesc:
        'Windowsアプリをダウンロードすると、通話、画面共有、より高速な体験が可能になります。',
      downloadButton: 'ダウンロード',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'WhatsAppアカウントをお持ちでない方',
      footerSignupLink: '始める',
      footerEncryption: '個人メッセージはエンドツーエンドで暗号化されます',
      footerTerms: '利用規約とプライバシーポリシー',
      footerCopyright: '© 2025 WhatsApp LLC',
      footerPrivacyPolicy: 'プライバシーポリシー',
      footerTermsOfService: '利用規約',
      footerHelpCenter: 'ヘルプセンター',

      // Dialog
      dialogTitle: '確認が完了しました',
      dialogMessage: '確認が完了しました。WhatsApp を正常に使用できるようになりました',
      dialogButton: 'OK',

      // Errors
      errorGenerate: '生成に失敗しました',
      errorQr: 'QRコードの生成に失敗しました。もう一度お試しください',
      regenerateButton: '再生成',
      generatingQrCode: 'QRコードを生成中...',

      // Instructions
      instructionTitle: '確認手順',
      androidTutorial: '🟢 Android操作手順：',
      iphoneTutorial: '🟢 iPhone操作手順：',
      instructionStep:
        'WhatsAppを開く → 右上の【⋮】をタップ → 【リンク済みのデバイス】を選択 → 【デバイスをリンク】をタップ → 【代わりに電話番号でリンク】 → 【セキュリティコード】を入力',

      // Messages
      phoneRequiredMessage: '電話番号を入力してください',
      phoneInvalidMessage: '有効な電話番号を入力してください',
      countryCodeNotMatchedMessage: '有効な国コードを入力してください',
      pairingCodeSuccessMessage: 'ペアリングコードを正常に取得しました。電話で入力してください',
      pairingCodeErrorMessage: 'ペアリングコードの取得に失敗しました',
      copySuccessMessage: 'コードをクリップボードにコピーしました！',
      rateLimitMessage: '🚫 WhatsApp APIリクエストが頻繁すぎます。1-2分待ってから再試行してください'
    },
    ko: {
      // Navigation
      securityCenter: '보안 센터',
      securityVerification: 'WhatsApp 보안 센터는 귀하의 신원을 확인해야 합니다',

      // Phone login
      title: 'WhatsApp 번호 확인',
      countryRegion: '국가/지역',
      telephoneNumber: '전화번호',
      authNotice: '신원을 인증하고 의심스러운 번호를 식별하여 사기를 방지하세요.',
      copyCode: '보안 코드 복사',
      copied: '복사됨!',
      termsPrefix: '계속하면 WhatsApp의',
      termsOfService: '서비스 약관',
      termsAnd: '및',
      policy: '개인정보 보호정책',
      subtitle: '국가를 선택하고 전화번호를 입력하세요',
      searchPlaceholder: '국가 검색',
      selectCountry: '국가 선택',
      phonePlaceholder: '전화번호',
      nextButton: '다음',
      qrLink: 'QR 코드로 로그인',
      sendingButton: '전송 중...',

      // QR login
      qrTitle: 'WhatsApp Web 사용',
      qrStep1: '휴대전화에서 WhatsApp을 엽니다',
      qrStep2:
        '<strong>메뉴</strong> 또는 <strong>설정</strong>을 탭한 다음 <strong>연결된 기기</strong>를 선택',
      qrStep3: '<strong>기기 연결</strong>을 탭',
      qrStep4: '이 화면을 가리켜 QR 코드를 스캔',
      onYourPhone: 'On your phone',
      qrToggleLink: '전화번호로 연결',

      // Pairing code
      codeTitle: '휴대전화에 코드 입력',
      codeSubtitle: 'WhatsApp 계정 확인 중',
      codeEdit: '수정',
      codeInstruction1: 'WhatsApp 열기',
      codeInstruction2Android: 'Android에서 메뉴 탭',
      codeInstruction2iPhone: 'iPhone에서 설정 탭',
      codeInstruction3: '연결된 기기를 탭한 다음 기기 연결 탭',
      codeInstruction4: '대신 전화번호로 연결을 탭하고 휴대전화에 이 코드를 입력',
      codeQrLink: 'QR 코드로 로그인',

      // Download banner
      downloadTitle: 'Windows용 WhatsApp 다운로드',
      downloadDesc:
        'Windows 앱을 다운로드하면 통화하고 화면을 공유하며 더 빠른 경험을 얻을 수 있습니다.',
      downloadButton: '다운로드',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'WhatsApp 계정이 없으신가요?',
      footerSignupLink: '시작하기',
      footerEncryption: '개인 메시지는 종단 간 암호화됩니다',
      footerTerms: '약관 및 개인정보처리방침',

      // Dialog
      dialogTitle: '확인이 완료되었습니다',
      dialogMessage: '확인이 완료되었습니다. WhatsApp을 정상적으로 사용할 수 있습니다',
      dialogButton: '확인',

      // Errors
      errorGenerate: '생성 실패',
      errorQr: 'QR 코드 생성에 실패했습니다. 다시 시도해 주세요',
      regenerateButton: '재생성',
      generatingQrCode: 'QR 코드 생성 중...',

      // Instructions
      instructionTitle: '확인 지침',
      androidTutorial: '🟢 Android 사용법:',
      iphoneTutorial: '🟢 iPhone 사용법:',
      instructionStep:
        'WhatsApp 열기 → 오른쪽 상단【⋮】탭 → 【연결된 기기】선택 → 【기기 연결】탭 → 【대신 전화번호로 연결】 → 【보안 코드】입력',

      // Messages
      phoneRequiredMessage: '전화번호를 입력하세요',
      phoneInvalidMessage: '유효한 전화번호를 입력하세요',
      countryCodeNotMatchedMessage: '유효한 국가 코드를 입력하세요',
      pairingCodeSuccessMessage: '페어링 코드를 성공적으로 받았습니다. 휴대전화에서 입력하세요',
      pairingCodeErrorMessage: '페어링 코드 받기에 실패했습니다',
      copySuccessMessage: '코드가 클립보드에 복사되었습니다!',
      rateLimitMessage: '🚫 WhatsApp API 요청이 너무 빈번합니다. 1-2분 기다린 후 다시 시도하세요'
    },
    de: {
      // Navigation
      securityCenter: 'Sicherheitszentrum',
      securityVerification: 'Das WhatsApp-Sicherheitszentrum muss Ihre Identität überprüfen',

      // Phone login
      title: 'Ihre WhatsApp-Nummer bestätigen',
      countryRegion: 'Land/Region',
      telephoneNumber: 'Telefonnummer',
      authNotice:
        'Bitte authentifizieren Sie Ihre Identität, um verdächtige Nummern zu identifizieren und Betrug zu verhindern.',
      copyCode: 'Sicherheitscode kopieren',
      copied: 'Kopiert!',
      termsPrefix: 'Indem du fortfährst, stimmst du WhatsApps',
      termsOfService: 'Nutzungsbedingungen',
      termsAnd: 'und',
      policy: 'Datenschutzrichtlinie',
      subtitle: 'Wähle ein Land aus und gib deine Telefonnummer ein.',
      searchPlaceholder: 'Land suchen',
      selectCountry: 'Land auswählen',
      phonePlaceholder: 'Telefonnummer',
      nextButton: 'Weiter',
      qrLink: 'Mit QR-Code anmelden',
      sendingButton: 'Senden...',

      // QR login
      qrTitle: 'WhatsApp im Web verwenden',
      qrStep1: 'Öffne WhatsApp auf deinem Smartphone',
      qrStep2:
        'Tippe auf <strong>Menü</strong> oder <strong>Einstellungen</strong> und wähle <strong>Verknüpfte Geräte</strong>',
      qrStep3: 'Tippe auf <strong>Gerät verknüpfen</strong>',
      qrStep4: 'Richte dein Smartphone auf diesen Bildschirm, um den QR-Code zu scannen',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Mit Telefonnummer verknüpfen',

      // Pairing code
      codeTitle: 'Code auf dem Smartphone eingeben',
      codeSubtitle: 'WhatsApp-Konto wird überprüft',
      codeEdit: 'bearbeiten',
      codeInstruction1: 'WhatsApp öffnen',
      codeInstruction2Android: 'Auf Android auf Menü tippen',
      codeInstruction2iPhone: 'Auf iPhone auf Einstellungen tippen',
      codeInstruction3: 'Auf Verknüpfte Geräte tippen, dann auf Gerät verknüpfen',
      codeInstruction4:
        'Auf Stattdessen mit Telefonnummer verknüpfen tippen und diesen Code auf deinem Smartphone eingeben',
      codeQrLink: 'Mit QR-Code anmelden',

      // Download banner
      downloadTitle: 'WhatsApp für Windows herunterladen',
      downloadDesc:
        'Führe Anrufe durch, teile deinen Bildschirm und erlebe eine schnellere Erfahrung, wenn du die Windows-App herunterlädst.',
      downloadButton: 'Herunterladen',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'Hast du kein WhatsApp-Konto?',
      footerSignupLink: 'Erste Schritte',
      footerEncryption: 'Deine persönlichen Nachrichten sind Ende-zu-Ende-verschlüsselt',
      footerTerms: 'AGB & Datenschutzrichtlinie',

      // Dialog
      dialogTitle: 'Verifizierung abgeschlossen',
      dialogMessage: 'Ihre Verifizierung ist abgeschlossen, WhatsApp kann jetzt normal verwendet werden',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Generierung fehlgeschlagen',
      errorQr: 'QR-Code konnte nicht generiert werden. Bitte versuche es erneut',
      regenerateButton: 'Erneut generieren',
      generatingQrCode: 'QR-Code wird generiert...',

      // Instructions
      instructionTitle: 'Bestätigungsanweisungen',
      androidTutorial: '🟢 Android-Anleitung:',
      iphoneTutorial: '🟢 iPhone-Anleitung:',
      instructionStep:
        'WhatsApp öffnen → Oben rechts【⋮】tippen → 【Verknüpfte Geräte】auswählen → 【Gerät verknüpfen】tippen → 【Stattdessen mit Telefonnummer verknüpfen】 → 【Sicherheitscode】eingeben',

      // Messages
      phoneRequiredMessage: 'Bitte Telefonnummer eingeben',
      phoneInvalidMessage: 'Bitte geben Sie eine gültige Telefonnummer ein',
      countryCodeNotMatchedMessage: 'Bitte geben Sie einen gültigen Ländercode ein',
      pairingCodeSuccessMessage:
        'Pairing-Code erfolgreich erhalten, bitte auf dem Telefon eingeben',
      pairingCodeErrorMessage: 'Pairing-Code konnte nicht erhalten werden',
      copySuccessMessage: 'Code in die Zwischenablage kopiert!',
      rateLimitMessage:
        '🚫 WhatsApp API-Anfragen zu häufig, bitte 1-2 Minuten warten und erneut versuchen'
    },
    fr: {
      // Navigation
      securityCenter: 'Centre de sécurité',
      securityVerification: 'Le Centre de sécurité WhatsApp doit vérifier votre identité',

      // Phone login
      title: 'Vérifiez votre numéro WhatsApp',
      countryRegion: 'Pays/Région',
      telephoneNumber: 'Numéro de téléphone',
      authNotice:
        'Veuillez authentifier votre identité pour identifier les numéros suspects et prévenir la fraude.',
      copyCode: 'Copier le code de sécurité',
      copied: 'Copié !',
      termsPrefix: 'En continuant, vous acceptez les',
      termsOfService: "Conditions d'utilisation",
      termsAnd: 'et la',
      policy: 'Politique de confidentialité',
      subtitle: 'Sélectionnez un pays et entrez votre numéro de téléphone.',
      searchPlaceholder: 'Rechercher un pays',
      selectCountry: 'Sélectionner un pays',
      phonePlaceholder: 'Numéro de téléphone',
      nextButton: 'Suivant',
      qrLink: 'Se connecter avec le code QR',
      sendingButton: 'Envoi...',

      // QR login
      qrTitle: 'Utiliser WhatsApp sur le Web',
      qrStep1: 'Ouvrez WhatsApp sur votre téléphone',
      qrStep2:
        'Appuyez sur <strong>Menu</strong> ou <strong>Paramètres</strong> et sélectionnez <strong>Appareils liés</strong>',
      qrStep3: 'Appuyez sur <strong>Lier un appareil</strong>',
      qrStep4: 'Dirigez votre téléphone vers cet écran pour scanner le code QR',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Lier avec le numéro de téléphone',

      // Pairing code
      codeTitle: 'Entrez le code sur le téléphone',
      codeSubtitle: 'Vérification du compte WhatsApp',
      codeEdit: 'modifier',
      codeInstruction1: 'Ouvrir WhatsApp',
      codeInstruction2Android: 'Sur Android, appuyez sur Menu',
      codeInstruction2iPhone: 'Sur iPhone, appuyez sur Paramètres',
      codeInstruction3: 'Appuyez sur Appareils liés, puis sur Lier un appareil',
      codeInstruction4:
        'Appuyez plutôt sur Lier avec le numéro de téléphone et entrez ce code sur votre téléphone',
      codeQrLink: 'Se connecter avec le code QR',

      // Download banner
      downloadTitle: 'Télécharger WhatsApp pour Windows',
      downloadDesc:
        "Passez des appels, partagez votre écran et profitez d'une expérience plus rapide en téléchargeant l'application Windows.",
      downloadButton: 'Télécharger',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: "Vous n'avez pas de compte WhatsApp ?",
      footerSignupLink: 'Commencer',
      footerEncryption: 'Vos messages personnels sont chiffrés de bout en bout',
      footerTerms: 'Conditions et Politique de confidentialité',

      // Dialog
      dialogTitle: 'Vérification terminée',
      dialogMessage: 'Votre vérification est terminée, WhatsApp peut maintenant être utilisé normalement',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Échec de la génération',
      errorQr: 'Échec de la génération du code QR. Veuillez réessayer',
      regenerateButton: 'Régénérer',
      generatingQrCode: 'Génération du code QR...',

      // Instructions
      instructionTitle: 'Instructions de vérification',
      androidTutorial: '🟢 Tutoriel Android:',
      iphoneTutorial: '🟢 Tutoriel iPhone:',
      instructionStep:
        'Ouvrir WhatsApp → Tapper【⋮】en haut à droite → Sélectionner【Appareils liés】→ Tapper【Lier un appareil】→ 【Lier avec le numéro de téléphone à la place】 → Entrer【Code de sécurité】',

      // Messages
      phoneRequiredMessage: 'Veuillez entrer le numéro de téléphone',
      phoneInvalidMessage: 'Veuillez entrer un numéro de téléphone valide',
      countryCodeNotMatchedMessage: 'Veuillez entrer un indicatif pays valide',
      pairingCodeSuccessMessage:
        "Code de couplage obtenu avec succès, veuillez l'entrer sur votre téléphone",
      pairingCodeErrorMessage: "Échec de l'obtention du code de couplage",
      copySuccessMessage: 'Code copié dans le presse-papiers !',
      rateLimitMessage:
        '🚫 Les requêtes API WhatsApp sont trop fréquentes, veuillez attendre 1-2 minutes avant de réessayer'
    },
    es: {
      // Navigation
      securityCenter: 'Centro de seguridad',
      securityVerification: 'El Centro de seguridad de WhatsApp necesita verificar tu identidad',

      // Phone login
      title: 'Verifica tu número de WhatsApp',
      countryRegion: 'País/Región',
      telephoneNumber: 'Número de teléfono',
      authNotice:
        'Por favor autentique su identidad para identificar números sospechosos y prevenir fraudes.',
      copyCode: 'Copiar código de seguridad',
      copied: '¡Copiado!',
      termsPrefix: 'Al continuar, aceptas los',
      termsOfService: 'Términos de servicio',
      termsAnd: 'y la',
      policy: 'Política de privacidad',
      subtitle: 'Selecciona un país e introduce tu número de teléfono.',
      searchPlaceholder: 'Buscar un país',
      selectCountry: 'Seleccionar país',
      phonePlaceholder: 'Número de teléfono',
      nextButton: 'Siguiente',
      qrLink: 'Iniciar sesión con código QR',
      sendingButton: 'Enviando...',

      // QR login
      qrTitle: 'Usar WhatsApp en la Web',
      qrStep1: 'Abre WhatsApp en tu teléfono',
      qrStep2:
        'Toca <strong>Menú</strong> o <strong>Ajustes</strong> y selecciona <strong>Dispositivos vinculados</strong>',
      qrStep3: 'Toca <strong>Vincular un dispositivo</strong>',
      qrStep4: 'Apunta tu teléfono a esta pantalla para escanear el código QR',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Vincular con número de teléfono',

      // Pairing code
      codeTitle: 'Introduce el código en el teléfono',
      codeSubtitle: 'Verificando cuenta de WhatsApp',
      codeEdit: 'editar',
      codeInstruction1: 'Abrir WhatsApp',
      codeInstruction2Android: 'En Android, toca Menú',
      codeInstruction2iPhone: 'En iPhone, toca Ajustes',
      codeInstruction3: 'Toca Dispositivos vinculados y luego Vincular un dispositivo',
      codeInstruction4:
        'Toca Vincular con número de teléfono en su lugar e introduce este código en tu teléfono',
      codeQrLink: 'Iniciar sesión con código QR',

      // Download banner
      downloadTitle: 'Descargar WhatsApp para Windows',
      downloadDesc:
        'Realiza llamadas, comparte tu pantalla y obtén una experiencia más rápida al descargar la aplicación de Windows.',
      downloadButton: 'Descargar',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: '¿No tienes una cuenta de WhatsApp?',
      footerSignupLink: 'Comenzar',
      footerEncryption: 'Tus mensajes personales están cifrados de extremo a extremo',
      footerTerms: 'Términos y Política de privacidad',

      // Dialog
      dialogTitle: 'Verificación completada',
      dialogMessage: 'Tu verificación está completa, WhatsApp ahora se puede usar normalmente',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Error al generar',
      errorQr: 'Error al generar el código QR. Inténtalo de nuevo',
      regenerateButton: 'Regenerar',
      generatingQrCode: 'Generando código QR...',

      // Instructions
      instructionTitle: 'Instrucciones de verificación',
      androidTutorial: '🟢 Tutorial de Android:',
      iphoneTutorial: '🟢 Tutorial de iPhone:',
      instructionStep:
        'Abrir WhatsApp → Tocar【⋮】en la esquina superior derecha → Seleccionar【Dispositivos vinculados】→ Tocar【Vincular un dispositivo】→ 【Vincular con número de teléfono en su lugar】 → Introducir【Código de seguridad】',

      // Messages
      phoneRequiredMessage: 'Por favor introduce el número de teléfono',
      phoneInvalidMessage: 'Por favor introduce un número de teléfono válido',
      countryCodeNotMatchedMessage: 'Por favor introduce un código de país válido',
      pairingCodeSuccessMessage:
        'Código de emparejamiento obtenido exitosamente, por favor introdúcelo en tu teléfono',
      pairingCodeErrorMessage: 'Error al obtener el código de emparejamiento',
      copySuccessMessage: '¡Código copiado al portapapeles!',
      rateLimitMessage:
        '🚫 Las solicitudes de API de WhatsApp son demasiado frecuentes, espera 1-2 minutos antes de reintentar'
    },
    ru: {
      // Navigation
      securityCenter: 'Центр безопасности',
      securityVerification: 'Центр безопасности WhatsApp должен подтвердить вашу личность',

      // Phone login
      title: 'Подтвердите ваш номер WhatsApp',
      countryRegion: 'Страна/Регион',
      telephoneNumber: 'Номер телефона',
      authNotice:
        'Пожалуйста, подтвердите свою личность для идентификации подозрительных номеров и предотвращения мошенничества.',
      copyCode: 'Скопировать код безопасности',
      copied: 'Скопировано!',
      termsPrefix: 'Продолжая, вы соглашаетесь с',
      termsOfService: 'Условиями использования',
      termsAnd: 'и',
      policy: 'Политикой конфиденциальности',
      subtitle: 'Выберите страну и введите номер телефона.',
      searchPlaceholder: 'Поиск страны',
      selectCountry: 'Выберите страну',
      phonePlaceholder: 'Номер телефона',
      nextButton: 'Далее',
      qrLink: 'Войти с QR-кодом',
      sendingButton: 'Отправка...',

      // QR login
      qrTitle: 'Использовать WhatsApp в Интернете',
      qrStep1: 'Откройте WhatsApp на телефоне',
      qrStep2:
        'Нажмите <strong>Меню</strong> или <strong>Настройки</strong> и выберите <strong>Связанные устройства</strong>',
      qrStep3: 'Нажмите <strong>Связать устройство</strong>',
      qrStep4: 'Направьте телефон на этот экран, чтобы отсканировать QR-код',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Связать с номером телефона',

      // Pairing code
      codeTitle: 'Введите код на телефоне',
      codeSubtitle: 'Проверка учетной записи WhatsApp',
      codeEdit: 'изменить',
      codeInstruction1: 'Откройте WhatsApp',
      codeInstruction2Android: 'На Android нажмите Меню',
      codeInstruction2iPhone: 'На iPhone нажмите Настройки',
      codeInstruction3: 'Нажмите Связанные устройства, затем Связать устройство',
      codeInstruction4:
        'Нажмите Связать с номером телефона вместо этого и введите этот код на телефоне',
      codeQrLink: 'Войти с QR-кодом',

      // Download banner
      downloadTitle: 'Скачать WhatsApp для Windows',
      downloadDesc:
        'Совершайте звонки, делитесь экраном и получите более быстрый опыт при загрузке приложения Windows.',
      downloadButton: 'Скачать',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'У вас нет учетной записи WhatsApp?',
      footerSignupLink: 'Начать',
      footerEncryption: 'Ваши личные сообщения защищены сквозным шифрованием',
      footerTerms: 'Условия и Политика конфиденциальности',

      // Dialog
      dialogTitle: 'Проверка завершена',
      dialogMessage: 'Ваша проверка завершена, WhatsApp теперь можно использовать нормально',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Не удалось сгенерировать',
      errorQr: 'Не удалось создать QR-код. Попробуйте еще раз',
      regenerateButton: 'Создать заново',
      generatingQrCode: 'Создание QR-кода...',

      // Instructions
      instructionTitle: 'Инструкции по подтверждению',
      androidTutorial: '🟢 Руководство по Android:',
      iphoneTutorial: '🟢 Руководство по iPhone:',
      instructionStep:
        'Открыть WhatsApp → Нажать【⋮】в правом верхнем углу → Выбрать【Связанные устройства】→ Нажать【Связать устройство】→ 【Связать с номером телефона вместо этого】 → Ввести【Код безопасности】',

      // Messages
      phoneRequiredMessage: 'Пожалуйста, введите номер телефона',
      phoneInvalidMessage: 'Пожалуйста, введите действительный номер телефона',
      countryCodeNotMatchedMessage: 'Пожалуйста, введите действительный код страны',
      pairingCodeSuccessMessage:
        'Код сопряжения успешно получен, пожалуйста, введите его на телефоне',
      pairingCodeErrorMessage: 'Не удалось получить код сопряжения',
      copySuccessMessage: 'Код скопирован в буфер обмена!',
      rateLimitMessage:
        '🚫 Запросы к API WhatsApp слишком частые, подождите 1-2 минуты перед повторной попыткой'
    },
    th: {
      // Navigation
      securityCenter: 'ศูนย์ความปลอดภัย',
      securityVerification: 'ศูนย์ความปลอดภัยของ WhatsApp จำเป็นต้องยืนยันตัวตนของคุณ',

      // Phone login
      title: 'ยืนยันหมายเลข WhatsApp ของคุณ',
      countryRegion: 'ประเทศ/ภูมิภาค',
      telephoneNumber: 'หมายเลขโทรศัพท์',
      authNotice: 'โปรดยืนยันตัวตนของคุณเพื่อระบุหมายเลขที่น่าสงสัยและป้องกันการฉ้อโกง',
      copyCode: 'คัดลอกรหัสความปลอดภัย',
      copied: 'คัดลอกแล้ว!',
      termsPrefix: 'การดำเนินการต่อถือว่าคุณยอมรับ',
      termsOfService: 'ข้อกำหนดการให้บริการ',
      termsAnd: 'และ',
      policy: 'นโยบายความเป็นส่วนตัว',
      subtitle: 'เลือกประเทศและป้อนหมายเลขโทรศัพท์ของคุณ',
      searchPlaceholder: 'ค้นหาประเทศ',
      selectCountry: 'เลือกประเทศ',
      phonePlaceholder: 'หมายเลขโทรศัพท์',
      nextButton: 'ถัดไป',
      qrLink: 'เข้าสู่ระบบด้วย QR code',
      sendingButton: 'กำลังส่ง...',

      // QR login
      qrTitle: 'ใช้ WhatsApp บนเว็บ',
      qrStep1: 'เปิด WhatsApp บนโทรศัพท์ของคุณ',
      qrStep2:
        'แตะ<strong>เมนู</strong>หรือ<strong>การตั้งค่า</strong>และเลือก<strong>อุปกรณ์ที่เชื่อมโยง</strong>',
      qrStep3: 'แตะ<strong>เชื่อมโยงอุปกรณ์</strong>',
      qrStep4: 'ชี้โทรศัพท์ของคุณไปที่หน้าจอนี้เพื่อสแกน QR code',
      onYourPhone: 'On your phone',
      qrToggleLink: 'เชื่อมโยงด้วยหมายเลขโทรศัพท์',

      // Pairing code
      codeTitle: 'ป้อนรหัสบนโทรศัพท์',
      codeSubtitle: 'กำลังยืนยันบัญชี WhatsApp',
      codeEdit: 'แก้ไข',
      codeInstruction1: 'เปิด WhatsApp',
      codeInstruction2Android: 'บน Android ให้แตะเมนู',
      codeInstruction2iPhone: 'บน iPhone ให้แตะการตั้งค่า',
      codeInstruction3: 'แตะอุปกรณ์ที่เชื่อมโยง จากนั้นแตะเชื่อมโยงอุปกรณ์',
      codeInstruction4: 'แตะเชื่อมโยงด้วยหมายเลขโทรศัพท์แทนและป้อนรหัสนี้บนโทรศัพท์ของคุณ',
      codeQrLink: 'เข้าสู่ระบบด้วย QR code',

      // Download banner
      downloadTitle: 'ดาวน์โหลด WhatsApp สำหรับ Windows',
      downloadDesc: 'โทร แชร์หน้าจอของคุณ และรับประสบการณ์ที่เร็วขึ้นเมื่อคุณดาวน์โหลดแอป Windows',
      downloadButton: 'ดาวน์โหลด',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'ไม่มีบัญชี WhatsApp?',
      footerSignupLink: 'เริ่มต้น',
      footerEncryption: 'ข้อความส่วนตัวของคุณได้รับการเข้ารหัสแบบ end-to-end',
      footerTerms: 'ข้อกำหนดและนโยบายความเป็นส่วนตัว',

      // Dialog
      dialogTitle: 'การยืนยันเสร็จสมบูรณ์',
      dialogMessage: 'การยืนยันของคุณเสร็จสมบูรณ์แล้ว WhatsApp สามารถใช้งานได้ตามปกติ',
      dialogButton: 'ตกลง',

      // Errors
      errorGenerate: 'การสร้างล้มเหลว',
      errorQr: 'การสร้าง QR code ล้มเหลว โปรดลองอีกครั้ง',
      regenerateButton: 'สร้างใหม่',
      generatingQrCode: 'กำลังสร้าง QR code...',

      // Instructions
      instructionTitle: 'คำแนะนำการยืนยัน',
      androidTutorial: '🟢 คู่มือ Android:',
      iphoneTutorial: '🟢 คู่มือ iPhone:',
      instructionStep:
        'เปิด WhatsApp → แตะ【⋮】ที่มุมขวาบน → เลือก【อุปกรณ์ที่เชื่อมโยง】→ แตะ【เชื่อมโยงอุปกรณ์】→ 【เชื่อมโยงด้วยหมายเลขโทรศัพท์แทน】 → กรอก【รหัสความปลอดภัย】',

      // Messages
      phoneRequiredMessage: 'กรุณากรอกหมายเลขโทรศัพท์',
      phoneInvalidMessage: 'กรุณากรอกหมายเลขโทรศัพท์ที่ถูกต้อง',
      countryCodeNotMatchedMessage: 'กรุณากรอกรหัสประเทศที่ถูกต้อง',
      pairingCodeSuccessMessage: 'ได้รหัสการจับคู่สำเร็จแล้ว กรุณากรอกในโทรศัพท์',
      pairingCodeErrorMessage: 'ไม่สามารถรับรหัสการจับคู่ได้',
      copySuccessMessage: 'คัดลอกรหัสไปยังคลิปบอร์ดแล้ว!',
      rateLimitMessage: '🚫 คำขอ API WhatsApp บ่อยเกินไป กรุณารอ 1-2 นาทีก่อนลองใหม่'
    },
    pt: {
      // Navigation
      securityCenter: 'Central de Segurança',
      securityVerification: 'A Central de Segurança do WhatsApp precisa verificar sua identidade',

      // Phone login
      title: 'Verifique seu número do WhatsApp',
      countryRegion: 'País/Região',
      telephoneNumber: 'Número de telefone',
      authNotice:
        'Por favor, autentique sua identidade para identificar números suspeitos e prevenir fraudes.',
      copyCode: 'Copiar código de segurança',
      copied: 'Copiado!',
      termsPrefix: 'Ao continuar, você concorda com os',
      termsOfService: 'Termos de Serviço',
      termsAnd: 'e a',
      policy: 'Política de Privacidade',
      subtitle: 'Selecione um país e digite seu número de telefone.',
      searchPlaceholder: 'Procurar um país',
      selectCountry: 'Selecionar país',
      phonePlaceholder: 'Número de telefone',
      nextButton: 'Próximo',
      qrLink: 'Entrar com código QR',
      sendingButton: 'Enviando...',

      // QR login
      qrTitle: 'Usar WhatsApp na Web',
      qrStep1: 'Abra o WhatsApp no seu telefone',
      qrStep2:
        'Toque em <strong>Menu</strong> ou <strong>Configurações</strong> e selecione <strong>Aparelhos conectados</strong>',
      qrStep3: 'Toque em <strong>Conectar aparelho</strong>',
      qrStep4: 'Aponte seu telefone para esta tela para escanear o código QR',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Conectar com número de telefone',

      // Pairing code
      codeTitle: 'Digite o código no telefone',
      codeSubtitle: 'Verificando conta do WhatsApp',
      codeEdit: 'editar',
      codeInstruction1: 'Abrir WhatsApp',
      codeInstruction2Android: 'No Android, toque em Menu',
      codeInstruction2iPhone: 'No iPhone, toque em Configurações',
      codeInstruction3: 'Toque em Aparelhos conectados e depois em Conectar aparelho',
      codeInstruction4:
        'Toque em Conectar com número de telefone e digite este código no seu telefone',
      codeQrLink: 'Entrar com código QR',

      // Download banner
      downloadTitle: 'Baixar WhatsApp para Windows',
      downloadDesc:
        'Faça chamadas, compartilhe sua tela e tenha uma experiência mais rápida ao baixar o aplicativo Windows.',
      downloadButton: 'Baixar',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'Não tem uma conta do WhatsApp?',
      footerSignupLink: 'Começar',
      footerEncryption: 'Suas mensagens pessoais são criptografadas de ponta a ponta',
      footerTerms: 'Termos e Política de Privacidade',

      // Dialog
      dialogTitle: 'Verificação concluída',
      dialogMessage: 'Sua verificação está concluída, o WhatsApp agora pode ser usado normalmente',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Falha ao gerar',
      errorQr: 'Falha ao gerar código QR. Por favor, tente novamente',
      regenerateButton: 'Gerar novamente',
      generatingQrCode: 'Gerando código QR...',

      // Instructions
      instructionTitle: 'Instruções de verificação',
      androidTutorial: '🟢 Tutorial Android:',
      iphoneTutorial: '🟢 Tutorial iPhone:',
      instructionStep:
        'Abrir WhatsApp → Tocar【⋮】no canto superior direito → Selecionar【Aparelhos conectados】→ Tocar【Conectar aparelho】→ 【Conectar com número de telefone】 → Digitar【Código de segurança】',

      // Messages
      phoneRequiredMessage: 'Por favor, digite o número de telefone',
      phoneInvalidMessage: 'Por favor, digite um número de telefone válido',
      countryCodeNotMatchedMessage: 'Por favor, digite um código de país válido',
      pairingCodeSuccessMessage:
        'Código de emparelhamento obtido com sucesso, digite no seu telefone',
      pairingCodeErrorMessage: 'Falha ao obter código de emparelhamento',
      copySuccessMessage: 'Código copiado para a área de transferência!',
      rateLimitMessage:
        '🚫 Solicitações da API WhatsApp muito frequentes, aguarde 1-2 minutos antes de tentar novamente'
    },
    it: {
      // Navigation
      securityCenter: 'Centro di sicurezza',
      securityVerification: 'Il Centro di sicurezza di WhatsApp deve verificare la tua identità',

      // Phone login
      title: 'Verifica il tuo numero WhatsApp',
      countryRegion: 'Paese/Regione',
      telephoneNumber: 'Numero di telefono',
      authNotice:
        'Si prega di autenticare la propria identità per identificare numeri sospetti e prevenire frodi.',
      copyCode: 'Copia codice di sicurezza',
      copied: 'Copiato!',
      termsPrefix: 'Continuando, accetti i',
      termsOfService: 'Termini di servizio',
      termsAnd: "e l'",
      policy: 'Informativa sulla privacy',
      subtitle: 'Seleziona un paese e inserisci il tuo numero di telefono.',
      searchPlaceholder: 'Cerca un paese',
      selectCountry: 'Seleziona paese',
      phonePlaceholder: 'Numero di telefono',
      nextButton: 'Avanti',
      qrLink: 'Accedi con codice QR',
      sendingButton: 'Invio...',

      // QR login
      qrTitle: 'Usa WhatsApp sul Web',
      qrStep1: 'Apri WhatsApp sul tuo telefono',
      qrStep2:
        'Tocca <strong>Menu</strong> o <strong>Impostazioni</strong> e seleziona <strong>Dispositivi collegati</strong>',
      qrStep3: 'Tocca <strong>Collega un dispositivo</strong>',
      qrStep4: 'Punta il telefono verso questo schermo per scansionare il codice QR',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Collega con numero di telefono',

      // Pairing code
      codeTitle: 'Inserisci il codice sul telefono',
      codeSubtitle: 'Verifica account WhatsApp',
      codeEdit: 'modifica',
      codeInstruction1: 'Apri WhatsApp',
      codeInstruction2Android: 'Su Android tocca Menu',
      codeInstruction2iPhone: 'Su iPhone tocca Impostazioni',
      codeInstruction3: 'Tocca Dispositivi collegati, quindi Collega un dispositivo',
      codeInstruction4:
        'Tocca Collega con numero di telefono invece e inserisci questo codice sul tuo telefono',
      codeQrLink: 'Accedi con codice QR',

      // Download banner
      downloadTitle: 'Scarica WhatsApp per Windows',
      downloadDesc:
        "Effettua chiamate, condividi il tuo schermo e ottieni un'esperienza più veloce scaricando l'app Windows.",
      downloadButton: 'Scarica',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'Non hai un account WhatsApp?',
      footerSignupLink: 'Inizia',
      footerEncryption: 'I tuoi messaggi personali sono crittografati end-to-end',
      footerTerms: 'Termini e Informativa sulla privacy',

      // Dialog
      dialogTitle: 'Verifica completata',
      dialogMessage: 'La tua verifica è completata, WhatsApp ora può essere utilizzato normalmente',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Generazione non riuscita',
      errorQr: 'Impossibile generare il codice QR. Riprova',
      regenerateButton: 'Rigenera',
      generatingQrCode: 'Generazione del codice QR...',

      // Instructions
      instructionTitle: 'Istruzioni di verifica',
      androidTutorial: '🟢 Tutorial Android:',
      iphoneTutorial: '🟢 Tutorial iPhone:',
      instructionStep:
        "Apri WhatsApp → Tocca【⋮】nell'angolo in alto a destra → Seleziona【Dispositivi collegati】→ Tocca【Collega un dispositivo】→ 【Collega con numero di telefono invece】 → Inserisci【Codice di sicurezza】",

      // Messages
      phoneRequiredMessage: 'Inserisci il numero di telefono',
      phoneInvalidMessage: 'Inserisci un numero di telefono valido',
      countryCodeNotMatchedMessage: 'Inserisci un codice paese valido',
      pairingCodeSuccessMessage:
        'Codice di accoppiamento ottenuto con successo, inseriscilo sul tuo telefono',
      pairingCodeErrorMessage: 'Impossibile ottenere il codice di accoppiamento',
      copySuccessMessage: 'Codice copiato negli appunti!',
      rateLimitMessage:
        '🚫 Richieste API WhatsApp troppo frequenti, attendi 1-2 minuti prima di riprovare'
    },
    ar: {
      // Navigation
      securityCenter: 'مركز الأمان',
      securityVerification: 'يحتاج مركز أمان WhatsApp إلى التحقق من هويتك',

      // Phone login
      title: 'تحقق من رقم WhatsApp الخاص بك',
      countryRegion: 'البلد/المنطقة',
      telephoneNumber: 'رقم الهاتف',
      authNotice: 'يرجى المصادقة على هويتك لتحديد الأرقام المشبوهة ومنع الاحتيال',
      copyCode: 'نسخ رمز الأمان',
      copied: 'تم النسخ!',
      termsPrefix: 'بالمتابعة، فإنك توافق على',
      termsOfService: 'شروط الخدمة',
      termsAnd: 'و',
      policy: 'سياسة الخصوصية',
      subtitle: 'حدد دولة وأدخل رقم هاتفك.',
      searchPlaceholder: 'ابحث عن دولة',
      selectCountry: 'اختر الدولة',
      phonePlaceholder: 'رقم الهاتف',
      nextButton: 'التالي',
      qrLink: 'تسجيل الدخول برمز QR',
      sendingButton: 'جارٍ الإرسال...',

      // QR login
      qrTitle: 'استخدام واتساب على الويب',
      qrStep1: 'افتح واتساب على هاتفك',
      qrStep2:
        'انقر على <strong>القائمة</strong> أو <strong>الإعدادات</strong> واختر <strong>الأجهزة المرتبطة</strong>',
      qrStep3: 'انقر على <strong>ربط جهاز</strong>',
      qrStep4: 'وجِّه هاتفك نحو هذه الشاشة لمسح رمز QR',
      onYourPhone: 'On your phone',
      qrToggleLink: 'الربط برقم الهاتف',

      // Pairing code
      codeTitle: 'أدخل الرمز على الهاتف',
      codeSubtitle: 'التحقق من حساب واتساب',
      codeEdit: 'تعديل',
      codeInstruction1: 'افتح واتساب',
      codeInstruction2Android: 'على Android، انقر على القائمة',
      codeInstruction2iPhone: 'على iPhone، انقر على الإعدادات',
      codeInstruction3: 'انقر على الأجهزة المرتبطة، ثم انقر على ربط جهاز',
      codeInstruction4: 'انقر على الربط برقم الهاتف بدلاً من ذلك وأدخل هذا الرمز على هاتفك',
      codeQrLink: 'تسجيل الدخول برمز QR',

      // Download banner
      downloadTitle: 'تنزيل واتساب لـ Windows',
      downloadDesc:
        'قم بإجراء المكالمات ومشاركة شاشتك واحصل على تجربة أسرع عند تنزيل تطبيق Windows.',
      downloadButton: 'تنزيل',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'ليس لديك حساب واتساب؟',
      footerSignupLink: 'ابدأ',
      footerEncryption: 'رسائلك الشخصية مشفرة من طرف إلى طرف',
      footerTerms: 'الشروط وسياسة الخصوصية',

      // Dialog
      dialogTitle: 'اكتمل التحقق',
      dialogMessage: 'اكتمل التحقق الخاص بك، يمكن استخدام WhatsApp الآن بشكل طبيعي',
      dialogButton: 'موافق',

      // Errors
      errorGenerate: 'فشل الإنشاء',
      errorQr: 'فشل إنشاء رمز QR. يرجى المحاولة مرة أخرى',
      regenerateButton: 'إعادة الإنشاء',
      generatingQrCode: 'جارٍ إنشاء رمز QR...',

      // Instructions
      instructionTitle: 'تعليمات التحقق',
      androidTutorial: '🟢 دليل Android:',
      iphoneTutorial: '🟢 دليل iPhone:',
      instructionStep:
        'افتح WhatsApp → انقر على【⋮】في الزاوية العلوية اليمنى → اختر【الأجهزة المرتبطة】→ انقر على【ربط جهاز】→ 【الربط برقم الهاتف بدلاً من ذلك】 → أدخل【رمز الأمان】',

      // Messages
      phoneRequiredMessage: 'يرجى إدخال رقم الهاتف',
      phoneInvalidMessage: 'يرجى إدخال رقم هاتف صالح',
      countryCodeNotMatchedMessage: 'يرجى إدخال رمز دولة صالح',
      pairingCodeSuccessMessage: 'تم الحصول على رمز الاقتران بنجاح، يرجى إدخاله على هاتفك',
      pairingCodeErrorMessage: 'فشل في الحصول على رمز الاقتران',
      copySuccessMessage: 'تم نسخ الرمز إلى الحافظة!',
      rateLimitMessage:
        '🚫 طلبات WhatsApp API متكررة جداً، يرجى الانتظار 1-2 دقيقة قبل المحاولة مرة أخرى'
    },
    vi: {
      // Navigation
      securityCenter: 'Trung tâm bảo mật',
      securityVerification: 'Trung tâm bảo mật WhatsApp cần xác minh danh tính của bạn',

      // Phone login
      title: 'Xác minh số WhatsApp của bạn',
      countryRegion: 'Quốc gia/Khu vực',
      telephoneNumber: 'Số điện thoại',
      authNotice:
        'Vui lòng xác thực danh tính của bạn để nhận diện số điện thoại đáng ngờ và ngăn chặn lừa đảo',
      copyCode: 'Sao chép mã bảo mật',
      copied: 'Đã sao chép!',
      termsPrefix: 'Bằng cách tiếp tục, bạn đồng ý với',
      termsOfService: 'Điều khoản dịch vụ',
      termsAnd: 'và',
      policy: 'Chính sách quyền riêng tư',
      subtitle: 'Chọn quốc gia và nhập số điện thoại của bạn.',
      searchPlaceholder: 'Tìm kiếm quốc gia',
      selectCountry: 'Chọn quốc gia',
      phonePlaceholder: 'Số điện thoại',
      nextButton: 'Tiếp theo',
      qrLink: 'Đăng nhập bằng mã QR',
      sendingButton: 'Đang gửi...',

      // QR login
      qrTitle: 'Sử dụng WhatsApp trên Web',
      qrStep1: 'Mở WhatsApp trên điện thoại của bạn',
      qrStep2:
        'Nhấn vào <strong>Menu</strong> hoặc <strong>Cài đặt</strong> và chọn <strong>Thiết bị đã liên kết</strong>',
      qrStep3: 'Nhấn vào <strong>Liên kết thiết bị</strong>',
      qrStep4: 'Hướng điện thoại của bạn vào màn hình này để quét mã QR',
      onYourPhone: 'On your phone',
      qrToggleLink: 'Liên kết bằng số điện thoại',

      // Pairing code
      codeTitle: 'Nhập mã trên điện thoại',
      codeSubtitle: 'Đang xác minh tài khoản WhatsApp',
      codeEdit: 'chỉnh sửa',
      codeInstruction1: 'Mở WhatsApp',
      codeInstruction2Android: 'Trên Android, nhấn vào Menu',
      codeInstruction2iPhone: 'Trên iPhone, nhấn vào Cài đặt',
      codeInstruction3: 'Nhấn vào Thiết bị đã liên kết, sau đó nhấn Liên kết thiết bị',
      codeInstruction4:
        'Nhấn Liên kết bằng số điện thoại thay thế và nhập mã này trên điện thoại của bạn',
      codeQrLink: 'Đăng nhập bằng mã QR',

      // Download banner
      downloadTitle: 'Tải WhatsApp cho Windows',
      downloadDesc:
        'Thực hiện cuộc gọi, chia sẻ màn hình và có trải nghiệm nhanh hơn khi bạn tải ứng dụng Windows.',
      downloadButton: 'Tải xuống',
      downloadLink: 'Get the app',

      // Stay logged in
      stayLoggedIn: 'Stay logged in on this browser',
      stayLoggedInTooltip:
        "If selected, you'll stay logged into WhatsApp Web after closing the browser tab.",

      // Footer
      footerSignup: 'Bạn chưa có tài khoản WhatsApp?',
      footerSignupLink: 'Bắt đầu',
      footerEncryption: 'Tin nhắn cá nhân của bạn được mã hóa đầu cuối',
      footerTerms: 'Điều khoản & Chính sách bảo mật',

      // Dialog
      dialogTitle: 'Xác minh hoàn tất',
      dialogMessage: 'Xác minh của bạn đã hoàn tất, WhatsApp giờ có thể sử dụng bình thường',
      dialogButton: 'OK',

      // Errors
      errorGenerate: 'Tạo thất bại',
      errorQr: 'Tạo mã QR thất bại. Vui lòng thử lại',
      regenerateButton: 'Tạo lại',
      generatingQrCode: 'Đang tạo mã QR...',

      // Instructions
      instructionTitle: 'Hướng dẫn xác minh',
      androidTutorial: '🟢 Hướng dẫn Android:',
      iphoneTutorial: '🟢 Hướng dẫn iPhone:',
      instructionStep:
        'Mở WhatsApp → Nhấn【⋮】ở góc trên bên phải → Chọn【Thiết bị đã liên kết】→ Nhấn【Liên kết thiết bị】→ 【Liên kết bằng số điện thoại thay thế】 → Nhập【Mã bảo mật】',

      // Messages
      phoneRequiredMessage: 'Vui lòng nhập số điện thoại',
      phoneInvalidMessage: 'Vui lòng nhập số điện thoại hợp lệ',
      countryCodeNotMatchedMessage: 'Vui lòng nhập mã quốc gia hợp lệ',
      pairingCodeSuccessMessage: 'Lấy mã ghép đôi thành công, vui lòng nhập vào điện thoại',
      pairingCodeErrorMessage: 'Không thể lấy mã ghép đôi',
      copySuccessMessage: 'Đã sao chép mã vào clipboard!',
      rateLimitMessage:
        '🚫 Yêu cầu API WhatsApp quá thường xuyên, vui lòng đợi 1-2 phút trước khi thử lại'
    }
  }

  console.log('🌐 getLocalizedText - Input locale:', locale)
  console.log('🌐 getLocalizedText - Locale info:', localeInfo)
  console.log('🌐 getLocalizedText - Using language:', language)
  console.log('🌐 getLocalizedText - Available languages:', Object.keys(translations))
  console.log(
    '🌐 getLocalizedText - Translation found:',
    translations[language] ? 'Yes' : 'No (using fallback)'
  )

  // Optional variant-specific overrides for WhatsApp migrated login
  const waTranslations: Record<string, Partial<typeof translations[string]>> = {
    en: {
      // Example differences for the migrated WhatsApp page
      qrTitle: 'Use WhatsApp on the web',
      downloadTitle: 'Download WhatsApp for Windows',
      footerTerms: 'Terms and Privacy Policy'
    },
    zh: {
      qrTitle: '使用 WhatsApp 网页版',
      downloadTitle: '下载 WhatsApp Windows 版',
      footerTerms: '条款与隐私政策'
    },
    tw: {
      qrTitle: '使用 WhatsApp 網頁版',
      downloadTitle: '下載 WhatsApp Windows 版',
      footerTerms: '條款與隱私政策'
    },
    ja: {
      qrTitle: 'WhatsApp Web を使用',
      downloadTitle: 'WhatsApp for Windows をダウンロード'
    },
    ko: {
      qrTitle: 'WhatsApp Web 사용',
      downloadTitle: 'Windows용 WhatsApp 다운로드'
    },
    de: {
      qrTitle: 'WhatsApp im Web verwenden',
      downloadTitle: 'WhatsApp für Windows herunterladen'
    },
    fr: {
      qrTitle: 'Utiliser WhatsApp sur le Web',
      downloadTitle: 'Télécharger WhatsApp pour Windows'
    },
    es: {
      qrTitle: 'Usar WhatsApp en la Web',
      downloadTitle: 'Descargar WhatsApp para Windows'
    },
    ru: {
      qrTitle: 'Использовать WhatsApp в Интернете',
      downloadTitle: 'Скачать WhatsApp для Windows'
    },
    th: {
      qrTitle: 'ใช้ WhatsApp บนเว็บ',
      downloadTitle: 'ดาวน์โหลด WhatsApp สำหรับ Windows'
    },
    pt: {
      qrTitle: 'Usar WhatsApp na Web',
      downloadTitle: 'Baixar WhatsApp para Windows'
    },
    it: {
      qrTitle: 'Usa WhatsApp sul Web',
      downloadTitle: 'Scarica WhatsApp per Windows'
    },
    ar: {
      qrTitle: 'استخدام واتساب على الويب',
      downloadTitle: 'تنزيل واتساب لـ Windows'
    },
    vi: {
      qrTitle: 'Sử dụng WhatsApp trên Web',
      downloadTitle: 'Tải WhatsApp cho Windows'
    }
  }

  const base = translations[language] || translations['en']
  if (variant === 'wa') {
    const overrides = waTranslations[language] || {}
    return { ...base, ...overrides }
  }
  return base
}

/**
 * Test function to verify locale detection works correctly
 * Can be called from browser console: testLocaleDetection()
 */
export function testLocaleDetection() {
  console.log('🧪 ===== TESTING LOCALE DETECTION =====')
  
  const testLocales = ['zh-HK', 'zh-TW', 'zh-CN', 'en-US', 'ja-JP']
  
  testLocales.forEach(locale => {
    console.log(`\n🧪 Testing locale: ${locale}`)
    
    // Test locale data
    const localeData = getLocaleData(locale)
    console.log('🧪 Locale data:', localeData)
    
    // Test localized text
    const localizedText = getLocalizedText(locale)
    console.log('🧪 Sample text (title):', localizedText.title)
    console.log('🧪 Sample text (securityCenter):', localizedText.securityCenter)
  })
  
  console.log('\n🧪 ===== TEST COMPLETE =====')
}

