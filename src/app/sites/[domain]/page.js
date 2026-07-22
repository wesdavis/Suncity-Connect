'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Send, Info, Loader2, Globe, AtSign, ThumbsUp, Star, ArrowLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function MasterTemplate() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [visitorId] = useState(() => Math.random().toString(36).substring(7));
  
  // Ref for auto-scrolling
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom whenever messages change or typing status triggers
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    async function fetchClientData() {
      const currentDomain = params?.domain;
      if (!currentDomain) return;

      const { data, error } = await supabase
        .from('clients')
        .select('id, business_name, custom_prompt, pdf_knowledge, logo_url, instagram_link, facebook_link, website_link, yelp_link, primary_color')
        .eq('custom_domain', currentDomain)
        .single();

      if (error || !data) {
        console.error("Client not found for domain:", currentDomain);
        setLoading(false);
        return;
      }

      setClient(data);
      document.title = `${data.business_name} | AI Assistant`;
      setMessages([
        { role: 'ai', text: `Hi! I'm the digital assistant for ${data.business_name}. How can I help you today?` }
      ]);
      setLoading(false);
    }

    fetchClientData();
  }, [params?.domain]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
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

      setMessages(prev => [
        ...prev,
        { role: 'ai', text: data.reply || data.error || "I hit a glitch. Please try again." }
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: "System connection lost. Please try again." }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Polished 404 State
  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-4 text-center">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-4">
          <h1 className="text-2xl font-bold">Storefront Not Found</h1>
          <p className="text-zinc-400 text-sm">
            The business storefront you are looking for does not exist or has been moved.
          </p>
          <Button 
            onClick={() => router.push('/')} 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-dvh w-full overflow-hidden bg-zinc-950 font-sans selection:bg-white/20">
      
      {/* LEFT SIDE: DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-[350px] lg:w-[400px] bg-zinc-950 border-r border-white/10 p-8 shrink-0 overflow-y-auto relative z-10">
        <div className="flex flex-col items-center mt-8 space-y-6">
          {client.logo_url ? (
            <img 
              src={client.logo_url} 
              alt={client.business_name} 
              className="w-32 h-32 rounded-full object-cover border-2 border-white/10 shadow-xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center shadow-xl">
              <span className="text-4xl font-bold text-zinc-500 uppercase">
                {client.business_name?.charAt(0) || '?'}
              </span>
            </div>
          )}

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">{client.business_name}</h1>
            <p className="text-zinc-400 text-sm">24/7 Digital Concierge</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 space-y-4">
          {client.website_link && (
            <a href={client.website_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
              <div className="bg-green-500/10 p-2 rounded-lg text-green-400 group-hover:bg-green-500/20 transition-colors">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-medium text-white">Visit Website</span>
            </a>
          )}
          {client.instagram_link && (
            <a href={client.instagram_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
              <div className="bg-pink-500/10 p-2 rounded-lg text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                <AtSign className="w-5 h-5" />
              </div>
              <span className="font-medium text-white">Instagram</span>
            </a>
          )}
          {client.facebook_link && (
            <a href={client.facebook_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <span className="font-medium text-white">Facebook</span>
            </a>
          )}
          {client.yelp_link && (
            <a href={client.yelp_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
              <div className="bg-red-500/10 p-2 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors">
                <Star className="w-5 h-5" />
              </div>
              <span className="font-medium text-white">Read Reviews</span>
            </a>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE / FULL MOBILE SCREEN: The AI Chat Interface */}
      <section className="flex flex-col w-full lg:flex-1 h-full relative bg-zinc-950">
        
        {/* MOBILE HEADER */}
        <header className="lg:hidden sticky top-0 flex items-center justify-between p-4 bg-zinc-950 border-b border-white/10 shrink-0 z-50 shadow-md">
          <div className="flex items-center gap-3">
            {client.logo_url && <img src={client.logo_url} alt="Logo" className="h-8 w-auto rounded-full" />}
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
            
            <SheetContent className="bg-zinc-950 border-l border-white/10 text-white p-6 sm:max-w-md w-full overflow-y-auto">
              <SheetHeader className="space-y-6 flex flex-col items-center mt-8">
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

              <div className="mt-10 space-y-4">
                {client.website_link && (
                  <a href={client.website_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                    <div className="bg-green-500/10 p-2 rounded-lg text-green-400 group-hover:bg-green-500/20 transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Visit Website</span>
                  </a>
                )}
                {client.instagram_link && (
                  <a href={client.instagram_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                    <div className="bg-pink-500/10 p-2 rounded-lg text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                      <AtSign className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Instagram</span>
                  </a>
                )}
                {client.facebook_link && (
                  <a href={client.facebook_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <ThumbsUp className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Facebook</span>
                  </a>
                )}
                {client.yelp_link && (
                  <a href={client.yelp_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                    <div className="bg-red-500/10 p-2 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors">
                      <Star className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Read Reviews</span>
                  </a>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* DESKTOP HEADER */}
        <header className="hidden lg:flex items-center p-6 bg-zinc-950 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg leading-none">Application Assistant</h2>
            <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: client.primary_color || '#ea580c' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: client.primary_color || '#ea580c' }}></span>
              Online & Ready
            </p>
          </div>
        </header>

        {/* CHAT MESSAGES STREAM */}
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

          {/* DEDICATED ANIMATED TYPING INDICATOR */}
          {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="bg-zinc-800 text-zinc-400 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          {/* Anchor element to force auto-scroll */}
          <div ref={chatEndRef} />
        </div>

        {/* CHAT INPUT FORM */}
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
              disabled={!chatInput.trim() || isTyping}
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