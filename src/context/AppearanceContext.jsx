import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AppearanceContext = createContext(null)

export const useAppearance = () => {
  const context = useContext(AppearanceContext)
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }
  return context
}

const DEFAULTS = { theme: 'dark', font_family: 'inter', font_size: 'medium' }

export function AppearanceProvider({ children }) {
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Appearance preferences
  const [theme, setTheme] = useState('dark')
  const [fontFamily, setFontFamily] = useState('inter')
  const [fontSize, setFontSize] = useState('medium')

  // Listen to auth state changes so preferences reload on login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        loadPreferences(uid)
      } else {
        applyDefaults()
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        loadPreferences(uid)
      } else {
        applyDefaults()
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyDefaults() {
    setTheme(DEFAULTS.theme)
    setFontFamily(DEFAULTS.font_family)
    setFontSize(DEFAULTS.font_size)
  }

  async function loadPreferences(uid) {
    try {
      const { data: prefs, error } = await supabase
        .from('user_preferences')
        .select('theme, font_family, font_size')
        .eq('user_id', uid)
        .maybeSingle()

      if (!error && prefs) {
        setTheme(prefs.theme ?? DEFAULTS.theme)
        setFontFamily(prefs.font_family ?? DEFAULTS.font_family)
        setFontSize(prefs.font_size ?? DEFAULTS.font_size)
      } else {
        applyDefaults()
      }
    } catch (err) {
      console.error('Error loading appearance preferences:', err)
      applyDefaults()
    } finally {
      setLoading(false)
    }
  }

  // Apply theme to document
  useEffect(() => {
    if (loading) return

    const root = document.documentElement

    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }

    const metaColorScheme = document.querySelector('meta[name="color-scheme"]')
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', theme === 'system' ? 'light dark' : theme)
    }
  }, [theme, loading])

  // Apply font family to document
  useEffect(() => {
    if (loading) return

    const root = document.documentElement

    switch (fontFamily) {
      case 'inter':
        root.style.setProperty('--font-family', 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif')
        break
      case 'geist':
        root.style.setProperty('--font-family', '"Geist Sans", Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif')
        break
      case 'manrope':
        root.style.setProperty('--font-family', 'Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif')
        break
      case 'system':
        root.style.setProperty('--font-family', 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif')
        break
      default:
        root.style.setProperty('--font-family', 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif')
    }
  }, [fontFamily, loading])

  // Apply font size scale to document
  useEffect(() => {
    if (loading) return

    const root = document.documentElement

    switch (fontSize) {
      case 'small':
        root.style.setProperty('--font-scale', '0.9')
        break
      case 'medium':
        root.style.setProperty('--font-scale', '1')
        break
      case 'large':
        root.style.setProperty('--font-scale', '1.1')
        break
      default:
        root.style.setProperty('--font-scale', '1')
    }
  }, [fontSize, loading])

  // Persist a single preference field to Supabase
  async function updatePreference(key, value) {
    // Optimistically update local state immediately
    switch (key) {
      case 'theme':
        setTheme(value)
        break
      case 'font_family':
        setFontFamily(value)
        break
      case 'font_size':
        setFontSize(value)
        break
    }

    if (!userId) return

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: userId, [key]: value },
          { onConflict: 'user_id' }
        )

      if (error) {
        console.error('Error saving appearance preference:', error)
        loadPreferences(userId)
      }
    } catch (err) {
      console.error('Error saving appearance preference:', err)
      loadPreferences(userId)
    }
  }

  const value = {
    theme,
    fontFamily,
    fontSize,
    loading,
    updatePreference,
    refreshPreferences: () => userId && loadPreferences(userId),
  }

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  )
}