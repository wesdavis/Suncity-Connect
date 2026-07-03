import Link from 'next/link';
import { ArrowRight, MonitorSmartphone, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TemplateGallery() {
  const templates = [
    {
      id: "logistics",
      name: "The Recruiter",
      industry: "Trucking & Logistics",
      color: "from-orange-500 to-orange-700",
      accent: "text-orange-500",
      description: "Engineered specifically to convert drivers. Aggressive mobile chat takeover to pre-screen CDL applicants instantly.",
      features: ["Driver Pre-screening Bot", "Route Benefits Showcase", "SMS-Style Mobile Layout"],
      // For now, they all point to your sandbox preview
      demoLink: "/template-preview?id=logistics",
    },
    {
      id: "medical",
      name: "The Clinic",
      industry: "Healthcare & MedSpa",
      color: "from-blue-500 to-blue-700",
      accent: "text-blue-500",
      description: "Clean, professional, and trustworthy. Features a patient-intake AI assistant to answer FAQs and book consultations.",
      features: ["Patient Intake AI", "Services Menu", "HIPAA-Compliant Tone"],
      demoLink: "/template-preview?id=medical",
    },
    {
      id: "services",
      name: "The Contractor",
      industry: "Home Services & Trades",
      color: "from-emerald-500 to-emerald-700",
      accent: "text-emerald-500",
      description: "Built for speed. Captures leads on the job site by instantly generating automated quotes and collecting contact info.",
      features: ["Instant Quote Bot", "Project Gallery Area", "Emergency Call Integration"],
      demoLink: "/template-preview?id=services",
    },
    {
      id: "realestate",
      name: "The Broker",
      industry: "Real Estate & Investments",
      color: "from-indigo-500 to-indigo-700",
      accent: "text-indigo-400",
      description: "Designed for high-value conversions. Captures buyer requirements, filters budget ranges, and qualifies seller timelines instantly.",
      features: ["Property Matching Assistant", "Interactive Showing Calendars", "Exclusive MLS Data Integration UI"],
      demoLink: "/template-preview?id=realestate",
    },
    {
      id: "restaurant",
      name: "The Bistro",
      industry: "Hospitality & Dining",
      color: "from-red-500 to-red-700",
      accent: "text-red-400",
      description: "Clean, visually striking layout built for immediate booking. Routes visitors straight to digital reservations, menus, and event catering requests.",
      features: ["Digital Reservation Engine", "Catering Sales Pipeline Layout", "Instant Directions & Hours Routing"],
      demoLink: "/template-preview?id=restaurant",
    }
  ];

  return (
    <div 
      className="min-h-screen font-sans selection:bg-orange-500/30 bg-zinc-950 bg-fixed bg-cover bg-center flex flex-col"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(9, 9, 11, 0.9), rgba(9, 9, 11, 0.98)), url('/assets/bg-dark.png')` }}
    >
      {/* --- TOP NAV --- */}
      <nav className="w-full border-b border-white/10 bg-black/20 backdrop-blur-md z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link href="/">
            <img src="/assets/SCC_logo.png" alt="Sun City Connect" className="h-10 md:h-12 w-auto drop-shadow-lg cursor-pointer" />
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HEADER --- */}
      <header className="pt-20 pb-16 px-4 text-center max-w-4xl mx-auto">
        <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-500/10 px-4 py-1.5 mb-6 backdrop-blur-md text-sm">
          <MonitorSmartphone className="w-4 h-4 mr-2 inline" /> Engineered for Conversion
        </Badge>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
          Choose Your Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">Storefront.</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Every template is custom-branded to your business, optimized for local SEO, and comes pre-installed with our 24/7 AI sales assistant.
        </p>
      </header>

      {/* --- GALLERY GRID --- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 pb-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {templates.map((template) => (
            <Card key={template.id} className="bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all flex flex-col group overflow-hidden">
              
              {/* Fake Browser Top Bar */}
              <div className="h-10 bg-zinc-950 border-b border-white/10 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="mx-auto text-xs text-zinc-600 font-mono flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-md">
                  yourbusiness.com
                </div>
              </div>

              {/* Template Preview Area (Gradient Placeholder) */}
              <div className={`h-48 w-full bg-gradient-to-br ${template.color} relative overflow-hidden flex items-center justify-center`}>
                 <div className="absolute inset-0 bg-black/20" />
                 <h3 className="text-3xl font-black text-white/90 z-10 uppercase tracking-widest drop-shadow-md">
                   {template.name}
                 </h3>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                  <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${template.accent}`}>
                    {template.industry}
                  </p>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  {template.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start text-sm text-zinc-400">
                      <CheckCircle2 className={`w-4 h-4 mr-2 shrink-0 ${template.accent}`} />
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  <Link href={template.demoLink} target="_blank">
                    <Button variant="outline" className="w-full bg-zinc-950 border-white/10 text-white hover:bg-zinc-800 transition-colors h-12">
                      <ExternalLink className="w-4 h-4 mr-2" /> Live Interactive Demo
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold transition-all h-12">
                      Select Template <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

        </div>
      </main>
    </div>
  );
}