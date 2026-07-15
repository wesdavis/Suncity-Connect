'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Send, Info, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MasterTemplate() {
  const params = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [visitorId] = useState(() => Math.random().toString(36).substring(7));

  useEffect(() => {
    async function fetchClientData() {
      // The middleware passed the custom domain via the URL params
      const currentDomain = params?.domain;

      // If the hook hasn't caught the URL yet, pause and wait
      if (!currentDomain) return;

      const { data, error } = await supabase
        .from('clients')
        .select('id, business_name, custom_prompt, pdf_knowledge, logo_url, instagram_link, facebook_link, website_link, yelp_link')
        .eq('custom_domain', currentDomain) // <-- This is the fix right here!
        .single();

      if (error || !data) {
        console.error("Client not found for domain:", currentDomain);
        setLoading(false);
        return; // In production, we'd redirect to a 404 here
      }

      setClient(data);
      document.title = `${data.business_name} | AI Assistant`;
      setMessages([
        { role: 'ai', text: `Hi! I'm the digital assistant for ${data.business_name}. How can I help you today?` }
      ]);
      setLoading(false);
    }

    fetchClientData();
  }, [params?.domain]); // <-- Update dependency array

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    // 1. Add user message to screen
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');

    // 2. Add temporary loading state
    setMessages(prev => [...prev, { role: 'ai', text: "Typing...", isLoading: true }]);

    console.log("SENDING TO API:", { message: userMessage, clientId: client?.id });

    try {
      // 3. Send the exact payload the API demands
      const response = await fetch('/api/web-chat', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain: params?.domain,
          message: userMessage, 
          history: messages,
          visitorId: visitorId
        })
      });
      
      const data = await response.json();
      
      // 4. Remove typing indicator and show the real AI response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // removes the "Typing..." message
        newMessages.push({ role: 'ai', text: data.reply || data.error });
        return newMessages;
      });

    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop();
        newMessages.push({ role: 'ai', text: "System connection lost. Please try again." });
        return newMessages;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <h1 className="text-2xl font-bold">Storefront Not Found</h1>
      </div>
    );
  }

  // Shared Informational Content
  const CompanyInfoBlock = () => (
    <div className="space-y-8 text-white">
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: client.primary_color || '#ea580c' }}>About Us</h3>
        <p className="text-zinc-300 text-sm leading-relaxed">{client.company_bio || "Welcome to our digital storefront."}</p>
      </section>

      {/* Fallback Benefits/Services if they haven't set them up yet */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: client.primary_color || '#ea580c' }}>Why Choose Us</h3>
        <ul className="space-y-3">
          <li className="flex items-center text-zinc-200 text-sm">
            <CheckCircle2 className="w-4 h-4 mr-3" style={{ color: client.primary_color || '#ea580c' }} />
            24/7 Priority Support
          </li>
          <li className="flex items-center text-zinc-200 text-sm">
            <CheckCircle2 className="w-4 h-4 mr-3" style={{ color: client.primary_color || '#ea580c' }} />
            Licensed & Verified
          </li>
        </ul>
      </section>

      <section className="pt-6 border-t border-white/10">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: client.primary_color || '#ea580c' }}>Location</h3>
        <p className="text-zinc-300 text-sm flex items-start gap-2 mb-4">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {client.street_address || "El Paso, TX"}
        </p>
      </section>
    </div>
  );

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-zinc-950 font-sans selection:bg-white/20">
      
      {/* LEFT SIDE: The Desktop Billboard (Hidden on Mobile) */}
      <section className="hidden lg:flex lg:w-1/2 flex-col relative border-r border-white/10 bg-zinc-900">
        <div 
          className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
          style={{ background: `radial-gradient(circle at center, ${client.primary_color || '#ea580c'} 0%, transparent 70%)` }}
        />
        
        <div className="flex-1 overflow-y-auto p-12 lg:p-16 z-10">
          {client.logo_url && <img src={client.logo_url} alt={client.business_name} className="h-16 w-auto mb-10" />}
          <h1 className="text-5xl font-black text-white mb-10 leading-tight">
            Connect with <br/> {client.business_name}.
          </h1>
          <CompanyInfoBlock />
        </div>
      </section>

      {/* RIGHT SIDE / FULL MOBILE SCREEN: The AI Chat Interface */}
      <section className="flex flex-col w-full lg:w-1/2 h-full relative bg-zinc-950">
        
        {/* --- UPDATED: Solid, Sticky Mobile Header --- */}
        <header className="lg:hidden sticky top-0 flex items-center justify-between p-4 bg-zinc-950 border-b border-white/10 shrink-0 z-50 shadow-md">
          <div className="flex items-center gap-3">
            {client.logo_url && <img src={client.logo_url} alt="Logo" className="h-8 w-auto" />}
            <div>
              <h2 className="text-white font-bold text-sm leading-none">{client.business_name}</h2>
              <p className="text-xs mt-1 flex items-center gap-1.5 opacity-80" style={{ color: client.primary_color || '#ea580c' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: client.primary_color || '#ea580c' }}></span>
                Live Agent
              </p>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                <Info className="w-6 h-6" />
              </button>
            </SheetTrigger>
            {/* --- DYNAMIC LINKTREE SHEET --- */}
        <SheetContent className="bg-zinc-950 border-l border-white/10 text-white p-6 sm:max-w-md w-full overflow-y-auto">
          <SheetHeader className="space-y-6 flex flex-col items-center mt-8">
            
            {/* Dynamic Logo Avatar */}
            {client.logo_url ? (
              <img 
                src={client.logo_url} 
                alt={client.business_name} 
                className="w-24 h-24 rounded-full object-cover border-2 border-white/10 shadow-xl" 
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center shadow-xl">
                <span className="text-3xl font-bold text-zinc-500 uppercase">
                  {client.business_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
            
            <div className="text-center">
              <SheetTitle className="text-2xl font-bold text-white">{client.business_name}</SheetTitle>
              <SheetDescription className="text-zinc-400 mt-2">
                24/7 Digital Concierge
              </SheetDescription>
            </div>
          </SheetHeader>

          {/* Action Buttons */}
          <div className="mt-10 space-y-4">
            
            {client.website_link && (
              <a href={client.website_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                <div className="bg-green-500/10 p-2 rounded-lg text-green-400 group-hover:bg-green-500/20 transition-colors">
                  🌐
                </div>
                <span className="font-medium">Visit Website</span>
              </a>
            )}

            {client.instagram_link && (
              <a href={client.instagram_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                <div className="bg-pink-500/10 p-2 rounded-lg text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                  📸
                </div>
                <span className="font-medium">Instagram</span>
              </a>
            )}

            {client.facebook_link && (
              <a href={client.facebook_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  👍
                </div>
                <span className="font-medium">Facebook</span>
              </a>
            )}

            {client.yelp_link && (
              <a href={client.yelp_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                <div className="bg-red-500/10 p-2 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors">
                  ⭐
                </div>
                <span className="font-medium">Read Reviews</span>
              </a>
            )}

          </div>
        </SheetContent>
          </Sheet>
        </header>

        <header className="hidden lg:flex items-center p-6 bg-zinc-950 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg leading-none">Application Assistant</h2>
            <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: client.primary_color || '#ea580c' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: client.primary_color || '#ea580c' }}></span>
              Online & Ready
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] shadow-md text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'rounded-tr-sm text-white' 
                    : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                }`}
                style={msg.role === 'user' ? { backgroundColor: client.primary_color || '#ea580c' } : {}}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-zinc-950 border-t border-white/10 shrink-0 pb-safe">
          <form onSubmit={handleSendMessage} className="relative flex items-center max-w-2xl mx-auto">
            <input 
              type="text" 
              placeholder="Type your answer..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-full py-3.5 pl-5 pr-14 text-white text-[15px] focus:ring-1 outline-none transition-shadow"
              style={{ '--tw-ring-color': client.primary_color || '#ea580c' }}
            />
            <button 
              type="submit"
              disabled={!chatInput.trim()}
              className="absolute right-1.5 p-2.5 rounded-full text-white transition-transform active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: client.primary_color || '#ea580c' }}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium uppercase tracking-widest">
            Powered by Sun City Connect
          </p>
        </div>

      </section>
    </main>
  );
}