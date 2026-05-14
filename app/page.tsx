"use client"

import Link from "next/link"
import { motion, Variants } from "framer-motion"
import {
  ArrowRight,
  Check,
  Zap,
  Globe,
  Clock,
  Shield,
  Search,
  Bot,
  BarChart3,
  AlertTriangle,
  Sparkles,
  ChevronDown,
} from "lucide-react"
import { useState } from "react"

// ─── Animation presets ──────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

// ─── Landing Page ───────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#0a0a0a] selection:bg-black selection:text-white overflow-x-hidden">
      <Navigation />
      <Hero />
      <SocialProof />
      <Features />
      <Pricing />
      <Faq />
      <Footer />
    </div>
  )
}

// ─── Navigation ─────────────────────────────────────────────────────
function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#fbfbfa]/80 backdrop-blur-xl border-b border-black/[0.04]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight hover:opacity-70 transition-opacity">
          Index111
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-semibold text-black/50 hover:text-black transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-semibold text-black/50 hover:text-black transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="text-sm font-semibold text-black/50 hover:text-black transition-colors">
            FAQ
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-black/50 hover:text-black transition-colors">
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white text-sm font-semibold rounded-full hover:bg-black hover:scale-[0.97] active:scale-[0.95] transition-all shadow-lg shadow-black/10"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden border-t border-black/[0.04] bg-[#fbfbfa] px-6 py-4 space-y-3"
        >
          <Link href="#features" className="block text-sm font-semibold text-black/60 hover:text-black">Features</Link>
          <Link href="#pricing" className="block text-sm font-semibold text-black/60 hover:text-black">Pricing</Link>
          <Link href="#faq" className="block text-sm font-semibold text-black/60 hover:text-black">FAQ</Link>
          <Link href="/dashboard" className="block text-sm font-semibold text-black/60 hover:text-black">Dashboard</Link>
        </motion.div>
      )}
    </nav>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_70%)]" />
      </div>

      <motion.div
        className="relative max-w-[1200px] mx-auto px-6 text-center"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/[0.03] border border-black/[0.06] text-black/70 text-xs font-bold uppercase tracking-wider mb-10 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse-dot" />
          Fast search engine indexing
        </motion.div>

        <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] max-w-5xl mx-auto text-balance">
          Get your website <br className="hidden md:block" />
          indexed by{" "}
          <span className="inline-flex items-center gap-3">
            <span className="text-[#4285f4]">G</span>
            <span className="text-[#ea4335]">o</span>
            <span className="text-[#fbbc04]">o</span>
            <span className="text-[#4285f4]">g</span>
            <span className="text-[#34a853]">l</span>
            <span className="text-[#ea4335]">e</span>
          </span>
          , <span className="text-[#008373]">Bing</span>, <span className="text-[#10a37f]">ChatGPT</span>,{" "}
          <span className="text-black/30">and other search engines.</span>
        </motion.h1>

        <motion.p variants={fadeUp} custom={2} className="mt-8 text-lg md:text-xl text-black/55 max-w-2xl mx-auto font-medium text-balance leading-relaxed">
          Drive more SEO traffic. Automate URL submission to Google Search Console, Bing, and LLM indexes. Connect your site, sync your sitemap, and watch your pages get indexed faster.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 px-8 py-4 bg-[#22c55e] text-white text-base font-bold rounded-full hover:bg-[#16a34a] hover:scale-[0.97] active:scale-[0.95] transition-all shadow-xl shadow-[#22c55e]/20 w-full sm:w-auto justify-center"
          >
            <Zap className="w-5 h-5" />
            Index My Pages Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.p variants={fadeUp} custom={4} className="mt-6 text-sm text-black/35 font-medium">
          No monthly subscription. You pay once and it&apos;s yours for life.
        </motion.p>

        {/* Stats row */}
        <motion.div variants={fadeUp} custom={5} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { num: "50K+", label: "URLs Indexed" },
            { num: "2.4k", label: "Active Users" },
            { num: "24h", label: "Avg. Index Time" },
            { num: "99.2%", label: "Uptime" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold tracking-tight">{s.num}</div>
              <div className="text-xs font-semibold text-black/40 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── Social Proof ───────────────────────────────────────────────────
function SocialProof() {
  const testimonials = [
    {
      name: "Marc Lou",
      handle: "@marclou",
      quote: "This tool saved me hours of manual work. My new blog posts are indexed within 24 hours now. The auto-submit feature is a game changer.",
      color: "bg-orange-100 text-orange-800",
    },
    {
      name: "Elena Voss",
      handle: "@elenavoss",
      quote: "Finally something that just works. Added my site, clicked sync, and forgot about it. Went from 40% indexed to 92% in two weeks.",
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "Kai Nakamura",
      handle: "@kainakamura",
      quote: "The LLM indexing feature is brilliant. My pages now show up in ChatGPT citations. Revenue from organic search doubled in 30 days.",
      color: "bg-emerald-100 text-emerald-800",
    },
  ]

  return (
    <section className="py-28 bg-white relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-4">
            Trusted by makers
          </motion.h2>
          <motion.p variants={fadeUp} className="text-center text-black/50 font-medium mb-16 max-w-lg mx-auto">
            Join thousands of website owners who stopped waiting for Google and started indexing.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                custom={i}
                className="bg-[#fbfbfa] rounded-3xl p-8 border border-black/[0.05] hover:border-black/[0.10] hover:shadow-lg hover:shadow-black/[0.03] hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-black/75 leading-relaxed font-medium text-[15px]">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-8 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${t.color}`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-black">{t.name}</div>
                    <div className="text-sm text-black/45 font-medium">{t.handle}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Features ───────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Google + Bing Indexing",
      desc: "Submit URLs directly to Google Search Console and Bing Webmaster Tools. Up to 20 URLs per day for Google, 200 for other engines.",
    },
    {
      icon: <Bot className="w-6 h-6" />,
      title: "LLM Indexing",
      desc: "Get your pages into ChatGPT, Perplexity, and other AI search indexes. The future of SEO is LLM-native.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Full Autopilot",
      desc: "Runs every day automatically. Syncs your sitemap, detects new pages, and submits them without you lifting a finger.",
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: "404 Alerts",
      desc: "Get instant notifications when pages return 404 or other errors. Fix broken links before they hurt your rankings.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Daily Reports",
      desc: "Track which pages are indexed, pending, or not indexed. Clear analytics to measure your indexing success.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safe & Official",
      desc: "Uses only official Google and Bing APIs. No black-hat techniques. Your site stays safe while getting indexed faster.",
    },
  ]

  return (
    <section id="features" className="py-28 bg-[#fbfbfa] relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.03] border border-black/[0.06] text-black/60 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to get indexed</h2>
            <p className="mt-4 text-lg text-black/50 font-medium max-w-xl mx-auto">
              No fluff. Just the tools that move the needle for your SEO.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group bg-white rounded-3xl p-8 border border-black/[0.05] hover:border-black/[0.10] hover:shadow-xl hover:shadow-black/[0.04] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center text-black/70 group-hover:bg-black group-hover:text-white transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="mt-6 text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="mt-3 text-sm text-black/55 leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Pricing ────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Life Time Deal",
      price: "$49",
      period: "one-time",
      description: "For personal blogs and side projects",
      features: [
        "Max 5 unique domains",
        "Total 1,000 URLs per domain",
        "Full autopilot, runs every day",
        "Alerts for 404 pages",
        "Daily reports for indexed pages",
        "Up to 20 URLs/day for Google",
        "Up to 200 URLs/day for other engines",
        "LLM indexing (ChatGPT + others)",
      ],
      cta: "Get LTD",
      highlighted: false,
    },
    {
      name: "LTD PRO",
      price: "$149",
      period: "one-time",
      description: "For growing businesses and agencies",
      features: [
        "Max 10 unique domains",
        "Total 10,000 URLs per domain",
        "Full autopilot, runs every day",
        "Alerts for 404 pages",
        "Daily reports for indexed pages",
        "Up to 20 URLs/day for Google",
        "Up to 200 URLs/day for other engines",
        "LLM indexing (ChatGPT + others)",
        "Priority support",
      ],
      cta: "Get LTD PRO",
      highlighted: true,
    },
    {
      name: "Custom Plan",
      price: "Contact",
      period: "",
      description: "For enterprises with custom needs",
      features: [
        "Unlimited domains",
        "Custom URL limits",
        "API access",
        "Dedicated support",
        "SLA guarantee",
        "White-label options",
      ],
      cta: "Contact Us",
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-28 bg-white relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.03] border border-black/[0.06] text-black/60 text-xs font-bold uppercase tracking-wider mb-6">
              Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple pricing</h2>
            <p className="mt-4 text-lg text-black/50 font-medium max-w-xl mx-auto">
              No monthly subscription. You pay once and it&apos;s yours for life.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                variants={fadeUp}
                custom={i}
                className={`rounded-3xl p-8 flex flex-col relative ${
                  p.highlighted
                    ? "bg-[#0a0a0a] text-white shadow-2xl shadow-black/15 scale-[1.02]"
                    : "bg-[#fbfbfa] border border-black/[0.06]"
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#22c55e] text-white text-[11px] font-bold uppercase tracking-wider rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-lg font-bold ${p.highlighted ? "text-white" : "text-black"}`}>{p.name}</h3>
                <p className={`mt-2 text-sm font-medium ${p.highlighted ? "text-white/55" : "text-black/50"}`}>
                  {p.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className={`text-5xl font-bold tracking-tight ${p.highlighted ? "text-white" : "text-black"}`}>
                    {p.price}
                  </span>
                  {p.period && (
                    <span className={`text-sm font-medium ${p.highlighted ? "text-white/50" : "text-black/45"}`}>
                      {p.period}
                    </span>
                  )}
                </div>
                <ul className="mt-8 space-y-3.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm font-medium">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${p.highlighted ? "text-[#22c55e]" : "text-black"}`} />
                      <span className={p.highlighted ? "text-white/75" : "text-black/65"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`mt-10 block text-center w-full py-3.5 rounded-full font-bold transition-all hover:scale-[0.97] active:scale-[0.95] ${
                    p.highlighted
                      ? "bg-[#22c55e] text-white hover:bg-[#16a34a] shadow-lg shadow-[#22c55e]/20"
                      : "bg-black/5 text-black hover:bg-black/10"
                  }`}
                >
                  {p.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── FAQ ────────────────────────────────────────────────────────────
function Faq() {
  const items = [
    {
      q: "How to index my website on Google?",
      a: "To index your website on Google, you need to submit your site's URL to Google's Search Console. Once submitted, Google's crawlers will visit and index your pages. With Index111, you can easily automate this completely. Submit your site's URL and let it do the work for you every day.",
    },
    {
      q: "How to get Google to crawl my site?",
      a: "To get Google to crawl your site, you need to submit a sitemap of your site to Google Search Console. This helps Google's crawlers discover all your pages. Index111 can pinpoint if there is anything wrong with your site or sitemap.",
    },
    {
      q: "What does it mean if my site is crawled but not indexed?",
      a: "If your site is crawled but not indexed, it means Google's web crawlers have visited your site but haven't added it to Google's search index. Index111 helps by re-submitting these URLs and providing tools to resubmit all pages in bulk.",
    },
    {
      q: "What does 'discovered currently not indexed' mean?",
      a: "'Discovered currently not indexed' means Google's web crawlers have found your site but haven't added it to Google's search results yet. Index111 provides tools to help you resubmit the pages in bulk.",
    },
    {
      q: "What is search engine indexing?",
      a: "Search engine indexing is the process of adding web pages to a search engine's index. When a web page is in the index, it can appear in search results. Index111 provides tools to help you get your web pages indexed by search engines faster.",
    },
    {
      q: "What is LLM Indexing and how does it help with chatbot indexing?",
      a: "LLM Indexing refers to the process of adding web pages to the index of Language Learning Models (LLMs) like ChatGPT. When your content is indexed by LLMs, it can be referenced in AI-generated responses, driving a new kind of organic traffic.",
    },
  ]

  return (
    <section id="faq" className="py-28 bg-[#fbfbfa] relative">
      <div className="max-w-[800px] mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-16">
            Website Page Indexing FAQ
          </motion.h2>

          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <FaqItem question={item.q} answer={item.a} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white rounded-2xl border border-black/[0.05] hover:border-black/[0.10] transition-colors overflow-hidden open:shadow-sm">
      <summary className="flex items-center justify-between p-6 cursor-pointer list-none select-none">
        <span className="font-bold text-[15px] text-black pr-4">{question}</span>
        <span className="ml-4 text-black/35 group-open:rotate-45 transition-transform duration-300 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </summary>
      <div className="px-6 pb-6 text-black/60 leading-relaxed font-medium text-[15px]">{answer}</div>
    </details>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-[#ededed] py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="text-xl font-bold tracking-tight">Index111</div>
            <p className="mt-3 text-sm text-[#ededed]/50 leading-relaxed font-medium max-w-xs">
              Get your website indexed by Google, Bing, ChatGPT, and other search engines. Drive more SEO traffic.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#ededed]/35 uppercase tracking-wider mb-5">Product</h4>
            <ul className="space-y-3">
              <li><Link href="/dashboard" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">Dashboard</Link></li>
              <li><Link href="/sites" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">Sites</Link></li>
              <li><Link href="#pricing" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">Pricing</Link></li>
              <li><Link href="#faq" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#ededed]/35 uppercase tracking-wider mb-5">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">Privacy</Link></li>
              <li><Link href="#" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">Terms</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#ededed]/35 uppercase tracking-wider mb-5">Friends</h4>
            <ul className="space-y-3">
              <li><a href="https://seobot.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">SEObot</a></li>
              <li><a href="https://unicornplatform.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">Unicorn Platform</a></li>
              <li><a href="https://devhunt.org" target="_blank" rel="noopener noreferrer" className="text-sm text-[#ededed]/60 hover:text-white transition-colors font-medium">DevHunt</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#ededed]/30 font-medium">© 2025 Index111. All rights reserved.</p>
          <p className="text-xs text-[#ededed]/30 font-medium">Built with care for website owners.</p>
        </div>
      </div>
    </footer>
  )
}
