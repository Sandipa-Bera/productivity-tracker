import { useContext } from 'react'
import { AuthContext } from '../context/authContext'

/**
 * useAuth — hook to access authentication context
 * 
 * @throws {Error} if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
