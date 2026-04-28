"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function SubmitAllButton({ siteId, urlCount }: { siteId: string; urlCount: number }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()

  async function submitAll() {
    if (urlCount <= 0) {
      setToast("No pending URLs to submit")
      setTimeout(() => setToast(null), 3000)
      return
    }
    setIsSubmitting(true)
    setToast(null)
    try {
      const res = await fetch(`/api/sites/${siteId}/submit-all`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setToast(`Submitted ${data.submitted} URLs (${data.successful} successful)`)
      } else {
        setToast(`Failed: ${data.error || "Unknown error"}`)
      }
      router.refresh()
    } catch {
      setToast("Network error")
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setToast(null), 5000)
    }
  }

  return (
    <div className="relative">
      {toast && (
        <div className="absolute right-0 top-10 z-10 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap">
          {toast}
        </div>
      )}
      <button
        onClick={submitAll}
        disabled={isSubmitting}
        className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : `Submit All (${urlCount})`}
      </button>
    </div>
  )
}
