'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Link as LinkIcon, Calendar, Bot, Clock, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [formData, setFormData] = useState({
    businessName: '',
    notificationEmail: '',
    industry: 'recruiting',
    streetAddress: '',
    suite: '',
    city: 'El Paso', 
    state: 'TX',    
    zipCode: '',
    primaryColor: '#ea580c', 
    secondaryColor: '#ffffff',
    logoUrl: '',
    companyBio: '',
    screeningRule: '',
    isBotActive: true, 
    enableCalendar: true,
    timezone: 'America/Denver', // NEW: Crucial for AI Math
    appointmentDuration: 60,    // NEW: Native Scheduling Length
    bookingLink: ''             // NEW: Renamed to match Supabase schema
  });

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Prefill notification email from auth when Facebook/email login provides one
  useEffect(() => {
    async function prefillEmail() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setFormData((prev) =>
            prev.notificationEmail ? prev : { ...prev, notificationEmail: session.user.email }
          );
        }
      } catch (e) {
        // ignore — user can type it
      }
    }
    prefillEmail();
  }, []);

  const submitOnboarding = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No active session found. Please log in again.");
      }

      const compiledPrompt = `COMPANY BIO: ${formData.companyBio}\n\nSTRICT RULES: ${formData.screeningRule}`;
      
      // Auto-generate the URL slug from the business name
      const generatedDomain = formData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      if (!formData.notificationEmail?.trim() || !formData.notificationEmail.includes('@')) {
        throw new Error('Please enter a valid email where we should send new order alerts.');
      }

      const payload = {
        business_name: formData.businessName,
        notification_email: formData.notificationEmail.trim().toLowerCase(),
        industry: formData.industry,
        street_address: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        primary_color: formData.primaryColor,
        secondary_color: formData.secondaryColor,
        custom_domain: generatedDomain,
        is_bot_active: formData.isBotActive,
        booking_link: formData.enableCalendar && formData.bookingLink ? formData.bookingLink : null, 
        timezone: formData.timezone,
        appointment_duration: formData.appointmentDuration,
        custom_prompt: compiledPrompt,
        // Pre-fill the Brain Database columns so the settings page doesn't crash
        extra_rules: formData.screeningRule,
        tone: 'Professional, friendly, and helpful.',
        pricing: 'Prices vary based on service. Ask the customer for details or push for an appointment.',
        hours: 'Standard business hours.'
      };

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      let dbError;

      if (existingClient) {
        const { error } = await supabase
          .from('clients')
          .update(payload)
          .eq('user_id', session.user.id);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ user_id: session.user.id, ...payload }]);
        dbError = error;
      }

      if (dbError) throw dbError;

      // Force a complete browser hard-reload to break the Next.js cache
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error("Failed to deploy storefront:", error.message);
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-xl bg-zinc-900 border-white/10 text-white">
        
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-t-xl overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <CardHeader className="pt-6">
          <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Step {step} of 3</span>
          <CardTitle className="text-2xl font-black">
            {step === 1 && "Tell us about your business"}
            {step === 2 && "Features & Branding"}
            {step === 3 && "Train your AI screening agent"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* STEP 1: Core Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-sm text-zinc-400">
                Let's set up the base profile for your new website hosting layer and local SEO mapping.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Business Name</label>
                <input
                  type="text"
                  autoComplete="organization"
                  placeholder="e.g. Sun City Staffing"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.businessName}
                  onChange={(e) => handleFieldChange('businessName', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Order notification email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@yourbusiness.com"
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.notificationEmail}
                  onChange={(e) => handleFieldChange('notificationEmail', e.target.value)}
                />
                <p className="text-xs text-zinc-500">
                  We&apos;ll email new paid orders here. Required — Facebook login often doesn&apos;t share an email.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300">Industry / Template Type</label>
                <select
                  className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  value={formData.industry}
                  onChange={(e) => handleFieldChange('industry', e.target.value)}
                >
                  <option value="recruiting">Recruiting & Staffing</option>
                  <option value="services">Home Services & Trades</option>
                  <option value="medical">Medical Practices & Clinics</option>
                  <option value="hospitality">Hospitality & Dining</option>
                  <option value="realestate">Real Estate & Investments</option>
                </select>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Physical Location & Time</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs text-zinc-400">Street Address</label>
                    <input
                      type="text"
                      autoComplete="street-address"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      value={formData.streetAddress}
                      onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs text-zinc-400">Suite</label>
                    <input
                      type="text"
                      autoComplete="address-line2"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      value={formData.suite}
                      onChange={(e) => handleFieldChange('suite', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs text-zinc-400">City</label>
                    <input
                      type="text"
                      autoComplete="address-level2"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      value={formData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs text-zinc-400">State</label>
                    <input
                      type="text"
                      maxLength={2}
                      autoComplete="address-level1"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white text-center focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      value={formData.state}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs text-zinc-400">ZIP Code</label>
                    <input
                      type="text"
                      autoComplete="postal-code"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      value={formData.zipCode}
                      onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>

                {/* NEW: Timezone Selector */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs text-zinc-400 flex items-center gap-1.5"><Globe className="w-3 h-3"/> Local Timezone (Crucial for AI Booking)</label>
                  <select
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                    value={formData.timezone}
                    onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Phoenix">Mountain Time - Arizona (No DST)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                    <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Features & Branding */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">Choose Your Lead Capture Features</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleFieldChange('isBotActive', !formData.isBotActive)}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${formData.isBotActive ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-950 border-white/10 hover:border-white/30'}`}
                  >
                    <Bot className={`w-6 h-6 ${formData.isBotActive ? 'text-orange-500' : 'text-zinc-500'}`} />
                    <h4 className="font-bold text-white text-sm">AI Chat Assistant</h4>
                    <p className="text-xs text-zinc-400">The bot talks to visitors and captures leads automatically.</p>
                  </div>
                  
                  <div 
                    onClick={() => handleFieldChange('enableCalendar', !formData.enableCalendar)}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${formData.enableCalendar ? 'bg-orange-500/10 border-orange-500' : 'bg-zinc-950 border-white/10 hover:border-white/30'}`}
                  >
                    <Calendar className={`w-6 h-6 ${formData.enableCalendar ? 'text-orange-500' : 'text-zinc-500'}`} />
                    <h4 className="font-bold text-white text-sm">AI Booking Calendar</h4>
                    <p className="text-xs text-zinc-400">Let the AI schedule appointments natively on your dashboard.</p>
                  </div>
                </div>
              </div>

              {/* NEW: Native Scheduling + Override Link */}
              {formData.enableCalendar && (
                <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-1.5"><Clock className="w-4 h-4 text-orange-500"/> Default Appointment Length (Minutes)</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                      value={formData.appointmentDuration}
                      onChange={(e) => handleFieldChange('appointmentDuration', parseInt(e.target.value) || 60)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Third-Party Override Link (Optional)</label>
                    <p className="text-xs text-zinc-400 mb-2">Leave blank to use the native AI calendar. Paste a Calendly link if you want the bot to hand off booking instead.</p>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="url"
                        placeholder="https://calendly.com/your-business"
                        className="w-full pl-10 bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
                        value={formData.bookingLink}
                        onChange={(e) => handleFieldChange('bookingLink', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dual Brand Color Pickers */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-12 rounded bg-zinc-950 border border-white/10 cursor-pointer"
                      value={formData.primaryColor}
                      onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-lg p-2 text-white uppercase focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      value={formData.primaryColor}
                      onChange={(e) => handleFieldChange('primaryColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-12 rounded bg-zinc-950 border border-white/10 cursor-pointer"
                      value={formData.secondaryColor}
                      onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-lg p-2 text-white uppercase focus:outline-none focus:border-orange-500 transition-colors text-sm"
                      value={formData.secondaryColor}
                      onChange={(e) => handleFieldChange('secondaryColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: AI Training */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
               <p className="text-sm text-zinc-400 mb-4">
                Almost done! Let's give your AI some basic knowledge. You can always update this in your dashboard later.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Company Bio</label>
                <textarea
                  placeholder="Short description of what you do..."
                  className="flex min-h-[80px] w-full rounded-lg border border-white/10 bg-zinc-950 p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                  value={formData.companyBio}
                  onChange={(e) => handleFieldChange('companyBio', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Core Rules & Pricing</label>
                <textarea
                  placeholder="e.g. Roof inspections are free. We don't do repairs under $500."
                  className="flex min-h-[80px] w-full rounded-lg border border-white/10 bg-zinc-950 p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500"
                  value={formData.screeningRule}
                  onChange={(e) => handleFieldChange('screeningRule', e.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="p-3 mt-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center font-medium">
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-6">
            <Button
              variant="ghost"
              onClick={prevStep}
              className={`text-zinc-400 hover:text-white ${step === 1 ? 'invisible' : ''}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={nextStep} className="bg-orange-500 hover:bg-orange-600 font-bold">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={submitOnboarding} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 font-bold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Launch Storefront
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}