import { signIn } from "@/lib/auth"
import { Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#0a0a0a] flex flex-col items-center justify-center px-6 selection:bg-black selection:text-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight hover:opacity-70 transition-opacity">
            <Zap className="w-5 h-5" />
            Index111
          </Link>
          <h1 className="mt-8 text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-black/50 font-medium">Sign in to manage your sites and indexing.</p>
        </div>

        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/dashboard" })
          }}
        >
          <button
            type="submit"
            className="group w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-black/[0.08] text-black text-sm font-bold rounded-2xl hover:bg-black/[0.02] hover:border-black/[0.15] hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-black/35 font-medium">
          By signing in, you agree to our{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-black transition-colors">Terms</Link>
          {" "}and{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-black transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
