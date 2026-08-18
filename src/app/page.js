'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, MessageSquare, BarChart3, Globe, ArrowRight, CheckCircle2, 
  Clock, ShieldCheck, Star, Users, MapPin, BrainCircuit, FileText, 
  Megaphone, Calendar, Menu, Zap, MessageCircle, HelpCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SplashPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#faq', label: 'FAQ' },
    { href: '#pricing', label: 'Pricing' },
  ];

  const scrollToSection = (href) => {
    setMobileOpen(false);
    // Small delay so the sheet closes before scrolling (avoids mobile focus/scroll glitches)
    setTimeout(() => {
      const id = href.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <div 
      className="min-h-screen font-sans selection:bg-orange-500/30 bg-zinc-950 text-white flex flex-col relative"
      style={{ 
        backgroundImage: `radial-gradient(ellipse at top, rgba(249,115,22,0.15), transparent 60%), linear-gradient(to bottom, rgba(9,9,11,0.8), rgba(9,9,11,1)), url('/assets/bg-dark.png')`, 
        backgroundAttachment: 'fixed', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center' 
      }}
    >
      {/* TOP ANNOUNCEMENT */}
      <div className="w-full bg-orange-500/10 border-b border-orange-500/20 text-center py-2.5 text-[13px] font-medium text-orange-300 tracking-wide">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center px-4">
          <MapPin className="w-3.5 h-3.5 shrink-0" /> 
          Meta + Instagram DM access is live • Now onboarding El Paso businesses for August
          <span className="text-white underline underline-offset-4 decoration-orange-500/50">Limited setup slots this month</span>
        </span>
      </div>

      {/* --- NAV --- */}
      <nav className="w-full sticky top-0 border-b border-white/[0.07] bg-zinc-950/70 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center group">
              <img 
                src="/assets/SCC_logo_large.png" 
                alt="Sun City Connect" 
                className="h-12 md:h-14 w-auto logo-sparkle drop-shadow-[0_0_12px_rgba(249,115,22,0.35)] group-hover:drop-shadow-[0_0_20px_rgba(249,115,22,0.55)] transition-all duration-300" 
              />
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-medium">
              {navLinks.map(link => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollToSection(link.href)}
                  className="hover:text-white transition"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5">
                Client Login
              </Button>
            </Link>
            <Link href="#pricing" className="hidden sm:block">
              <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-6 h-10">
                Get Started
              </Button>
            </Link>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-zinc-950 border-white/10 text-white w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-white text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-6">
                  {navLinks.map(link => (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => scrollToSection(link.href)}
                      className="px-3 py-3 rounded-lg text-left text-zinc-300 hover:text-white hover:bg-white/5 font-medium w-full"
                    >
                      {link.label}
                    </button>
                  ))}
                  <div className="h-px bg-white/10 my-3" />
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-zinc-300 hover:text-white">
                      Client Login
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    onClick={() => scrollToSection('#pricing')}
                    className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full"
                  >
                    Get Started
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
      <main className="relative overflow-x-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-orange-500/15 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Copy */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300 text-xs font-semibold mb-6 backdrop-blur">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              EL PASO&apos;S ALL-IN-ONE AI GROWTH SYSTEM
            </div>

            <h1 className="text-[40px] md:text-[58px] font-black tracking-[-0.04em] leading-[0.92] mb-6">
              Never miss another
              <br />
              <span className="text-zinc-500">late-night DM.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                Book revenue on autopilot.
              </span>
            </h1>

            <p className="text-[17px] md:text-[19px] text-zinc-400 leading-relaxed max-w-xl mb-8">
              Sun City Connect gives local businesses a custom storefront, a 24/7 AI sales agent that answers Instagram & Facebook DMs, and an AI marketing engine that creates content from real customer questions — all live in 24 hours.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="#pricing" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-[52px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[15px] rounded-full shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                  Launch Your System <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-[52px] px-8 bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] rounded-full font-semibold">
                  See how it works
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400" /> No long-term contracts
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-400" /> Live in 24 hours
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-zinc-400" /> Meta + Instagram approved
              </div>
            </div>
          </div>

          {/* Right Visual Mock */}
          <div className="relative lg:h-[560px] flex items-center justify-center overflow-visible">
            {/* Decorative sun watermark */}
            <img 
              src="/assets/SCC_sun_clean_512.png" 
              alt="" 
              className="absolute w-[280px] h-[280px] opacity-[0.07] pointer-events-none select-none logo-glow z-0"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              aria-hidden="true"
            />
            {/* Phone Mock */}
            <div className="relative w-[300px] sm:w-[320px] bg-zinc-900 rounded-[2.5rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden z-10">
              <div className="bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-orange-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(249,115,22,0.25)]">
                      <img src="/assets/SCC_sun_clean_128.png" alt="" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-none">Sun City Catering & Events</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> AI Sales Agent Active
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500">Now</div>
                </div>
                <div className="space-y-3">
                  <div className="bg-zinc-800 text-zinc-300 text-[12px] p-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                    Hi! Do you cater weddings for 100 people in El Paso?
                  </div>
                  <div className="bg-orange-500 text-white text-[12px] p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto">
                    Yes! Our catering packages start at $18/person. Can I shoot our full menu PDF over to your email?
                  </div>
                  <div className="bg-zinc-800 text-zinc-300 text-[12px] p-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                    Awesome! Send it to wes@suncityconnect.com please.
                  </div>
                  <div className="bg-orange-500 text-white text-[12px] p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Menu emailed! Want to lock in a tasting call on our calendar?
                  </div>
                </div>
                <div className="mt-4 bg-black/50 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">Email Sent via Resend</span>
                  <span className="text-[10px] font-bold text-white bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                    +1 Hot Lead Captured
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Stats — sit above the phone, offset outside its edges */}
            <div className="absolute left-0 sm:-left-6 md:-left-10 top-[10%] z-20 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <div className="text-[11px] text-zinc-400">Avg. Reply Time</div>
                <div className="text-sm font-bold text-white">&lt; 5 seconds</div>
              </div>
            </div>
            <div className="absolute right-0 sm:-right-4 md:-right-8 bottom-[16%] z-20 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="text-[11px] text-zinc-400">PDF Knowledge Brain</div>
                <div className="text-sm font-bold text-white">Instant Sync</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust / Results strip */}
        <div className="border-y border-white/[0.06] bg-white/[0.02] backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-zinc-400 font-medium overflow-x-auto w-full sm:w-auto [&::-webkit-scrollbar]:hidden">
              <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold shrink-0">Built for</span>
              <span className="shrink-0">Restaurants & Catering</span>
              <span className="w-1 h-1 bg-white/15 rounded-full shrink-0" />
              <span className="shrink-0">Contractors</span>
              <span className="w-1 h-1 bg-white/15 rounded-full shrink-0" />
              <span className="shrink-0">Salons & Barbers</span>
              <span className="w-1 h-1 bg-white/15 rounded-full shrink-0" />
              <span className="shrink-0">Gyms</span>
              <span className="w-1 h-1 bg-white/15 rounded-full shrink-0" />
              <span className="shrink-0">MedSpas</span>
              <span className="w-1 h-1 bg-white/15 rounded-full shrink-0" />
              <span className="shrink-0">Real Estate</span>
            </div>
          </div>
        </div>
      </main>

      {/* --- SOCIAL PROOF / RESULTS --- */}
      <section className="w-full py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '< 5s', label: 'Average AI reply time' },
              { value: '24/7', label: 'Lead capture coverage' },
              { value: '1 day', label: 'Average time to go live' },
              { value: '100%', label: 'Custom to your business' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white tracking-tight mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="w-full py-20 px-6 relative scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">
              <Sparkles className="w-4 h-4" /> The Complete Platform
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[0.95] mb-4">
              Everything you need to capture, close, and market.
            </h2>
            <p className="text-zinc-400 text-lg">
              Stop juggling five different tools. Sun City Connect handles your storefront, Instagram & Facebook DMs, scheduling, and social content in one system built for local El Paso businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-orange-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">High-Speed Digital Storefront</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">
                  A custom-branded, mobile-first storefront with live chat, social links, and booking. One clean link that replaces messy link-in-bio tools.
                </p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> Custom domain & SSL included</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> Replaces Linktree-style pages</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">24/7 AI Sales Receptionist</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">
                  Your AI agent answers questions across your website and Instagram/Facebook DMs. It qualifies leads, sends menus, and books appointments while you sleep.
                </p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Instagram + Facebook DMs live</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Human takeover kill-switch</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-purple-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Instant PDF Knowledge Brain</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">
                  Upload a menu, price list, or service guide. The AI extracts your rules and pricing so the bot answers accurately — no manual training required.
                </p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Reads menus & price sheets</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Ready in minutes, not weeks</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-pink-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Megaphone className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Social Content Generator</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">
                  The marketing engine scans real customer questions from your inbox and drafts branded ad copy + graphics so you always have content ready to post.
                </p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" /> Auto-brands with your logo</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" /> Saves to your Campaign Vault</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 5 */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Native AI Booking Calendar</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">
                  Let the AI book appointments directly onto your dashboard calendar with conflict detection, local timezone handling, and automatic confirmations.
                </p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Timezone-aware engine</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Works with Calendly if preferred</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 6 */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-yellow-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Real-Time Lead CRM Pipeline</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">
                  Every conversation is logged, emails are extracted, and leads are scored Hot / Warm / Cold automatically so you never lose a prospect again.
                </p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" /> Auto email extraction</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" /> Full conversation history</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="w-full bg-white/[0.02] border-y border-white/[0.06] py-24 px-6 scroll-mt-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
              Live in 24 hours.<br />Zero technical stress.
            </h2>
            <p className="text-zinc-400 mb-10 max-w-md">
              We handle the setup. You just answer a few questions and upload your menu or price list.
            </p>
            <div className="space-y-8">
              {[
                { 
                  n: '01', 
                  t: 'Complete the onboarding wizard', 
                  d: 'Tell us your business details, brand colors, and scheduling preferences. Takes about 10 minutes.' 
                },
                { 
                  n: '02', 
                  t: 'Upload your knowledge (PDF or menu)', 
                  d: 'Drop in your price list, catering menu, or service guide. The AI reads it and is ready to answer accurately.' 
                },
                { 
                  n: '03', 
                  t: 'Connect Instagram / Facebook + go live', 
                  d: 'We finish Meta integration and put your custom storefront + AI agent live. You start capturing leads the same day.' 
                },
              ].map(step => (
                <div key={step.n} className="flex gap-5">
                  <div className="text-3xl font-black text-white/10 leading-none pt-0.5">{step.n}</div>
                  <div>
                    <h4 className="font-bold text-white mb-1">{step.t}</h4>
                    <p className="text-sm text-zinc-400 max-w-sm">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-white">The old way vs Sun City Connect</h4>
              <span className="text-[11px] bg-white/10 px-2 py-1 rounded-full text-zinc-300">Side-by-side</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-xl p-5 border border-white/5">
                <div className="text-xs text-zinc-500 mb-4 font-bold uppercase tracking-wider">The Old Way</div>
                <div className="space-y-3 text-sm text-zinc-500">
                  <div className="flex gap-2"><span className="text-red-400/80">✕</span> $2k+ website + tools</div>
                  <div className="flex gap-2"><span className="text-red-400/80">✕</span> Missed late-night DMs</div>
                  <div className="flex gap-2"><span className="text-red-400/80">✕</span> Manual follow-ups</div>
                  <div className="flex gap-2"><span className="text-red-400/80">✕</span> Hours writing social posts</div>
                </div>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-5 border border-orange-500/25">
                <div className="text-xs text-orange-400 mb-4 font-bold uppercase tracking-wider">With Sun City Connect</div>
                <div className="space-y-3 text-sm text-white">
                  <div className="flex gap-2"><span className="text-emerald-400">✓</span> Turnkey storefront included</div>
                  <div className="flex gap-2"><span className="text-emerald-400">✓</span> Instant 24/7 DM replies</div>
                  <div className="flex gap-2"><span className="text-emerald-400">✓</span> Automated email + booking</div>
                  <div className="flex gap-2"><span className="text-emerald-400">✓</span> AI social content on demand</div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-white text-black rounded-xl p-5 flex gap-3">
              <Star className="w-5 h-5 fill-black shrink-0 mt-0.5" />
              <p className="text-[13px] font-medium leading-snug">
                “We stopped missing late-night inquiries and booked 9 new appointments in the first week without lifting a finger.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="w-full py-24 px-6 scroll-mt-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4">
              <HelpCircle className="w-4 h-4" /> Common Questions
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Straight answers before you start.</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Will the AI sound robotic or give wrong prices?",
                a: "No. We train it on your actual menu or price sheet (PDF upload). It only answers from your knowledge base. You also have a one-click human takeover if you ever need to jump in."
              },
              {
                q: "Does it actually work with Instagram and Facebook DMs?",
                a: "Yes. Meta permissions are fully approved. The AI can reply to Instagram and Facebook DMs, extract contact info, send emails, and book appointments — the same way it works on your website chat."
              },
              {
                q: "How long does setup really take?",
                a: "Most businesses are fully live within 24 hours. You complete a short onboarding wizard and upload your documents. We handle the technical side and Meta connection."
              },
              {
                q: "What if I already have a website or use Calendly?",
                a: "No problem. Many clients keep their existing site and use our storefront as the smart link-in-bio + AI layer. We also support external calendar links if you prefer to stay on Calendly."
              },
              {
                q: "Is there a long-term contract?",
                a: "No. Month-to-month. 14-day money-back guarantee. Cancel anytime from your dashboard."
              },
            ].map((item, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="font-bold text-white mb-2 text-[15px]">{item.q}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="w-full py-24 px-6 relative scroll-mt-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-500/[0.07] blur-[100px] rounded-full" />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Simple, transparent pricing.</h2>
            <p className="text-zinc-400">
              Everything agencies charge thousands for — packaged into one platform built for El Paso businesses.
            </p>
          </div>

          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 overflow-hidden">
            <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-0">
              <CardContent className="p-8 md:p-10">
                <div className="inline-flex bg-orange-500 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">
                  Full Growth Membership
                </div>
                <h3 className="text-3xl font-black text-white mb-6">Complete AI Command Suite</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-[15px] text-white">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <span><strong>Custom Smart Storefront</strong> — Hosted, SSL, updates included</span>
                  </li>
                  <li className="flex gap-3 text-[15px] text-white">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <span><strong>24/7 AI Sales Receptionist</strong> — Web + Instagram + Facebook DMs</span>
                  </li>
                  <li className="flex gap-3 text-[15px] text-white">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <span><strong>PDF Document Knowledge Brain</strong> — Upload menus, rules & price guides</span>
                  </li>
                  <li className="flex gap-3 text-[15px] text-white">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <span><strong>AI Social Marketing Engine</strong> — Ad copy & graphics from real customer questions</span>
                  </li>
                  <li className="flex gap-3 text-[15px] text-white">
                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <span><strong>Omnichannel Lead CRM</strong> — Auto email extraction & pipeline scoring</span>
                  </li>
                </ul>
                <div className="mt-8 flex items-center gap-3 text-xs text-zinc-500">
                  <ShieldCheck className="w-4 h-4" /> 14-day money-back guarantee • Cancel anytime
                </div>
              </CardContent>

              <div className="bg-black/50 p-8 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 text-center">
                <div className="mb-1">
                  <span className="text-6xl font-black text-white tracking-tight">$97</span>
                  <span className="text-lg text-zinc-500 font-medium">/mo</span>
                </div>
                <div className="text-sm text-orange-300 font-medium mb-1">+$99 one-time build & setup</div>
                <div className="text-xs text-zinc-500 mb-8">Covers custom branding, PDF setup & Meta integration</div>
                
                <Link href="/login" className="w-full mb-3">
                  <Button className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-bold text-[15px] rounded-full">
                    Get Started — Live in 24hrs
                  </Button>
                </Link>
                
                <div className="mt-6 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                  ))}
                  <span className="text-xs text-zinc-400 ml-2">Built for local owners</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-[0.95] mb-3">
              Ready to stop missing<br />El Paso leads?
            </h2>
            <p className="text-white/85 max-w-md">
              Meta + Instagram access is live. We handle setup and technical integration so you can start capturing revenue this week.
            </p>
          </div>
          <Link href="/login">
            <Button className="h-14 px-8 bg-black text-white hover:bg-zinc-900 rounded-full font-bold text-base shrink-0">
              Get Started Today <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-black/40 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/assets/SCC_logo_large.png" alt="SCC" className="h-9 w-auto opacity-90 logo-glow" />
            <span className="text-xs text-zinc-600">
              © {new Date().getFullYear()} Sun City Connect • Built in El Paso, TX
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
            <a 
              href="https://instagram.com/suncity_connect" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white transition"
            >
              @suncity_connect
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
