import { useCallback, useRef, useState } from 'react'
import type { NotificationProfile } from './notificationProfilesTypes'

export function useNotificationProfilesState() {
  const [showModal, setShowModal] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profiles, setProfiles] = useState<NotificationProfile[]>([])
  const nextProfileId = useRef(1)

  const openModal = useCallback(() => setShowModal(true), [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setProfileName('')
  }, [])

  const removeProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const createProfile = useCallback(() => {
    const name = profileName.trim()
    if (!name) return
    const id = String(nextProfileId.current++)
    setProfiles((prev) => [...prev, { id, name }])
    setProfileName('')
    setShowModal(false)
  }, [profileName])

  return {
    showModal,
    profileName,
    setProfileName,
    profiles,
    openModal,
    closeModal,
    removeProfile,
    createProfile,
  }
}
