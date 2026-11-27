import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { initTelegram } from './lib/telegram'
import { applyPerformanceClass } from './lib/performance'
import { BackendProvider } from './lib/backendContext'
import { applyBrand, BrandTheme, brandStore } from './brand'

initTelegram()
applyPerformanceClass()
applyBrand(brandStore.get()) // before the first paint, so the default colours never flash

// BrowserRouter (not HashRouter): Telegram passes launch parameters in the URL hash, which a hash router would hijack.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <BrandTheme />
      <BackendProvider>
        <App />
      </BackendProvider>
    </BrowserRouter>
  </StrictMode>,
)
