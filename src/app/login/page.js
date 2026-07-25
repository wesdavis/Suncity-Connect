'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Mail, ArrowRight, Loader2, ShieldCheck, Zap, CheckCircle2, AlertCircle, Eye, EyeOff, Building2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Check the URL for Facebook OAuth errors
    const hash = window.location.hash;
    const query = window.location.search;

    if (hash.includes('error_code=500') || query.includes('error_code=500') || query.includes('error_description')) {
      setError("Facebook's security settings prevented us from verifying your email. Please create your account using your business email below.");
      setShowEmailFallback(true);
      setIsSignUp(true); // Force the form into sign-up mode
      
      // Clean the URL so it doesn't get stuck in an error loop
      window.history.replaceState(null, '', '/login');
    }

    // 2. Standard session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard');
    });
  }, [router]);

  const ensureClientRow = async (userId, email) => {
    const { data: existing } = await supabase.from('clients').select('id, business_name').eq('user_id', userId).maybeSingle();
    if (existing) return existing;

    const businessName = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() || 'My Business';
    const { data, error } = await supabase.from('clients').insert([{
      user_id: userId,
      business_name: businessName,
      custom_prompt: 'You are a friendly, professional AI receptionist for this business. Be concise and helpful.',
      is_active: true,
      is_bot_active: false, 
      is_subscribed: false,
      industry: 'local',
      timezone: 'America/Denver'
    }]).select().single();

    if (error) {
      console.error('Client creation error:', error);
    }
    return data;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || password.length < 6) {
      setError('Please enter a valid email and password (6+ characters).');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        if (data.session) {
          await ensureClientRow(data.user.id, cleanEmail);
          router.push('/dashboard');
        } else {
          await ensureClientRow(data.user.id, cleanEmail);
          setMessage('Check your email! We sent a confirmation link to ' + cleanEmail);
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          setError('Invalid email or password. Try again or reset your password.');
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        await ensureClientRow(data.user.id, cleanEmail);
        const { data: client } = await supabase.from('clients').select('business_name, logo_url').eq('user_id', data.user.id).single();
        if (!client?.logo_url || client?.business_name?.includes("'s Business")) {
          router.push('/dashboard/onboarding'); 
        } else {
          router.push('/dashboard');
        }
      }
    }
    setLoading(false);
  };

  // NEW: Google OAuth Function
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/login`,
        scopes: 'email, public_profile, pages_show_list, pages_messaging, pages_read_engagement, pages_manage_engagement, business_management'
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email first to reset password.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setMessage(`Password reset link sent to ${email}. Check your inbox.`);
    setLoading(false);
    setShowForgot(false);
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-white selection:bg-orange-500/30 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[800px] h-[800px] bg-orange-500/[0.12] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-blue-500/[0.08] blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="hidden lg:flex w-[48%] relative z-10 flex-col justify-between p-12 border-r border-white/[0.06] bg-white/[0.01]">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-9 w-auto" />
            <span className="font-black tracking-tight text-lg">SUN CITY CONNECT</span>
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> LIVE: 27 appointments booked today in El Paso
            </div>
            <h1 className="text-5xl font-black tracking-[-0.04em] leading-[0.9] mb-6">
              Your pipeline,<br />
              <span className="text-zinc-500">on autopilot.</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-md leading-relaxed">
              Log in to see every DM, lead, and booking captured by your AI receptionist in one command center.
            </p>
          </div>

          <div className="space-y-4 max-w-sm">
            {[
              { icon: Zap, title: "Instant inbox", desc: "All IG + FB DMs unified with AI replies" },
              { icon: Building2, title: "Lead intelligence", desc: "Phone, email, intent auto-extracted" },
              { icon: ShieldCheck, title: "Secure by default", desc: "SOC2-ready auth via Supabase" },
            ].map(item => (
              <div key={item.title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0"><item.icon className="w-4 h-4 text-zinc-300" /></div>
                <div><div className="text-sm font-semibold text-white">{item.title}</div><div className="text-xs text-zinc-500">{item.desc}</div></div>
              </div>
            ))}
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex gap-3">
            <img src="https://i.pravatar.cc/100?img=32" className="w-10 h-10 rounded-full" alt="client" />
            <div><div className="text-[13px] font-medium leading-tight">"We stopped missing DMs. 9 extra bookings last week alone without hiring."</div><div className="text-xs text-zinc-500 mt-1">— Local owner, El Paso</div></div>
          </div>
        </div>

        <div className="text-xs text-zinc-600">© {new Date().getFullYear()} Sun City Connect • Built in El Paso, TX</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[420px] space-y-6">
          <div className="lg:hidden flex flex-col items-center text-center">
            <Link href="/"><img src="/assets/SCC_logo.png" alt="SCC" className="h-14 w-auto mb-4" /></Link>
            <h2 className="text-2xl font-black tracking-tight">{isSignUp ? 'Create your command center' : 'Welcome back'}</h2>
            <p className="text-zinc-500 text-sm mt-1">{isSignUp ? 'Start capturing El Paso leads tonight.' : 'Sign in to your pipeline.'}</p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-3xl font-black tracking-tight">{isSignUp ? 'Create account' : 'Welcome back'}</h2>
            <p className="text-zinc-500 mt-2 text-[14px]">{isSignUp ? 'Get your smart storefront live in 48 hours.' : 'Enter your credentials to access your dashboard.'}</p>
          </div>

          <Card className="bg-zinc-900/60 backdrop-blur-2xl border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <CardContent className="p-7">
              
              {!showEmailFallback && (
                <>
                  <Button 
                    type="button" 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-bold h-11 rounded-full mb-3"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Button>

                  <Button 
                    type="button" 
                    onClick={handleFacebookLogin}
                    disabled={loading}
                    className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold h-11 rounded-full"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                    Continue with Facebook
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-widest"><span className="bg-zinc-900 px-3 text-zinc-500">Or with email</span></div>
                  </div>
                </>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-[13px]">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-[13px] h-4 w-4 text-zinc-500" />
                    <Input 
                      type="email" 
                      placeholder="you@business.com" 
                      className="pl-11 h-11 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500/50 rounded-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-300 text-[13px]">Password</Label>
                    {!isSignUp && !showEmailFallback && (
                      <button type="button" onClick={() => setShowForgot(!showForgot)} className="text-xs text-zinc-400 hover:text-white">
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-[13px] h-4 w-4 text-zinc-500" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-11 bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500/50 rounded-full"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[10px] p-1 text-zinc-500 hover:text-zinc-300">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isSignUp && <p className="text-[11px] text-zinc-500">Min 6 characters. You’ll confirm email if required.</p>}
                </div>

                {showForgot && (
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between gap-3">
                    <span className="text-xs text-orange-200">Reset link will go to email above</span>
                    <Button type="button" size="sm" onClick={handleForgotPassword} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-8 text-xs">Send reset</Button>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-300 flex gap-2 leading-tight">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
                  </div>
                )}
                {message && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[13px] text-emerald-300 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> <span>{message}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10 font-bold h-11 rounded-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>

                {!showEmailFallback && (
                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                      className="text-[13px] text-zinc-400 hover:text-white"
                    >
                      {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
                    </button>
                  </div>
                )}

                {isSignUp && <p className="text-[11px] text-zinc-600 text-center leading-tight">By creating an account, you agree to our Terms & Privacy. No spam, ever.</p>}
              </form>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-600">
            <Link href="/" className="hover:text-zinc-400">← Back to site</Link>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <a href="mailto:support@suncityconnect.com" className="hover:text-zinc-400">Need help?</a>
          </div>
        </div>
      </div>
    </div>
  );
}