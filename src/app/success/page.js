'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled') === '1';
  const total = searchParams.get('total');

  if (cancelled) {
    return (
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Payment cancelled</h1>
          <p className="text-zinc-400 text-[15px] leading-relaxed">
            No charge was made. You can close this tab and go back to the chat if you still want to order.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="rounded-full border-white/15 text-white hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sun City Connect
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.25)]">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Payment successful
        </h1>
        {total && (
          <p className="text-orange-400 font-bold text-lg mb-3">${total} paid</p>
        )}
        <p className="text-zinc-400 text-[15px] leading-relaxed">
          You’re all set. The business has been notified and will prepare your order.
          You can close this tab and return to the chat anytime.
        </p>
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left text-sm text-zinc-400 space-y-2">
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span>A receipt was emailed to you from Stripe / Link.</span>
        </p>
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <span>The shop owner was notified of your order.</span>
        </p>
      </div>
      <Link href="/">
        <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
          Done
        </Button>
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="mb-10 opacity-90">
        <img
          src="/assets/SCC_logo_large.png"
          alt="Sun City Connect"
          className="h-10 w-auto mx-auto"
          onError={(e) => {
            e.currentTarget.src = '/assets/SCC_logo.png';
          }}
        />
      </div>
      <Suspense
        fallback={
          <div className="text-zinc-500 text-sm animate-pulse">Confirming payment…</div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
