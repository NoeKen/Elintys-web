'use client'
import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold" style={{ color: 'var(--on-surface)' }}>
        Une erreur est survenue
      </h2>
      <button onClick={reset}
              className="rounded-lg bg-[#4A8E9E] px-4 py-2 text-white text-sm">
        Réessayer
      </button>
    </div>
  )
}
