'use client';
import { useState } from 'react';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
  businessName: '',
  industry: 'recruiting',
  streetAddress: '',
  suite: '',
  city: 'El Paso', // Defaulting to El Paso saves local clients a keystroke
  state: 'TX',     // Defaulting to TX
  zipCode: '',
  primaryColor: '#ea580c', 
  logoUrl: '',
  companyBio: '',
  screeningRule: ''
});

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const submitOnboarding = async () => {
    setLoading(true);
    // This will send a POST request to update the 'clients' table in Supabase
    console.log("Deploying E-Real Estate Data...", formData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-xl bg-zinc-900 border-white/10 text-white">
        
        {/* Google-style Top Progress Bar */}
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
            {step === 2 && "Customize your digital storefront branding"}
            {step === 3 && "Train your AI screening agent"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* STEP 1: Core Info Inputs */}
{step === 1 && (
  <div className="space-y-4 animate-in fade-in duration-200">
    <p className="text-sm text-zinc-400">
      Let's set up the base profile for your new website hosting layer and local SEO mapping.
    </p>

    {/* Business Name */}
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">Business Name</label>
      <input
        type="text"
        placeholder="e.g. Sun City Staffing"
        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
        value={formData.businessName}
        onChange={(e) => handleFieldChange('businessName', e.target.value)}
      />
    </div>

    {/* Industry Dropdown */}
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">Industry / Template Type</label>
      <select
        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
        value={formData.industry}
        onChange={(e) => handleFieldChange('industry', e.target.value)}
      >
        <option value="recruiting">Recruiting & Staffing</option>
        <option value="beauty">Beauty & Wellness (Salons, Barbers)</option>
        <option value="medical">Medical Practices & Clinics</option>
      </select>
    </div>

    {/* Physical Address Block */}
    <div className="space-y-3 pt-2 border-t border-white/5">
      <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Physical Location (For Google Maps SEO)</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs text-zinc-400">Street Address</label>
          <input
            type="text"
            placeholder="e.g. 123 N Mesa St"
            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors text-sm"
            value={formData.streetAddress}
            onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
          />
        </div>
        <div className="col-span-1 space-y-1.5">
          <label className="text-xs text-zinc-400">Suite / Apt</label>
          <input
            type="text"
            placeholder="e.g. Suite 400"
            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors text-sm"
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
            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white text-center focus:outline-none focus:border-orange-500 transition-colors text-sm"
            value={formData.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
          />
        </div>
        <div className="col-span-1 space-y-1.5">
          <label className="text-xs text-zinc-400">ZIP Code</label>
          <input
            type="text"
            placeholder="79901"
            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white placeholder:text-zinc-700 focus:outline-none focus:border-orange-500 transition-colors text-sm"
            value={formData.zipCode}
            onChange={(e) => handleFieldChange('zipCode', e.target.value)}
          />
        </div>
      </div>
    </div>
  </div>
)}

          {/* STEP 2: Branding / Color Picker Render Here */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Color picker and file upload drops here */}
            </div>
          )}

          {/* STEP 3: AI Screening Training Box */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* High-impact questions to construct the prompt custom variables */}
            </div>
          )}

          {/* Bottom Navigation Control Bar */}
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