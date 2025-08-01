'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Gamepad2, Sparkles, Target, Users, ArrowRight, Star, Zap, Brain, Heart } from 'lucide-react'

// Simple spinner & error components
function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <div
      className={`animate-spin border-2 border-violet-500 border-t-transparent rounded-full ${sizeClasses[size]} ${className}`}
    />
  )
}

function ErrorMessage({ message }: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <svg
          className="w-5 h-5 text-red-400 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 
               1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 
               001.414-1.414L11.414 10l1.293-1.293a1 1 0 
               00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-red-800 text-sm font-medium">{t('dashboard.messages.error')}</span>
      </div>
      <p className="text-red-700 text-sm mt-1">{message}</p>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const {
    user,
    token,
    loading: authLoading,
    register,
    login,
  } = useAuth()

  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<'success' | 'error' | 'info' | null>(null)
  const [detail, setDetail] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user && token) {
      router.push('/dashboard')
    }
  }, [user, token, authLoading, router])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setMessage(null)
    setDetail('')
  }

  const handleSubmit = async () => {
    if (!email || !password) {
      setMessage('error')
      setDetail(t('dashboard.errors.enter_email_password'))
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      if (isSignUp) {
        const res = await register(email, password)
        if (!res.ok) throw await res.text()
        setMessage('info')
        setDetail(t('dashboard.messages.waitlist_added'))
      } else {
        await login(email, password)
        setMessage('success')
        setDetail(t('dashboard.messages.logged_in_redirecting'))
      }
    } catch (err: any) {
      setMessage('error')
      setDetail(err.toString())
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Smart Recommendations",
      description: "Our AI analyzes your gaming preferences to suggest titles you'll actually love, not just what's popular."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Personalized Insights",
      description: "Discover why each game matches your taste with detailed explanations of genre preferences, gameplay mechanics, and themes."
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Hidden Gems",
      description: "Uncover incredible indie titles and overlooked masterpieces that align perfectly with your gaming DNA."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Taste Evolution",
      description: "Watch your gaming palate evolve as Arcade Augur learns from your feedback and discovers new facets of your preferences."
    }
  ]

  const testimonials = [
    {
      quote: "Finally found my next favorite game! Arcade Augur recommended a title I never would have discovered on my own.",
      author: "Alex M.",
      games: "Loves RPGs & Strategy"
    },
    {
      quote: "The explanations are spot-on. It's like having a gaming friend who really knows what I like.",
      author: "Sam K.",
      games: "Indie & Puzzle Enthusiast"
    },
    {
      quote: "Discovered 5 amazing games in my first week. This is the future of game discovery.",
      author: "Riley T.",
      games: "Action & Adventure"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl mb-8"
            >
              <Gamepad2 className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              Arcade Augur
            </h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Your personal game discovery oracle. Tell us what you love, and we'll reveal your next gaming obsession with 
              <span className="text-violet-600 font-semibold"> AI-powered insights</span> about why it's perfect for you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm border">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Instant Recommendations</span>
              </div>
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm border">
                <Star className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-gray-700">Personalized Insights</span>
              </div>
              <div className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-sm border">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Growing Community</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-violet-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-indigo-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Games That <span className="text-violet-600">Speak to You</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop scrolling through endless lists. Get curated recommendations with the reasoning behind each suggestion.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-8 h-full border border-violet-100 group-hover:border-violet-200 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
                  <div className="text-violet-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-r from-violet-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Three Steps to Gaming <span className="text-violet-600">Enlightenment</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Share Your Favorites",
                description: "Tell us about games you love. Rate them, explain what you enjoyed, and help us understand your unique gaming DNA."
              },
              {
                step: "02", 
                title: "Get Smart Suggestions",
                description: "Our AI analyzes patterns in your preferences and matches you with games that align with your taste profile."
              },
              {
                step: "03",
                title: "Discover & Understand",
                description: "Receive personalized recommendations with detailed explanations of why each game is perfect for you."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full text-white font-bold text-xl mb-6">
                  {step.step}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section className="py-24 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 shadow-2xl"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" suppressHydrationWarning>
                {isSignUp ? t('dashboard.messages.join_the_waitlist') : 'Start Your Journey'}
              </h2>
              <p className="text-gray-600">
                {isSignUp 
                  ? 'Be among the first to experience the future of game discovery'
                  : 'Log in to discover your next favorite game'
                }
              </p>
            </div>

            {/* toggle between sign-up / login */}
            <div className="text-center mb-6">
              <button
                className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                onClick={() => {
                  resetForm()
                  setIsSignUp(!isSignUp)
                }}
                suppressHydrationWarning
              >
                {isSignUp
                  ? t('dashboard.messages.already_have_invite')
                  : t('dashboard.messages.want_access_join_waitlist_callout')}
              </button>
            </div>

            {/* show messages */}
            {message === 'error' && <div className="mb-6"><ErrorMessage message={detail} /></div>}
            {message === 'info' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm mb-6">
                {detail}
              </div>
            )}
            {message === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm mb-6">
                {detail}
              </div>
            )}

            {/* form */}
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!loading) handleSubmit()
              }}
            >
              <input
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder={t('dashboard.placeholder.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                suppressHydrationWarning
              />

              <input
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder={t('dashboard.placeholder.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                suppressHydrationWarning
              />

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 group"
                suppressHydrationWarning
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>{isSignUp ? t('dashboard.messages.join_waitlist') : 'Start Discovering'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Gamepad2 className="w-8 h-8 text-violet-400" />
            <span className="text-2xl font-bold">Arcade Augur</span>
          </div>
          <p className="text-gray-400">
            Discover your next gaming obsession with AI-powered recommendations.
          </p>
        </div>
      </footer>
    </div>
  )
}