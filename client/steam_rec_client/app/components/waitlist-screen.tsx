// app/components/waitlist-screen.tsx
'use client'
import { Sparkles, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export function WaitlistScreen({ email }: { email: string }) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-8">
      <Sparkles size={48} className="text-blue-500 mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        You’re on the wait-list!
      </h1>
      <p className="max-w-md text-center text-gray-600 text-lg mb-8">
        Thanks for signing up{email && `, ${email}`}.<br />
        We’ll email you as soon as your account is approved.
      </p>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
        <LogOut size={18} />
        Sign out
      </button>
    </div>
  )
}
