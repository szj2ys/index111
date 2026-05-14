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
      className={`relative inline-flex h-[22px] w-10 items-center rounded-full transition-all duration-300 ${
        isOn ? "bg-[#22c55e]" : "bg-black/15"
      } ${isLoading ? "opacity-50" : "hover:opacity-90"}`}
    >
      <span
        className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white transition-all duration-300 shadow-sm ${
          isOn ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  )
}
