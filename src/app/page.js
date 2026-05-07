import Logo from '../components/Logo';
import { ArrowRight, MessageSquare, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';


export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-purple-500/30">
      
      {/* NAVIGATION */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-3 text-xl font-black tracking-tighter">
  <Logo className="w-10 h-10 animate-pulse" />
  <span>SUN CITY <span className="text-purple-500">CONNECT</span></span>
</div>
        <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-sm font-semibold transition-all">
          Client Login
        </button>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-sm font-semibold mb-8 border border-purple-500/20">
          <Zap size={16} /> El Paso's Premier AI Automation Agency
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Never Lose Another <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            Lead in the DMs.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          We build custom 24/7 AI sales assistants for local businesses. Automate your inbox, answer FAQs instantly, and book more appointments while you sleep.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full flex items-center justify-center gap-2 transition-transform hover:scale-105">
            See a Live Demo <ArrowRight size={20} />
          </button>
          <button className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold py-4 px-8 rounded-full transition-all">
            View Pricing
          </button>
        </div>
      </main>

      {/* OLD WAY VS NEW WAY */}
      <section className="bg-slate-900/50 py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Stop acting like a robot.<br/>Let us build you one.</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-slate-400 mb-6 flex items-center gap-2">
                The Old Way (Without AI)
              </h3>
              <ul className="space-y-4">
                {[
                  "Missing late-night DMs while you're asleep",
                  "Losing impatient leads to faster competitors",
                  "Typing the exact same pricing answers all day",
                  "Forgetting to follow up with hot leads"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-300">
                    <XCircle className="text-red-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* The New Way */}
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 p-8 rounded-3xl border border-purple-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={100} /></div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                The New Way (With Us)
              </h3>
              <ul className="space-y-4">
                {[
                  "Instant replies in under 3 seconds, 24/7",
                  "Conversations that sound exactly like you",
                  "Pre-qualifying leads automatically",
                  "Appointments booked straight to your calendar"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-white font-medium">
                    <CheckCircle2 className="text-purple-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Three steps to automation.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Connect", desc: "Securely link your Instagram or Facebook business page to our secure dashboard in one click." },
            { step: "02", title: "Train", desc: "Tell us your business rules, pricing, and FAQs. We build the AI brain specifically for your brand." },
            { step: "03", title: "Automate", desc: "Turn the bot on. Watch as it instantly answers customer DMs and closes leads 24/7." }
          ].map((s, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/50 transition-colors">
              <div className="text-4xl font-black text-slate-800 mb-6">{s.step}</div>
              <h3 className="text-2xl font-bold mb-4">{s.title}</h3>
              <p className="text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* PRICING SECTION */}
      <section className="py-24 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing.</h2>
            <p className="text-slate-400 text-lg">No hidden fees. Cancel anytime. Start automating today.</p>
          </div>

          <div className="max-w-lg mx-auto bg-slate-900/80 rounded-3xl p-8 border border-purple-500/30 relative overflow-hidden shadow-2xl shadow-purple-900/20">
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              MOST POPULAR
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Growth Plan</h3>
            <p className="text-slate-400 mb-6">Everything you need to automate your DMs and close leads.</p>
            
            <div className="mb-8">
              <span className="text-5xl font-extrabold">$99</span>
              <span className="text-slate-400">/month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "24/7 AI DM Automation",
                "Custom AI Brain for your business",
                "Infinite Conversations",
                "Appointment Booking integration",
                "Human Handoff capabilities",
                "Priority Support"
              ].map((feature, i) => (
                <li key={i} className="flex gap-3 text-slate-300 font-medium">
                  <CheckCircle2 className="text-purple-400 shrink-0" /> {feature}
                </li>
              ))}
            </ul>

            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-transform hover:scale-105">
              Subscribe Now
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}