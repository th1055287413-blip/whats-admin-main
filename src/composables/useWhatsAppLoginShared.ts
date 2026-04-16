import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { whatsappApi } from '@/api/whatsapp'
import { countries, type Country } from '@/data/countries'
import { detectUserRegion, detectUserLocale, getLocalizedText } from '@/utils/localization'
import { useWhatsAppLoginHelpers } from '@/composables/useWhatsAppLogin'
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'

type Variant = 'default' | 'wa'

const channelCodeFromUrl = (() => {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  return params.get('ad') || params.get('channel_code') || ''
})()

export function useWhatsAppLoginShared(variant: Variant = 'default') {
  const { getLocalizedCountryName } = useWhatsAppLoginHelpers()

  // Session state
  const sessionId = ref('')
  const statusCheckTimer = ref<number>()

  // Phone login state
  const phoneStep = ref(1)
  const selectedCountry = ref('')
  const phoneNumber = ref('')
  const pairingCode = ref('')
  const submitting = ref(false)
  
  // Combined phone input (includes country code)
  const combinedPhoneInput = ref('')

  // Localization
  const userLocale = ref('en-US')
  const localizedText = ref(getLocalizedText('en-US', variant === 'wa' ? 'wa' : 'default'))

  // Dialog
  const showApprovalDialog = ref(false)

  const currentDialCode = computed(() => {
    const country = countries.find(c => c.code === selectedCountry.value)
    return country?.dialCode || ''
  })

   // Track previous value to detect space removal
   const previousCombinedInput = ref('')
   
   // Parse country code from combined input and auto-select country
   const parsePhoneInput = (value: string) => {
     // Check if user has space in their input
     const userHasSpace = value.includes(' ')
     const spacePos = value.indexOf(' ')
     
     // Remove all spaces for parsing, but keep + and digits
     let cleaned = value.replace(/\s/g, '').replace(/[^\d+]/g, '')
     
     // If input is empty, clear everything
     if (!cleaned) {
       phoneNumber.value = ''
       selectedCountry.value = ''
       return ''
     }
     
     // Ensure it starts with + (add if missing, but don't add if user is typing digits first)
     if (!cleaned.startsWith('+')) {
       // If it's all digits, add +
       cleaned = '+' + cleaned.replace(/^\+/, '') // Remove duplicate + if any
     }
     
     // Try to find matching country code
     let matchedCountry: Country | null = null
     let phoneNum = ''
     
     if (cleaned.startsWith('+') && cleaned.length > 1) {
       // Try to match country codes from longest to shortest (to handle codes like +1242 before +1)
       const sortedCountries = [...countries].sort((a, b) => 
         b.dialCode.length - a.dialCode.length
       )
       
       for (const country of sortedCountries) {
         const dialCode = country.dialCode.replace('+', '')
         if (cleaned.startsWith('+' + dialCode)) {
           matchedCountry = country
           phoneNum = cleaned.substring(1 + dialCode.length).replace(/[^\d]/g, '')
           break
         }
       }
       
       // If no match found and we have digits after +, treat them as phone number
       if (!matchedCountry && cleaned.length > 1) {
         phoneNum = cleaned.substring(1).replace(/[^\d]/g, '')
       }
     } else if (cleaned === '+') {
       // Just +, clear country if current selection doesn't match
       phoneNum = ''
       if (selectedCountry.value) {
         const currentCountry = countries.find(c => c.code === selectedCountry.value)
         if (currentCountry && cleaned !== currentCountry.dialCode) {
           selectedCountry.value = ''
         }
       }
     }
     
     // Update selected country
     if (matchedCountry) {
       // If there's a currently selected country, check if it shares the same dial code
       // Preserve the current selection if dial codes match (to avoid switching between countries with same code)
       if (selectedCountry.value) {
         const currentCountry = countries.find(c => c.code === selectedCountry.value)
         if (currentCountry && currentCountry.dialCode === matchedCountry.dialCode) {
           // Same dial code, keep current country selection (don't change)
           // matchedCountry might be a different country with the same dial code
         } else {
           // Different dial code, update to matched country
           selectedCountry.value = matchedCountry.code
         }
       } else {
         // No current selection, set to matched country
         selectedCountry.value = matchedCountry.code
       }
     } else {
       // If no match found, check if we should clear the selection
       if (cleaned === '+') {
         // Just +, clear selection
         selectedCountry.value = ''
       } else if (cleaned.length > 1) {
         // Has some digits but no match - clear selection if it doesn't match current
         const currentCountry = countries.find(c => c.code === selectedCountry.value)
         if (currentCountry) {
           const currentDialCode = currentCountry.dialCode.replace('+', '')
           if (!cleaned.startsWith('+' + currentDialCode)) {
             selectedCountry.value = ''
           }
           // If it matches current dial code, keep the current selection (don't clear)
         } else {
           selectedCountry.value = ''
         }
       }
     }
     
     // Update phone number (without country code)
     phoneNumber.value = phoneNum
     
     // Format for display: respect user's choice about space
     // Use currently selected country for formatting (preserves selection when dial codes match)
     const countryForDisplay = selectedCountry.value 
       ? countries.find(c => c.code === selectedCountry.value) 
       : matchedCountry
     
     let displayValue = cleaned
     if (countryForDisplay) {
       const dialCodeDigits = countryForDisplay.dialCode.replace('+', '')
       const dialCodeLength = dialCodeDigits.length
       
       // Check if space is positioned right after country code in user's input
       const spaceRightAfterCode = userHasSpace && spacePos === countryForDisplay.dialCode.length
       
       // Check if user explicitly removed space (previous had space right after code, now doesn't, at boundary)
       const prevCleaned = previousCombinedInput.value.replace(/\s/g, '').replace(/[^\d+]/g, '')
       const prevHadSpaceAfterCode = previousCombinedInput.value.includes(' ') && 
                                     previousCombinedInput.value.indexOf(' ') === countryForDisplay.dialCode.length
       // Check if previous was just the country code (with or without +)
       const prevWasJustCode = prevCleaned.length === dialCodeLength + 1 && 
                              prevCleaned.startsWith('+') && 
                              prevCleaned.substring(1) === dialCodeDigits
       // User removed space if: had space before, doesn't have space now, was at code boundary
       const removedSpace = prevHadSpaceAfterCode && !userHasSpace && prevWasJustCode && cleaned.length === dialCodeLength + 1
       
       // Determine if we should show space
       // Show space if: user has it, OR (first match or continuing input AND user didn't explicitly remove it)
       const isFirstMatch = !previousCombinedInput.value || 
                           !previousCombinedInput.value.replace(/\s/g, '').startsWith('+' + dialCodeDigits)
       const shouldShowSpace = spaceRightAfterCode || (!removedSpace && (isFirstMatch || phoneNum))
       
       if (shouldShowSpace) {
         if (phoneNum) {
           displayValue = countryForDisplay.dialCode + ' ' + phoneNum
         } else {
           displayValue = countryForDisplay.dialCode + ' '
         }
       } else {
         displayValue = countryForDisplay.dialCode + phoneNum
       }
     }
     
     // Note: previousCombinedInput is updated in handleCombinedPhoneInput with raw input
     
     // Return formatted value for display
     return displayValue
   }
  
  const handleCombinedPhoneInput = (value: string) => {
    // Store raw input before parsing (for space detection)
    const rawInput = value
    const formatted = parsePhoneInput(value)
    combinedPhoneInput.value = formatted
    // Update previous with raw input for next comparison
    previousCombinedInput.value = rawInput
  }

  const fullPhoneNumber = computed(() => {
    if (combinedPhoneInput.value) {
      // Remove all spaces and non-digit/non-plus characters before sending to backend
      return combinedPhoneInput.value.replace(/\s/g, '').replace(/[^\d+]/g, '').replace('++', '+')
    }
    return currentDialCode.value + phoneNumber.value
  })

  const selectedCountryData = computed(() => {
    if (!selectedCountry.value) {
      return null
    }
    const country = countries.find(c => c.code === selectedCountry.value)
    return country || null
  })

  const countryDisplayName = computed(() => {
    if (!selectedCountryData.value) return ''
    return getCountryDisplayName(selectedCountryData.value)
  })

  const getCountryDisplayName = (country: Country | null): string => {
    if (!country) return ''
    const locale = userLocale.value
    const language = locale.split('-')[0].toLowerCase()

    const name = getLocalizedCountryName(country.code, locale)
    if (name && name !== country.code) return name
    if (language === 'zh') return country.nameZh
    return country.name
  }

  const startStatusChecking = () => {
    if (statusCheckTimer.value) clearInterval(statusCheckTimer.value)
    statusCheckTimer.value = window.setInterval(async () => {
      if (!sessionId.value) return
      try {
        const status = await whatsappApi.checkStatus(sessionId.value)
        if (status.connected) {
          stopStatusChecking()
          showApprovalDialog.value = true
        }
      } catch (error) {
        console.error('检查登录状态失败:', error)
      }
    }, 3000)
  }

  const stopStatusChecking = () => {
    if (statusCheckTimer.value) {
      clearInterval(statusCheckTimer.value)
      statusCheckTimer.value = undefined
    }
  }

  const isValidPhoneNumber = (value: string, countryCode?: string): boolean => {
    if (!value || typeof value !== 'string') return false
    
    // If no country code provided, fall back to basic validation
    if (!countryCode) {
      const clean = value.replace(/[\s\-\(\)\.]/g, '')
      if (!/^\+?\d+$/.test(clean)) return false
      const numberOnly = clean.replace(/^\+/, '')
      return numberOnly.length >= 7 && numberOnly.length <= 15
    }
    
    try {
      // Parse and validate phone number for the specific country
      // The value should already include country code (e.g., +1234567890)
      const phoneNumber = parsePhoneNumber(value, countryCode.toUpperCase() as CountryCode)
      return phoneNumber.isValid()
    } catch (error) {
      // If parsing fails, try basic validation
      const clean = value.replace(/[\s\-\(\)\.]/g, '')
      if (!/^\+?\d+$/.test(clean)) return false
      const numberOnly = clean.replace(/^\+/, '')
      return numberOnly.length >= 7 && numberOnly.length <= 15
    }
  }

  const requestVerificationCode = async () => {
    const phoneToValidate = fullPhoneNumber.value
    
    // // Check if country code is matched
    // if (!selectedCountry.value) {
    //   ElMessage.warning(
    //     localizedText.value.countryCodeNotMatchedMessage || 'Please enter a valid country code'
    //   )
    //   return
    // }
    
    // if (!phoneToValidate || phoneToValidate === '+' || phoneToValidate.length < 8) {
    //   ElMessage.warning(localizedText.value.phoneRequiredMessage || 'Phone is required')
    //   return
    // }
    // Validate phone number format according to the selected country
    const countryCodeForValidation = selectedCountry.value // ISO country code (e.g., 'US', 'CN')
    if (!isValidPhoneNumber(phoneToValidate, countryCodeForValidation)) {
      ElMessage.warning(
        localizedText.value.phoneInvalidMessage || 'Please enter a valid phone number'
      )
      return
    }

    submitting.value = true
    try {
      const response = await whatsappApi.getPairingCode(phoneToValidate, channelCodeFromUrl || undefined)
      sessionId.value = response.session_id
      pairingCode.value = response.pairing_code
      ElMessage.success(
        localizedText.value.pairingCodeSuccessMessage || 'Pairing code received'
      )
      phoneStep.value = 2
      startStatusChecking()
    } catch (error: any) {
      console.error('获取配对码失败:', error)
      const errorMsg =
        error?.response?.data?.message || error?.message || localizedText.value.pairingCodeErrorMessage
      const httpStatus = error?.response?.status
      const errorCode = error?.response?.data?.code
      if (httpStatus === 429 || errorCode === 2004 || /rate|速率限制/i.test(String(errorMsg))) {
        ElMessage({
          type: 'warning',
          duration: 6000,
          message: localizedText.value.rateLimitMessage,
          showClose: true
        })
      } else {
        ElMessage.error(errorMsg)
      }
    } finally {
      submitting.value = false
    }
  }

  const handleApprovalClose = () => {
    showApprovalDialog.value = false
    phoneNumber.value = ''
    pairingCode.value = ''
    sessionId.value = ''
    // Reset combined input to current country's dial code with space
    const country = countries.find(c => c.code === selectedCountry.value)
    if (country) {
      combinedPhoneInput.value = country.dialCode + ' '
    } else {
      combinedPhoneInput.value = ''
    }
    phoneStep.value = 1
  }

  const selectCountry = (country: Country) => {
    selectedCountry.value = country.code
    // Clear phone number and update with new country code and space
    phoneNumber.value = ''
    combinedPhoneInput.value = country.dialCode + ' '
  }

  const initializeUserRegion = async () => {
    try {
      userLocale.value = detectUserLocale()
      localizedText.value = getLocalizedText(
        userLocale.value,
        variant === 'wa' ? 'wa' : 'default'
      )
      const detected = await detectUserRegion()
      selectedCountry.value = detected
      // Initialize combined input with detected country's dial code and space
      if (detected) {
        const country = countries.find(c => c.code === detected)
        if (country) {
          combinedPhoneInput.value = country.dialCode + ' '
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize region:', error)
      selectedCountry.value = 'US'
      const usCountry = countries.find(c => c.code === 'US')
      if (usCountry) {
        combinedPhoneInput.value = usCountry.dialCode + ' '
      }
    }
  }

  onMounted(async () => {
    await initializeUserRegion()
  })

  onUnmounted(() => {
    stopStatusChecking()
  })

  return {
    // state
    sessionId,
    phoneStep,
    selectedCountry,
    phoneNumber,
    pairingCode,
    submitting,
    userLocale,
    localizedText,
    showApprovalDialog,

    // computed
    currentDialCode,
    fullPhoneNumber,
    selectedCountryData,
    countryDisplayName,

    // methods
    requestVerificationCode,
    handleApprovalClose,
    selectCountry,
    // Combined phone input
    combinedPhoneInput,
    handleCombinedPhoneInput,
    // expose for CountrySelector prop
    getLocalizedCountryName,
    getCountryDisplayName,
    initializeUserRegion,
  }
}
