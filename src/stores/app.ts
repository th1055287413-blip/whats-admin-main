import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const loading = ref(false)
  const title = ref('WhatsApp 管理系统')

  // Toggle sidebar
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // Set loading state
  const setLoading = (state: boolean) => {
    loading.value = state
  }

  // Set page title
  const setTitle = (newTitle: string) => {
    title.value = newTitle
    document.title = newTitle
  }

  return {
    sidebarCollapsed,
    loading,
    title,
    toggleSidebar,
    setLoading,
    setTitle
  }
})