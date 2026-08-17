'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Send, Info, Loader2, Globe, AtSign, ThumbsUp, Star, ArrowLeft, Calendar as CalendarIcon, Clock, User, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- NATIVE BOOKING WIDGET COMPONENT ---
function BookingWidget({ userId, businessName, primaryColor, onSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '' });

  const availableDates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];

  const handleBooking = async (e) => {
    e.preventDefault();
    setLoading(true);

    const timeString = selectedTime.match(/(\d+):(\d+)\s(AM|PM)/);
    let hours = parseInt(timeString[1]);
    if (timeString[3] === 'PM' && hours < 12) hours += 12;
    if (timeString[3] === 'AM' && hours === 12) hours = 0;
    
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hours, 0, 0, 0);

    try {
      // Send the data securely to our backend to handle DB and Emails
      const response = await fetch('/api/widget-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          businessName: businessName,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          appointmentTime: appointmentDate.toISOString()
        })
      });

      if (response.ok) {
        setStep(3); // Show Success Screen
      } else {
        alert("Something went wrong with the booking. Please try again.");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-white p-6">
      <div className="text-center pb-6 border-b border-white/10 mb-6 mt-4">
        <h3 className="text-2xl font-black">Book an Appointment</h3>
        <p className="text-zinc-400 text-sm mt-1">Schedule a time with {businessName}</p>
      </div>
      
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Select a Day
            </h4>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x scrollbar-hide">
              {availableDates.map((date, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`snap-start shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border transition-all ${selectedDate === date ? 'text-white shadow-lg' : 'bg-zinc-900 border-white/10 hover:border-white/30 text-zinc-300'}`}
                  style={selectedDate === date ? { backgroundColor: primaryColor || '#ea580c', borderColor: primaryColor || '#ea580c' } : {}}
                >
                  <span className="text-[10px] uppercase font-bold opacity-80">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-xl font-black mt-1">{date.getDate()}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div className="animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Select a Time
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((time, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedTime(time);
                      setStep(2);
                    }}
                    className="p-3 rounded-lg border border-white/10 text-sm font-bold bg-zinc-900 hover:text-white transition-all"
                    style={{ '--tw-hover-bg': primaryColor || '#ea580c' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor || '#ea580c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleBooking} className="space-y-5 animate-in slide-in-from-right-4">
          <div className="bg-zinc-900 p-4 rounded-xl flex flex-col gap-2 border border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-500">Selected Time</span>
              <button type="button" onClick={() => setStep(1)} className="text-xs underline text-zinc-400 hover:text-white">Change</button>
            </div>
            <div className="font-bold flex items-center gap-2" style={{ color: primaryColor || '#ea580c' }}>
              <CalendarIcon className="w-4 h-4" />
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} @ {selectedTime}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input required placeholder="Full Name" className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl outline-none focus:border-white/30 text-sm" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input required type="email" placeholder="Email Address" className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl outline-none focus:border-white/30 text-sm" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
              <input type="tel" placeholder="Phone Number (Optional)" className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl outline-none focus:border-white/30 text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold text-white mt-4 transition-transform active:scale-95" style={{ backgroundColor: primaryColor || '#ea580c' }}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Booking"} 
          </Button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-12 animate-in zoom-in-95 space-y-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-3xl font-black">You're Booked!</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            We've locked in your time for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {selectedTime}. We'll see you then!
          </p>
          <Button variant="outline" onClick={() => { setStep(1); if(onSuccess) onSuccess(); }} className="mt-8 border-white/10 bg-zinc-900 text-white hover:bg-zinc-800 h-11 px-8 rounded-xl">
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

// --- MAIN STOREFRONT COMPONENT ---
export default function MasterTemplate() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [visitorId] = useState(() => Math.random().toString(36).substring(7));
  const [isMobileBookingOpen, setIsMobileBookingOpen] = useState(false);
  
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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
        .select('id, user_id, business_name, custom_prompt, pdf_knowledge, logo_url, instagram_link, facebook_link, website_link, yelp_link, primary_color')
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
    resetTextareaHeight();
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

        <div className="mt-10 mb-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="w-full h-14 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] rounded-xl" style={{ backgroundColor: client.primary_color || '#ea580c' }}>
                <CalendarIcon className="w-5 h-5 mr-2" /> Book Appointment
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-zinc-950 border-r border-white/10 text-white p-0 w-full sm:max-w-md overflow-y-auto">
              <BookingWidget userId={client.user_id} businessName={client.business_name} primaryColor={client.primary_color} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
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
            {client.logo_url && <img src={client.logo_url} alt="Logo" className="h-9 w-9 rounded-full object-cover border border-white/10" />}
            <div>
              <h2 className="text-white font-bold text-sm leading-none">{client.business_name}</h2>
              <p className="text-xs mt-1 flex items-center gap-1.5 opacity-80" style={{ color: client.primary_color || '#ea580c' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: client.primary_color || '#ea580c' }}></span>
                Live Agent
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Sheet open={isMobileBookingOpen} onOpenChange={setIsMobileBookingOpen}>
              <SheetTrigger asChild>
                <button 
                  className="px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                  style={{ backgroundColor: client.primary_color || '#ea580c' }}
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> Book
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-zinc-950 border-t border-white/10 text-white p-0 h-[90vh] overflow-hidden rounded-t-3xl flex flex-col">
                <div className="w-full flex justify-center pt-3 pb-1 shrink-0 bg-zinc-950">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <BookingWidget userId={client.user_id} businessName={client.business_name} primaryColor={client.primary_color} onSuccess={() => setIsMobileBookingOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                  <Info className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent className="bg-zinc-950 border-l border-white/10 text-white p-6 sm:max-w-md w-full overflow-y-auto">
                <SheetHeader className="space-y-6 flex flex-col items-center mt-8">
                  {client.logo_url ? (
                    <img src={client.logo_url} alt={client.business_name} className="w-24 h-24 rounded-full object-cover border-2 border-white/10 shadow-xl" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center shadow-xl">
                      <span className="text-3xl font-bold text-zinc-500 uppercase">{client.business_name?.charAt(0) || '?'}</span>
                    </div>
                  )}
                  <div className="text-center">
                    <SheetTitle className="text-2xl font-bold text-white">{client.business_name}</SheetTitle>
                    <SheetDescription className="text-zinc-400 mt-2">24/7 Digital Concierge</SheetDescription>
                  </div>
                </SheetHeader>
                <div className="mt-10 space-y-4">
                  {client.website_link && (
                    <a href={client.website_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                      <div className="bg-green-500/10 p-2 rounded-lg text-green-400 group-hover:bg-green-500/20 transition-colors"><Globe className="w-5 h-5" /></div>
                      <span className="font-medium">Visit Website</span>
                    </a>
                  )}
                  {client.instagram_link && (
                    <a href={client.instagram_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                      <div className="bg-pink-500/10 p-2 rounded-lg text-pink-400 group-hover:bg-pink-500/20 transition-colors"><AtSign className="w-5 h-5" /></div>
                      <span className="font-medium">Instagram</span>
                    </a>
                  )}
                  {client.facebook_link && (
                    <a href={client.facebook_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                      <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors"><ThumbsUp className="w-5 h-5" /></div>
                      <span className="font-medium">Facebook</span>
                    </a>
                  )}
                  {client.yelp_link && (
                    <a href={client.yelp_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 transition-colors w-full group">
                      <div className="bg-red-500/10 p-2 rounded-lg text-red-400 group-hover:bg-red-500/20 transition-colors"><Star className="w-5 h-5" /></div>
                      <span className="font-medium">Read Reviews</span>
                    </a>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 flex flex-col min-w-0">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] min-w-0 shadow-md text-[15px] leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere] ${
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

          {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="bg-zinc-800 text-zinc-400 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* CHAT INPUT FORM */}
        <div className="p-4 bg-zinc-950 border-t border-white/10 shrink-0 pb-safe">
          <form onSubmit={handleSendMessage} className="relative flex items-end max-w-2xl mx-auto gap-0">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type your answer..."
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                // Auto-grow the textarea as they type
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter adds a new line
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (chatInput.trim() && !isTyping) {
                    handleSendMessage(e);
                  }
                }
              }}
              className="w-full bg-zinc-900 border border-white/10 rounded-3xl py-3.5 pl-5 pr-14 text-white text-[15px] focus:ring-1 outline-none transition-shadow resize-none overflow-y-auto break-words whitespace-pre-wrap leading-relaxed max-h-[140px]"
              style={{ '--tw-ring-color': client.primary_color || '#ea580c' }}
            />
            <button 
              type="submit"
              disabled={!chatInput.trim() || isTyping}
              className="absolute right-1.5 bottom-1.5 p-2.5 rounded-full text-white transition-transform active:scale-95 disabled:opacity-50"
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