import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <img
        src="/nl2sql_logo_only_picture.png"
        alt="NL2SQL"
        className="h-20 w-20 object-contain mb-8"
      />
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
