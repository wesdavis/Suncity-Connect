'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Save, Loader2, ArrowLeft, Settings, ExternalLink, Globe, Star, Camera, AtSign, ThumbsUp, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
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
    const [showToast, setShowToast] = useState(false); 
    const [clientId, setClientId] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    
    // Form State
    const [primaryColor, setPrimaryColor] = useState('#ea580c');
    const [secondaryColor, setSecondaryColor] = useState('#ffffff');
    const [logoUrl, setLogoUrl] = useState('');
    
    // Social Links State
    const [instagramLink, setInstagramLink] = useState('');
    const [facebookLink, setFacebookLink] = useState('');
    const [websiteLink, setWebsiteLink] = useState('');
    const [yelpLink, setYelpLink] = useState('');
    
    // Calendar Settings State
    const [appointmentDuration, setAppointmentDuration] = useState(60);

    // NEW: Meta Integration State
    const [fbPageId, setFbPageId] = useState(null);
    const [fbPages, setFbPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [showPageModal, setShowPageModal] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            const { data, error } = await supabase
                .from('clients')
                .select('id, primary_color, secondary_color, logo_url, instagram_link, facebook_link, website_link, yelp_link, appointment_duration, fb_page_id')
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
                if (data.appointment_duration) setAppointmentDuration(data.appointment_duration);
                if (data.fb_page_id) setFbPageId(data.fb_page_id);
            }
            setLoading(false);
        }
        fetchSettings();
    }, []);

    // Meta Graph API Fetcher with Instagram Fields attached
    const fetchMetaPages = async () => {
        setLoadingPages(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.provider_token) {
            alert("We couldn't find your Facebook token. Please sign out and sign back in with Facebook to refresh your connection.");
            setLoadingPages(false);
            return;
        }

        try {
            const res = await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${session.provider_token}`);
            const data = await res.json();
            
            if (data.data) {
                setFbPages(data.data);
                setShowPageModal(true);
            } else {
                alert("No pages found or permission denied. Ensure you granted permissions during login.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to Meta.");
        }
        setLoadingPages(false);
    };

    // Save the specific page, Instagram ID, AND Subscribe to Webhooks
    const connectSpecificPage = async (page) => {
        setSaving(true);
        
        // Scoop up the Instagram Professional Account ID if it exists
        const igAccountId = page.instagram_business_account ? page.instagram_business_account.id : null;

        try {
            const webhookRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${page.access_token}`, {
                method: 'POST'
            });
            const webhookData = await webhookRes.json();
            
            if (!webhookData.success) {
                console.error("Webhook subscription failed:", webhookData);
                alert("Connected to Meta, but failed to link the live message routing. Please try again.");
                setSaving(false);
                return;
            }

            // 2. Save everything to Supabase
            const { error } = await supabase
                .from('clients')
                .update({
                    fb_page_id: page.id,
                    meta_access_token: page.access_token,
                    ig_account_id: igAccountId 
                })
                .eq('id', clientId);

            if (!error) {
                setFbPageId(page.id);
                setShowPageModal(false);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            } else {
                alert("Failed to save page connection to database.");
            }
        } catch (err) {
            console.error("Connection process failed:", err);
            alert("A network error occurred while connecting the page.");
        }
        
        setSaving(false);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            alert("Please keep logo images under 2MB.");
            return;
        }
        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${clientId}_${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('brand_assets')
                .upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: publicUrlData } = supabase.storage
                .from('brand_assets')
                .getPublicUrl(fileName);
            setLogoUrl(publicUrlData.publicUrl);
        } catch (error) {
            console.error("Logo upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploadingLogo(false);
        }
    };

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
                yelp_link: yelpLink,
                appointment_duration: parseInt(appointmentDuration) || 60
            })
            .eq('id', clientId);
            
        if (error) {
            console.error("Failed to update settings:", error);
            alert("Failed to save settings. Please try again.");
        } else {
            setSaving(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pt-12 md:pt-24 font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}>
            
            {/* THE SUCCESS TOAST NOTIFICATION */}
            <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)] backdrop-blur-xl transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold">Settings Saved Successfully!</span>
            </div>

            {/* THE META PAGE SELECTOR MODAL */}
            {showPageModal && (
                <div className="fixed inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4">
                    <Card className="max-w-md w-full bg-zinc-900 border-white/10 shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <ThumbsUp className="w-5 h-5 text-[#1877F2]" /> Select Business Page
                            </CardTitle>
                            <CardDescription className="text-zinc-400">Choose the Facebook page you want to connect to your AI bot.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {fbPages.length === 0 ? (
                                <p className="text-zinc-500 text-sm text-center py-4">No pages found. Make sure you granted permissions during login.</p>
                            ) : (
                                fbPages.map(page => (
                                    <div key={page.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-white/10 rounded-xl hover:border-white/30 transition-colors">
                                        <span className="text-white font-bold text-sm truncate pr-4">{page.name}</span>
                                        <Button size="sm" onClick={() => connectSpecificPage(page)} className="bg-[#1877F2] hover:bg-[#166FE5] text-white shrink-0">
                                            Connect
                                        </Button>
                                    </div>
                                ))
                            )}
                            <Button variant="ghost" onClick={() => setShowPageModal(false)} className="w-full text-zinc-400 hover:text-white mt-4 border border-white/5">Cancel</Button>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                                Update your branding, logos, scheduling rules, and integrations.
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
                        
                        {/* Meta Integration Card */}
                        <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#1877F2]"></div>
                            <CardHeader>
                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                    <ExternalLink className="w-5 h-5 text-[#1877F2]" /> System Integrations
                                </CardTitle>
                                <CardDescription className="text-zinc-400">Connect your external platforms to the AI core.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex flex-col mb-4 sm:mb-0">
                                        <span className="text-white font-bold flex items-center gap-2">
                                            <ThumbsUp className="w-4 h-4 text-[#1877F2]" />
                                            Meta Business Suite
                                        </span>
                                        <span className="text-zinc-400 text-sm mt-1">
                                            {fbPageId ? "Your business page is successfully linked." : "Link your page to enable automated Instagram & Facebook DMs."}
                                        </span>
                                    </div>
                                    <Button 
                                        onClick={fetchMetaPages} 
                                        disabled={loadingPages}
                                        className={`font-bold transition-all ${fbPageId ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10' : 'bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-[0_0_15px_rgba(24,119,242,0.3)]'}`}
                                    >
                                        {loadingPages ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        {fbPageId ? "Change Page" : "Connect Meta Pages"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Logo Upload Card */}
                        <div className="space-y-2">
                            <Label className="text-zinc-300 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-orange-500"/> Upload Logo Image
                            </Label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                {logoUrl && (
                                    <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                        <img src={logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        disabled={uploadingLogo}
                                        className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 file:cursor-pointer cursor-pointer w-full bg-zinc-900/30 p-2 rounded-xl border border-white/5 transition-all focus:outline-none"
                                        onChange={handleLogoUpload}
                                    />
                                    {uploadingLogo && <p className="text-xs text-orange-500 mt-2 animate-pulse">Uploading to server...</p>}
                                    {!uploadingLogo && <p className="text-xs text-zinc-500 mt-2">Upload a PNG, JPG, or WEBP (Max 2MB).</p>}
                                </div>
                            </div>
                        </div>
                        
                        {/* Booking & Calendar Settings Card */}
                        <Card className="bg-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-green-400" /> Booking Settings
                                </CardTitle>
                                <CardDescription className="text-zinc-400">Control how the AI schedules your appointments.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500"/> Default Appointment Length (Minutes)</Label>
                                    <Input
                                        type="number"
                                        min="15"
                                        step="15"
                                        className="bg-zinc-900/50 border-white/10 text-white w-full md:w-1/3"
                                        value={appointmentDuration}
                                        onChange={(e) => setAppointmentDuration(e.target.value)}
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">The AI will automatically block out this much time on your schedule for each new booking.</p>
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
                                    <Input placeholder="https://www.yourmainwebsite.com" className="bg-zinc-900/50 border-white/10 text-white" value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2"><AtSign className="w-4 h-4 text-pink-500"/> Instagram Profile</Label>
                                    <Input placeholder="https://instagram.com/yourhandle" className="bg-zinc-900/50 border-white/10 text-white" value={instagramLink} onChange={(e) => setInstagramLink(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-blue-500"/> Facebook Page</Label>
                                    <Input placeholder="https://facebook.com/yourpage" className="bg-zinc-900/50 border-white/10 text-white" value={facebookLink} onChange={(e) => setFacebookLink(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2"><Star className="w-4 h-4 text-red-500"/> Yelp / Review Link</Label>
                                    <Input placeholder="https://yelp.com/biz/your-business" className="bg-zinc-900/50 border-white/10 text-white" value={yelpLink} onChange={(e) => setYelpLink(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Button onClick={handleSave} disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 text-base transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                            {saving ? "Saving Changes..." : "Save Settings"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}