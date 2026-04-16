<template>
  <div class="wa-country-selector" :class="variant" ref="selectorRef">
    <div class="wa-country-input" @click="toggleDropdown" tabindex="0" @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown">
      <img v-if="selectedCountry" :src="`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`"
        :srcset="`https://flagcdn.com/w80/${selectedCountry.code.toLowerCase()}.png 2x`"
        :alt="`${selectedCountry.name} flag`" class="wa-country-flag-img" loading="lazy" />
      <span class="wa-country-name">{{ selectedCountry ? displayName : selectCountry }}</span>
      <img :src="chevronIcon" alt="Chevron" class="wa-chevron" :class="{ 'rotated': isOpen }" width="16" height="16" />
    </div>

    <!-- Country Dropdown -->
    <transition name="dropdown">
      <div v-if="isOpen" class="wa-country-dropdown">
        <div class="wa-country-search-container">
          <img :src="searchIconSrc" alt="Search" class="wa-search-icon" width="16" height="16" />
          <input type="text" :placeholder="searchPlaceholder" class="wa-country-search" @click.stop
            @input="handleSearchInput" ref="searchInputRef" />
        </div>
        <div class="wa-country-list">
          <div v-for="country in filteredCountries" :key="country.code" v-memo="[country.code === modelValue]"
            class="wa-country-item" :class="{ 'selected': country.code === modelValue }"
            @click="handleCountrySelect(country)" tabindex="0" @keydown.enter="handleCountrySelect(country)">
            <img :src="`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`"
              :srcset="`https://flagcdn.com/w80/${country.code.toLowerCase()}.png 2x`" :alt="`${country.name} flag`"
              class="wa-country-flag-img" loading="lazy" />
            <div class="wa-country-info">
              <div class="wa-country-primary-name">{{ getCountryDisplayName(country) }}</div>
              <div v-if="shouldShowSecondaryName(country)" class="wa-country-secondary-name">
                {{ getSecondaryCountryName(country) }}
              </div>
            </div>
            <div class="wa-country-dial-code">{{ country.dialCode }}</div>
            <div v-if="country.code === modelValue" class="wa-country-checkmark">
              <img :src="checkmarkIconSrc" alt="Selected" width="16" height="16" />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { Country } from '@/data/countries'

interface Props {
  modelValue: string
  countries: Country[]
  selectedCountry: Country | null
  displayName: string
  searchPlaceholder: string
  selectCountry: string
  locale: string
  chevronIcon: string
  searchIconSrc: string
  checkmarkIconSrc: string
  getLocalizedCountryName: (code: string, locale: string) => string
  variant?: 'wa' | 'hk'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'wa'
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [country: Country]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const selectorRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
let searchDebounceTimer: number | undefined

// Optimized filtered countries
const filteredCountries = computed(() => {
  if (!searchQuery.value) return props.countries

  const query = searchQuery.value.toLowerCase()

  return props.countries.filter(country => {
    // Quick checks first (cheaper operations)
    if (country.dialCode.includes(query) || country.code.toLowerCase().includes(query)) {
      return true
    }

    // Then check name fields
    if (country.name.toLowerCase().includes(query) || country.nameZh.toLowerCase().includes(query)) {
      return true
    }

    // Finally check localized name (most expensive)
    const localizedName = props.getLocalizedCountryName(country.code, props.locale).toLowerCase()
    return localizedName.includes(query)
  })
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handleCountrySelect = (country: Country) => {
  emit('update:modelValue', country.code)
  emit('select', country)
  isOpen.value = false
  searchQuery.value = ''
}

const getCountryDisplayName = (country: Country): string => {
  const language = props.locale.split('-')[0].toLowerCase()
  const localizedName = props.getLocalizedCountryName(country.code, props.locale)

  if (localizedName && localizedName !== country.code) {
    return localizedName
  }

  if (language === 'zh') {
    return country.nameZh
  }

  return country.name
}

const shouldShowSecondaryName = (country: Country): boolean => {
  const language = props.locale.split('-')[0].toLowerCase()
  const primaryName = getCountryDisplayName(country)

  if (primaryName !== country.name && language !== 'en') {
    return true
  }

  if (language === 'en' && country.nameZh !== country.name) {
    return true
  }

  return false
}

const getSecondaryCountryName = (country: Country): string => {
  const language = props.locale.split('-')[0].toLowerCase()
  const primaryName = getCountryDisplayName(country)

  if (primaryName !== country.name) {
    return country.name
  }

  if (language === 'en') {
    return country.nameZh
  }

  return country.name
}

// Debounced search handler
const handleSearchInput = (event: Event) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  const input = event.target as HTMLInputElement
  searchDebounceTimer = window.setTimeout(() => {
    searchQuery.value = input.value
  }, 150)
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (selectorRef.value && !selectorRef.value.contains(event.target as Node)) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

// Watch for dropdown opening to focus search input
watch(isOpen, async (value) => {
  if (value) {
    await nextTick()
    searchInputRef.value?.focus()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})
</script>

<style scoped lang="scss">
/* Country Selector Styles */
.wa-country-selector {
  position: relative;
  width: 100%;
}

.wa-country-input {
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

/* HK variant overrides */
.hk .wa-country-input {
  border: 1px solid #d1d7db;
  border-radius: 8px;

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

.hk .wa-dial-code-display {
  background: #f5f5f5;
}

.hk .wa-country-dropdown {
  border: 1px solid #e9edef;
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
</style>


