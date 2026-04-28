import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-slate-900">
              Index111
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Pricing
              </Link>
              <Link
                href="/auth/signin"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Fast search engine indexing
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-tight">
            Get indexed by Google<br />
            <span className="text-emerald-600">in hours, not days</span>
          </h1>
          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto">
            Automate URL submission to Google Search Console. Connect your site,
            sync your sitemap, and watch your pages get indexed faster.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              Index My Pages Now
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Free plan: 1 site, 20 URLs/day
          </p>
        </div>
      </section>

      {/* Wall of Love */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-16">
            Wall of Love
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              name="Marc Lou"
              handle="@marclou"
              quote="This tool saved me hours of manual work. My new blog posts are indexed within 24 hours now."
            />
            <TestimonialCard
              name="Sarah Chen"
              handle="@sarahchendev"
              quote="Finally something that just works. Added my site, clicked sync, and forgot about it."
            />
            <TestimonialCard
              name="Alex Rivera"
              handle="@arivera"
              quote="Went from 40% indexed to 92% in two weeks. The auto-submit feature is a game changer."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Pricing</h2>
            <p className="mt-2 text-slate-500">Simple, transparent pricing for every stage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="For personal blogs and side projects"
              features={["1 site", "20 URLs/day", "Auto-submit", "Basic stats"]}
              cta="Get Started"
              ctaLink="/auth/signin"
              highlighted={false}
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/mo"
              description="For growing businesses and agencies"
              features={["10 sites", "200 URLs/day", "Auto-submit", "Advanced analytics", "Priority support"]}
              cta="Start Pro Trial"
              ctaLink="/auth/signin"
              highlighted={true}
            />
            <PricingCard
              name="Custom"
              price="Contact"
              description="For enterprises with custom needs"
              features={["Unlimited sites", "Custom limits", "API access", "Dedicated support", "SLA"]}
              cta="Contact Us"
              ctaLink="mailto:hello@index111.app"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Website Page Indexing FAQ
          </h2>
          <div className="space-y-4">
            <FaqItem
              question="How to index my website on Google?"
              answer="The fastest way is to use Google Search Console's URL Inspection tool to request indexing. Index111 automates this process by submitting your sitemap URLs daily."
            />
            <FaqItem
              question="What does 'crawled but not indexed' mean?"
              answer="Google has visited your page but decided not to include it in search results. This could be due to thin content, duplicate content, or technical issues. Index111 helps by re-submitting these URLs."
            />
            <FaqItem
              question="How long does indexing take?"
              answer="Without tools, it can take days to weeks. With Index111 submitting your URLs directly to Google's Indexing API, most pages are indexed within hours to 24 hours."
            />
            <FaqItem
              question="Is this safe for my site?"
              answer="Yes. We only use official Google APIs (Search Console and Indexing API) and follow Google's guidelines. We never use black-hat techniques."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-lg font-bold text-white">Index111</div>
            <div className="flex gap-6 text-sm">
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <div className="text-sm">Built with care for website owners</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function TestimonialCard({ name, handle, quote }: { name: string; handle: string; quote: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
      <p className="text-slate-700 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">{name}</div>
          <div className="text-sm text-slate-500">{handle}</div>
        </div>
      </div>
    </div>
  )
}

function PricingCard({
  name,
  price,
  period = "",
  description,
  features,
  cta,
  ctaLink,
  highlighted,
}: {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  cta: string
  ctaLink: string
  highlighted: boolean
}) {
  return (
    <div className={`rounded-2xl p-8 ${highlighted ? "bg-slate-900 text-white ring-2 ring-emerald-500" : "bg-white border border-slate-200"}`}>
      <h3 className={`text-lg font-semibold ${highlighted ? "text-white" : "text-slate-900"}`}>{name}</h3>
      <div className="mt-4 flex items-baseline">
        <span className={`text-4xl font-bold ${highlighted ? "text-white" : "text-slate-900"}`}>{price}</span>
        {period && <span className={`ml-1 ${highlighted ? "text-slate-300" : "text-slate-500"}`}>{period}</span>}
      </div>
      <p className={`mt-2 text-sm ${highlighted ? "text-slate-300" : "text-slate-500"}`}>{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={highlighted ? "text-slate-200" : "text-slate-600"}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={ctaLink}
        className={`mt-8 block text-center w-full py-3 rounded-lg font-medium transition-colors ${
          highlighted
            ? "bg-emerald-500 text-white hover:bg-emerald-400"
            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-slate-50 rounded-xl border border-slate-200">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
        <span className="font-medium text-slate-900">{question}</span>
        <span className="ml-4 text-slate-400 group-open:rotate-180 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </summary>
      <div className="px-5 pb-5 text-slate-600 leading-relaxed">{answer}</div>
    </details>
  )
}
