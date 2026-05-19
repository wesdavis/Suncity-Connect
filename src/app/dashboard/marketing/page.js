'use client';

import { useState } from 'react';
import { Sparkles, Megaphone, Loader2, Copy, CheckCircle2, ArrowLeft, Image as ImageIcon, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';

export default function MarketingEngine() {
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState(false);
  
  // NEW: Added the headline state right here!
  const [headline, setHeadline] = useState(null); 
  const [campaign, setCampaign] = useState(null);
  const [imageStr, setImageStr] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateCampaign = async () => {
    setLoading(true);
    setHeadline(null); // Clear old headline
    setCampaign(null);
    setImageStr(null);
    try {
      const response = await fetch('/api/marketing-engine', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setHeadline(data.headline); // Save new headline from backend
        setCampaign(data.campaign);
        setImageStr(data.image);
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

  // THE BROWSER-BASED AI ARTIST 🎨
  const downloadBrandedAsset = async () => {
    if (!imageStr || !campaign || !headline) return; // Added headline check
    setBranding(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 1. Load Background Image
      const bgImg = new Image();
      bgImg.crossOrigin = "Anonymous";
      bgImg.src = `data:image/jpeg;base64,${imageStr}`;
      await new Promise((resolve) => (bgImg.onload = resolve));

      canvas.width = bgImg.width;
      canvas.height = bgImg.height;

      // 2. Draw Background
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // 3. Add Dark Cinematic Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. Load & Draw Logo
      const logoImg = new Image();
      logoImg.src = '/assets/SCC_logo.png'; 
      await new Promise((resolve) => (logoImg.onload = resolve));

      const logoWidth = Math.floor(canvas.width / 3.5);
      const logoHeight = (logoWidth / logoImg.width) * logoImg.height;
      const logoX = (canvas.width - logoWidth) / 2;
      const logoY = canvas.height - logoHeight - (canvas.height * 0.05);
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      // 5. Draw the Ad Text
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fontSize = Math.floor(canvas.width / 16);
      ctx.font = `bold ${fontSize}px sans-serif`;

      // Word Wrapping Logic
      const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        const startY = y - ((lines.length - 1) * lineHeight) / 2;
        for (let k = 0; k < lines.length; k++) {
          context.fillText(lines[k].trim(), x, startY + (k * lineHeight));
        }
      };

      const textCenterY = canvas.height * 0.45;
      
      // NEW: Drawing the headline variable on the image instead of the campaign text
      wrapText(ctx, `"${headline}"`, canvas.width / 2, textCenterY, canvas.width * 0.85, fontSize * 1.3);

      // 6. Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `SunCity_Campaign_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

    } catch (error) {
      console.error("Failed to brand image:", error);
    }
    setBranding(false);
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 pt-8 md:pt-12 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-16 w-auto drop-shadow-lg" />
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <Sparkles className="text-orange-500 w-8 h-8" />
                AI Content Engine
              </h1>
              <p className="text-zinc-400 mt-1 text-lg">Generate hyper-targeted ads based on your actual customer DMs.</p>
            </div>
          </div>
          
          <Link href="/dashboard">
            <Button variant="outline" className="bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pipeline
            </Button>
          </Link>
        </div>

        <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-white">Launch a New Campaign</CardTitle>
            <CardDescription className="text-zinc-400">
              Our AI reads your last 50 DMs, identifies what customers want most right now, and designs a complete visual campaign to capture them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <Button 
              onClick={generateCampaign} 
              disabled={loading}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600