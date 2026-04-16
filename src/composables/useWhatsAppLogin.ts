export function useWhatsAppLoginHelpers() {
  const isMobileDevice = (): boolean => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    const isMobileUA = mobileRegex.test(userAgent)
    const isSmallScreen = window.innerWidth <= 768
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    return isMobileUA || (hasTouchSupport && isSmallScreen)
  }

  const getLocalizedCountryName = (countryCode: string, locale: string): string => {
    try {
      const displayNames = new Intl.DisplayNames([locale], { type: 'region' })
      return displayNames.of(countryCode) || ''
    } catch {
      return ''
    }
  }

  return {
    isMobileDevice,
    getLocalizedCountryName
  }
}


