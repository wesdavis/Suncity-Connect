'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, BrainCircuit, Save, Loader2, ArrowLeft, ShieldAlert, MessageSquare, Clock, DollarSign } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BotBrain() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState(null);

  // Structured State for the AI Brain
  const [businessName, setBusinessName] = useState('');
  const [tone, setTone] = useState('');
  const [pricing, setPricing] = useState('');
  const [hours, setHours] = useState('');
  const [extraRules, setExtraRules] = useState('');

  useEffect(() => {
    async function fetchBrainData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch the client's current settings
      const { data, error } = await supabase
        .from('clients')
        .select('id, custom_prompt, business_name')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setClientId(data.id);
        setBusinessName(data.business_name || '');
        
        // If they already have a custom_prompt, we dump it into the 'extraRules' box 
        // to ensure we don't accidentally delete their previous instructions.
        if (data.custom_prompt) {
          setExtraRules(data.custom_prompt);
        }
      }
      setLoading(false);
    }
    fetchBrainData();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    // Compile all the fields into one master System Prompt for Gemini
    const compiledPrompt = `
BUSINESS NAME: ${businessName}
TONE OF VOICE: ${tone || 'Professional, friendly, and energetic.'}
HOURS OF OPERATION: ${hours || 'Standard business hours. If closed, tell them we will reply tomorrow.'}
PRICING & SERVICES: ${pricing || 'Do not quote exact prices. Tell them it depends on the job and push for a demo/consultation.'}
ADDITIONAL STRICT RULES:
${extraRules}
    `.trim();

    // Save back to the database
    const { error } = await supabase
      .from('clients')
      .update({ custom_prompt: compiledPrompt, business_name: businessName })
      .eq('id', clientId);

    if (error) {
      console.error("Failed to update brain:", error);
    } else {
      // Show success briefly
      setTimeout(() => setSaving(false), 800);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 pt-12 md:pt-24 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-12 md:h-20 w-auto drop-shadow-lg self-start sm:self-auto" />
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-2 md:gap-3 mb-2">
                <BrainCircuit className="text-orange-500 w-6 h-6 md:w-10 md:h-10 shrink-0" />
                AI Bot Brain
              </h1>
              <p className="text-zinc-400 text-sm md:text-lg max-w-xl">
                Train your 24/7 digital sales assistant. Tell it exactly how to sell your business, what prices to quote, and how to sound.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shrink-0 mt-2 md:mt-0">
            <Link href="/dashboard" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800 h-11 px-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Pipeline
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* The Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Knowledge Base</CardTitle>
                  <CardDescription className="text-zinc-400">Fill in your business details. The AI will use this memory to answer customer DMs instantly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-orange-500"/> Business Name</Label>
                    <Input 
                      placeholder="e.g. El Paso Roofing Co." 
                      className="bg-zinc-900/50 border-white/10 text-white"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-400"/> Pricing & Services</Label>
                    <textarea 
                      placeholder="List your core services and starting prices. e.g. 'Roof inspections are free. Full replacements start at $5k.'"
                      className="flex min-h-[100px] w-full rounded-md border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                      value={pricing}
                      onChange={(e) => setPricing(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400"/> Operating Hours</Label>
                      <textarea 
                        placeholder="e.g. Mon-Fri 8am-6pm. Closed Sundays."
                        className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2"><Sparkles className="w-4 h-4 text-yellow-400"/> Tone of Voice</Label>
                      <textarea 
                        placeholder="e.g. Professional, energetic, use lots of emojis."
                        className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-400"/> Strict Rules (Advanced)</Label>
                    <textarea 
                      placeholder="Any hard rules? e.g. 'Never offer a discount. Always push them to book a call using the word DEMO.'"
                      className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                      value={extraRules}
                      onChange={(e) => setExtraRules(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 text-base transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] mt-4"
                  >
                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    {saving ? "Deploying Updates to AI..." : "Update AI Brain"}
                  </Button>

                </CardContent>
              </Card>
            </div>

            {/* The Live Preview Panel */}
            <div className="lg:col-span-1 space-y-6">
               <Card className="bg-zinc-900/50 border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-600"></div>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" /> Neural Link Active
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Changes made here are <strong className="text-white">instantly deployed</strong> to your Instagram and Facebook bots. 
                  </p>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    The AI automatically remembers past conversations, so you only need to give it the broad rules here. It will handle the context natively.
                  </p>
                  
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 mt-6">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 block">System Status</span>
                    <div className="flex items-center gap-3 text-sm text-white">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      Meta Webhooks Connected
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white mt-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      Gemini 2.5 Logic Engine Online
                    </div>
                  </div>
                </CardContent>
               </Card>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}