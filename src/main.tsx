import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import '@/styles/tokens.css'

import { Providers } from '@/app/providers'
import { AppRouter } from '@/app/router'

const container = document.getElementById('root')
if (!container) throw new Error('Elemen #root tidak ditemukan.')

createRoot(container).render(
  <StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </StrictMode>,
)
