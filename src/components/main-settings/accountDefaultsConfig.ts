import { HEADER_CONSTANTS } from '@constants/headerConstants'
import type { Tab } from './types'

const { PERMISSIONS } = HEADER_CONSTANTS

export const accountDefaultsTabs: Tab[] = [
  { id: 'general', label: 'General', permission: PERMISSIONS.VIEW_ACCOUNT_DEFAULTS_GENERAL },
  { id: 'user-defaults', label: 'User Defaults', permission: PERMISSIONS.VIEW_ACCOUNT_USER_DEFAULT },
  { id: 'notification-profiles', label: 'Notification Profiles', permission: PERMISSIONS.VIEW_ACCOUNT_NOTIFICATION_PROFILES },
  { id: 'currency', label: 'Currency', permission: PERMISSIONS.VIEW_ACCOUNT_CURRENCY },
  { id: 'data-hosting', label: 'Data Hosting', permission: PERMISSIONS.VIEW_ACCOUNT_DATA_HOSTING },
  { id: 'feature-releases', label: 'Feature Releases', permission: PERMISSIONS.VIEW_ACCOUNT_FEATURE_RELEASE },
]
