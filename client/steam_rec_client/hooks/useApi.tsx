// hooks/useApi.ts
'use client'
import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'

const API = process.env.NEXT_PUBLIC_API_BASE_URL

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
}

export function useApi() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(async (url: string, options: ApiOptions = {}) => {
    setLoading(true)
    setError(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const config: RequestInit = {
        method: options.method || 'GET',
        headers,
      }

      if (options.body) {
        config.body = JSON.stringify(options.body)
      }

      const response = await fetch(`${API}${url}`, config)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  return { request, loading, error }
}
