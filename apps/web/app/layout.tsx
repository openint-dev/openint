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
    // TODO Fix hydration error rather than suppress warning
    // https://nextjs.org/docs/messages/react-hydration-error#solution-3-using-suppresshydrationwarning
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body>{children}</body>
    </html>
  )
}
