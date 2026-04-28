"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function UrlActions({ urlId, url, siteId }: { urlId: string; url: string; siteId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const router = useRouter()

  async function submitUrl() {
    setIsSubmitting(true)
    setToast(null)
    try {
      const res = await fetch(`/api/urls/${urlId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, siteId }),
      })
      const data = await res.json()
      if (data.success) {
        setToast(`Submitted: ${data.result?.message || "OK"}`)
      } else {
        setToast(`Failed: ${data.error || "Unknown error"}`)
      }
      router.refresh()
    } catch {
      setToast("Network error")
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  async function checkStatus() {
    setIsChecking(true)
    setToast(null)
    try {
      const res = await fetch(`/api/urls/${urlId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, siteId }),
      })
      const data = await res.json()
      if (data.status) {
        setToast(`Status: ${data.status}`)
      } else {
        setToast(`Check failed: ${data.error || "Unknown"}`)
      }
      router.refresh()
    } catch {
      setToast("Network error")
    } finally {
      setIsChecking(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="flex items-center gap-2 justify-end relative">
      {toast && (
        <div className="absolute right-0 bottom-8 z-10 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap">
          {toast}
        </div>
      )}
      <button
        onClick={submitUrl}
        disabled={isSubmitting}
        className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "..." : "Submit"}
      </button>
      <button
        onClick={checkStatus}
        disabled={isChecking}
        className="px-3 py-1.5 text-xs font-medium bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        {isChecking ? "..." : "Refresh"}
      </button>
    </div>
  )
}
