import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Smartphone,
  ArrowRight,
  Layers,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { ROUTES } from '../../routes/routeConstants';

export const About = () => {
  const shouldReduceMotion = useReducedMotion();

  const fadeIn = {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' },
  };

  return (
    <div className="space-y-20 pb-20 bg-[#FAF9F6]">
      {/* ── 1. Page Header with Photographic Spatial Showcase ─────── */}
      <section className="bg-[#F6F3EE] border-b border-[#E7E2D8] py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <motion.div
              className="lg:col-span-7 space-y-4"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EDE7DD] border border-[#DDD5C7] text-xs font-oswald font-bold uppercase tracking-wider text-stone-700">
                <Award className="w-3.5 h-3.5 text-stone-700" />
                <span>Platform Mission & Scope</span>
              </div>
              <h1 className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl text-stone-900 tracking-tight leading-[0.98] uppercase">
                Transforming laundry into a connected digital utility.
              </h1>
              <p className="font-erode text-lg sm:text-xl text-stone-600 leading-relaxed max-w-2xl">
                LaundryWave was built to eliminate fragmentation in neighborhood laundry care by giving independent laundry operators enterprise-grade software while delivering transparent, on-demand convenience to consumers.
              </p>
            </motion.div>

            {/* Dual Photographic Spatial Card */}
            <motion.div
              className="lg:col-span-5 grid grid-cols-2 gap-4"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={{ ...fadeIn.transition, delay: 0.1 }}
            >
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md relative group h-64">
                <img
                  src="/images/facility_hero.jpg"
                  alt="Industrial laundry facility"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3.5">
                  <span className="font-oswald font-bold text-xs uppercase tracking-wider text-white">
                    Smart Plant Mesh
                  </span>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md relative group h-64 mt-6">
                <img
                  src="/images/hero_app_dashboard.jpg"
                  alt="Real LaundryWave application dashboard in store atelier"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3.5">
                  <span className="font-oswald font-bold text-xs uppercase tracking-wider text-white">
                    Atelier Terminal
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. The Operational Challenge ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
              Market Context
            </span>
            <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-stone-900 tracking-tight uppercase">
              The operational friction in traditional garment care
            </h2>
            <p className="font-erode text-sm sm:text-base text-stone-600 leading-relaxed">
              Independent laundries and dry cleaners have historically operated with paper tickets, cash tally books, and informal delivery arrangements. Consumers face uncertain turnaround times, manual visits, and lack of status visibility.
            </p>
            <p className="font-erode text-sm sm:text-base text-stone-600 leading-relaxed">
              LaundryWave bridges this gap by creating an integrated marketplace platform where orders, logistics, and payments flow through a centralized, transparent technical infrastructure.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2.5">
              <span className="font-oswald font-bold text-2xl text-stone-700 block">
                01
              </span>
              <h3 className="font-oswald font-bold text-lg text-stone-900 uppercase">Fragmented Local Supply</h3>
              <p className="font-erode text-xs text-stone-600 leading-relaxed">
                Consumers struggle to compare local laundry providers, transparent pricing schedules, and specialty garment capabilities across individual neighborhood stores.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2.5">
              <span className="font-oswald font-bold text-2xl text-stone-700 block">
                02
              </span>
              <h3 className="font-oswald font-bold text-lg text-stone-900 uppercase">Manual Paper Operations</h3>
              <p className="font-erode text-xs text-stone-600 leading-relaxed">
                Facilities tracking items on paper tickets face high risk of garment misplacement, billing disputes, and unclear turnaround commitments.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2.5">
              <span className="font-oswald font-bold text-2xl text-stone-700 block">
                03
              </span>
              <h3 className="font-oswald font-bold text-lg text-stone-900 uppercase">Unmanaged Last-Mile Logistics</h3>
              <p className="font-erode text-xs text-stone-600 leading-relaxed">
                Doorstep pickup and drop-off is managed informally over telephone calls without driver dispatch queues, route clarity, or accountable handover handshakes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2.5">
              <span className="font-oswald font-bold text-2xl text-stone-700 block">
                04
              </span>
              <h3 className="font-oswald font-bold text-lg text-stone-900 uppercase">Absence of Governance</h3>
              <p className="font-erode text-xs text-stone-600 leading-relaxed">
                Store disputes, damage claims, and driver settlements lack an audited transaction log or multi-tier resolution desk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Four-Sided Ecosystem Model with Photo Cards ─────────── */}
      <section className="bg-white border-y border-slate-200/90 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
              Interaction Model
            </span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-stone-900 uppercase tracking-tight">
              How the four ecosystem participants interact
            </h2>
            <p className="font-erode text-stone-600 text-sm sm:text-base leading-relaxed">
              LaundryWave coordinates demand between consumers who need reliable garment care and service providers who need predictable facility capacity and dispatched drivers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Participant 1: Consumer */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-stone-200/80 overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-40 overflow-hidden relative">
                <img
                  src="/images/app_lifestyle.jpg"
                  alt="Consumers ordering on app"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Consumers
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-oswald font-bold text-xl text-stone-900 uppercase">Doorstep Customers</h3>
                  <p className="font-erode text-xs text-stone-600 leading-relaxed mt-1">
                    Experience upfront piece-by-piece garment pricing, choose matching pickup and drop windows, pay securely via Razorpay or COD, and track live status.
                  </p>
                </div>
              </div>
            </div>

            {/* Participant 2: Laundry Store */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-stone-200/80 overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-40 overflow-hidden relative">
                <img
                  src="/images/store_counter.jpg"
                  alt="Laundry store manager reception"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Laundry Stores
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-oswald font-bold text-xl text-stone-900 uppercase">Independent Stores</h3>
                  <p className="font-erode text-xs text-stone-600 leading-relaxed mt-1">
                    Receive incoming customer orders with audio chimes, manage custom service rate books, schedule daily capacity slots, and dispatch delivery drivers.
                  </p>
                </div>
              </div>
            </div>

            {/* Participant 3: Delivery Drivers */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-stone-200/80 overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-40 overflow-hidden relative">
                <img
                  src="/images/doorstep_fleet_logistics.jpg"
                  alt="Electric delivery fleet van and courier delivering garments"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Delivery Fleet
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-oswald font-bold text-xl text-stone-900 uppercase">Delivery Drivers</h3>
                  <p className="font-erode text-xs text-stone-600 leading-relaxed mt-1">
                    Execute structured task runs, transport bags between customer doorsteps and laundry facilities, log COD collections, and track per-order earnings.
                  </p>
                </div>
              </div>
            </div>

            {/* Participant 4: Super Admin */}
            <div className="rounded-3xl bg-[#FAF9F6] border border-stone-200/80 overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-40 overflow-hidden relative">
                <img
                  src="/images/facility_hero.jpg"
                  alt="Platform super admin"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Governance
                </span>
              </div>
              <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-oswald font-bold text-xl text-stone-900 uppercase">Super Admin</h3>
                  <p className="font-erode text-xs text-stone-600 leading-relaxed mt-1">
                    Maintains multi-tenant platform integrity, audits store applications, monitors SLA compliance, calculates driver settlements, and provides dispute resolution.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Form Factor Strategy: Mobile vs Web ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3 mb-10">
          <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
            Form Factor Strategy
          </span>
          <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-stone-900 uppercase tracking-tight">
            Native mobile for on-the-go &middot; Desktop web for operational density
          </h2>
          <p className="font-erode text-stone-600 text-sm sm:text-base">
            We specifically designed our technical frontends to suit the physical context and task density of each user.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mobile Box */}
          <div className="rounded-3xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="h-52 overflow-hidden relative">
              <img
                src="/images/app_lifestyle.jpg"
                alt="Mobile client experience"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-xs font-oswald font-bold uppercase tracking-wider text-white">
                <Smartphone className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>React Native Mobile Client</span>
              </div>
            </div>
            <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-oswald font-bold text-2xl text-stone-900 uppercase">
                  For Customers & Delivery Partners
                </h3>
                <p className="font-erode text-xs sm:text-sm text-stone-600 leading-relaxed mt-2">
                  Customers ordering from home and drivers navigating neighborhood routes require touch-optimized mobile screens with background push notifications, geocoded addresses, and simple status handover toggles.
                </p>
              </div>
              <ul className="text-xs text-stone-600 space-y-2 pt-3 border-t border-stone-100 font-erode">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-700 flex-shrink-0 mt-0.5" />
                  <span>Optimized for handheld touch and quick milestone taps.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-700 flex-shrink-0 mt-0.5" />
                  <span>Lightweight payload suitable for cellular delivery routes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-700 flex-shrink-0 mt-0.5" />
                  <span>Dedicated customer and delivery driver navigation stacks.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Web Box */}
          <div className="rounded-3xl bg-white border border-stone-200/90 shadow-2xs overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all">
            <div className="h-52 overflow-hidden relative">
              <img
                src="/images/store_counter.jpg"
                alt="Web management workspace"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-xs font-oswald font-bold uppercase tracking-wider text-white">
                <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>React 18 + Vite Web Application</span>
              </div>
            </div>
            <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-oswald font-bold text-2xl text-stone-900 uppercase">
                  For Laundry Store Managers & Super Admins
                </h3>
                <p className="font-erode text-xs sm:text-sm text-stone-600 leading-relaxed mt-2">
                  Facility operators and platform administrators need high data density: live order queues, garment price catalog editors, CSV data reporting, real-time alert feeds, and keyboard command palettes.
                </p>
              </div>
              <ul className="text-xs text-stone-600 space-y-2 pt-3 border-t border-stone-100 font-erode">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-700 flex-shrink-0 mt-0.5" />
                  <span>Full-screen data tables with multi-field search and status filtering.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-700 flex-shrink-0 mt-0.5" />
                  <span>Sound-enabled real-time WebSocket order alert feeds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-stone-700 flex-shrink-0 mt-0.5" />
                  <span>Role-guarded Super Admin and Store Admin workspace layouts.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Platform Principles ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F5F2EB] border border-[#DDD5C7] rounded-3xl p-8 sm:p-12 space-y-6">
          <div className="space-y-1">
            <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
              Core Principles
            </span>
            <h3 className="font-oswald font-bold text-3xl sm:text-4xl text-stone-900 uppercase tracking-tight">
              Software engineering standards we adhere to
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-oswald font-bold text-lg text-stone-900 uppercase">Operational Integrity</h4>
              <p className="font-erode text-xs text-stone-600 leading-relaxed">
                Every state transition in an order (from placed to pickup, intake, wash, return, and complete) is validated by backend middleware.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-oswald font-bold text-lg text-stone-900 uppercase">Multi-Tenant Store Isolation</h4>
              <p className="font-erode text-xs text-stone-600 leading-relaxed">
                Stores cannot inspect or tamper with another store&apos;s customer lists, service catalogs, delivery routes, or financial records.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-oswald font-bold text-lg text-stone-900 uppercase">Auditable Settlements</h4>
              <p className="font-erode text-xs text-stone-600 leading-relaxed">
                Platform commission fees and driver earning shares are computed and recorded alongside each order to support transparent payouts and CSV exports.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DDD5C7] flex flex-wrap items-center justify-between gap-4">
            <span className="font-erode text-xs text-stone-500 font-medium">
              Want to see step-by-step role workflows?
            </span>
            <Link
              to={ROUTES.PUBLIC.HOW_IT_WORKS}
              className="inline-flex items-center gap-1.5 text-xs font-oswald font-bold uppercase tracking-wider text-stone-800 hover:text-black"
            >
              <span>Explore Detailed Workflows</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
