"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Globe, ArrowRight } from "lucide-react"

export function AddSiteButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const url = formData.get("url") as string

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error?.message || "Failed to add site")
      } else {
        setIsOpen(false)
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white text-sm font-bold rounded-full hover:bg-black hover:scale-[0.97] active:scale-[0.95] transition-all shadow-lg shadow-black/10"
      >
        <Plus className="w-4 h-4" />
        Add Site
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/10 scale-100 transition-transform">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-black/30 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <div className="w-12 h-12 bg-black/[0.03] rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-black/70" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-black">Add New Site</h2>
              <p className="text-black/45 font-medium mt-2 text-sm">Enter your website URL to connect and sync sitemaps.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100 flex items-start gap-3">
                <X className="w-5 h-5 text-red-500 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-black mb-2 uppercase tracking-wider">Website URL</label>
                <input
                  name="url"
                  type="text"
                  required
                  placeholder="https://example.com"
                  className="w-full px-4 py-3.5 bg-[#fbfbfa] border border-black/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/[0.1] focus:border-black/20 transition-all font-medium placeholder:text-black/25 text-sm"
                />
                <p className="mt-2 text-xs font-medium text-black/35">
                  We&apos;ll auto-detect the sitemap and extract all URLs.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3.5 bg-black/[0.04] text-black font-bold text-sm rounded-xl hover:bg-black/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1a1a1a] text-white font-bold text-sm rounded-xl hover:bg-black hover:scale-[0.97] active:scale-[0.95] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading ? "Adding..." : "Add Site"}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
