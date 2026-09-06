export const metadata = {
  title: 'KAEKURU',
  description: '忘れ物管理アプリ',
}

import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
