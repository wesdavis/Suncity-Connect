'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Download, Copy, CheckCircle2, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';

export default function CampaignLibrary() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/library');
        const data = await response.json();
        if (data.success) {
          setCampaigns(data.campaigns);
        }
      } catch (error) {
        console.error("Failed to load library:", error);
      }
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Custom function to force download from the Supabase URL
  const triggerDownload = async (url, id) => {
    setDownloadingId(id);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `SunCity_Asset_${id.substring(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
    setDownloadingId(null);
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 pt-8 md:pt-12 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 gap-6 md:gap-0">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-12 md:h-16 w-auto drop-shadow-lg self-start sm:self-auto" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2 md:gap-3">
                <Sparkles className="text-orange-500 w-6 h-6 md:w-8 md:h-8 shrink-0" />
                Campaign Vault
              </h1>
              <p className="text-zinc-400 mt-1 text-sm md:text-lg">Your saved AI marketing assets, ready to deploy.</p>
            </div>
          </div>
          
          {/* Navigation Button Group */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 w-full md:w-auto">
            <Link href="/dashboard/marketing" className="flex-1 md:flex-none">
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                Create New Ad
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800">
                <ArrowLeft className="w-4 h-4 mr-2" /> Pipeline
              </Button>
            </Link>
          </div>
          
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-orange-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="text-zinc-400 font-medium">Decrypting Vault...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && campaigns.length === 0 && (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5 backdrop-blur-sm">
            <ImageIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Vault is Empty</h3>
            <p className="text-zinc-400 mb-6">You haven't saved any generated campaigns yet.</p>
            <Link href="/dashboard/marketing">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                Launch the Content Engine
              </Button>
            </Link>
          </div>
        )}

        {/* The Pinterest-Style Split Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-zinc-950/60 backdrop-blur-xl border-white/10 overflow-hidden group hover:border-orange-500/30 transition-colors">
              <div className="flex flex-col sm:flex-row h-full">
                
                {/* Left Side: The Image */}
                <div className="w-full sm:w-2/5 aspect-square sm:aspect-auto relative bg-zinc-900 border-r border-white/5 flex-shrink-0">
                  <img 
                    src={campaign.image_url} 
                    alt={campaign.headline}
                    className="w-full h-full object-cover"
                  />
                  {/* Download Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <Button 
                      onClick={() => triggerDownload(campaign.image_url, campaign.id)}
                      disabled={downloadingId === campaign.id}
                      className="bg-zinc-800 hover:bg-white hover:text-black text-white font-bold shadow-2xl transition-all"
                    >
                      {downloadingId === campaign.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                      {downloadingId === campaign.id ? "Downloading..." : "Download Asset"}
                    </Button>
                  </div>
                </div>

                {/* Right Side: The Condensed Text */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-black/60 px-2 py-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider rounded border border-white/10 w-fit">
                      Saved Ad
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-white text-lg font-black mb-3 tracking-tight line-clamp-2 leading-snug">
                    "{campaign.headline}"
                  </h3>
                  
                  {/* Compact, smaller caption */}
                  <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap flex-1 line-clamp-4 sm:line-clamp-6 mb-4">
                    {campaign.caption}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(campaign.caption, campaign.id)}
                    className={`w-full mt-auto text-sm h-9 transition-colors ${copiedId === campaign.id ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white'}`}
                  >
                    {copiedId === campaign.id ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copiedId === campaign.id ? "Caption Copied!" : "Copy Full Caption"}
                  </Button>
                </div>

              </div>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}