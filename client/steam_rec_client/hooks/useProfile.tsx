// hooks/useProfile.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi'
import { useAuth } from './useAuth'        // ← new
import { Profile } from '@/types'

export function useProfile() {
  const { request } = useApi()
  const { token, loading: authLoading } = useAuth()   // ← watch these
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!token) return                 // extra guard (shouldn’t run now)
    try {
      const data = await request('/api/profile')
      setProfile(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [request, token])

  // run only after auth finished and we have a token
  useEffect(() => {
    if (!authLoading && token) fetchProfile()
  }, [authLoading, token, fetchProfile])

  return { profile, loading, error, refresh: fetchProfile }
}
