import { useState, useEffect } from 'react'

const KEY_NAME   = 'afrotresse_user_name'
const KEY_AVATAR = 'afrotresse_user_avatar'

export function useProfile() {
  const [name,   setNameState]   = useState('')
  const [avatar, setAvatarState] = useState('👩🏾')

  useEffect(() => {
    setNameState(localStorage.getItem(KEY_NAME)   || '')
    setAvatarState(localStorage.getItem(KEY_AVATAR) || '👩🏾')
  }, [])

  const setName = (v) => {
    const clean = v.trim()
    localStorage.setItem(KEY_NAME, clean)
    setNameState(clean)
  }

  const setAvatar = (v) => {
    localStorage.setItem(KEY_AVATAR, v)
    setAvatarState(v)
  }

  // Prénom affiché : ce que l'utilisatrice a saisi, sinon "Reine"
  const displayName = name || 'Reine'

  return { name, displayName, setName, avatar, setAvatar }
}
