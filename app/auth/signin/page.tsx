export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Index111</h1>
          <p className="mt-2 text-slate-500">Fast search engine indexing</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-emerald-900">Test Mode</p>
          <p className="text-sm text-emerald-700 mt-1">
            Authentication is bypassed. You are automatically logged in as a test user.
          </p>
        </div>

        <a
          href="/dashboard"
          className="mt-6 w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
