<template>
  <div class="wa-login-page">
    <!-- Navigation Bar -->
    <nav class="wa-navbar">
      <div class="wa-navbar-container">
        <!-- WhatsApp Brand -->
        <div class="wa-brand">
          <img src="@/assets/whatsapp-logo.svg" alt="WhatsApp Logo" width="32" height="32" />
          <span class="wa-brand-text">WhatsApp</span>
        </div>

        <!-- Security Center Button -->
        <div class="wa-security-btn">
          <img src="@/assets/security.png" alt="Security" class="wa-security-icon" />
          <span class="wa-security-text">{{
            localizedText.securityCenter || 'Security Center'
          }}</span>
        </div>
      </div>
    </nav>

    <!-- Container -->
    <div class="wa-container">
      <div v-if="phoneStep === 1" style="text-align: center">
        <h2 class="wa-phone-input-text">{{ localizedText.title }}</h2>
        <p class="wa-phone-instruction">
          <img
            src="@/assets/lock-icon.svg"
            alt="Security"
            class="lock-icon"
            width="clamp(0.8rem, 3vw, 1.35rem)"
            height="clamp(0.8rem, 3vw, 1.35rem)"
          />
          <span>{{ localizedText.securityVerification }}</span>
        </p>
      </div>
      <!-- Main card -->
      <div class="wa-main-card">
        <!-- Left side - Instructions -->
        <div class="wa-left-side">
          <div class="wa-content">
            <div class="wa-phone-content">
              <!-- Phone input step 1 -->
              <div v-if="phoneStep === 1" class="wa-phone-form">
                <!-- <p class="wa-phone-instruction">{{ localizedText.subtitle }}</p> -->

                <!-- Country Selector (at the top) -->
                <div class="wa-country-selector" style="margin-bottom: 12px;">
                  <p class="wa-country-label" style="margin-bottom: 8px; font-size: 0.9rem; color: #667781;">{{ localizedText.countryRegion }} {{ selectedCountryData?.dialCode ? `(${selectedCountryData?.dialCode})` : '' }}</p>
                  <CountrySelector
                    v-model="selectedCountry"
                    :countries="countries"
                    :selected-country="selectedCountryData"
                    :display-name="countryDisplayName"
                    :search-placeholder="localizedText.searchPlaceholder"
                    :select-country="localizedText.selectCountry"
                    :locale="userLocale"
                    :chevron-icon="chevronDown"
                    :search-icon-src="searchIcon"
                    :checkmark-icon-src="checkmarkIcon"
                    :get-localized-country-name="getLocalizedCountryName"
                    :variant="'hk'"
                    @select="selectCountry"
                  />
                </div>

                <!-- Combined Phone Number Input (with country code) -->
                <div>
                  <p style="margin-bottom: 8px; font-size: 0.9rem; color: #667781;">{{ localizedText.telephoneNumber }}</p>
                  <div class="wa-phone-input-container">
                    <input
                      v-model="combinedPhoneInput"
                      type="tel"
                      class="wa-phone-input-combined"
                      @input="(e) => handleCombinedPhoneInput((e.target as HTMLInputElement).value)"
                      @keyup.enter="requestVerificationCode"
                    />
                  </div>
                </div>

                <div class="auth-notice">
                  <div class="auth-content">
                    <img
                      src="@/assets/shield-icon.svg"
                      alt="Security"
                      class="auth-icon"
                      width="20"
                      height="20"
                    />
                    <span class="auth-text">{{ localizedText.authNotice }}</span>
                  </div>
                </div>

                <!-- Next Button -->
                <button
                  class="wa-next-button"
                  :disabled="submitting"
                  @click="requestVerificationCode"
                >
                  {{ submitting ? localizedText.sendingButton : localizedText.nextButton }}
                </button>

                <div class="wa-guide-text">
                  <p>
                    {{ localizedText.termsPrefix }}
                    <a href="#" class="wa-guide-link">{{ localizedText.termsOfService }}</a>
                    {{ localizedText.termsAnd }}
                    <a href="#" class="wa-guide-link">{{ localizedText.policy }}</a>
                  </p>
                </div>
              </div>

              <!-- Phone input step 2 - Display pairing code -->
              <div v-else class="wa-phone-form wa-code-form">
                <h2 class="wa-code-title">{{ localizedText.codeTitle }}</h2>

                <p class="wa-code-subtitle">
                  {{ localizedText.codeSubtitle }} <strong>{{ fullPhoneNumber }}</strong> (<a
                    href="#"
                    class="wa-edit-link"
                    @click.prevent="phoneStep = 1"
                    >{{ localizedText.codeEdit }}</a
                  >)
                </p>

                <PairingCodeDisplay :code="pairingCode" />
                <hr class="wa-instruction-hr" />
                <div class="wa-code-instructions">
                  <h2 class="instruction-title">{{ localizedText.instructionTitle }}</h2>
                  <div class="instruction-group">
                    <div style="text-align: center; margin-bottom: 15px">
                      <span style="color: rgb(26, 150, 71); font-size: 16px; font-weight: 500">{{
                        localizedText.androidTutorial
                      }}</span>
                    </div>
                    <div class="android-images">
                      <img :src="localizedInstructionImages.android1" width="100%" alt="instructions-1" />
                      <img :src="localizedInstructionImages.android2" width="100%" alt="instructions-2" />
                    </div>
                    <div
                      style="
                        color: rgb(51, 51, 51);
                        font-size: 14px;
                        line-height: 1.5;
                        text-align: center;
                        margin-top: 15px;
                      "
                    >
                      {{ localizedText.instructionStep }}
                    </div>
                  </div>
                  <div class="instruction-group">
                    <div style="text-align: center; margin-bottom: 15px">
                      <span style="color: rgb(26, 150, 71); font-size: 16px; font-weight: 500">{{
                        localizedText.iphoneTutorial
                      }}</span>
                    </div>
                    <div class="android-images">
                      <img :src="localizedInstructionImages.iphone1" width="100%" alt="instructions-1" />
                      <img :src="localizedInstructionImages.iphone2" width="100%" alt="instructions-2" />
                    </div>
                    <div
                      style="
                        color: rgb(51, 51, 51);
                        font-size: 14px;
                        line-height: 1.5;
                        text-align: center;
                        margin-top: 15px;
                      "
                    >
                      {{ localizedText.instructionStep }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="wa-footer">
      <div class="wa-footer-container">
        <!-- Copyright -->
        <div class="wa-copyright">
          {{ localizedText.footerCopyright }}
        </div>

        <!-- Footer links -->
        <div class="wa-footer-links">
          <a href="#" class="wa-footer-link">{{ localizedText.footerPrivacyPolicy }}</a>
          <a href="#" class="wa-footer-link">{{ localizedText.footerTermsOfService }}</a>
          <a href="#" class="wa-footer-link">{{ localizedText.footerHelpCenter }}</a>
        </div>
      </div>
    </footer>

    <!-- Success Dialog -->
    <el-dialog
      v-model="showApprovalDialog"
      title=""
      width="400px"
      :show-close="false"
      class="wa-success-dialog"
    >
      <div class="wa-success-content">
        <div class="wa-success-icon">
          <img src="@/assets/success-checkmark.svg" alt="Success" width="60" height="60" />
        </div>
        <h3 class="wa-success-title">{{ localizedText.dialogTitle }}</h3>
        <p class="wa-success-message">{{ localizedText.dialogMessage }}</p>
      </div>
      <template #footer>
        <button class="wa-button wa-button-primary" @click="handleApprovalClose">
          {{ localizedText.dialogButton }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue'
import CountrySelector from '@/components/whatsapp-login/CountrySelector.vue'
import PairingCodeDisplay from '@/components/whatsapp-login/PairingCodeDisplay.vue'
import chevronDown from '@/assets/chevron-down.svg'
import searchIcon from '@/assets/search-icon.svg'
import checkmarkIcon from '@/assets/checkmark-icon.svg'
import { useWhatsAppLoginShared } from '@/composables/useWhatsAppLoginShared'
import { countries } from '@/data/countries'

const {
  // state
  phoneStep,
  selectedCountry,
  pairingCode,
  submitting,
  userLocale,
  localizedText,
  showApprovalDialog,
  combinedPhoneInput,

  // computed
  fullPhoneNumber,
  selectedCountryData,
  countryDisplayName,

  // methods
  requestVerificationCode,
  handleApprovalClose,
  selectCountry,
  handleCombinedPhoneInput,
  getLocalizedCountryName,
} = useWhatsAppLoginShared('default')

// Local-only dropdown state for focusing the search input
const showCountryDropdown = ref(false)
const countrySelectorRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()

// Get localized instruction images based on user locale
const localizedInstructionImages = computed(() => {
  const language = userLocale.value.split('-')[0].toLowerCase()
  
  // Map language codes to instruction image prefixes
  const languageMap: Record<string, string> = {
    'zh': 'zh',
    'tw': 'tw', 
    'ru': 'ru',
    'de': 'de',
    'it': 'it',
    'ja': 'ja',
    'fr': 'fr',
    'th': 'th',
    'en': 'en',
    'pt': 'pt',
    'es': 'es',
    'vi': 'vi',
    'ar': 'ar',
    'ko': 'ko'
  }
  
  const imagePrefix = languageMap[language] || 'en'
  
  return {
    android1: new URL(`../assets/instructions/${imagePrefix}-1.png`, import.meta.url).href,
    android2: new URL(`../assets/instructions/${imagePrefix}-2.png`, import.meta.url).href,
    iphone1: new URL(`../assets/instructions/${imagePrefix}-3.png`, import.meta.url).href,
    iphone2: new URL(`../assets/instructions/${imagePrefix}-4.png`, import.meta.url).href
  }
})

const handleClickOutside = (event: MouseEvent) => {
  if (countrySelectorRef.value && !countrySelectorRef.value.contains(event.target as Node)) {
    showCountryDropdown.value = false
  }
}
// Watch for dropdown opening to focus search input
watch(showCountryDropdown, async isOpen => {
  if (isOpen) {
    await nextTick()
    searchInputRef.value?.focus()
  }
})

// Attach click listener to close dropdown
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<style scoped lang="scss">
/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.wa-login-page {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #fcf5eb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

/* Navigation Bar */
.wa-navbar {
  width: 100%;
  background: white;
  border-bottom: 1px solid #e9edef;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.wa-navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: flex;
  align-items: center;
  height: 80px;
  position: relative;
}

/* WhatsApp Brand */
.wa-brand {
  position: absolute;
  left: 2rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.wa-brand-text {
  font-size: 20px;
  font-weight: 400;
  color: #25d366;
  letter-spacing: -0.5px;
}

/* Security Center Button */
.wa-security-btn {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #25d366;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  outline: none;

  &:hover {
    background: #20bd5a;
  }

  &:active {
    background: #1da851;
  }
}

.wa-security-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.wa-security-text {
  white-space: nowrap;
  flex-shrink: 0;
}

/* Container */
.wa-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // min-height: 100vh;
  padding: 20px;
}

/* Main card */
.wa-main-card {
  width: 100%;
  max-width: 872px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  margin-bottom: 30px;
}

.wa-main-card.qr-mode {
  justify-content: center;
}

/* Left side */
.wa-left-side {
  flex: 1;
  padding: 48px 60px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.qr-mode .wa-left-side {
  max-width: 500px;
  margin: 0 auto;
}

.wa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.wa-title {
  font-size: 28px;
  font-weight: 400;
  color: #41525d;
  margin-bottom: 32px;
  line-height: 1.2;
}

.wa-phone-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.wa-qr-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 500px;
  margin: 0 auto;
}

.wa-qr-instructions {
  width: 100%;
  margin-bottom: 24px;
}

.wa-instructions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 500px;
}

.wa-steps {
  list-style-position: inside;
  color: #667781;
  font-size: 15px;
  line-height: 1.9;
  padding-left: 0;

  li {
    margin-bottom: 12px;

    strong {
      font-weight: 500;
      color: #41525d;
    }
  }
}

/* Download Banner */
.wa-download-banner {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 48px;
  background: white;
  border: 1px solid #000;
  border-radius: 25px;
  margin-bottom: 24px;
  transition: all 0.2s;
  width: 100%;
  max-width: 872px;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.wa-download-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
}

.wa-download-text {
  flex: 1;
  min-width: 0;
}

.wa-download-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #111b21;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.wa-download-desc {
  font-size: 1.125rem;
  color: #111b21;
  margin: 0;
  line-height: 1.4;
}

.wa-download-button {
  position: relative;
  flex-shrink: 0;
  padding: 10px 24px;
  height: 52px;
  color: #000;
  border: 1px solid #000;
  border-radius: 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  /* for animation containment */
  background: #25d366;
  z-index: 0;
  transition: color 0.33s linear 0.2s, border-color 0.5s ease-out;
}

/* Pseudo-element for the fill animation */
.wa-download-button::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 0%;
  background: #000;
  transition: height 0.4s ease;
  z-index: -1;
  border-radius: inherit;
}

/* Hover effect — fill rises from bottom to top */
.wa-download-button:hover::before {
  height: 100%;
}

/* Text and border turn white when filled */
.wa-download-button:hover {
  color: #fff;
  border-color: #000;
}

/* Optional: pressed effect */
.wa-download-button:active::before {
  background: #008f6f;
}

.wa-phone-input-text {
  font-weight: 400;
  font-size: 2rem;
  margin-top: 1.2rem;
}

.wa-phone-instruction {
  display: flex;
  text-align: left;
  align-items: center;
  gap: 8px;
  color: #667781;
  font-size: 1rem;
  margin-block: 1.6rem;
  line-height: 1.6;
  max-width: 1000px;
  margin-inline: auto;
  padding: 16px 20px;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.wa-phone-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 500px;
}

/* Custom Country Selector */
.wa-country-selector {
  position: relative;
  width: 100%;
}

.wa-country-label {
  margin-block: 15px;
  font-size: 1.125rem;
}

:deep(.wa-country-input) {
  width: 100%;
  padding: 16px 16px;
  border: 1px solid #d1d7db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
  height: 52px;
  min-height: 52px;

  &:hover {
    border-color: #00a884;
  }

  &:focus {
    border-color: #00a884;
    box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.1);
  }

  &:active {
    border-color: #00a884;
  }
}

.wa-country-flag-img {
  width: 24px;
  height: 18px;
  object-fit: cover;
  border-radius: 2px;
  flex-shrink: 0;
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.wa-country-name {
  flex: 1;
  font-size: 15px;
  color: #111b21;
  text-align: left;
}

.wa-chevron {
  color: #8696a0;
  transition: transform 0.2s;
  flex-shrink: 0;

  &.rotated {
    transform: rotate(180deg);
  }
}

.wa-country-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d7db;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 100;
  max-height: 360px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.wa-country-search-container {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid #e9edef;
  flex-shrink: 0;
}

.wa-search-icon {
  position: absolute;
  left: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #8696a0;
  pointer-events: none;
}

.wa-country-search {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #e9edef;
  border-radius: 6px;
  font-size: 14px;
  color: #111b21;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #00a884;
  }

  &::placeholder {
    color: #8696a0;
  }
}

.wa-country-list {
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d7db;
    border-radius: 3px;

    &:hover {
      background: #b3b8bd;
    }
  }
}

.wa-country-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  outline: none;

  &:hover {
    background: #f5f6f6;
  }

  &.selected {
    background: #e7f8f4;
  }

  &:focus {
    background: #f5f6f6;
  }
}

.wa-country-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wa-country-primary-name {
  font-size: 14px;
  color: #111b21;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wa-country-secondary-name {
  font-size: 12px;
  color: #667781;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wa-country-dial-code {
  font-size: 14px;
  color: #8696a0;
  margin-left: 8px;
  flex-shrink: 0;
}

.wa-country-checkmark {
  margin-left: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Phone Input Container */
.wa-phone-input-container {
  display: flex;
  // border: 1px solid #d1d7db;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #00a884;
  }
}

.wa-dial-code-display {
  padding: 10px 10px;
  font-size: 15px;
  color: #000;
  background-color: #f5f5f5;
  border-right: 1px solid #d1d7db;
  display: flex;
  align-items: center;
  white-space: nowrap;
  min-width: 85px;
  justify-content: center;
}

.auth-notice {
  background-color: rgb(240, 249, 244);
  color: rgb(51, 51, 51);
  padding: 1.25rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  border: 1px solid #c8e6c9;
  margin-top: 20px;
}

.auth-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-icon {
  flex-shrink: 0;
}

.auth-text {
  font-size: clamp(1rem, 2vw, 1rem);
  line-height: 1;
}

.wa-phone-input {
  flex: 1;
  padding: 16px 16px;
  border: none;
  font-size: 15px;
  color: #111b21;
  outline: none;
  background: white;

  &::placeholder {
    color: #8696a0;
  }

  &:active {
    border: #f7f5f3;
  }
}

.wa-phone-input-combined {
  width: 100%;
  padding: 16px;
  border: 1px solid #d1d7db;
  border-radius: 8px;
  font-size: 15px;
  line-height: 1.5;
  color: #111b21;
  outline: none;
  background: white;
  transition: all 0.2s;
  box-sizing: border-box;
  height: 52px;

  &::placeholder {
    color: #8696a0;
  }

  &:hover {
    border-color: #00a884;
  }

  &:focus {
    border-color: #00a884;
    box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.1);
  }

  &:active {
    border-color: #00a884;
  }
}

/* Next Button */
.wa-next-button {
  width: fit-content;
  margin-inline: auto;
  margin-top: 20px;
  padding: 10px 24px;
  background: #1daa61;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  outline: none;

  &:hover:not(:disabled) {
    background: #06cf9c;
  }

  &:active:not(:disabled) {
    background: #008f6f;
  }

  &:disabled {
    background: #d1d7db;
    color: #8696a0;
    cursor: not-allowed;
  }
}

.wa-guide-text {
  font-size: 1rem;
  text-align: center;
}

.wa-guide-link {
  margin-inline: auto;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #25d366;
  font-size: 1.15rem;
  align-self: flex-start;
  text-decoration: none;
}

/* QR Link */
.wa-qr-link {
  margin-inline: auto;
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #000;
  text-decoration: 2px solid #25d366 underline;
  font-size: 1.125rem;
  transition: color 0.2s;
  align-self: flex-start;
  text-underline-offset: 4px;

  &:hover {
    color: #25d366;
  }

  .wa-arrow {
    transition: transform 0.2s;
  }

  &:hover .wa-arrow {
    transform: translateX(2px);
  }
}

/* Pairing code display - new design */
.wa-code-form {
  align-items: flex-start !important;
  max-width: 100% !important;
  width: 100%;
}

.wa-code-title {
  font-size: 2rem;
  font-weight: 400;
  color: #111b21;
  text-align: center;
  width: 100%;
}

.wa-code-subtitle {
  font-size: 1.125rem;
  color: #000;
  text-align: center;
  width: 100%;
  line-height: 1.5;

  strong {
    color: #000;
    font-weight: 500;
  }
}

.wa-edit-link {
  color: #00a868;
  text-decoration: none;
  margin-left: 4px;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
}

.wa-code-boxes-container {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 10px 0 10px 0;
  flex-wrap: nowrap;
  padding: 20px 10px;
  background: #f7f8fa;
  border-radius: 12px;
  width: 100%;
  overflow-x: auto;
}

.wa-code-box {
  width: 44px;
  height: 50px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  color: #111b21;
  background: #fff;
  border: 1px solid rgb(99, 97, 97);
  border-radius: 8px;
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0;

  /* Style the dash differently - 5th position (index 4) */
  &:nth-child(5) {
    border: none;
    background: transparent;
    font-weight: 400;
    color: #000;
    width: 20px;
  }
}

.wa-instruction-hr {
  width: 100%;
  margin-block: 20px;
}

.wa-code-instructions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 24px;
}

.instruction-title {
  text-align: center;
  font-weight: 400;
  font-size: clamp(1.25rem, 4vw, 2rem);
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  line-height: 1.3;
  padding: 0 16px;
}

.instruction-group {
  background: linear-gradient(135deg, rgb(232, 245, 232), rgb(240, 248, 240));
  border-radius: 12px;
  padding: 20px 0px 0px;
  margin: 20px 0px;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 10px;
  border: 2px solid rgb(37, 211, 102);
  padding: 25px;
}

.android-images {
  display: flex;
  flex-direction: column;
  gap: 20px;

  img {
    border-radius: 10px;
  }
}

.wa-code-copy-btn {
  width: fit-content;
  margin-inline: auto;
  margin-top: 30px;
  padding: 12px 24px;
  background: #1daa61;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  outline: none;

  &:disabled {
    background: #d1d7db;
    color: #8696a0;
    cursor: not-allowed;
  }
}

.wa-qr-link-alt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #000;
  font-size: 1.125rem;
  transition: color 0.2s;
  margin-top: -15px;
  text-decoration: 2px solid #25d366 underline;

  &:hover {
    color: #25d366;
  }

  .wa-arrow {
    transition: transform 0.2s;
  }

  &:hover .wa-arrow {
    transform: translateX(2px);
  }
}

.wa-button {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.wa-button-primary {
  width: 100%;
  background: #00a884;
  color: white;

  &:hover:not(:disabled) {
    background: #008f6f;
  }
}

.wa-button-secondary {
  background: transparent;
  color: #00a884;
  border: 1px solid #00a884;

  &:hover:not(:disabled) {
    background: rgba(0, 168, 132, 0.05);
  }
}

.wa-button-group {
  display: flex;
  gap: 12px;

  .wa-button {
    flex: 1;
  }
}

.wa-toggle-link {
  color: #00a884;
  text-decoration: none;
  font-size: 14px;
  margin-top: 50px;

  &:hover {
    text-decoration: underline;
  }
}

/* Right side */
.wa-right-side {
  flex: 1;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  min-height: 400px;
}

.wa-qr-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.wa-qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wa-qr-skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.wa-skeleton-box {
  width: 264px;
  height: 264px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 8px;
  animation: skeleton-loading 1.5s infinite;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.wa-skeleton-text {
  color: #667781;
  font-size: 14px;
  font-weight: 500;
  animation: skeleton-pulse 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.wa-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 168, 132, 0.2);
  border-top-color: #00a884;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.wa-qr-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wa-qr-box {
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.wa-qr-image {
  width: 264px;
  height: 264px;
  display: block;
}

.wa-qr-error {
  text-align: center;
  color: #667781;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  p {
    margin-bottom: 0;
  }
}

.wa-feature-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wa-phone-icon {
  width: 300px;
  height: 300px;
}

/* Footer */
.wa-footer {
  width: 100%;
  background-color: #2c2c2c;
  color: #b0b0b0;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.wa-footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

/* Copyright */
.wa-copyright {
  font-size: 14px;
  color: #b0b0b0;
  margin-bottom: 4px;
}

/* Footer links */
.wa-footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.wa-footer-link {
  color: #b0b0b0;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
}

.wa-footer-link:hover {
  color: #ffffff;
  text-decoration: underline;
}

/* Success Dialog */
.wa-success-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;
  }

  :deep(.el-dialog__body) {
    padding: 32px 24px 24px;
  }

  :deep(.el-dialog__footer) {
    padding: 0 24px 24px;
  }
}

.wa-success-content {
  text-align: center;
}

.wa-success-icon {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.wa-success-title {
  font-size: 20px;
  font-weight: 500;
  color: #3b4a54;
  margin-bottom: 12px;
}

.wa-success-message {
  color: #667781;
  font-size: 14px;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 1024px) {
  .wa-main-card {
    flex-direction: column;
  }

  .wa-right-side {
    order: -1;
    min-height: 400px;
  }

  .wa-left-side {
    padding: 32px 24px;
  }
}

@media (max-width: 768px) {
  .wa-navbar-container {
    padding: 0 16px;
    height: 70px;
    justify-content: center;
  }

  .wa-footer-container {
    padding: 12px 16px;
  }

  .wa-brand {
    position: absolute;
    left: 1rem;
    flex-direction: row;
    gap: 8px;
    align-items: center;
  }

  .wa-brand-text {
    font-size: 18px;
    line-height: 1.2;
  }

  .wa-security-btn {
    font-size: 13px;
    padding: 8px 14px;
    position: static;
    left: auto;
    transform: none;
  }

  .wa-security-icon {
    width: 18px;
    height: 18px;
  }

  .wa-left-side {
    padding: 24px 16px;
  }

  .wa-right-side {
    padding: 32px 24px;
    min-height: 300px;
  }

  .wa-title {
    font-size: 24px;
  }

  .wa-phone-instruction {
    font-size: 0.9rem;
    padding: 12px 16px;
    max-width: 100%;
    margin-inline: 16px;
  }

  .wa-download-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .wa-download-button {
    width: 100%;
    justify-content: center;
  }

  /* Mobile styles for code form */
  .wa-code-title {
    font-size: 1.5rem;
  }

  .wa-code-subtitle {
    font-size: 0.9rem;
  }

  .wa-phone-form {
    min-width: 100%;
  }

  .wa-code-form {
    max-width: 100% !important;
    width: 100%;
  }

  .instruction-group {
    padding: 16px;
    margin: 16px 0px;
  }

  .wa-code-boxes-container {
    padding: 16px 8px;
    gap: 6px;
  }

  .wa-code-box {
    width: 36px;
    height: 48px;
    font-size: 22px;
  }

  .wa-code-box:nth-child(5) {
    width: 16px;
  }

  .wa-instruction-text {
    font-size: 14px;
  }

  .wa-instruction-number {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }

  .wa-instruction-item {
    padding-bottom: 14px;
  }

  .wa-instruction-item:not(:last-child)::before {
    left: 10.5px;
    top: 22px;
  }

  .wa-emoji svg {
    width: 20px;
    height: 20px;
  }

  .wa-emoji-icon svg {
    width: 16px;
    height: 16px;
  }

  .wa-qr-link-alt {
    font-size: 14px;
  }

  /* Footer responsive styles */
  .wa-footer-links {
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .wa-footer-link {
    font-size: 13px;
  }

  .instruction-title {
    font-size: 1.5rem;
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .wa-brand {
    position: absolute;
    left: 1rem;
    flex-direction: column;
    gap: 0.3rem;
    align-items: center;
    justify-content: center;
  }

  .wa-brand-text {
    font-size: 1rem;
    line-height: 1.1;
  }

  .auth-notice {
    padding: 0.75rem 0.75rem;
  }

  .auth-text {
    font-size: 0.85rem;
  }

  .wa-left-side {
    padding: 20px 12px;
  }

  .wa-code-form {
    max-width: 100% !important;
    width: 100%;
  }

  .wa-code-title {
    font-size: 1.25rem;
  }

  .wa-code-subtitle {
    font-size: 0.85rem;
    margin-bottom: 24px;
  }

  .instruction-group {
    padding: 12px;
    margin: 12px 0px;
  }

  .wa-code-boxes-container {
    padding: 12px 6px;
    gap: 4px;
  }

  .wa-code-box {
    width: 32px;
    height: 42px;
    font-size: 20px;
    border-radius: 6px;
  }

  .wa-code-box:nth-child(5) {
    width: 12px;
  }

  .wa-instruction-text {
    font-size: 13px;
  }

  .wa-instruction-number {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .wa-instruction-item {
    gap: 10px;
    padding-bottom: 12px;
  }

  .wa-instruction-item:not(:last-child)::before {
    left: 9.5px;
    top: 20px;
  }

  .instruction-title {
    font-size: 1.25rem;
    padding: 0 12px;
    line-height: 1.3;
  }
}
</style>
