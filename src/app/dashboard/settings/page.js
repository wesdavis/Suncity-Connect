'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Save, Loader2, ArrowLeft, Settings, Palette, ExternalLink, Instagram, Facebook, Globe, Star, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState(null);

  // Form State
  const [primaryColor, setPrimaryColor] = useState('#ea580c');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Social Links State
  const [instagramLink, setInstagramLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  const [yelpLink, setYelpLink] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('clients')
        .select('id, primary_color, secondary_color, logo_url, instagram_link, facebook_link, website_link, yelp_link')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setClientId(data.id);
        if (data.primary_color) setPrimaryColor(data.primary_color);
        if (data.secondary_color) setSecondaryColor(data.secondary_color);
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.instagram_link) setInstagramLink(data.instagram_link);
        if (data.facebook_link) setFacebookLink(data.facebook_link);
        if (data.website_link) setWebsiteLink(data.website_link);
        if (data.yelp_link) setYelpLink(data.yelp_link);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('clients')
      .update({ 
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        logo_url: logoUrl,
        instagram_link: instagramLink,
        facebook_link: facebookLink,
        website_link: websiteLink,
        yelp_link: yelpLink
      })
      .eq('id', clientId);

    if (error) {
      console.error("Failed to update settings:", error);
      alert("Failed to save settings. Please try again.");
    } else {
      setTimeout(() => setSaving(false), 800);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 pt-12 md:pt-24 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 md:gap-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-12 md:h-20 w-auto drop-shadow-lg self-start sm:self-auto" />
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-2 md:gap-3 mb-2">
                <Settings className="text-zinc-400 w-6 h-6 md:w-10 md:h-10 shrink-0" />
                Storefront Settings
              </h1>
              <p className="text-zinc-400 text-sm md:text-lg max-w-xl">
                Update your branding, logos, and public social links.
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
          <div className="space-y-8">
            
            {/* Branding Card */}
            <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-400" /> Brand Identity
                </CardTitle>
                <CardDescription className="text-zinc-400">Manage how your storefront looks to visitors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-orange-500"/> Logo Image URL
                  </Label>
                  <Input 
                    placeholder="https://yourwebsite.com/logo.png" 
                    className="bg-zinc-900/50 border-white/10 text-white"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500 mt-1">Paste a direct link to your logo image (PNG or JPG).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Primary Brand Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-12 rounded bg-zinc-950 border border-white/10 cursor-pointer"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                      />
                      <Input 
                        className="bg-zinc-900/50 border-white/10 text-white uppercase"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Secondary Brand Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-12 rounded bg-zinc-950 border border-white/10 cursor-pointer"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                      />
                      <Input 
                        className="bg-zinc-900/50 border-white/10 text-white uppercase"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links Card */}
            <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-blue-400" /> Public Links & Socials
                </CardTitle>
                <CardDescription className="text-zinc-400">These links will appear on your storefront's interactive menu.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2"><Globe className="w-4 h-4 text-green-400"/> Main Website</Label>
                  <Input 
                    placeholder="https://www.yourmainwebsite.com" 
                    className="bg-zinc-900/50 border-white/10 text-white"
                    value={websiteLink}
                    onChange={(e) => setWebsiteLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-500"/> Instagram Profile</Label>
                  <Input 
                    placeholder="https://instagram.com/yourhandle" 
                    className="bg-zinc-900/50 border-white/10 text-white"
                    value={instagramLink}
                    onChange={(e) => setInstagramLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-500"/> Facebook Page</Label>
                  <Input 
                    placeholder="https://facebook.com/yourpage" 
                    className="bg-zinc-900/50 border-white/10 text-white"
                    value={facebookLink}
                    onChange={(e) => setFacebookLink(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2"><Star className="w-4 h-4 text-red-500"/> Yelp / Review Link</Label>
                  <Input 
                    placeholder="https://yelp.com/biz/your-business" 
                    className="bg-zinc-900/50 border-white/10 text-white"
                    value={yelpLink}
                    onChange={(e) => setYelpLink(e.target.value)}
                  />
                </div>

              </CardContent>
            </Card>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 text-base transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {saving ? "Saving Changes..." : "Save Settings"}
            </Button>

          </div>
        )}
      </div>
    </div>
  );
}