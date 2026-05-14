"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SendHorizontal, ChevronDown } from "lucide-react"

const ALL_ENGINES = ["google", "bing", "yandex"] as const

export function SubmitAllButton({ siteId, urlCount }: { siteId: string; urlCount: number }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    if (urlCount <= 0) {
      setToast("No pending URLs to submit")
      setTimeout(() => setToast(null), 3000)
      return
    }
    setIsSubmitting(true)
    setToast(null)
    setDropdownOpen(false)
    try {
      const res = await fetch(`/api/sites/${siteId}/submit-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engines }),
      })
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
    <div className="relative" ref={dropdownRef}>
      {toast && (
        <div className="absolute right-0 top-full mt-2 z-10 px-4 py-2 bg-[#1a1a1a] text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-xl">
          {toast}
        </div>
      )}
      <button
        onClick={() => !isSubmitting && setDropdownOpen((v) => !v)}
        disabled={isSubmitting || urlCount <= 0}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#22c55e] text-white text-sm font-bold rounded-full hover:bg-[#16a34a] hover:scale-[0.97] active:scale-[0.95] transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-lg shadow-[#22c55e]/15"
      >
        <SendHorizontal className="w-4 h-4" />
        {isSubmitting ? "Submitting..." : `Submit All (${urlCount})`}
        <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
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
  )
}
