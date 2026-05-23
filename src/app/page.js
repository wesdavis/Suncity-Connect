import Link from 'next/link';
import { Sparkles, MessageSquare, BarChart3, Megaphone, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
          
          {/* Bigger Logo */}
          <img 
            src="/assets/SCC_logo.png" 
            alt="Sun City Connect" 
            className="h-28 md:h-40 w-auto drop-shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-500" 
          />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-sm font-semibold mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> 
            Premium Membership Now Available
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
            Your 24/7 AI Sales Team <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              and Marketing Agency.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
            Stop letting valuable leads slip through your Instagram and Facebook DMs. 
            Sun City Connect is an all-in-one command center designed to turn casual conversations into booked appointments, while putting your social media marketing on autopilot.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all transform hover:-translate-y-1">
                Upgrade Your Agency <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          
        </div>
      </main>

      {/* --- FEATURES GRID --- */}
      <section className="w-full bg-black/40 border-t border-white/5 py-24 px-4 md:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Built for Local Business Growth.</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Unlock a suite of enterprise-grade AI tools tailored specifically to help your business dominate the local market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Feature 1 */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                  <MessageSquare className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">24/7 AI Sales Assistant</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Never miss another midnight inquiry. Our smart AI instantly replies to incoming DMs on Instagram and Facebook, answering questions, handling objections, and driving customers to book a demo—all while matching your brand's unique voice. Take over manually at any time with our single-click Kill Switch.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Smart Pipeline & CRM</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Ditch the messy spreadsheets. Our AI automatically extracts crucial contact data—phone numbers, emails, and purchase intent—straight from your chat logs. We instantly categorize your leads into Hot, Warm, and Cold, organizing them into a sleek, real-time dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                  <Megaphone className="w-7 h-7 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AI Social Manager</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Struggling to figure out what to post? Let your customers tell you. Our intelligent marketing engine analyzes your recent inbox trends to discover exactly what your audience wants, then generates a high-converting caption and a stunning, ready-to-post branded image using enterprise-grade AI.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-orange-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                  <Lock className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">The Campaign Vault</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Save your favorite AI-generated ads to your private Vault. Download your branded assets in high resolution, copy your tailored captions, and deploy your campaigns to Meta with zero friction.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* --- CLOSING CTA --- */}
      <section className="w-full py-24 px-4 md:px-8 relative z-10 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">You run the business. <br className="hidden md:block"/> Let us handle the pipeline.</h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
             <Link href="/login">
              <Button className="h-14 px-10 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all transform hover:-translate-y-1">
                Get Started Today
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-zinc-500 font-medium">
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-orange-500" /> Meta Integration</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-orange-500" /> Real-time Analytics</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-orange-500" /> Secure Cloud Hosting</span>
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