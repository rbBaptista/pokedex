import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { CapturasProvider } from './contexts/CapturasContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CapturasProvider>
          <App />
        </CapturasProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
