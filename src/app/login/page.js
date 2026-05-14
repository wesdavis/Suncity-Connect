'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'; // <-- Facebook is GONE from here

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/dashboard` 
      }
    });

    if (error) setError(error.message);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 bg-fixed bg-cover bg-center selection:bg-orange-500/30 dark"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.8), rgba(9, 9, 11, 0.95)), url('/assets/bg-dark.png')` }}
    >
      <div className="w-full max-w-md space-y-8 relative z-10">
        
        <div className="flex flex-col items-center text-center">
          <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-20 w-auto drop-shadow-2xl mb-6" />
          <h2 className="text-3xl font-black text-white tracking-tight">Welcome Back</h2>
          <p className="text-zinc-400 mt-2 font-medium">Sign in to access your pipeline intelligence.</p>
        </div>

        <Card className="bg-zinc-950/40 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" /> Secure Login
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your admin credentials to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <Button 
              type="button" 
              onClick={handleFacebookLogin}
              className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-bold h-11 mb-6 transition-all"
            >
              {/* RAW SVG BYPASS - VERCEL CANNOT CRASH ON THIS */}
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
              Continue with Facebook
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-zinc-300">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input 
                    type="email" 
                    placeholder="wes@suncityconnect.com" 
                    className="pl-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300">Password</Label>
                  <a href="#" className="text-xs text-orange-500 hover:text-orange-400 font-medium">Forgot password?</a>
                </div>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-orange-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center font-medium">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 transition-all"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}