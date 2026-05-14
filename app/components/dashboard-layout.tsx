import Link from "next/link"
import { LayoutDashboard, Globe, Zap } from "lucide-react"

export async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#0a0a0a] flex selection:bg-black selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 w-[260px] bg-white border-r border-black/[0.05] flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-black/[0.05]">
          <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-70 transition-opacity flex items-center gap-2.5">
            <Zap className="w-5 h-5" />
            Index111
          </Link>
        </div>

        <div className="flex-1 py-6 px-3 space-y-0.5">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-[18px] h-[18px]" />}>
            Overview
          </NavItem>
          <NavItem href="/sites" icon={<Globe className="w-[18px] h-[18px]" />}>
            Sites
          </NavItem>
        </div>

        <div className="p-4 border-t border-black/[0.05]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-black/[0.02]">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              G
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-black truncate">Guest</p>
              <p className="text-[11px] font-semibold text-black/40 uppercase tracking-wider mt-0.5">Guest Mode</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-[260px] flex flex-col min-h-screen">
        <header className="h-16 bg-[#fbfbfa]/80 backdrop-blur-xl border-b border-black/[0.04] sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse-dot" />
            <span className="text-xs font-bold text-black/40 uppercase tracking-wider">All Systems Operational</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 uppercase tracking-wider border border-amber-200/60">
              Guest Mode
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-[13px] font-bold text-black/50 rounded-xl hover:bg-black/[0.04] hover:text-black transition-all"
    >
      <span className="text-black/30">{icon}</span>
      {children}
    </Link>
  )
}
