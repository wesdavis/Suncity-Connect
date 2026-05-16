'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center space-x-4">
          <a href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </a>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
        </div>

        <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200 dark:border-white/10 p-8 rounded-2xl shadow-sm space-y-6 text-sm leading-relaxed">
          
          <p className="text-zinc-500 dark:text-zinc-400">Last Updated: May 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Introduction</h2>
            <p>
              Welcome to Sun City Connect. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and share information when you use our software and services, particularly in connection with our Meta (Facebook and Instagram) integrations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Data We Collect</h2>
            <p>When you interact with our AI Sales Assistant via Meta platforms, we may collect the following data:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-300">
              <li><strong>Public Profile Information:</strong> Such as your Instagram or Facebook username and public profile details.</li>
              <li><strong>Messaging Data:</strong> The content of direct messages or public comments you send to businesses utilizing our AI bots.</li>
              <li><strong>Contact Information:</strong> Phone numbers or email addresses explicitly provided by you during the conversation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. How We Use Your Data</h2>
            <p>We use the collected data strictly to provide our services:</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-300">
              <li>To operate the AI conversational agent and generate relevant replies.</li>
              <li>To log lead information (intent, contact data, timelines) for the local businesses you are messaging.</li>
              <li>To improve the context and memory of our AI for future interactions with you.</li>
            </ul>
            <p className="font-semibold text-orange-600 dark:text-orange-400">We do not sell your personal data or messaging history to third-party data brokers.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Third-Party Services & Integrations</h2>
            <p>
              Our application integrates with the Meta Graph API to send and receive messages. Your data is processed in accordance with Meta's Platform Terms. We also utilize Google's Gemini AI to process text and generate responses. Only the text of the message is shared with the AI model for processing purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Data Deletion Instructions (Meta Requirement)</h2>
            <p>
              Under Meta's developer policies, you have the right to request the deletion of your data. If you have interacted with a Sun City Connect bot and wish to have your chat history, username, or contact information completely erased from our database, please submit a written request.
            </p>
            <div className="bg-zinc-100 dark:bg-white/5 p-4 rounded-lg border border-zinc-200 dark:border-white/10 mt-2">
              <p className="font-medium">To request data deletion:</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">Send an email to <strong>privacy@suncityconnect.com</strong> with the subject line "Data Deletion Request" and include your exact Instagram or Facebook handle.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Contact Us</h2>
            <p>If you have questions or concerns regarding this Privacy Policy, please contact our team operating locally out of El Paso, TX at privacy@suncityconnect.com.</p>
          </section>

        </div>
      </div>
    </div>
  );
}