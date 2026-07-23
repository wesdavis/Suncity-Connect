import Link from 'next/link';
import { Sparkles, MessageSquare, BarChart3, Globe, ArrowRight, CheckCircle2, Zap, Clock, ShieldCheck, Star, Users, MapPin, BrainCircuit, FileText, Megaphone, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SplashPage() {
  return (
    <div 
      className="min-h-screen font-sans selection:bg-orange-500/30 bg-zinc-950 text-white flex flex-col relative"
      style={{ backgroundImage: `radial-gradient(ellipse at top, rgba(249,115,22,0.15), transparent 60%), linear-gradient(to bottom, rgba(9,9,11,0.8), rgba(9,9,11,1)), url('/assets/bg-dark.png')`, backgroundAttachment: 'fixed', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* TOP ANNOUNCEMENT */}
      <div className="w-full bg-orange-500/10 border-b border-orange-500/20 text-center py-2 text-[13px] font-medium text-orange-300 tracking-wide">
        <span className="inline-flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Now onboarding local El Paso businesses for August • <span className="text-white underline underline-offset-4 decoration-orange-500/50">Limited onboarding slots available</span></span>
      </div>

      {/* --- NAV --- */}
      <nav className="w-full sticky top-0 border-b border-white/[0.07] bg-zinc-950/70 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-9 w-auto" />
            <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-medium">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              <a href="#pricing" className="hover:text-white transition">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5">Client Login</Button>
            </Link>
            <Link href="#pricing">
              <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-6 h-10">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-orange-500/15 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 md:pt-28 md:pb-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Copy */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300 text-xs font-semibold mb-6 backdrop-blur">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              EL PASO&apos;S ALL-IN-ONE AI GROWTH SYSTEM
            </div>

            <h1 className="text-[42px] md:text-[64px] font-black tracking-[-0.04em] leading-[0.9] mb-6">
              Turn social clicks
              <br />
              <span className="text-zinc-500">into booked revenue,</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                completely on autopilot.
              </span>
            </h1>

            <p className="text-[17px] md:text-[19px] text-zinc-400 leading-relaxed max-w-xl mb-8">
              Sun City Connect deploys a custom digital storefront, an AI DM agent that answers questions and schedules appointments 24/7, and an AI marketing suite that creates your social ad content automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a href="#pricing" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-[52px] px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[15px] rounded-full shadow-[0_0_30px_rgba(249,115,22,0.4)]">
                  Launch Your System <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-[52px] px-8 bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] rounded-full font-semibold">
                  How it works in 60s
                </Button>
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400" /> No long-term contracts
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-400" /> Live in 24 hours
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-zinc-400" /> Tailored for El Paso
              </div>
            </div>
          </div>

          {/* Right Visual Mock */}
          <div className="relative lg:h-[560px] flex items-center justify-center">
            {/* Phone Mock */}
            <div className="relative w-[320px] bg-zinc-900 rounded-[2.5rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
              <div className="bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
                    <div>
                      <div className="text-xs font-bold text-white leading-none">Sun City Catering & Events</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> AI Sales Agent Active</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-500">Now</div>
                </div>
                <div className="space-y-3">
                  <div className="bg-zinc-800 text-zinc-300 text-[12px] p-3 rounded-2xl rounded-tl-sm max-w-[85%]">Hi! Do you cater weddings for 100 people in El Paso?</div>
                  <div className="bg-orange-500 text-white text-[12px] p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto">Yes! Our catering packages start at $18/person. Can I shoot our full menu PDF over to your email?</div>
                  <div className="bg-zinc-800 text-zinc-300 text-[12px] p-3 rounded-2xl rounded-tl-sm max-w-[85%]">Awesome! Send it to wes@suncityconnect.com please.</div>
                  <div className="bg-orange-500 text-white text-[12px] p-3 rounded-2xl rounded-tr-sm max-w-[85%] ml-auto flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Menu emailed! Want to lock in a tasting call on our calendar?</div>
                </div>
                <div className="mt-4 bg-black/50 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">Email Sent via Resend</span>
                  <span className="text-[10px] font-bold text-white bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">+1 Hot Lead Captured</span>
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <div className="absolute -left-4 md:left-0 top-[15%] bg-zinc-900/90 backdrop-blur border border-white/10 rounded-xl p-3 shadow-xl hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-green-400" /></div>
              <div><div className="text-[11px] text-zinc-400">Response Speed</div><div className="text-sm font-bold text-white">&lt; 5 seconds</div></div>
            </div>
            <div className="absolute -right-2 md:right-4 bottom-[20%] bg-zinc-900/90 backdrop-blur border border-white/10 rounded-xl p-3 shadow-xl hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center"><BrainCircuit className="w-4 h-4 text-orange-400" /></div>
              <div><div className="text-[11px] text-zinc-400">PDF Knowledge Brain</div><div className="text-sm font-bold text-white">Instant Sync</div></div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-y border-white/[0.06] bg-white/[0.02] backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold shrink-0">Built for local industries</span>
            <div className="flex items-center gap-8 text-sm text-zinc-400 font-medium shrink-0">
              <span>Restaurants & Catering</span><span className="w-1 h-1 bg-white/10 rounded-full" /><span>Contractors & Trades</span><span className="w-1 h-1 bg-white/10 rounded-full" /><span>Barbershops & Salons</span><span className="w-1 h-1 bg-white/10 rounded-full" /><span>Gyms & Fitness</span><span className="w-1 h-1 bg-white/10 rounded-full" /><span>Medical & MedSpas</span><span className="w-1 h-1 bg-white/10 rounded-full" /><span>Real Estate</span>
            </div>
          </div>
        </div>
      </main>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="w-full py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-14">
            <div className="inline-flex items-center gap-2 text-orange-400 text-xs font-bold tracking-widest uppercase mb-4"><Sparkles className="w-4 h-4" /> The Complete Platform</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[0.95] mb-4">Everything you need to capture, close, and market.</h2>
            <p className="text-zinc-400 text-lg">Stop juggling 5 different subscriptions. Sun City Connect handles your website, lead capture, scheduling, and social graphics in one place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Storefront */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-orange-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Globe className="w-6 h-6 text-orange-400" /></div>
                <h3 className="text-xl font-bold text-white mb-3">High-Speed Digital Storefront</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">A custom-branded, ultra-fast storefront designed specifically for mobile traffic. Gives customers one clean link for live chat, social links, and bookings.</p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> Custom domain & SSL hosting</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" /> Replaces messy link-in-bio trees</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 2: Omnichannel AI Agent */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><MessageSquare className="w-6 h-6 text-blue-400" /></div>
                <h3 className="text-xl font-bold text-white mb-3">24/7 AI Sales Receptionist</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">Your AI agent works across your website and Instagram/Facebook DMs. It answers questions, handles pricing inquiries, and sends emails instantly.</p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Automated Resend email firing</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> Human escalation kill-switch built-in</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 3: Document Brain Upload */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-purple-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6 text-purple-400" /></div>
                <h3 className="text-xl font-bold text-white mb-3">Instant PDF Document Knowledge</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">Upload a catering menu, price guide, or rule sheet. Our AI extraction engine reads your documents and teaches your bot your business rules in seconds.</p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> Reads menus, price sheets, & rules</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" /> No manual coding required</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 4: AI Social Marketing Suite */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-pink-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Megaphone className="w-6 h-6 text-pink-400" /></div>
                <h3 className="text-xl font-bold text-white mb-3">AI Social Content Generator</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">Stuck on what to post? The AI Social Manager scans recent customer questions in your inbox and drafts branded ad copy and high-res imagery powered by Imagen 3.</p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" /> Auto-brands graphics with your logo</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" /> Save & download from Campaign Vault</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 5: Native Scheduling Engine */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Calendar className="w-6 h-6 text-emerald-400" /></div>
                <h3 className="text-xl font-bold text-white mb-3">Native AI Booking Calendar</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">Let the AI schedule appointments directly onto your native dashboard calendar with built-in conflict detection, local timezone alignment, and automated confirmations.</p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Timezone-aware booking engine</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Compatible with external Calendly links</li>
                </ul>
              </CardContent>
            </Card>

            {/* Card 6: Centralized CRM */}
            <Card className="bg-white/[0.03] backdrop-blur border-white/[0.06] hover:border-yellow-500/30 hover:bg-white/[0.05] transition-all group">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><BarChart3 className="w-6 h-6 text-yellow-400" /></div>
                <h3 className="text-xl font-bold text-white mb-3">Real-Time Lead CRM Pipeline</h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-4">Never lose a customer inquiry again. Every conversation is automatically analyzed, extracting emails and scoring leads as Hot, Warm, or Cold in your dashboard.</p>
                <ul className="space-y-2 text-[13px] text-zinc-300">
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" /> Auto email extraction & pipeline</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" /> Full conversation audit logs</li>
                </ul>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="w-full bg-white/[0.02] border-y border-white/[0.06] py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Live in 24 hours. Zero technical stress.</h2>
            <div className="space-y-8 mt-10">
              {[
                { n: '01', t: 'Set Up Your Profile', d: 'Complete our 3-step onboarding wizard to customize your colors, business details, and scheduling preferences.' },
                { n: '02', t: 'Train Your AI Core', d: 'Upload your price sheet or catering PDF. The AI reads your business details and is ready to answer questions immediately.' },
                { n: '03', t: 'Connect & Automate', d: 'Add your custom storefront link to your social bio and connect your social pages to capture leads on autopilot.' },
              ].map(step => (
                <div key={step.n} className="flex gap-6">
                  <div className="text-3xl font-black text-white/10">{step.n}</div>
                  <div><h4 className="font-bold text-white mb-1">{step.t}</h4><p className="text-sm text-zinc-400 max-w-sm">{step.d}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6"><h4 className="font-bold text-white">Traditional Setup vs Sun City Connect</h4><span className="text-[11px] bg-white/10 px-2 py-1 rounded-full text-zinc-300">Efficiency Comparison</span></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                <div className="text-xs text-zinc-500 mb-3 font-bold uppercase">The Old Way</div>
                <div className="space-y-2 text-xs text-zinc-500">
                  <div>❌ $2,000+ website design fee</div>
                  <div>❌ Missed late-night DMs</div>
                  <div>❌ Manual email follow-ups</div>
                  <div>❌ Hours spent creating social posts</div>
                </div>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="text-xs text-orange-400 mb-3 font-bold uppercase">With Sun City Connect</div>
                <div className="space-y-2 text-xs text-white">
                  <div>✓ Turnkey Storefront Included</div>
                  <div>✓ 24/7 Instant AI DM Replies</div>
                  <div>✓ Automated Email Follow-Ups</div>
                  <div>✓ Instant AI Social Graphic Creation</div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-white text-black rounded-xl p-4 flex items-center gap-3"><Star className="w-5 h-5 fill-black shrink-0" /><p className="text-[13px] font-medium leading-tight">"We stopped missing late-night inquiries and booked 9 new appointments in our first week without lifting a finger."</p></div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="w-full py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-500/[0.07] blur-[100px] rounded-full" /></div>
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Simple, Transparent Pricing.</h2>
            <p className="text-zinc-400">Everything software agencies charge thousands for, packaged into one platform.</p>
          </div>

          <Card className="bg-zinc-900/60 backdrop-blur-xl border-white/10 overflow-hidden">
            <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-0">
              <CardContent className="p-8 md:p-10">
                <div className="inline-flex bg-orange-500 text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-6">Full Growth Membership</div>
                <h3 className="text-3xl font-black text-white mb-6">Complete AI Command Suite</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3 text-[15px] text-white"><CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" /><span><strong>Custom Smart Storefront</strong> — Hosted, SSL secured, updates included</span></li>
                  <li className="flex gap-3 text-[15px] text-white"><CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" /><span><strong>24/7 AI Sales Receptionist</strong> — Web + Instagram DMs + Facebook DMs</span></li>
                  <li className="flex gap-3 text-[15px] text-white"><CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" /><span><strong>PDF Document Knowledge Brain</strong> — Upload menus, rules & price guides</span></li>
                  <li className="flex gap-3 text-[15px] text-white"><CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" /><span><strong>AI Social Marketing Engine</strong> — Automatic ad copy & graphic creation</span></li>
                  <li className="flex gap-3 text-[15px] text-white"><CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" /><span><strong>Omnichannel Lead CRM</strong> — Auto email extraction & pipeline</span></li>
                </ul>
                <div className="mt-8 flex items-center gap-3 text-xs text-zinc-500"><ShieldCheck className="w-4 h-4" /> 14-day money-back guarantee • Cancel anytime</div>
              </CardContent>
              <div className="bg-black/50 p-8 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/10 text-center">
                <div className="mb-1"><span className="text-6xl font-black text-white tracking-tight">$97</span><span className="text-lg text-zinc-500 font-medium">/mo</span></div>
                <div className="text-sm text-orange-300 font-medium mb-1">+$99 One-Time Build & Setup Fee</div>
                <div className="text-xs text-zinc-500 mb-8">Covers custom branding, PDF setup, & Meta integration</div>
                <Link href="/login" className="w-full mb-3">
                  <Button className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-bold text-[15px] rounded-full">Get Started Now — 24hr Setup</Button>
                </Link>
                
                <div className="mt-6 flex items-center justify-center gap-1"><Star className="w-3 h-3 fill-orange-400 text-orange-400" /><Star className="w-3 h-3 fill-orange-400 text-orange-400" /><Star className="w-3 h-3 fill-orange-400 text-orange-400" /><Star className="w-3 h-3 fill-orange-400 text-orange-400" /><Star className="w-3 h-3 fill-orange-400 text-orange-400" /><span className="text-xs text-zinc-400 ml-2">Trusted by local business owners</span></div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div><h2 className="text-3xl md:text-4xl font-black text-white leading-[0.9] mb-3">Ready to automate your<br />El Paso business?</h2><p className="text-white/80">Live in 24 hours. We handle all the setup and technical integration.</p></div>
          <Link href="/login"><Button className="h-14 px-8 bg-black text-white hover:bg-zinc-900 rounded-full font-bold text-base">Get Started Today <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </section>

      <footer className="w-full border-t border-white/5 bg-black/40 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3"><img src="/assets/SCC_logo.png" alt="SCC" className="h-6 w-auto opacity-80" /><span className="text-xs text-zinc-600">© {new Date().getFullYear()} Sun City Connect • Built in El Paso, TX</span></div>
          <div className="flex items-center gap-6 text-xs text-zinc-500"><a href="#" className="hover:text-white">Privacy Policy</a><a href="#" className="hover:text-white">Terms of Service</a><a href="https://instagram.com/suncity_connect" className="hover:text-white">@suncity_connect</a></div>
        </div>
      </footer>
    </div>
  );
}