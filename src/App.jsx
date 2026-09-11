import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppearanceProvider } from './context/AppearanceContext.jsx'
import router from './routes/index'

export default function App() {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppearanceProvider>
  )
}
