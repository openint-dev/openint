import './global.css'
import {env} from '@openint/app-config/env'

export const metadata = {
  title: `${
    env.VERCEL_ENV === 'production' ? '' : `[${env.VERCEL_ENV}] `
  }OpenInt`,
  icons: [{url: '/favicon.svg', type: 'image/svg+xml'}],
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head></head>
      <body>{children}</body>
    </html>
  )
}
