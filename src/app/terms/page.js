'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center space-x-4">
          <a href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </a>
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-white/10 p-8 rounded-2xl shadow-sm space-y-6 text-sm leading-relaxed">
          
          <p className="text-zinc-500 dark:text-zinc-400">Last Updated: May 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Agreement to Terms</h2>
            <p>
              By accessing or using Sun City Connect, a service operated by DuckNutz LLC, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Description of Service</h2>
            <p>
              Sun City Connect provides AI-driven social media management and messaging automation tools. We grant you a limited, non-exclusive, non-transferable license to use our software for your legitimate business purposes, subject to these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Acceptable Use & Meta Compliance</h2>
            <p>You agree not to use the service to:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-300">
              <li>Violate any applicable local, state, national, or international law.</li>
              <li>Spam, defraud, or mislead other users or customers.</li>
              <li>Violate the Meta Platform Terms, Instagram Terms of Use, or Facebook Terms of Service.</li>
            </ul>
            <p className="font-semibold text-orange-600 dark:text-orange-400">Violation of Meta's developer policies may result in immediate termination of your Sun City Connect account without refund.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Subscriptions and Payments</h2>
            <p>
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis. You may cancel your subscription at any time, but no refunds will be issued for partial months of service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Limitation of Liability</h2>
            <p>
              In no event shall DuckNutz LLC, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the State of Texas, without regard to its conflict of law provisions. Any legal actions or proceedings arising out of these Terms shall be brought exclusively in the state or federal courts located in El Paso County, Texas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at legal@suncityconnect.com.</p>
          </section>

        </div>
      </div>
    </div>
  );
}