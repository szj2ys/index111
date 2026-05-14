"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Send, ChevronDown } from "lucide-react"

const ALL_ENGINES = ["google", "bing", "yandex"] as const

export function UrlActions({ urlId, url, siteId }: { urlId: string; url: string; siteId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function doSubmit(engines: string[]) {
    setIsSubmitting(true)
    setToast(null)
    setDropdownOpen(false)
    try {
      const res = await fetch(`/api/urls/${urlId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, siteId, engines }),
      })
      const data = await res.json()
      if (data.success) {
        const first = data.results?.[0]
        setToast(`Submitted: ${first?.message || "OK"}`)
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
    <div className="flex items-center gap-2 justify-end relative" ref={dropdownRef}>
      {toast && (
        <div className="absolute right-0 bottom-full mb-2 z-10 px-3 py-1.5 bg-[#1a1a1a] text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-xl">
          {toast}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => !isSubmitting && setDropdownOpen((v) => !v)}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#1a1a1a] text-white rounded-lg hover:bg-black active:scale-95 transition-all disabled:opacity-50"
        >
          <Send className="w-3 h-3" />
          {isSubmitting ? "..." : "Submit"}
          <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-black/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            <button
              onClick={() => doSubmit(ALL_ENGINES.slice())}
              className="w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-black hover:bg-black/[0.03] transition-colors"
            >
              Submit to All
            </button>
            {ALL_ENGINES.map((engine) => (
              <button
                key={engine}
                onClick={() => doSubmit([engine])}
                className="w-full text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-black/60 hover:bg-black/[0.03] transition-colors"
              >
                {engine.charAt(0).toUpperCase() + engine.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={checkStatus}
        disabled={isChecking}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-black/[0.04] text-black rounded-lg hover:bg-black/[0.08] active:scale-95 transition-all disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`} />
        {isChecking ? "..." : "Check"}
      </button>
    </div>
  )
}
