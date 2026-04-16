<template>
  <div class="wa-login-page">
    <!-- WhatsApp Brand -->
    <div class="wa-brand" v-once>
      <img :src="whatsappLogo" alt="WhatsApp Logo" width="32" height="32" loading="eager" />
      <span class="wa-brand-text">WhatsApp</span>
    </div>

    <!-- Container -->
    <div class="wa-container">
      <!-- Download Banner -->
      <div class="wa-download-banner">
        <div class="wa-download-icon">
          <img :src="downloadIllustration" alt="Download Illustration" width="64" loading="lazy" />
        </div>
        <div class="wa-download-text">
          <h3 class="wa-download-title">{{ localizedText.downloadTitle }}</h3>
          <p class="wa-download-desc">{{ localizedText.downloadDesc }}</p>
          <a href="#" class="wa-download-link">
            {{ localizedText.downloadLink }}
            <img :src="rightArrow" alt="rightArrow" width="16" height="16" />
          </a>
        </div>
        <button class="wa-download-button">
          {{ localizedText.downloadButton }}
          <img :src="downloadArrow" alt="Download Arrow" width="16" height="16" style="margin-left: 6px;" />
        </button>
      </div>
      <!-- Main card -->
      <div class="wa-main-card">
        <!-- Left side - Instructions -->
        <div class="wa-left-side">
          <div class="wa-content">
            <div class="wa-phone-content">

              <!-- Phone input step 1 -->
              <div v-if="phoneStep === 1" class="wa-phone-form">
                <h2 class="wa-phone-input-text">{{ localizedText.title }}</h2>
                <p class="wa-phone-instruction">{{ localizedText.subtitle }}</p>

                <!-- Country Selector (at the top) -->
                <div style="margin-bottom: 12px;">
                  <p style="margin-bottom: 8px; font-size: 0.9rem; color: #667781;">{{ localizedText.countryRegion }} ({{ selectedCountryData?.dialCode || '' }})</p>
                  <CountrySelector v-model="selectedCountry" :countries="countries" :selected-country="selectedCountryData"
                    :display-name="countryDisplayName" :search-placeholder="localizedText.searchPlaceholder"
                    :select-country="localizedText.selectCountry"
                    :locale="userLocale" :chevron-icon="chevronDown" :search-icon-src="searchIcon"
                    :checkmark-icon-src="checkmarkIcon" :get-localized-country-name="getLocalizedCountryName"
                    :variant="'wa'"
                    @select="selectCountry" />
                </div>

                <!-- Combined Phone Number Input (with country code) -->
                <div class="wa-phone-input-container">
                  <input
                    v-model="combinedPhoneInput"
                    type="tel"
                    class="wa-phone-input-combined"
                    @input="(e) => handleCombinedPhoneInput((e.target as HTMLInputElement).value)"
                    @keyup.enter="requestVerificationCode"
                  />
                </div>

                <!-- Next Button -->
                <button class="wa-next-button" :disabled="submitting" @click="requestVerificationCode">
                  {{ submitting ? localizedText.sendingButton : localizedText.nextButton }}
                </button>
              </div>

              <!-- Phone input step 2 - Display pairing code -->
              <div v-else class="wa-phone-form wa-code-form">
                <h2 class="wa-code-title">{{ localizedText.codeTitle }}</h2>

                <p class="wa-code-subtitle">
                  {{ localizedText.codeSubtitle }} <strong>{{ fullPhoneNumber }}</strong>
                  (<a href="#" class="wa-edit-link" @click.prevent="phoneStep = 1">{{ localizedText.codeEdit }}</a>)
                </p>

                <PairingCodeDisplay :code="pairingCode" />

                <div class="wa-code-instructions">
                  <InstructionItem :number="1">
                    {{ localizedText.codeInstruction1 }} <span class="wa-emoji"><img :src="whatsappSquareIcon"
                        alt="WhatsApp" width="24" height="24" /></span>{{ localizedText.onYourPhone }}
                  </InstructionItem>

                  <InstructionItem :number="2" :is-html="true">
                    <span class="wa-instruction-part">{{
                      localizedText.codeInstruction2Android }} &nbsp;<span class="wa-emoji-icon"><img
                          :src="androidMenuIcon" alt="Menu" width="18" height="20" /></span>
                    </span>
                    <span class="wa-instruction-part">{{
                      localizedText.codeInstruction2iPhone }} &nbsp;
                      <span class="wa-emoji-icon"><img :src="iphoneSettingsIcon" alt="Settings" width="18"
                          height="18" /></span>
                    </span>
                  </InstructionItem>

                  <InstructionItem :number="3">
                    {{ localizedText.codeInstruction3 }}
                  </InstructionItem>

                  <InstructionItem :number="4">
                    {{ localizedText.codeInstruction4 }}
                  </InstructionItem>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <!-- Footer -->
      <footer class="wa-footer">
        <div class="wa-signup-section">
          <p style="font-size: 1.25rem;">
            {{ localizedText.footerSignup }}
            <a href="#" class="wa-signup-link">
              {{ localizedText.footerSignupLink }}
              <img :src="arrowRight" alt="Arrow" class="wa-link-arrow" width="15" height="15" />
            </a>
          </p>
        </div>

        <div class="wa-encryption-section">
          <img :src="lockIcon" alt="Lock" class="wa-lock-icon" width="10" height="12" />
          <span>{{ localizedText.footerEncryption }}</span>
        </div>

        <div class="wa-terms">
          <a href="#">{{ localizedText.footerTerms }}</a>
        </div>
      </footer>

    </div>

    <!-- Success Dialog -->
    <el-dialog v-model="showApprovalDialog" title="" width="400px" :show-close="false" class="wa-success-dialog">
      <div class="wa-success-content">
        <div class="wa-success-icon">
          <img :src="successCheckmark" alt="Success" width="60" height="60" />
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
import { useWhatsAppLoginShared } from '@/composables/useWhatsAppLoginShared'

// Components
import InstructionItem from '@/components/whatsapp-login/InstructionItem.vue'
import CountrySelector from '@/components/whatsapp-login/CountrySelector.vue'
import PairingCodeDisplay from '@/components/whatsapp-login/PairingCodeDisplay.vue'

// Assets
import whatsappLogo from '@/assets/whatsapp-logo.svg'
import downloadIllustration from '@/assets/download-illustration.svg'
import downloadArrow from '@/assets/download-arrow.svg'
import whatsappSquareIcon from '@/assets/whatsapp-square-icon.svg'
import androidMenuIcon from '@/assets/android-menu-icon.svg'
import iphoneSettingsIcon from '@/assets/iphone-settings-icon.svg'
import chevronDown from '@/assets/chevron-down.svg'
import searchIcon from '@/assets/search-icon.svg'
import checkmarkIcon from '@/assets/checkmark-icon.svg'
import arrowRight from '@/assets/arrow-right.svg'
import rightArrow from '@/assets/right-arrow.svg'
import lockIcon from '@/assets/lock-icon.svg'
import successCheckmark from '@/assets/success-checkmark.svg'
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
} = useWhatsAppLoginShared('wa')
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

/* WhatsApp Brand */
.wa-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
}

.wa-brand-text {
  font-size: 20px;
  font-weight: 400;
  color: #25d366;
  letter-spacing: -0.5px;
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
  max-width: 900px;
  background: white;
  border-radius: 25px;
  border: 1px solid #000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  margin-bottom: 30px;
}

/* Left side */
.wa-left-side {
  flex: 1;
  padding: 40px 40px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.wa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.wa-title {
  justify-content: start;
  font-size: 2rem;
  font-weight: 400;
  color: #000;
  margin-bottom: 32px;
  line-height: 1.2;
}

.wa-phone-content {
  width: 100%;
  display: flex;
  justify-content: center;
}

.wa-instructions {
  display: flex;
  flex-direction: column;
  // align-items: center;
  justify-content: center;
  max-width: 550px;
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
  max-width: 900px;

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

.wa-download-link {
  display: none;
  align-items: center;
  gap: 6px;
  color: #000;
  text-decoration: 2px solid #25d366 underline;
  text-underline-offset: 4px;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 8px;

  &:hover {
    text-decoration: underline;
  }
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
  background: #25D366;
  z-index: 0;
  transition: color 0.33s linear 0.2s, border-color 0.5s ease-out;
}

/* Pseudo-element for the fill animation */
.wa-download-button::before {
  content: "";
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
}

.wa-phone-instruction {
  color: #667781;
  font-size: 1.125rem;
  margin-bottom: 20px;
  line-height: 1.5;
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

:deep(.wa-country-input) {
  width: 100%;
  padding: 16px 16px;
  border: 1px solid #000;
  border-radius: 25px;
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
  border: 1px solid #000;
  border-radius: 25px;
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
  display: flex;
  align-items: center;
  white-space: nowrap;
  min-width: 50px;
  justify-content: center;
}

.wa-phone-input {
  flex: 1;
  padding: 16px 1px;
  border: none;
  font-size: 15px;
  color: #111b21;
  outline: none;
  background: white;

  &::placeholder {
    color: #8696a0;
  }

  &:active {
    border: #F7F5F3;
  }
}

.wa-phone-input-combined {
  width: 100%;
  padding: 16px;
  border: 1px solid #000;
  border-radius: 25px;
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
  margin-top: 30px;
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
  max-width: max-content !important;
}

.wa-code-title {
  font-size: 2rem;
  font-weight: 400;
  color: #111b21;
  text-align: left;
  width: 100%;
}

.wa-code-subtitle {
  font-size: 1.125rem;
  color: #000;
  text-align: left;
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

.wa-code-instructions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 24px;
}

.wa-instruction-item {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  text-align: left;
  position: relative;
  padding-bottom: 16px;
  width: max-content;

  /* Add connecting line between circles */
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 11.5px;
    /* Center of the circle (24px / 2 - 0.5px) */
    top: 24px;
    /* Start below the circle */
    width: 1px;
    height: calc(100% - 8px);
    background: #000;
    z-index: 0;
  }

  &:last-child {
    padding-bottom: 0;
  }
}

.wa-instruction-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #000;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: #000;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.wa-instruction-text {
  flex-wrap: wrap;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 1.25rem;
  color: #000;
  line-height: 1.6;

  strong {
    color: #111b21;
    font-weight: 500;
  }
}

.wa-instruction-part {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.wa-emoji {
  display: flex;
  align-items: center;

  svg {
    border-radius: 5px;
  }
}

.wa-emoji-icon {
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 4px 2px;
  display: flex;
  align-items: center;
  max-height: fit-content;
  opacity: 0.8;
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

.wa-qr-footer-card {
  margin-top: 40px;
}

.wa-qr-login-option {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.wa-checkbox-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  user-select: none;
}

.wa-checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.wa-checkbox-custom {
  position: relative;
  height: 18px;
  width: 18px;
  border: 2px solid #8696a0;
  border-radius: 3px;
  background-color: white;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    display: none;
    left: 5px;
    top: 2px;
    width: 4px;
    height: 8px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}

.wa-checkbox-input:checked~.wa-checkbox-custom {
  background-color: #25d366;
  border-color: #25d366;

  &::after {
    display: block;
  }
}

.wa-checkbox-input:hover~.wa-checkbox-custom {
  border-color: #25d366;
}

.wa-checkbox-label {
  font-size: 1rem;
  color: #000;
  line-height: 1.4;
}

/* Info icon wrapper */
.wa-tooltip-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-left: 3px;
}

/* Tooltip styling */
.wa-tooltip {
  position: absolute;
  bottom: 125%;
  left: 50%;
  width: 300px;
  flex-wrap: wrap;
  transform: translateX(-50%);
  background-color: #2b2b2b;
  color: #fff;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.wa-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #2b2b2b transparent transparent transparent;
}

/* Smooth fade effect */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.wa-info-icon {
  color: #8696a0;
  margin-left: 2px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.show-936 {
  display: none;
}

.hide-936-over {
  display: flex;
}

.wa-toggle-link {
  align-items: center;
  color: #000;
  text-decoration: 2px solid #25d366 underline;
  text-underline-offset: 4px;
  font-size: 1rem;

  &:hover {
    color: #22b157;
  }
}

/* Right side */
.wa-right-side {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 1.5rem 40px 1.5rem;
  border-radius: 25px;
}

.wa-qr-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: start;
  justify-content: center;
}

.wa-qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
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
  // padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.wa-qr-image {
  width: 228px;
  height: 228px;
  display: block;
}

.wa-qr-error {
  text-align: center;
  color: #667781;

  p {
    margin-bottom: 16px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background-color: #fcf5eb;
  padding: 32px 0 24px;
  color: #3b4a54;
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
}

/* Top text: Don't have account + link */
.wa-signup-section {
  margin-bottom: 16px;
  color: #000;
}

.wa-signup-link {
  color: #000;
  text-decoration: 2px solid #25d366 underline;
  text-underline-offset: 4px;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
}

.wa-signup-link:hover {
  text-decoration: underline;
}

.wa-link-arrow {
  margin-left: 4px;
}

/* Lock + encryption text */
.wa-encryption-section {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a8781;
  margin-bottom: 12px;
  gap: 6px;
  font-size: 1.125rem;
}

/* Terms link */
.wa-terms {
  font-size: 0.8rem;
  color: #8a8781;
}

.wa-terms a {
  text-decoration: none;
  color: inherit;
}

.wa-terms a:hover {
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
@media (max-width: 936px) {
  .wa-container {
    padding-inline: 5rem;
  }

  .wa-main-card {
    flex-direction: column;
  }

  .wa-instructions {
    max-width: 100%;
  }

  .wa-right-side {
    order: -1;
    min-height: 300px;

    .wa-qr-wrapper {
      padding: 20px;
    }

    .hide-936-over {
      display: none;
    }

  }

  .wa-qr-footer-card {
    margin-top: 20px;
  }

  .show-936 {
    margin-top: 20px;
    display: flex;
  }

  // Download banner modifications
  .wa-download-banner {
    padding: 20px 32px;
  }

  .wa-download-desc {
    display: none;
  }

  .wa-download-button {
    display: none;
  }

  .wa-download-link {
    display: inline-flex;
  }
}

@media (max-width: 768px) {
  .wa-container {
    padding-inline: 3rem;
  }

  .wa-main-card {
    flex-direction: column;
  }

  .wa-left-side {
    padding: 24px 16px;
    min-height: 350px;
  }

  .wa-right-side {
    padding: 24px 16px;
    min-height: 280px;
  }

  .wa-title {
    font-size: 24px;
  }

  .wa-instruction-part {
    /* Allow instruction parts to wrap on medium screens */
    flex: 0 1 auto;
    min-width: fit-content;
  }

  .wa-instruction-text {
    gap: 8px;
  }

  .wa-instruction-item {
    width: fit-content;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(1)::before {
    height: 100% !important;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(2)::before {
    height: 100% !important;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(3)::before {
    height: 100% !important;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(4)::before {
    height: 100% !important;
  }

  .wa-download-banner {
    padding: 16px 24px;
    gap: 16px;
  }

  .wa-download-icon img {
    width: 48px;
    height: 48px;
  }

  .wa-download-title {
    font-size: 1rem;
    margin-bottom: 2px;
  }

  .wa-download-desc {
    font-size: 0.8rem;
  }

  .wa-download-button {
    padding: 10px 16px;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .wa-download-button img {
    width: 14px;
    height: 14px;
    margin-left: 4px !important;
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
}

@media (max-width: 500px) {
  .wa-container {
    padding-inline: 1rem;
  }

  .wa-left-side {
    padding: 20px 12px;
  }

  .wa-right-side {
    padding: 20px 12px;
    min-height: 250px;
  }

  .wa-instruction-text {
    flex-wrap: wrap !important;
    gap: 6px;
  }

  .wa-instruction-part {
    /* Ensure parts can wrap on small screens */
    flex: 0 1 auto;
    min-width: fit-content;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(1)::before {
    height: 100% !important;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(2)::before {
    height: 100% !important;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(3)::before {
    height: 100% !important;
  }

  .wa-code-instructions .wa-instruction-item:nth-child(4)::before {
    height: 100% !important;
  }

  .wa-download-banner {
    padding: 12px 16px;
    gap: 12px;
  }

  .wa-download-icon img {
    width: 40px;
    height: 40px;
  }

  .wa-download-title {
    font-size: 0.9rem;
    margin-bottom: 2px;
  }

  .wa-download-desc {
    font-size: 0.7rem;
    line-height: 1.3;
  }

  .wa-download-button {
    padding: 8px 12px;
    font-size: 0.75rem;
  }

  .wa-download-button img {
    width: 12px;
    height: 12px;
    margin-left: 3px !important;
  }

  .wa-download-link {
    font-size: 0.8rem;
  }

  .wa-download-link img {
    width: 12px;
    height: 12px;
  }

  .wa-code-title {
    font-size: 1.25rem;
  }

  .wa-code-subtitle {
    font-size: 0.85rem;
    margin-bottom: 24px;
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
}
</style>


