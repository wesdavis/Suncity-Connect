'use client';

import { useState } from 'react';
import { Sparkles, Megaphone, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MarketingEngine() {
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateCampaign = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/marketing-engine', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error("Failed to generate campaign", error);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(campaign);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans bg-zinc-950 text-white selection:bg-orange-500/30">
      <div className="max-w-4xl mx-auto space-y-8 mt-12">
        
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Sparkles className="text-orange-500 w-8 h-8" />
            AI Content Engine
          </h1>
          <p className="text-zinc-400 mt-2">Generate hyper-targeted ads based on your actual customer DMs.</p>
        </div>

        <Card className="bg-zinc-900/50 border-white/10 shadow-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle>Launch a New Campaign</CardTitle>
            <CardDescription className="text-zinc-400">
              Our AI reads your last 50 DMs, identifies what customers want most right now, and writes a converting ad to capture them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <Button 
              onClick={generateCampaign} 
              disabled={loading}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-8 text-base transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Megaphone className="w-5 h-5 mr-2" />}
              {loading ? "Analyzing Inbox Data..." : "Generate Campaign"}
            </Button>

            {campaign && (
              <div className="mt-8 p-6 bg-zinc-950 rounded-xl border border-white/5 relative group">
                <div className="absolute -top-3 left-4 bg-zinc-900 px-2 text-xs font-bold text-orange-500 uppercase tracking-wider border border-white/5 rounded-md">
                  Generated Ad Copy
                </div>
                <p className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {campaign}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyToClipboard}
                  className="absolute top-4 right-4 bg-zinc-800 border-white/10 hover:bg-zinc-700 hover:text-white"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}