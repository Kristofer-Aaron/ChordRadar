/**
 * Application entry point - Mounts React app and initializes background texture renderer
 *
 * Calls startSuedeTextureRenderer() to set up procedural suede background with
 * theme switching support (light/dark). Renders App root with StrictMode.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startSuedeTextureRenderer } from './utils'

startSuedeTextureRenderer()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
