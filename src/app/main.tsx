import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// FSD-lite global styles - import order defines the cascade:
// tokens → base → utilities → animations → themes → mobile
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/utilities.css'
import '@/styles/animations.css'
import '@/styles/themes.css'
import '@/styles/mobile.css'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
