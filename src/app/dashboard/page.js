'use client'; 
import { useEffect, useState } from 'react'; 
import { createClient } from '@supabase/supabase-js'; 
import { Lock, ArrowRight, LayoutDashboard, Settings, Phone, Flame, Mail, Clock, MessageSquare, Smartphone, Link as LinkIcon, Menu, LogOut, CreditCard, Search, Sparkles, Library, BrainCircuit, Globe, Pen, Calendar as CalendarIcon, User, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; 
import { Badge } from "@/components/ui/badge"; 
import { Skeleton } from "@/components/ui/skeleton"; 
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";  
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; 
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'; 
import { useRouter } from 'next/navigation'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; 
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey); 

export default function PremiumLeadDashboard() {   
  const [leads, setLeads] = useState([]);   
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);   
  const [selectedLead, setSelectedLead] = useState(null);   
  const [searchTerm, setSearchTerm] = useState('');   
  const [userProfile, setUserProfile] = useState(null);   
  const [clientData, setClientData] = useState(null);
  const [userId, setUserId] = useState(null);   
  const [isSubscribed, setIsSubscribed] = useState(false);   
  const [isBotActive, setIsBotActive] = useState(true);   
  const [clientDomain, setClientDomain] = useState('');   
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'calendar'
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();   

  const handleLogout = async () => {     
    await supabase.auth.signOut();     
    router.push('/login');   
  };   

  const toggleBot = async () => {     
    const newState = !isBotActive;     
    setIsBotActive(newState);          
    const { data: { session } } = await supabase.auth.getSession();     
    if (session) {       
      const { error } = await supabase         
        .from('clients')         
        .update({ is_bot_active: newState })         
        .eq('user_id', session.user.id);                
      if (error) {         
        console.error("Error toggling bot status:", error);         
        setIsBotActive(!newState);       
      }     
    }   
  };   

  const cancelAppointment = async (apptId) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', apptId);

    if (!error) {
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'cancelled' } : a));
    }
  };

  useEffect(() => {     
    async function checkAuthAndFetchData() {       
      const { data: { session } } = await supabase.auth.getSession();              
      if (!session) {         
        router.push('/login');         
        return;        
      }       
      setUserProfile(session.user.user_metadata);       
      setUserId(session.user.id);       

      // Pull down complete client branding layer, logo configurations, and settings
      const { data: fetchedClient } = await supabase         
        .from('clients')         
        .select('is_bot_active, is_subscribed, business_name, ig_account_id, logo_url, custom_domain')         
        .eq('user_id', session.user.id)         
        .maybeSingle();                

      if (fetchedClient) {
    setClientData(fetchedClient);
    if (fetchedClient.is_bot_active !== null) setIsBotActive(fetchedClient.is_bot_active);
    if (fetchedClient.is_subscribed !== null) setIsSubscribed(fetchedClient.is_subscribed);

    // 1. Check if the business name is missing FIRST!
    if (!fetchedClient.business_name) {
        router.push('/dashboard/onboarding');
        return;
    }

    // 2. NOW it is safe to do the string math since we know it exists
    const domainSlug = fetchedClient.custom_domain || fetchedClient.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setClientDomain(domainSlug);
    
} else {
    // FIX: Automatically create a missing client profile row for OAuth users
    const defaultName = session.user.email ? session.user.email.split('@')[0] : 'My Business';
    await supabase.from('clients').insert([{
        user_id: session.user.id,
        business_name: defaultName,
        custom_prompt: 'You are a friendly, professional AI receptionist for this business.',
        is_active: true,
        is_bot_active: false,
        is_subscribed: false,
        industry: 'local',
        timezone: 'America/Denver'
    }]);

    router.push('/dashboard/onboarding');
    return;
}
      // Fetch CRM Leads Stream
      let leadsQuery = supabase         
        .from('b2b_inbox')         
        .select('ig_username, extracted_data, created_at, incoming_message, ai_reply, platform, lead_source, status')         
        .not('extracted_data', 'is', null)         
        .order('created_at', { ascending: false });       

      if (fetchedClient.ig_account_id) {         
        leadsQuery = leadsQuery.or(`user_id.eq.${session.user.id},business_ig_id.eq.${fetchedClient.ig_account_id}`);       
      } else {         
        leadsQuery = leadsQuery.eq('user_id', session.user.id);       
      }       
      const { data: leadsData } = await leadsQuery;       
      if (leadsData) setLeads(leadsData);       

      // Fetch AI Calendar Bookings Data Engine
      const { data: apptsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', session.user.id)
        .order('appointment_time', { ascending: true });
      if (apptsData) setAppointments(apptsData);


      // Catch the Stripe success redirect
      if (window.location.search.includes('success=true')) {
          setShowWelcome(true);
          // Silently clean the URL so the popup doesn't keep showing if they refresh the page
          window.history.replaceState(null, '', '/dashboard');
  }

      

      setLoading(false);     
    }          
    checkAuthAndFetchData();   
  }, [router]);   

  const hotLeadsCount = leads.filter(l => l.extracted_data?.status === 'Hot').length;   
  const numbersCaught = leads.filter(l => l.extracted_data?.phone && l.extracted_data.phone !== 'Pending').length;   
  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';   

  const pipelineData = [     
    { name: 'Hot Leads', value: hotLeadsCount, color: '#f92516' },      
    { name: 'Warm Leads', value: leads.filter(l => l.extracted_data?.status === 'Warm').length, color: '#e0c61b' },      
    { name: 'Cold Leads', value: leads.filter(l => l.extracted_data?.status === 'Cold').length, color: '#0808fa' },    
  ].filter(item => item.value > 0);    

  const filteredLeads = leads.filter(l => {     
    if (!searchTerm) return true;     
    const search = searchTerm.toLowerCase();     
    const handle = l.ig_username?.toLowerCase() || '';     
    const email = l.extracted_data?.email?.toLowerCase() || '';     
    return handle.includes(search) || email.includes(search);   
  });   

  return (     
    <>           
      {!loading && !isSubscribed && (   
        <div className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-4 transition-all duration-500">     
          <Card className="max-w-md w-full bg-zinc-900 border-orange-500/40 shadow-[0_0_50px_rgba(249,115,22,0.2)] text-center p-8 text-white">       
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">         
              <Lock className="w-8 h-8 text-orange-500 animate-pulse" />       
            </div>       
            <h2 className="text-3xl font-black tracking-tight mb-2">Workspace Locked</h2>       
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">         
              Your account is verified, but your digital real estate is inactive. Complete your plan registration to unlock your CRM, train your custom AI core, and launch your public storefront.       
            </p>              
            <div className="space-y-4">         
              <a href={`https://buy.stripe.com/4gM8wI6zGbaU8qKaUY7Vm03?client_reference_id=${userId}`} target="_blank" rel="noopener noreferrer" className="block w-full">           
                <Button className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-base rounded-xl transition-all shadow-lg shadow-orange-500/20">             
                  Activate Subscription Plan <ArrowRight className="w-5 h-5 ml-2" />           
                </Button>         
              </a>                  
              <Button variant="ghost" onClick={handleLogout} className="w-full text-zinc-500 hover:text-zinc-300 text-xs font-semibold">             
                Disconnect Account           
              </Button>       
            </div>     
          </Card>   
        </div>       
      )}
      {/* THE POST-PAYMENT WELCOME TOUR MODAL */}
      {showWelcome && (
          <div className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
              <Card className="max-w-lg w-full bg-zinc-900 border-orange-500/50 shadow-[0_0_80px_rgba(249,115,22,0.3)] p-8 text-center relative overflow-hidden">
                  <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-orange-500/20 blur-[80px] rounded-full pointer-events-none" />
                  
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10">
                      <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  
                  <h2 className="text-3xl font-black text-white tracking-tight mb-3 relative z-10">Welcome to the inside.</h2>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-8 relative z-10">
                      Your subscription is active and your AI is officially online. Here is how to get the most out of your new command center:
                  </p>
                  
                  <div className="space-y-4 text-left mb-8 relative z-10">
                      <div className="flex gap-4 items-start bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5"><BrainCircuit className="w-4 h-4 text-purple-400" /></div>
                          <div><div className="text-white font-bold text-sm">1. Train the Brain</div><div className="text-xs text-zinc-500 mt-1">Upload your menus, pricing, and rules so the AI knows how to sell your services.</div></div>
                      </div>
                      <div className="flex gap-4 items-start bg-zinc-950/50 p-4 rounded-xl border border-white/5">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5"><Globe className="w-4 h-4 text-green-400" /></div>
                          <div><div className="text-white font-bold text-sm">2. Check Your Storefront</div><div className="text-xs text-zinc-500 mt-1">Your custom booking link is live. Add it to your Instagram bio immediately.</div></div>
                      </div>
                  </div>
                  
                  <Button onClick={() => setShowWelcome(false)} className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold text-base rounded-xl transition-all relative z-10">
                      Let's Go <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
              </Card>
          </div>
      )}

      <div className="dark min-h-screen p-4 md:p-8 pt-8 md:pt-12 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}>         
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">                      
          
          {/* Header Section */}           
          <div className="flex items-center justify-between mb-6 md:mb-10">             
            <div className="flex items-center gap-3 md:gap-6">               
              <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-10 md:h-16 w-auto drop-shadow-lg" />               
              <div>                 
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white capitalize">                   
                  {clientData?.business_name ? `${clientData.business_name}` : "Dashboard"}                 
                </h1>                 
                <p className="text-zinc-400 mt-1 text-sm md:text-lg">Real-time pipeline intelligence and AI chat logs.</p>               
              </div>             </div>             
            
            <div className="flex items-center gap-4">                               
              {userProfile && (                 
                <div className="hidden sm:flex items-center gap-4">                   
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-zinc-800 shadow-lg bg-zinc-900">                     
                    {clientData?.logo_url ? (
                      <AvatarImage src={clientData.logo_url} alt={clientData.business_name} className="object-cover" />
                    ) : (
                      <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name} />
                    )}                     
                    <AvatarFallback className="bg-orange-500 text-white font-bold">                       
                      {getInitials(clientData?.business_name || userProfile.full_name)}                     
                    </AvatarFallback>                   
                  </Avatar>                   
                  <Button onClick={handleLogout} variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">                     
                    <LogOut className="h-5 w-5" />                   
                  </Button>                 
                </div>               
              )}               
              
              <Sheet>                 
                <SheetTrigger asChild>                   
                  <Button variant="outline" className="bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white transition-all px-3 md:px-4">                     
                    <Menu className="h-5 w-5 md:mr-2" /> <span className="hidden md:inline">Menu</span>                   
                  </Button>                 
                </SheetTrigger>                 
                <SheetContent side="right" className="bg-zinc-950/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-2xl">                   
                  <SheetHeader className="text-left mt-6 mb-8">                     
                    <SheetTitle className="text-2xl font-black text-white">Account Menu</SheetTitle>                     
                    <SheetDescription className="text-zinc-400">Manage your agency settings and membership.</SheetDescription>                   
                  </SheetHeader>                   
                  <div className="flex flex-col gap-4 flex-1">                                          
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/10">                       
                      <div className="flex flex-col">                         
                        <span className="text-white font-bold flex items-center gap-2">                           
                          <Flame className={`w-4 h-4 ${isBotActive ? 'text-orange-500' : 'text-zinc-500'}`} />                           
                          AI Sales Bot                         
                        </span>                         
                        <span className="text-zinc-400 text-xs mt-1">Pause all automated replies.</span>                       
                      </div>                       
                      <button onClick={toggleBot} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${isBotActive ? 'bg-orange-500' : 'bg-zinc-700'}`}>                         
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBotActive ? 'translate-x-6' : 'translate-x-1'}`} />                       
                      </button>                     
                    </div>                     
                    <a href="/dashboard/brain">                       
                      <Button variant="outline" className="w-full justify-start h-14 bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white transition-all text-base">                         
                        <BrainCircuit className="w-5 h-5 mr-3 text-purple-400" /> Configure AI Brain                       
                      </Button>                     
                    </a>                     
                    <a href="/dashboard/marketing">                       
                      <Button variant="outline" className="w-full justify-start h-14 bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white transition-all text-base">                         
                        <Sparkles className="w-5 h-5 mr-3 text-orange-500" /> AI Social Manager                       
                      </Button>                     
                    </a>                     
                    <a href="/dashboard/library">                       
                      <Button variant="outline" className="w-full justify-start h-14 bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white transition-all text-base">                         
                        <Library className="w-5 h-5 mr-3 text-blue-400" /> Campaign Vault                       
                      </Button>                     
                    </a>                     
                    <a 
  href={isSubscribed ? "https://billing.stripe.com/p/login/5kQ00c5vC1AkfTc3sw7Vm01" : `https://buy.stripe.com/4gM8wI6zGbaU8qKaUY7Vm03?client_reference_id=${userId}`} 
  target="_blank" 
  rel="noopener noreferrer"
>
  <Button variant="outline" className="w-full justify-start h-14 bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white transition-all text-base">
    <CreditCard className="w-5 h-5 mr-3 text-green-400" /> {isSubscribed ? "Manage Membership" : "Upgrade Membership"} 
  </Button>
</a>                    
                    <div className="pb-6">                       
                      <Button onClick={handleLogout} variant="destructive" className="w-full justify-start h-14 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-base">                         
                        <LogOut className="w-5 h-5 mr-3" /> Sign Out                       
                      </Button>                     
                    </div>                   
                  </div>                 
                </SheetContent>               
              </Sheet>             
            </div>           
          </div>                      
          
          {/* Storefront Control Bar */}           
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-900/50 border border-white/10 rounded-2xl p-5 mb-6 shadow-lg">             
            <div className="flex items-center gap-4 mb-4 sm:mb-0">               
              <div className="bg-green-500/10 p-3 rounded-full border border-green-500/20">                 
                <Globe className="w-6 h-6 text-green-400" />               
              </div>               
              <div>                 
                <h3 className="text-white font-black text-lg">Your Website is Live</h3>                 
                <p className="text-zinc-400 text-sm">suncityconnect.com/sites/{clientDomain}</p>               
              </div>             
            </div>                          
            <div className="flex items-center gap-3 w-full sm:w-auto">               
              <a href={`/sites/${clientDomain}`} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">                 
                <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold shadow-lg shadow-white/10">                   
                  View Storefront <ArrowRight className="w-4 h-4 ml-2" />                 
                </Button>               
              </a>               
              <Button variant="outline" onClick={() => router.push('/dashboard/settings')} className="flex-1 sm:flex-none border-white/10 text-white hover:bg-white/10">                 
                <Pen className="w-4 h-4 mr-2" /> Quick Edit               
              </Button>           
            </div>           
          </div>                      
          
          {/* Top Metric Cards */}           
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">             
            <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl">               
              <CardHeader className="flex flex-row items-center justify-between pb-2">                 
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Hot Leads</CardTitle>                 
                <Flame className="h-5 w-5 text-orange-500" />               
              </CardHeader>               
              <CardContent>                 
                <div className="text-4xl font-black text-white">{loading ? <Skeleton className="h-10 w-16 bg-white/10" /> : hotLeadsCount}</div>               
              </CardContent>             
            </Card>             
            <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl">               
              <CardHeader className="flex flex-row items-center justify-between pb-2">                 
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Appointments Booked</CardTitle>                 
                <CalendarIcon className="h-5 w-5 text-blue-400" />               
              </CardHeader>               
              <CardContent>                 
                <div className="text-4xl font-black text-white">{loading ? <Skeleton className="h-10 w-16 bg-white/10" /> : appointments.filter(a => a.status === 'confirmed').length}</div>               
              </CardContent>             
            </Card>             
            <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl">               
              <CardHeader className="flex flex-row items-center justify-between pb-2">                 
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Emails Captured</CardTitle>                 
                <Mail className="h-5 w-5 text-green-400" />               
              </CardHeader>               
              <CardContent>                 
                <div className="text-4xl font-black text-white">                   
                  {loading ? <Skeleton className="h-10 w-16 bg-white/10" /> : leads.filter(l => l.extracted_data?.email && l.extracted_data.email !== 'Pending').length}                 
                </div>               
              </CardContent>             
            </Card>           
          </div>           
          
          {/* Main Layout Grid Split */}           
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">             
            <div className="lg:col-span-1 flex flex-col gap-6">               
              <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl">                 
                <CardHeader className="pb-2">                   
                  <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Pipeline Health</CardTitle>                 
                </CardHeader>                 
                <CardContent className="h-[220px] flex items-center justify-center">                   
                  {loading || leads.length === 0 ? (                     
                    <Skeleton className="h-32 w-32 rounded-full bg-white/10" />                   
                  ) : (                     
                    <ResponsiveContainer width="100%" height="100%">                       
                      <PieChart>                         
                        <Pie data={pipelineData} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">                           
                          {pipelineData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}                         
                        </Pie>                         
                        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', borderColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />                       
                      </PieChart>                     
                    </ResponsiveContainer>                   
                  )}                 
                </CardContent>               
              </Card>               
              <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl">                 
                <CardHeader className="pb-0">                   
                  <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Active Platforms</CardTitle>                 
                </CardHeader>                 
                <CardContent className="h-[180px] pt-4">                   
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-white/5">
                      <div className="flex items-center gap-2 text-white text-sm font-medium">
                        <Globe className="w-4 h-4 text-green-400" /> Website Storefront
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-none">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-white/5 opacity-50">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                        <Smartphone className="w-4 h-4 text-pink-400" /> Instagram Bot
                      </div>
                      <Badge variant="outline" className="text-zinc-500 border-zinc-700">Sandbox</Badge>
                    </div>
                  </div>
                </CardContent>               
              </Card>             
            </div>             
            
            {/* Main Interactive Panel Space */}             
            <div className="lg:col-span-3">               
              <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden h-full flex flex-col">                 
                
                {/* Clean Tab Selector Bar */}
                <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5">                   
                  <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveTab('leads')}
                      className={`h-9 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'leads' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" /> Leads Pipeline
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveTab('calendar')}
                      className={`h-9 px-4 rounded-lg text-sm font-bold transition-all ${activeTab === 'calendar' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" /> Booking Calendar
                    </Button>
                  </div>

                  {activeTab === 'leads' && (
                    <div className="relative w-full sm:w-64 animate-in fade-in duration-200">                     
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />                     
                      <Input                       
                        placeholder="Search handles or emails..."                       
                        className="pl-9 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-orange-500/50 h-9"                       
                        value={searchTerm}                       
                        onChange={(e) => setSearchTerm(e.target.value)} />                   
                    </div>
                  )}                 
                </div>                 
                
                <div className="flex-1 overflow-auto max-h-[600px] min-h-[400px]">                   
                  
                  {/* TAB 1: CRM LEADS TIMELINE */}
                  {activeTab === 'leads' && (
                    <Table className="animate-in fade-in duration-200">                     
                      <TableHeader className="bg-white/5 border-b border-white/10 sticky top-0 z-10 backdrop-blur-md">                       
                        <TableRow className="hover:bg-transparent border-transparent">                         
                          <TableHead className="font-semibold text-zinc-300 py-5">Lead Identity</TableHead>                         
                          <TableHead className="font-semibold text-zinc-300">Intent</TableHead>                         
                          <TableHead className="font-semibold text-zinc-300">Contact Data</TableHead>                         
                          <TableHead className="font-semibold text-zinc-300">Target Action</TableHead>                         
                          <TableHead className="font-semibold text-zinc-300 text-right">Status</TableHead>                       
                        </TableRow>                     
                      </TableHeader>                     
                      <TableBody>                       
                        {loading ? (                         
                          Array.from({ length: 4 }).map((_, i) => (                           
                            <TableRow key={i} className="border-white/5">                             
                              <TableCell><Skeleton className="h-10 w-32 bg-white/5" /></TableCell>                             
                              <TableCell><Skeleton className="h-5 w-24 bg-white/5" /></TableCell>                             
                              <TableCell><Skeleton className="h-8 w-32 bg-white/5" /></TableCell>                             
                              <TableCell><Skeleton className="h-5 w-20 bg-white/5" /></TableCell>                             
                              <TableCell className="text-right"><Skeleton className="h-6 w-16 bg-white/5 ml-auto" /></TableCell>                           
                            </TableRow>                         
                          ))                       ) : filteredLeads.length === 0 ? (                         
                          <TableRow>                           
                            <TableCell colSpan={5} className="text-center py-10 text-zinc-500">                             
                              No leads found matching "{searchTerm}"                           
                            </TableCell>                         
                          </TableRow>                       ) : filteredLeads.map((lead, i) => {                         
                          const data = lead.extracted_data || {};                         
                          return (                           
                            <TableRow                             
                              key={i}                             
                              className="border-white/5 hover:bg-white/5 transition-all cursor-pointer group"                             
                              onClick={() => setSelectedLead(lead)}                           
                            >                             
                              <TableCell className="font-medium text-white flex items-center gap-3 py-4">                               
                                <Avatar className="h-10 w-10 border-2 border-white/10 shadow-md group-hover:border-orange-500/50 transition-colors">                                 
                                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.ig_username}&backgroundColor=ea580c&textColor=ffffff`} />                                 
                                  <AvatarFallback className="text-xs bg-zinc-800 text-zinc-300">{getInitials(lead.ig_username)}</AvatarFallback>                               
                                </Avatar>                               
                                <div>
                                  <div className="text-white font-bold">@{lead.ig_username}</div>
                                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                    {new Date(lead.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>                             
                              </TableCell>                             
                              <TableCell className="text-zinc-300 capitalize font-medium">{data.intent || 'Unknown'}</TableCell>                             
                              <TableCell>                               
                                <div className="flex flex-col gap-2">                                 
                                  {data.phone !== 'Pending' && <Badge variant="outline" className="w-fit bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md"><Phone className="w-3 h-3 mr-1.5" /> {data.phone}</Badge>}                                 
                                  {data.email !== 'Pending' && <Badge variant="outline" className="w-fit bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-md"><Mail className="w-3 h-3 mr-1.5" /> {data.email}</Badge>}                                 
                                  {data.phone === 'Pending' && data.email === 'Pending' && <span className="text-sm text-zinc-500 italic">Pending</span>}                               
                                </div>                             
                              </TableCell>                             
                              <TableCell className="text-zinc-400">                               
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-zinc-500 shrink-0" /> 
                                  <span className="truncate max-w-[140px]">{data.timeline || 'Pending'}</span>
                                </div>                             
                              </TableCell>                             
                              <TableCell className="text-right">       
                                <Badge variant="secondary" className={`${lead.status === 'escalated' ? 'bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] border-red-500/50' : data.status === 'Hot' ? 'bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : data.status === 'Warm' ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-zinc-400'} border-transparent px-3 py-1 text-xs`}>         
                                  {lead.status === 'escalated' ? 'Escalated' : data.status || 'Cold'}       
                                </Badge>     
                              </TableCell>                           
                            </TableRow>                         
                          );                       
                        })}                     
                      </TableBody>                   
                    </Table>
                  )}

                  {/* TAB 2: NATIVE AI SCHEDULER VIEW */}
                  {activeTab === 'calendar' && (
                    <div className="p-6 space-y-4 animate-in fade-in duration-200">
                      {appointments.length === 0 ? (
                        <div className="text-center py-20 text-zinc-500 flex flex-col items-center justify-center gap-2 bg-zinc-900/10 rounded-xl border border-dashed border-white/5">
                          <CalendarIcon className="w-10 h-10 opacity-30 text-orange-500 mb-2" />
                          <h4 className="font-bold text-white">No Appointments Scheduled Yet</h4>
                          <p className="text-sm text-zinc-400 max-w-xs">When the AI core schedules consultations or bookings via storefront chat, they'll sync right here.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {appointments.map((appt) => {
                            const dateObj = new Date(appt.appointment_time);
                            const isCancelled = appt.status === 'cancelled';
                            return (
                              <div 
                                key={appt.id} 
                                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-4 ${isCancelled ? 'bg-zinc-900/20 border-white/5 opacity-40' : 'bg-zinc-900/60 border-white/10 shadow-lg hover:border-orange-500/30'}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className={`font-black text-base tracking-tight ${isCancelled ? 'line-through text-zinc-500' : 'text-white'}`}>{appt.customer_name}</h4>
                                      <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider px-2 border-none ${isCancelled ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                        {appt.status}
                                      </Badge>
                                    </div>
                                    <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                                      <Mail className="w-3 h-3 text-zinc-500" /> {appt.customer_email || 'No email provided'}
                                    </p>
                                    <p className="text-zinc-400 text-xs font-medium bg-white/5 border border-white/5 px-2 py-0.5 rounded w-fit capitalize mt-2">
                                      {appt.service_type || 'General Booking'}
                                    </p>
                                  </div>

                                  <div className="text-center shrink-0 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-orange-400 min-w-[75px] shadow-inner">
  <div className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-0.5">{dateObj.toLocaleString([], { weekday: 'short' })}</div>
  <div className="text-xl font-black tracking-tighter leading-none my-1">{dateObj.toLocaleString([], { month: 'short', day: 'numeric' }).toUpperCase()}</div>
  <div className="text-[10px] font-bold font-mono bg-orange-500/20 py-0.5 px-1.5 rounded mt-1">{dateObj.toLocaleString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
</div>
                                </div>

                                {!isCancelled && (
                                  <div className="border-t border-white/5 pt-3 flex justify-end">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => cancelAppointment(appt.id)}
                                      className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 font-bold text-xs"
                                    >
                                      <X className="w-3.5 h-3.5 mr-1" /> Cancel Appointment
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>               
              </Card>             
            </div>           
          </div>         
        </div>       
      </div>       
      
      {/* Selected Lead Chat Log Sheet */}       
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>         
        <SheetContent className="w-full sm:max-w-md bg-zinc-950/90 backdrop-blur-3xl border-l border-white/10 p-0 flex flex-col shadow-2xl">           
          <SheetHeader className="p-6 border-b border-white/5 bg-black/20">             
            <SheetTitle className="flex items-center justify-between text-xl text-white">               
              <div className="flex items-center gap-3">                 
                <Avatar className="h-10 w-10 border border-white/20">                   
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedLead?.ig_username}&backgroundColor=ea580c&textColor=ffffff`} />                   
                  <AvatarFallback className="bg-zinc-800">{getInitials(selectedLead?.ig_username)}</AvatarFallback>                 
                </Avatar>                 
                @{selectedLead?.ig_username}               
              </div>             
            </SheetTitle>             
            <SheetDescription className="text-zinc-400 mt-2">               
              Live conversation logged by the AI Sales Assistant.             
            </SheetDescription>             
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 text-sm text-zinc-400">               
              <LinkIcon className="h-4 w-4" />               
              <span>Source: <span className="text-zinc-300 font-medium">{selectedLead?.lead_source || 'Direct Message'}</span> on {selectedLead?.platform || 'Website'}</span>             
            </div>           
          </SheetHeader>           
          <ScrollArea className="flex-1 p-6">             
            <div className="flex flex-col gap-6">               
              <div className="flex flex-col gap-1.5 items-start w-[85%]">                 
                <span className="text-xs font-bold text-zinc-500 ml-1 uppercase tracking-wider">Customer</span>                 
                <div className="bg-white/10 border border-white/5 backdrop-blur-md text-zinc-100 p-4 rounded-2xl rounded-tl-sm shadow-sm">                   
                  <p className="text-sm leading-relaxed">{selectedLead?.incoming_message}</p>                 
                </div>               
              </div>               
              <div className="flex flex-col gap-1.5 items-end w-[85%] self-end">                 
                <span className="text-xs font-bold text-orange-500 mr-1 uppercase tracking-wider">AI Assistant</span>                 
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-[0_4px_20px_rgba(249,115,22,0.3)]">                   
                  <p className="text-sm leading-relaxed">{selectedLead?.ai_reply}</p>                 
                </div>               
              </div>             
            </div>           
          </ScrollArea>         
        </SheetContent>       
      </Sheet>     
    </>   
  ); 
}