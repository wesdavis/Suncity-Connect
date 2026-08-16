'use client';

import Link from 'next/link';
import { ArrowLeft, HelpCircle, MessageSquare, ShoppingCart, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function FAQPage() {
  const faqs = [
    {
      category: "The Basics",
      items: [
        {
          q: "What is Sun City Connect, in plain English?",
          a: "It’s a helper for local businesses in El Paso. It gives you a simple online page for your business, an AI that answers customer messages for you (even at night), and tools to take orders or book appointments — all in one place. You don’t need to be tech-savvy to use it."
        },
        {
          q: "Do I need to know how to code or build websites?",
          a: "No. Not at all. We set everything up for you. You just answer a few simple questions about your business and upload your menu or price list. We handle the rest."
        },
        {
          q: "How long does it take to get started?",
          a: "Most businesses are fully up and running within 24 hours. You fill out a short form, upload your menu or price list, and we connect everything. Then it starts working."
        }
      ]
    },
    {
      category: "The AI That Answers Messages",
      items: [
        {
          q: "What does the AI actually do?",
          a: "It reads messages that come into your Instagram, Facebook, or website chat. Then it replies for you — politely and using only the information you gave it (like your menu or prices). It can answer questions, take orders, and even book appointments while you’re busy or sleeping."
        },
        {
          q: "Does it work with Instagram and Facebook messages?",
          a: "Yes. Once we connect your accounts (we help you do this), the AI can read and reply to Instagram and Facebook direct messages the same way it replies on your website."
        },
        {
          q: "Will the AI make things up or give the wrong prices?",
          a: "No. It only uses the information you upload — your real menu, your real prices, and your real rules. If someone asks for something that isn’t on your list, it will say so instead of guessing."
        },
        {
          q: "What if the AI gets something wrong or a customer is upset?",
          a: "You can take over the conversation at any time with one click. The AI will step aside and a real person (you or your staff) can continue the chat. You are always in control."
        }
      ]
    },
    {
      category: "Taking Orders Through Chat",
      items: [
        {
          q: "Can customers order food or products right in the chat?",
          a: "Yes. If you add your items and prices into the system, customers can tell the AI what they want. The AI checks what you actually have in stock, figures out the total, and sends the customer a secure payment link. Once they pay, the order is ready for you."
        },
        {
          q: "How does the ordering part work, step by step?",
          a: "Here’s what happens:\n\n1. A customer messages you (on Instagram, Facebook, or your website) and says what they want.\n2. The AI looks at your real list of items and current stock.\n3. If everything is available, it calculates the total and sends a safe payment link.\n4. The customer clicks the link and pays with a card or Cash App.\n5. You get notified, and the system automatically updates how many of that item you have left.\n\nYou never have to type the total or create a payment link yourself."
        },
        {
          q: "What if we run out of something?",
          a: "The system checks your stock before it creates a payment link. If you don’t have enough of an item, the AI will tell the customer right away instead of taking an order you can’t fulfill."
        },
        {
          q: "Is the payment safe?",
          a: "Yes. The payment goes through Stripe (or Square if you prefer). The money goes straight into your connected business account. Sun City Connect never holds your customers’ money."
        },
        {
          q: "Does this only work for food?",
          a: "No. It works for anything you put into your inventory — food, drinks, products, packages, or fixed-price services. If it has a name, a price, and a quantity, the AI can sell it through chat."
        }
      ]
    },
    {
      category: "Your Website / Online Page",
      items: [
        {
          q: "Do I still need a regular website?",
          a: "You can keep the website you already have if you like. Many businesses use Sun City Connect as their main “link in bio” page on Instagram and Facebook. It gives customers one clean place to chat, see what you offer, and book or order."
        },
        {
          q: "Can customers book appointments too?",
          a: "Yes. The AI can check your calendar and book appointments for you. You can also connect an outside calendar tool if you already use one."
        }
      ]
    },
    {
      category: "Money & Contracts",
      items: [
        {
          q: "How much does it cost?",
          a: "It’s $97 per month plus a one-time $99 setup fee. That covers everything: your online page, the AI that answers messages, the ordering system, and the tools to create social media content."
        },
        {
          q: "Is there a long contract?",
          a: "No. It’s month-to-month. You can cancel anytime from your dashboard. We also give you a 14-day money-back guarantee if it’s not the right fit."
        },
        {
          q: "Are there extra fees for the payment links?",
          a: "Sun City Connect does not charge extra when a customer pays. Normal card processing fees from Stripe or Square still apply (the same fees any business pays when accepting cards)."
        }
      ]
    },
    {
      category: "Getting Help",
      items: [
        {
          q: "What if I get stuck or something isn’t working?",
          a: "Just message or email us. We’re based right here in El Paso and we help local business owners every day. You are not expected to figure everything out alone."
        },
        {
          q: "Can I try it before I pay?",
          a: "Yes. We sometimes open short private beta spots for local owners. Reach out and ask — we’ll let you know if a trial is available."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Simple top bar */}
      <div className="border-b border-white/10 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Button>
          </Link>
          <Link href="/">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-7 w-auto opacity-90" />
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/25 mb-5">
            <HelpCircle className="w-7 h-7 text-orange-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Simple answers to common questions
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Written for busy business owners — no tech talk, no jargon.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-orange-400 text-sm font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                {section.category === "Taking Orders Through Chat" && <ShoppingCart className="w-4 h-4" />}
                {section.category === "The AI That Answers Messages" && <MessageSquare className="w-4 h-4" />}
                {section.category === "Money & Contracts" && <ShieldCheck className="w-4 h-4" />}
                {section.category === "The Basics" && <Smartphone className="w-4 h-4" />}
                {section.category}
              </h2>

              <div className="space-y-4">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-7"
                  >
                    <h3 className="font-bold text-white text-[17px] mb-3 leading-snug">
                      {item.q}
                    </h3>
                    <div className="text-zinc-400 text-[15px] leading-relaxed whitespace-pre-line">
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Still have a question?
          </h2>
          <p className="text-white/85 mb-6 max-w-md mx-auto">
            We’re real people in El Paso. Just reach out and we’ll explain it in plain English.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button className="h-12 px-7 bg-black text-white hover:bg-zinc-900 rounded-full font-bold">
                Get Started
              </Button>
            </Link>
            <a href="mailto:wes@suncityconnect.com">
              <Button variant="outline" className="h-12 px-7 bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full font-semibold">
                Email us
              </Button>
            </a>
          </div>
        </div>

        {/* Tiny footer note */}
        <p className="text-center text-xs text-zinc-600 mt-10">
          © {new Date().getFullYear()} Sun City Connect · Built in El Paso, TX
        </p>
      </main>
    </div>
  );
}
