import Link from 'next/link';
import { Sparkles, MessageSquare, BarChart3, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SplashPage() {
  return (
    <div 
      className="min-h-screen font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center flex flex-col"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.98)), url('/assets/bg-dark.png')` }}
    >
      {/* --- TOP NAV --- */}
      <nav className="w-full border-b border-white/10 bg-black/20 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-10 md:h-12 w-auto drop-shadow-lg" />
          <Link href="/login">
            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
              Client Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-24 px-4 md:px-8 text-center relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          
          <img 
            src="/assets/SCC_logo.png" 
            alt="Sun City Connect" 
            className="h-28 md:h-40 w-auto drop-shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500" 
          />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-sm font-semibold mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> 
            The Turnkey Solution for Local Businesses
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
            Deploy Your Smart <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              Digital Storefront.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
            Stop relying on static web pages and missed social media DMs. We install a centralized lead capture system—complete with a high-converting storefront and a 24/7 AI sales team that books appointments while you sleep.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/templates" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all transform hover:-translate-y-1">
                View The System <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          
        </div>
      </main>

      {/* --- CORE FEATURES --- */}
      <section className="w-full bg-black/40 border-y border-white/5 py-24 px-4 md:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Everything You Need to Dominate Locally.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-8">
                <Globe className="w-10 h-10 text-orange-400 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Conversion Portals</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Fast, mobile-optimized storefronts branded exactly for your business. Link to it from your bio or existing site to funnel local traffic into a dedicated checkout lane.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-8">
                <MessageSquare className="w-10 h-10 text-blue-400 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">24/7 AI Receptionist</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Embedded directly into your storefront and your Meta DMs. Our AI instantly answers questions, pre-screens candidates, and books appointments 24 hours a day.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-8">
                <BarChart3 className="w-10 h-10 text-green-400 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Unified CRM Dashboard</h3>
                <p className="text-zinc-400 leading-relaxed">
                  One clean command center. We automatically extract phone numbers, emails, and client intent from every conversation, logging them into a single secure pipeline.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- NEW: SINGLE TIER PRICING --- */}
      <section className="w-full py-24 px-4 md:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">One System. One Price.</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              No complex tiers or hidden fees. Get the exact infrastructure the top agencies use, for a fraction of the cost.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-zinc-900 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.15)] flex flex-col relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                The Complete Package
              </div>
              <CardHeader className="text-center pb-2 pt-10">
                <CardTitle className="text-3xl md:text-4xl font-black text-white">Centralized Lead Capture</CardTitle>
              </CardHeader>
              <CardContent className="p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">
                
                {/* Feature List */}
                <div className="flex-1 w-full">
                  <ul className="space-y-5">
                    <li className="flex items-start text-white text-lg"><CheckCircle2 className="w-6 h-6 text-orange-500 mr-4 shrink-0" /> Custom Smart Storefront (Hosted & Maintained)</li>
                    <li className="flex items-start text-white text-lg"><CheckCircle2 className="w-6 h-6 text-orange-500 mr-4 shrink-0" /> 24/7 AI Sales Receptionist (Web, IG, & FB)</li>
                    <li className="flex items-start text-white text-lg"><CheckCircle2 className="w-6 h-6 text-orange-500 mr-4 shrink-0" /> Omnichannel CRM Lead Dashboard</li>
                    <li className="flex items-start text-white text-lg"><CheckCircle2 className="w-6 h-6 text-orange-500 mr-4 shrink-0" /> Automated Lead Qualification & Data Extraction</li>
                  </ul>
                </div>

                {/* Price Block */}
                <div className="w-full md:w-80 bg-black/40 p-8 rounded-2xl border border-white/10 text-center flex flex-col justify-center shrink-0">
                  <div className="mb-2">
                    <span className="text-6xl font-black text-white">$97</span><span className="text-xl text-zinc-400">/mo</span>
                  </div>
                  <p className="text-sm text-orange-400 font-medium mb-1">+$199 One-Time Setup Fee</p>
                  <p className="text-xs text-zinc-500 mb-8">No contracts. Cancel anytime.</p>
                  <Link href="/login" className="w-full">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 text-lg shadow-lg shadow-orange-500/20 transition-transform transform hover:-translate-y-1">
                      Start Building
                    </Button>
                  </Link>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* --- FOOTER --- */}
      <footer className="w-full border-t border-white/5 bg-black/40 py-8 px-4 text-center text-zinc-600 text-sm">
        <p>© {new Date().getFullYear()} Sun City Connect. All rights reserved.</p>
      </footer>

    </div>
  );
}