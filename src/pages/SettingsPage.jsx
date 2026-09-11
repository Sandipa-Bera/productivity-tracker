import { useState } from 'react'
import { useAppearance } from '../context/AppearanceContext'

/**
 * SettingsPage — user preferences and configuration.
 *
 * Currently implements:
 *   • Appearance: Theme, Font, Font Size
 */
export default function SettingsPage() {
  const { theme, fontFamily, fontSize, updatePreference } = useAppearance()
  const [saveError, setSaveError] = useState(null)

  async function handleChange(key, value) {
    setSaveError(null)
    try {
      await updatePreference(key, value)
    } catch {
      setSaveError('Could not save preference. Please try again.')
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Configure your workspace preferences.</p>
      </div>

      {/* ── Appearance section ── */}
      <section className="section app-card card-padding">
        <h2 className="section-title" style={{ marginBottom: 20 }}>Appearance</h2>

        {saveError && (
          <p
            role="alert"
            style={{
              marginBottom: 16,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--red)',
              background: 'var(--red-soft)',
              border: '1px solid var(--red)',
            }}
          >
            {saveError}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Theme */}
          <div className="settings-row">
            <label
              htmlFor="setting-theme"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}
            >
              Theme
            </label>
            <select
              id="setting-theme"
              value={theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="settings-select"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Font */}
          <div className="settings-row">
            <label
              htmlFor="setting-font"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}
            >
              Font
            </label>
            <select
              id="setting-font"
              value={fontFamily}
              onChange={(e) => handleChange('font_family', e.target.value)}
              className="settings-select"
            >
              <option value="inter">Inter</option>
              <option value="geist">Geist</option>
              <option value="manrope">Manrope</option>
              <option value="system">System Default</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="settings-row">
            <label
              htmlFor="setting-font-size"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}
            >
              Font Size
            </label>
            <select
              id="setting-font-size"
              value={fontSize}
              onChange={(e) => handleChange('font_size', e.target.value)}
              className="settings-select"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

        </div>
      </section>
    </div>
  )
}
