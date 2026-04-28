"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ToggleAutoSubmit({ siteId, enabled }: { siteId: string; enabled: boolean }) {
  const [isOn, setIsOn] = useState(enabled)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/sites/${siteId}/toggle-auto`, { method: "POST" })
      if (res.ok) {
        setIsOn(!isOn)
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isOn ? "bg-emerald-500" : "bg-slate-300"
      } ${isLoading ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}
