import { ArrowRight, MessageSquare, Zap, CheckCircle2, XCircle, CalendarClock, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500/20">
      
      {/* NAVIGATION */}
      <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* UPDATED LOGO: Added object-left so it stays anchored, bumped height */}
            <img 
              src="/assets/SCC_logo.png" 
              alt="Sun City Connect Logo" 
              className="h-16 md:h-20 w-auto object-contain object-left drop-shadow-sm hover:scale-105 transition-transform origin-left" 
            />
          </div>
          <div className="hidden md:flex items-center gap-8 font-bold text-sm">
            <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How it Works</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg">
              Client Login
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 relative overflow-hidden">
        {/* Soft background blurs mimicking the Sun City vibe */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-orange-100 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-amber-50 rounded-full blur-3xl -z-10"></div>

        <div className="flex flex-col items-center text-center relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full text-orange-600 text-xs font-bold mb-8 uppercase tracking-widest shadow-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            Now Onboarding in El Paso, TX
          </div>
          
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.95] text-slate-900 mb-6">
            STOP TYPING. <br/>
            <span className="text-orange-500">START CLOSING.</span>
          </h1>
          
          <p className="text-lg lg:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            We build 24/7 custom AI sales assistants for local businesses. Never miss a late-night DM or lose another lead to a competitor.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-black text-lg py-4 px-10 rounded-full flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-xl shadow-orange-500/20">
              Get a Live Demo <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </main>

      {/* FEATURE CARDS */}
      <section id="how-it-works" className="w-full max-w-7xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 p-5 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex flex-col">
            <div className="w-full aspect-[4/3] bg-slate-100 rounded-3xl mb-6 overflow-hidden border-4 border-slate-50 relative shadow-inner flex items-center justify-center">
               <MessageSquare size={64} className="text-orange-300" />
            </div>
            <div className="text-center px-2 pb-4">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Instant Replies</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Your bot answers FAQs, pricing questions, and pre-qualifies leads in under 3 seconds.</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 p-5 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex flex-col">
            <div className="w-full aspect-[4/3] bg-slate-100 rounded-3xl mb-6 overflow-hidden border-4 border-slate-50 relative shadow-inner flex items-center justify-center">
               <CalendarClock size={64} className="text-orange-300" />
            </div>
            <div className="text-center px-2 pb-4">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Book Appointments</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Directly connected to your calendar. Customers book times without you lifting a finger.</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 p-5 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex flex-col">
            <div className="w-full aspect-[4/3] bg-slate-900 rounded-3xl mb-6 overflow-hidden border-4 border-slate-800 relative shadow-inner flex items-center justify-center">
               <TrendingUp size={64} className="text-orange-500" />
            </div>
            <div className="text-center px-2 pb-4">
              <h3 className="text-2xl font-black text-slate-900 mb-2">24/7 Sales Rep</h3>
              <p className="text-slate-500 font-medium leading-relaxed">Never sleep. Never take a break. Your inbox is officially an automated revenue engine.</p>
            </div>
          </div>

        </div>
      </section>

      {/* OLD WAY VS NEW WAY */}
      <section className="bg-white py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-4 text-slate-900">Stop acting like a robot.</h2>
            <p className="text-xl text-slate-500 font-medium">Let us build you one.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                The Old Way
              </h3>
              <ul className="space-y-6">
                {[
                  "Missing late-night DMs while you're asleep",
                  "Losing impatient leads to faster competitors",
                  "Typing the exact same pricing answers all day",
                  "Forgetting to follow up with hot leads"
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-slate-600 font-medium text-lg">
                    <XCircle className="text-red-500 shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* The New Way */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 p-8 opacity-5 text-white"><Zap size={200} /></div>
              <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
                The Sun City Way
              </h3>
              <ul className="space-y-6 relative z-10">
                {[
                  "Instant replies in under 3 seconds, 24/7",
                  "Conversations that sound exactly like you",
                  "Pre-qualifying leads automatically",
                  "Appointments booked straight to your calendar"
                ].map((item, i) => (
                  <li key={i} className="flex gap-4 text-slate-300 font-medium text-lg">
                    <CheckCircle2 className="text-orange-400 shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight mb-4 text-slate-900">Simple, transparent pricing.</h2>
            <p className="text-slate-500 text-lg font-medium">No hidden fees. Cancel anytime. Start automating today.</p>
          </div>

          <div className="max-w-lg mx-auto bg-white rounded-[2.5rem] p-10 border border-orange-200 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
            
            <h3 className="text-3xl font-black mb-2 text-slate-900">Growth Plan</h3>
            <p className="text-slate-500 font-medium mb-8">Everything you need to automate your DMs and close leads.</p>
            
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-7xl font-black tracking-tighter text-slate-900">$99</span>
              <span className="text-slate-500 font-bold">/month</span>
            </div>

            <ul className="space-y-5 mb-10">
              {[
                "24/7 AI DM Automation",
                "Custom AI Brain for your business",
                "Infinite Conversations",
                "Appointment Booking integration",
                "Human Handoff capabilities",
                "Priority Support"
              ].map((feature, i) => (
                <li key={i} className="flex gap-3 text-slate-700 font-bold text-lg">
                  <CheckCircle2 className="text-orange-500 shrink-0" /> {feature}
                </li>
              ))}
            </ul>

            <button className="w-full bg-slate-900 hover:bg-orange-500 text-white font-black text-lg py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
              Start Your Free Demo
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-slate-200 bg-white text-center text-slate-400 font-medium text-sm">
        <p>© 2026 Sun City Connect. A DuckNutz LLC Company. All rights reserved.</p>
      </footer>

    </div>
  );
}