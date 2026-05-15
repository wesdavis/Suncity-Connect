
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
// ADDED: Menu, LogOut, CreditCard
import { Phone, Flame, Mail, Clock, MessageSquare, Instagram, Facebook, Link as LinkIcon, Menu, LogOut, CreditCard } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// ADDED: SheetTrigger
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useRouter } from 'next/navigation';
// ADDED: Button
import { Button } from "@/components/ui/button";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PremiumLeadDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  useEffect(() => {
    async function checkAuthAndFetchLeads() {
      // 1. THE BOUNCER: Check if the user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If they don't have a session, kick them to the login page immediately
        router.push('/login');
        return; 
      }

      // 2. If they are authenticated, fetch the leads
      const { data, error } = await supabase
        .from('b2b_inbox')
        .select('ig_username, extracted_data, created_at, incoming_message, ai_reply, platform, lead_source') // <-- Added columns here
        .not('extracted_data', 'is', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLeads(data);
      }
      setLoading(false);
    }
    
    checkAuthAndFetchLeads();
  }, [router]);

  const hotLeadsCount = leads.filter(l => l.extracted_data?.status === 'Hot').length;
  const numbersCaught = leads.filter(l => l.extracted_data?.phone && l.extracted_data.phone !== 'Pending').length;

  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';

  const pipelineData = [
    { name: 'Hot Leads', value: hotLeadsCount, color: '#f92516' }, 
    { name: 'Warm Leads', value: leads.filter(l => l.extracted_data?.status === 'Warm').length, color: '#e0c61b' }, 
    { name: 'Cold Leads', value: leads.filter(l => l.extracted_data?.status === 'Cold').length, color: '#0808fa' }, 
  ].filter(item => item.value > 0); 

  // DYNAMIC PLATFORM CALCULATOR
  const igCount = leads.filter(l => l.platform === 'Instagram').length;
  const fbCount = leads.filter(l => l.platform === 'Facebook').length;
  
  const platformData = [
    { name: 'Instagram', value: igCount, fill: '#cd8808' },
    { name: 'Facebook', value: fbCount, fill: '#3b82f6' }
  ].filter(item => item.value > 0); // Only show platforms that actually have leads

  return (
    // THE BACKGROUND: Custom image with a dark overlay to ensure text stays readable
    <div 
      className="dark min-h-screen p-8 pt-12 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section with Logo & Navigation */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-16 w-auto drop-shadow-lg" />
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">Wes's Dashboard</h1>
              <p className="text-zinc-400 mt-1 text-lg">Real-time pipeline intelligence and AI chat logs.</p>
            </div>
          </div>

          {/* NEW: Hamburger Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white transition-all">
                <Menu className="h-5 w-5 mr-2" /> Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-950/95 backdrop-blur-3xl border-l border-white/10 flex flex-col shadow-2xl">
              <SheetHeader className="text-left mt-6 mb-8">
                <SheetTitle className="text-2xl font-black text-white">Account Menu</SheetTitle>
                <SheetDescription className="text-zinc-400">
                  Manage your agency settings and membership.
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex flex-col gap-4 flex-1">
                {/* Stripe Portal Link */}
                <a href="https://billing.stripe.com/p/login/test_YOUR_LINK_HERE" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start h-14 bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 hover:text-white transition-all text-base">
                    <CreditCard className="w-5 h-5 mr-3 text-blue-400" /> Manage Membership
                  </Button>
                </a>
              </div>

              {/* Log Out Button pinned to the bottom */}
              <div className="pb-6">
                <Button 
                  onClick={handleLogout} 
                  variant="destructive" 
                  className="w-full justify-start h-14 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-base"
                >
                  <LogOut className="w-5 h-5 mr-3" /> Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Top Metric Cards - GLASSMORPHISM */}
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
              <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Numbers Captured</CardTitle>
              <Phone className="h-5 w-5 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white">{loading ? <Skeleton className="h-10 w-16 bg-white/10" /> : numbersCaught}</div>
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

        {/* MAIN LAYOUT: Left Column (Charts) | Right Column (Table) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT COLUMN: Visual Analytics */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Donut Chart */}
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

            {/* NEW: Traffic Source Bar Chart */}
            <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Traffic Source</CardTitle>
              </CardHeader>
              <CardContent className="h-[180px] pt-4">
                {loading ? (
                   <Skeleton className="h-full w-full bg-white/10" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {/* FIX 1: Removed the negative left margin, added right margin */}
                    <BarChart data={platformData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      {/* FIX 2: Added width={80} so the words have room to breathe */}
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#a1a1aa', fontSize: 12 }} 
                        width={80} 
                      />
                      <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: The Data Table */}
          <div className="lg:col-span-3">
            <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden h-full">
              <Table>
                <TableHeader className="bg-white/5 border-b border-white/10">
                  <TableRow className="hover:bg-transparent border-transparent">
                    <TableHead className="font-semibold text-zinc-300 py-5">Lead Identity</TableHead>
                    <TableHead className="font-semibold text-zinc-300">Intent</TableHead>
                    <TableHead className="font-semibold text-zinc-300">Contact Data</TableHead>
                    <TableHead className="font-semibold text-zinc-300">Timeline</TableHead>
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
                    ))
                  ) : leads.map((lead, i) => {
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
                            @{lead.ig_username}
                          </TableCell>
                          <TableCell className="text-zinc-300 capitalize font-medium">{data.intent || 'Unknown'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {data.phone !== 'Pending' && <Badge variant="outline" className="w-fit bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md"><Phone className="w-3 h-3 mr-1.5"/> {data.phone}</Badge>}
                              {data.email !== 'Pending' && <Badge variant="outline" className="w-fit bg-green-500/20 text-green-300 border-green-500/30 backdrop-blur-md"><Mail className="w-3 h-3 mr-1.5"/> {data.email}</Badge>}
                              {data.phone === 'Pending' && data.email === 'Pending' && <span className="text-sm text-zinc-500 italic">Pending</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400 flex items-center gap-1.5 mt-3">
                            <Clock className="w-4 h-4 text-zinc-500"/> {data.timeline || 'Pending'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className={`${
                              data.status === 'Hot' ? 'bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 
                              data.status === 'Warm' ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 
                              'bg-white/5 text-zinc-400'
                            } border-transparent px-3 py-1 text-xs`}>
                              {data.status || 'Cold'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>

      {/* THE SLIDE-OUT CHAT PANEL */}
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
            
            {/* DYNAMIC: Visual Tracking for Content Origin */}
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5 text-sm text-zinc-400">
              <LinkIcon className="h-4 w-4" />
              <span>Source: <span className="text-zinc-300 font-medium">{selectedLead?.lead_source || 'Direct Message'}</span> on {selectedLead?.platform || 'Instagram'}</span>
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

    </div>
  );
}