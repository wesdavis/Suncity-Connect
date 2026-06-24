'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Info, MapPin, CheckCircle2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// 1. The Database of Fake Clients for the Showroom
const templateProfiles = {
  logistics: {
    business_name: "Sun City Staffing & Logistics",
    primary_color: "#ea580c",
    logo_url: "/assets/SCC_logo.png",
    company_bio: "El Paso's premier logistics recruiting agency. We match experienced CDL-A drivers with the highest-paying local and OTR routes in the Southwest.",
    address: "123 N Mesa St, Suite 400, El Paso, TX 79901",
    benefits: ["Starting at 70 CPM", "Guaranteed Home Weekends", "Sign-on Bonuses"],
    is_bot_active: true, // Bot is ON
    calendar_url: null,
    ai_greeting: "Hi! I'm the digital recruiting assistant for Sun City Staffing. Are you looking for local El Paso routes or OTR?",
    ai_response: "Got it! Do you currently hold a valid Class A CDL and have at least 1 year of experience?"
  },
  medical: {
    business_name: "Sun City Aesthetics & Wellness",
    primary_color: "#3b82f6",
    logo_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=256&h=256&fit=crop&q=80", 
    company_bio: "The premier destination for medical aesthetics, wellness, and anti-aging treatments. We specialize in enhancing your natural beauty.",
    address: "7470 Cimarron Market Ave, El Paso, TX 79911",
    benefits: ["Board Certified Injectors", "Free Consultations", "0% Financing Available"],
    is_bot_active: true, // Bot is ON
    calendar_url: null,
    ai_greeting: "Hello! Welcome to Sun City Aesthetics. Would you like to view our treatment menu or book a free consultation?",
    ai_response: "Wonderful! We have openings this week. Can I get your best phone number so our front desk can text you the available times?"
  },
  services: {
    business_name: "Sun City Roofing & Exteriors",
    primary_color: "#10b981",
    logo_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=256&h=256&fit=crop&q=80",
    company_bio: "Trusted local roofing experts. We handle storm damage, full replacements, and insurance claims from start to finish.",
    address: "11450 Rojas Dr, El Paso, TX 79936",
    benefits: ["Free Drone Inspections", "Fully Licensed & Bonded", "Insurance Claim Specialists"],
    is_bot_active: false, // Bot is OFF - triggers the Calendar layout
    calendar_url: "https://calendly.com/suncityconnect", // Ensure this points to a real public booking link for testing
    ai_greeting: "",
    ai_response: ""
  }
};

function TemplateContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id') || 'logistics';
  const client = templateProfiles[templateId] || templateProfiles.logistics;

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: client.ai_greeting }
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text: chatInput }]);
    setChatInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: client.ai_response }]);
    }, 1000);
  };

  const CompanyInfoBlock = () => (
    <div className="space-y-8 text-white">
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: client.primary_color }}>About Us</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">{client.company_bio}</p>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: client.primary_color }}>Why Choose Us</h3>
        <ul className="space-y-3">
          {client.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-center text-zinc-200 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-3" style={{ color: client.primary_color }} />
              {benefit}
            </li>
          ))}
        </ul>
      </section>

      <section className="pt-6 border-t border-white/10">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: client.primary_color }}>Location & Contact</h3>
        <p className="text-zinc-300 text-sm flex items-start gap-2 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {client.address}
        </p>
        <div className="flex gap-4">
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
          </button>
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </section>
    </div>
  );

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-zinc-950 font-sans selection:bg-white/20">
      
      {/* LEFT SIDE: Desktop Billboard */}
      <section className="hidden lg:flex lg:w-1/2 flex-col relative border-r border-white/10 bg-zinc-900">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
          style={{ background: `radial-gradient(circle at center, ${client.primary_color} 0%, transparent 70%)` }}
        />
        
        <div className="flex-1 overflow-y-auto p-12 lg:p-16 z-10">
          <img src={client.logo_url} alt={client.business_name} className="h-16 w-16 object-cover rounded-xl shadow-lg border border-white/10 mb-10" />
          <h1 className="text-5xl font-black text-white mb-10 leading-tight">
            {templateId === 'medical' ? "Enhance your natural beauty." : templateId === 'services' ? "Protect your biggest investment." : "Stop scrolling. Start driving."}
          </h1>
          <CompanyInfoBlock />
        </div>
      </section>

      {/* RIGHT SIDE / FULL MOBILE SCREEN: The Dynamic Panel */}
      <section className="flex flex-col w-full lg:w-1/2 h-full relative bg-zinc-950">
        
        {/* Universal Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <img src={client.logo_url} alt="Logo" className="h-8 w-8 object-cover rounded-md" />
            <div>
              <h2 className="text-white font-bold text-sm leading-none">{client.business_name}</h2>
              {client.is_bot_active ? (
                <p className="text-xs mt-1 flex items-center gap-1.5 opacity-80" style={{ color: client.primary_color }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: client.primary_color }}></span>
                  Live Agent
                </p>
              ) : (
                <p className="text-xs mt-1 flex items-center gap-1.5 text-zinc-400">
                  <CalendarIcon className="w-3 h-3" /> Booking Portal
                </p>
              )}
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                <Info className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-950 border-l border-white/10 w-[85%] sm:w-sm overflow-y-auto p-6">
              <SheetHeader className="text-left mt-4 mb-8">
                <img src={client.logo_url} alt={client.business_name} className="h-12 w-12 object-cover rounded-xl mb-4" />
                <SheetTitle className="text-2xl font-black text-white">{client.business_name}</SheetTitle>
              </SheetHeader>
              <CompanyInfoBlock />
            </SheetContent>
          </Sheet>
        </header>

        {/* LOGIC SPLIT: Show Chat OR Calendar */}
        {client.is_bot_active ? (
          <>
            {/* Desktop Chat Header */}
            <header className="hidden lg:flex items-center p-6 bg-zinc-950 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg leading-none">Application Assistant</h2>
                <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: client.primary_color }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: client.primary_color }}></span>
                  Online & Ready
                </p>
              </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-md text-[15px] leading-relaxed ${
                      msg.role === 'user' ? 'rounded-tr-sm text-white' : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                    }`}
                    style={msg.role === 'user' ? { backgroundColor: client.primary_color } : {}}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-zinc-950 border-t border-white/10 shrink-0 pb-safe">
              <form onSubmit={handleSendMessage} className="relative flex items-center max-w-2xl mx-auto">
                <input 
                  type="text" 
                  placeholder="Type your answer..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-full py-3.5 pl-5 pr-14 text-white text-[15px] focus:ring-1 outline-none transition-shadow"
                  style={{ '--tw-ring-color': client.primary_color }}
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-1.5 p-2.5 rounded-full text-white transition-transform active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: client.primary_color }}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* Desktop Calendar Header */}
            <header className="hidden lg:flex items-center p-6 bg-zinc-950 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-white font-bold text-lg leading-none">Schedule an Appointment</h2>
                <p className="text-sm mt-1 flex items-center gap-1.5 text-zinc-400">
                  <CalendarIcon className="w-3 h-3" /> Select a time below
                </p>
              </div>
            </header>

            {/* IFRAME EMBED */}
            <div className="flex-1 w-full bg-white relative">
               {client.calendar_url ? (
                 <iframe 
                   src={client.calendar_url} 
                   width="100%" 
                   height="100%" 
                   frameBorder="0" 
                   className="absolute inset-0"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400 p-8 text-center">
                    No booking calendar connected yet.
                 </div>
               )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function MasterTemplate() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>}>
      <TemplateContent />
    </Suspense>
  );
}