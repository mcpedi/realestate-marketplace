import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Link } from "wouter";
import { ArrowLeft, Award, BadgeCheck, Headphones, HeartHandshake, HousePlus, MapPin, ShieldCheck, Target, UsersRound } from "lucide-react";

const heroImage = "/manus-storage/pediwa-kenyan-estate-hero_d54d8e46.jpg";

const values = [
  { icon: ShieldCheck, title: "Trust", description: "Clear information and thoughtful decisions at every step." },
  { icon: UsersRound, title: "People first", description: "Built around the real needs of buyers, owners and agents." },
  { icon: Award, title: "Quality", description: "A calmer, more considered way to discover property." },
  { icon: MapPin, title: "Local focus", description: "Designed for Kenyan neighbourhoods and everyday realities." },
];

const benefits = [
  { icon: HousePlus, title: "Thoughtful discovery", description: "Search, compare and save places at your own pace." },
  { icon: ShieldCheck, title: "A safer process", description: "Practical tools and transparent property information." },
  { icon: Headphones, title: "Local support", description: "Helpful guidance when you are ready to take the next step." },
  { icon: BadgeCheck, title: "Easy to use", description: "A simple experience from first search to inquiry." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="pb-24 lg:pb-0">
        <section className="container pt-5 sm:pt-7">
          <div className="flex items-center justify-between px-1">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700 transition-colors hover:text-emerald-700"><ArrowLeft className="h-4 w-4" /> Back home</Link>
            <span className="text-sm font-extrabold tracking-[-0.02em] text-slate-900">About Nyumba 360</span>
            <Link href="/contact" className="text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-800">Contact</Link>
          </div>

          <section className="relative mt-5 overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-8 text-white shadow-[0_20px_55px_-28px_rgba(4,120,87,0.72)] sm:px-9 sm:py-12 lg:min-h-[26rem] lg:px-14 lg:py-16">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,44,34,0.96)_0%,rgba(3,70,51,0.84)_45%,rgba(4,50,42,0.22)_100%)]" />
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] backdrop-blur-sm"><span className="grid h-5 w-5 place-items-center rounded-md bg-lime-300 text-emerald-950"><HousePlus className="h-3.5 w-3.5" /></span>Nyumba 360</div>
              <h1 className="mt-5 max-w-[12ch] text-[2.15rem] font-extrabold leading-[1.04] tracking-[-0.055em] sm:text-5xl lg:text-6xl">Find the place that <span className="text-lime-300">fits your life.</span></h1>
              <p className="mt-5 max-w-md text-base leading-7 text-emerald-50/90 sm:text-lg">A clearer, more human way to search, discover and connect around property in Kenya.</p>
            </div>
          </section>

          <section className="relative z-20 mx-3 -mt-7 rounded-[1.6rem] border border-slate-100 bg-white p-5 shadow-[0_15px_35px_-20px_rgba(15,23,42,0.35)] sm:mx-6 sm:flex sm:items-center sm:gap-6 sm:p-7 lg:mx-10 lg:-mt-10">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 sm:h-16 sm:w-16"><Target className="h-7 w-7" /></div>
            <div className="mt-4 sm:mt-0"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">Our mission</p><p className="mt-1.5 text-base font-semibold leading-6 text-slate-700 sm:text-lg">To make property discovery and connection simple, accessible and trustworthy for more people across Kenya.</p></div>
          </section>

          <section className="mt-10 sm:mt-14">
            <div className="flex items-end justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">What guides us</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Our core values</h2></div><div className="hidden h-px flex-1 bg-slate-100 sm:block" /></div>
            <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm md:grid-cols-4 md:divide-y-0">
              {values.map(({ icon: Icon, title, description }) => <article key={title} className="p-5 sm:p-6"><div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-sm font-extrabold tracking-[-0.02em] text-slate-900 sm:text-base">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">{description}</p></article>)}
            </div>
          </section>

          <section className="mt-10 overflow-hidden rounded-[2rem] bg-emerald-50 p-5 sm:mt-14 sm:p-8 lg:grid lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-12 lg:p-10">
            <div className="max-w-xl"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">Our story</p><div className="mt-3 h-1 w-11 rounded-full bg-lime-400" /><h2 className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-3xl">Property choices deserve better tools.</h2><p className="mt-4 leading-7 text-slate-600">Nyumba 360 brings property search, local insight and useful workflows into one calm place. We are building a marketplace that makes it easier to explore options, ask questions and move forward with confidence.</p><p className="mt-4 leading-7 text-slate-600">Our approach combines technology with a deep respect for the practical decisions people make around homes, land and spaces to grow.</p></div>
            <div className="relative mt-7 min-h-56 overflow-hidden rounded-[1.5rem] sm:min-h-72 lg:mt-0"><img src={heroImage} alt="Modern Kenyan home at dusk" className="absolute inset-0 h-full w-full object-cover object-[70%_center]" /><div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-transparent" /><div className="absolute bottom-4 left-4 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-emerald-900 backdrop-blur">Made for property journeys in Kenya</div></div>
          </section>

          <section className="mt-10 sm:mt-14"><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700">The Nyumba 360 difference</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">A more considered way to move forward</h2><div className="mt-6 grid grid-cols-2 divide-x divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm md:grid-cols-4 md:divide-y-0">{benefits.map(({ icon: Icon, title, description }) => <article key={title} className="p-5 text-center sm:p-6"><Icon className="mx-auto h-6 w-6 text-emerald-600" /><h3 className="mt-3 text-sm font-extrabold tracking-[-0.02em] text-slate-900 sm:text-base">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">{description}</p></article>)}</div></section>

          <section className="mt-10 overflow-hidden rounded-[1.8rem] bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 px-6 py-6 text-white shadow-[0_18px_40px_-24px_rgba(4,120,87,0.8)] sm:mt-14 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8 sm:py-7"><div className="flex items-center gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><HeartHandshake className="h-6 w-6" /></div><div><h2 className="text-lg font-extrabold tracking-[-0.03em]">Have a question?</h2><p className="mt-0.5 text-sm text-emerald-50/90">Our team is ready to help you take the next step.</p></div></div><Link href="/contact" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-extrabold text-emerald-800 transition-transform hover:-translate-y-0.5 hover:bg-emerald-50 sm:mt-0">Contact us <ArrowLeft className="ml-2 h-4 w-4 rotate-180" /></Link></section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
