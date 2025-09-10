/**
 * Utility functions for managing localStorage data
 * Clears all application data when users logout or sessions expire
 */

/**
 * Clear all localStorage data related to the application
 * This includes CTI call states, user preferences, and any other stored data
 */
export const clearAllLocalStorage = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // CTI related localStorage keys
      localStorage.removeItem('cti_call_states')
      localStorage.removeItem('cti_call_states_timestamp')
      
      // User preferences and settings (add more as needed)
      localStorage.removeItem('user_preferences')
      localStorage.removeItem('theme_mode')
      localStorage.removeItem('language')
      localStorage.removeItem('sidebar_collapsed')
      
      // Session and authentication related
      localStorage.removeItem('last_activity')
      localStorage.removeItem('user_session_data')
      localStorage.removeItem('tmsSession') // TMS session data
      
      // Clear any other custom keys that start with your app prefix
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('cti_') ||
          key.startsWith('app_') ||
          key.startsWith('user_') ||
          key.startsWith('session_')
        )) {
          keysToRemove.push(key)
        }
      }
      
      // Remove the identified keys
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      console.log('All localStorage data cleared successfully')
    }
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

/**
 * Clear only CTI related localStorage data
 * Use this when you want to clear just CTI data without affecting other app data
 */
export const clearCtiLocalStorage = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('cti_call_states')
      localStorage.removeItem('cti_call_states_timestamp')
      console.log('CTI localStorage data cleared successfully')
    }
  } catch (error) {
    console.error('Error clearing CTI localStorage:', error)
  }
}

/**
 * Get localStorage usage information for debugging
 */
export const getLocalStorageInfo = (): {
  totalKeys: number
  ctiKeys: number
  appKeys: number
  totalSize: string
} => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { totalKeys: 0, ctiKeys: 0, appKeys: 0, totalSize: '0 B' }
    }

    const keys = Object.keys(localStorage)
    const ctiKeys = keys.filter(key => key.startsWith('cti_'))
    const appKeys = keys.filter(key => 
      key.startsWith('app_') || 
      key.startsWith('user_') || 
      key.startsWith('session_')
    )
    
    // Calculate total size
    let totalSize = 0
    keys.forEach(key => {
      const value = localStorage.getItem(key)
      if (value) {
        totalSize += new Blob([key, value]).size
      }
    })

    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return {
      totalKeys: keys.length,
      ctiKeys: ctiKeys.length,
      appKeys: appKeys.length,
      totalSize: formatBytes(totalSize)
    }
  } catch (error) {
    console.error('Error getting localStorage info:', error)
    return { totalKeys: 0, ctiKeys: 0, appKeys: 0, totalSize: '0 B' }
  }
} 