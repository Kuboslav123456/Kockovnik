import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/rubik'
// Rukopis: IM Fell (text, iniciály, kapitálky); EB Garamond dopĺňa slovenské znaky (č, š, ž…), ktoré IM Fell nemá
import '@fontsource/im-fell-english/400.css'
import '@fontsource/im-fell-english/400-italic.css'
import '@fontsource/im-fell-english-sc/400.css'
import '@fontsource/eb-garamond/latin-ext-400.css'
import '@fontsource/eb-garamond/latin-ext-400-italic.css'
import '@fontsource-variable/caveat'
import '@fontsource-variable/orbitron'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
