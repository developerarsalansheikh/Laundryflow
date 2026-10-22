import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import { ROUTES } from '../../routes/routeConstants';
import { useAuthStore } from '../../store/authStore';

export const Home = () => {
  const shouldReduceMotion = useReducedMotion();
  const { isAuthenticated, role } = useAuthStore();

  const isSuperAdmin = String(role || '').toLowerCase() === 'superadmin';
  const dashboardPath = isSuperAdmin ? ROUTES.SUPERADMIN.DASHBOARD : ROUTES.ADMIN.DASHBOARD;
  const dashboardLabel = isSuperAdmin ? 'Super Admin Portal' : 'Store Dashboard';

  const fadeIn = {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' },
  };

  return (
    <div className="space-y-20 pb-20 bg-[#FAF9F6]">
      {/* ── 1. Architectural Editorial Hero (Inspired by Minimalist Arch Reference) ── */}
      <section className="relative overflow-hidden bg-[#F6F3EE] border-b border-[#E7E2D8] pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-12 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Top Monoline Architectural Emblem */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-900 border border-stone-300/90 bg-white/70 shadow-2xs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="w-4 h-4 text-stone-800"
              >
                <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z" />
                <path d="M9 21V14C9 12.3431 10.3431 11 12 11C13.6569 11 15 12.3431 15 14V21" />
              </svg>
            </div>
            <span className="font-oswald font-bold text-xs tracking-[0.25em] text-stone-600 uppercase">
              LaundryWave &bull; Atelier Standard &bull; Real Software
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Architectural Arch Portal with Bespoke Limestone Garments */}
            <motion.div
              className="lg:col-span-5 flex justify-center lg:justify-start"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={fadeIn.transition}
            >
              <div className="w-full max-w-[310px] sm:max-w-[340px]">
                {/* Semicircle Arch Portal Frame */}
                <div className="w-full aspect-[3/3.8] rounded-t-[140px] sm:rounded-t-[180px] overflow-hidden bg-[#ECE6DC] border border-[#DDD5C7] shadow-xl relative group">
                  <img
                    src="/images/bespoke_garment_arch.jpg"
                    alt="Crisp folded bespoke white shirts and linen garments resting on limestone pedestal"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="font-oswald text-xs font-bold uppercase tracking-widest text-[#F0D59E] block">
                      Atelier Care Spec &bull; 04
                    </span>
                    <span className="font-erode text-xs text-stone-200 mt-0.5 block leading-tight">
                      Organic steam press, delicate sorting &amp; sealed protective packaging.
                    </span>
                  </div>
                </div>
                {/* Architectural pedestal base shelf */}
                <div className="w-full h-3 bg-[#DDD5C7] rounded-b-md shadow-xs border-t border-stone-300/80" />
                <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] font-mono text-stone-500">
                  <span>ATELIER MESH 2026</span>
                  <span>100% STEAM FINISHED</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Editorial Oswald Bold Heading & Value Prop */}
            <motion.div
              className="lg:col-span-7 space-y-7"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              transition={{ ...fadeIn.transition, delay: 0.1 }}
            >
              <div className="space-y-3">
                <span className="font-oswald text-xs font-bold tracking-[0.25em] text-stone-500 uppercase block">
                  Connected Marketplace Operating System
                </span>
                <h1 className="font-oswald font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-stone-900 uppercase tracking-tight leading-[0.95]">
                  Pristine Care.
                  <br />
                  <span className="text-stone-600">Real-Time</span>
                  <br />
                  Operations.
                </h1>
              </div>

              <p className="font-erode text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                LaundryWave connects consumer pickup requests, independent laundry facilities, and last-mile electric fleets through a unified real-time application.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isAuthenticated ? (
                  <Link
                    to={dashboardPath}
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-oswald font-bold uppercase tracking-wider text-white bg-stone-900 hover:bg-black rounded-xl shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Open {dashboardLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    to={ROUTES.AUTH.LOGIN}
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-oswald font-bold uppercase tracking-wider text-white bg-stone-900 hover:bg-black rounded-xl shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Operations Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                <Link
                  to={ROUTES.PUBLIC.HOW_IT_WORKS}
                  className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-oswald font-bold uppercase tracking-wider text-stone-800 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 cursor-pointer"
                >
                  <span>Interactive Workflows</span>
                </Link>

                <Link
                  to={ROUTES.PUBLIC.DOWNLOAD}
                  className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-oswald font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <span>Client Mobile App &rarr;</span>
                </Link>
              </div>

              {/* Key Platform Metrics Pill Bar */}
              <div className="pt-6 border-t border-stone-300/80 grid grid-cols-3 gap-4">
                <div>
                  <span className="font-oswald font-bold text-2xl text-stone-900 block leading-tight">
                    4 ROLES
                  </span>
                  <span className="font-erode text-xs text-stone-500 block">
                    Zero Monolith Clutter
                  </span>
                </div>
                <div>
                  <span className="font-oswald font-bold text-2xl text-stone-600 block leading-tight">
                    100% LIVE
                  </span>
                  <span className="font-erode text-xs text-stone-500 block">
                    Socket.IO Mesh
                  </span>
                </div>
                <div>
                  <span className="font-oswald font-bold text-2xl text-emerald-700 block leading-tight">
                    REST + MDB
                  </span>
                  <span className="font-erode text-xs text-stone-500 block">
                    Audited MongoDB
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. Real Application In Operation (Authentic Software Showcase) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F2EB] border border-[#DDD5C7]">
            <span className="w-2 h-2 rounded-full bg-stone-600 animate-pulse" />
            <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
              Live Commercial Software
            </span>
          </div>
          <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-slate-900 uppercase tracking-tight">
            The Laundry Operating Cockpit
          </h2>
          <p className="font-erode text-base sm:text-lg text-slate-600 leading-relaxed">
            Real software running in active laundry studios: live order feeds, facility telemetry, and instant driver dispatching.
          </p>
        </div>

        {/* Real Software Browser Frame with Realistic Image */}
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl bg-white">
          {/* Browser / Application Top Bar */}
          <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs font-mono text-slate-500 hidden sm:inline">
                https://app.laundrywave.com/store-terminal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-oswald font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Socket.IO Live Room Connected
              </span>
            </div>
          </div>

          {/* High Resolution Real Software Showcase Image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 group">
            <img
              src="/images/hero_app_dashboard.jpg"
              alt="Real LaundryWave software application running in boutique laundry studio"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 sm:p-8">
              <div className="text-white space-y-1">
                <span className="font-oswald font-bold text-xs uppercase tracking-widest text-cyan-300 block">
                  Store Operations Terminal &bull; Active Production
                </span>
                <p className="font-erode text-sm sm:text-base text-slate-200 max-w-xl">
                  Live order tracking, turnaround SLA timers, and automated customer status handshakes configured in software.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Real Photography Showcase (High-Impact Images, Low Text) ─ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
              Operational Quality
            </span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-slate-900 uppercase tracking-tight mt-1">
              Industrial Care. Pristine Delivery.
            </h2>
          </div>
          <p className="font-erode text-sm sm:text-base text-slate-600 max-w-md">
            Commercial equipment, non-toxic detergents, and audited driver collection runs configured in software.
          </p>
        </div>

        {/* 4 Spatial Photographic Cards with Real Generated Imagery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Smart Laundry Facility */}
          <div className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="h-60 overflow-hidden relative">
              <img
                src="/images/facility_hero.jpg"
                alt="Automated industrial laundry facility"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
                Facility Bay 01 &bull; Active
              </span>
              <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white">
                500 kg/hr
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-oswald font-bold text-xl text-slate-900 uppercase tracking-wide">
                  Smart Plant Infrastructure
                </h3>
                <p className="font-erode text-xs text-slate-600 leading-relaxed mt-1">
                  Automated industrial washing drums, sensor calibration, and load distribution with zero queue delay.
                </p>
              </div>
              <span className="font-oswald font-bold text-[11px] text-stone-700 hover:text-stone-900 uppercase tracking-wider">
                Industrial Drum Mesh &rarr;
              </span>
            </div>
          </div>

          {/* Card 2: Luxury Garment Care */}
          <div className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="h-60 overflow-hidden relative">
              <img
                src="/images/bespoke_garment_arch.jpg"
                alt="Crisp folded garments with steam finishing and eco packaging"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30">
                Artisanal Steam Press
              </span>
              <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white">
                100% Cotton & Cashmere
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-oswald font-bold text-xl text-slate-900 uppercase tracking-wide">
                  Luxury Garment Care
                </h3>
                <p className="font-erode text-xs text-slate-600 leading-relaxed mt-1">
                  Gentle temperature curves, fine fabric pressing, crisp collar alignment, and biodegradable seals.
                </p>
              </div>
              <span className="font-oswald font-bold text-[11px] text-stone-700 hover:text-stone-900 uppercase tracking-wider">
                Steam Finished & Inspected &rarr;
              </span>
            </div>
          </div>

          {/* Card 3: Doorstep Delivery (Using our new realistic courier & electric van image) */}
          <div className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="h-60 overflow-hidden relative">
              <img
                src="/images/doorstep_fleet_logistics.jpg"
                alt="Electric delivery fleet van and courier delivering freshly cleaned clothes to residential home"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                Electric Fleet Courier
              </span>
              <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white">
                Handover OTP Verified
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-oswald font-bold text-xl text-slate-900 uppercase tracking-wide">
                  Doorstep Logistics
                </h3>
                <p className="font-erode text-xs text-slate-600 leading-relaxed mt-1">
                  Guaranteed hourly collection windows, direct apartment handshakes, and immediate app state triggers.
                </p>
              </div>
              <span className="font-oswald font-bold text-[11px] text-stone-700 hover:text-stone-900 uppercase tracking-wider">
                GPS Handset Navigated &rarr;
              </span>
            </div>
          </div>

          {/* Card 4: High-Precision Capacity */}
          <div className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="h-60 overflow-hidden relative">
              <img
                src="/images/laundry_washing.jpg"
                alt="Industrial grade laundry drums with water cycle management"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-blue-300 border border-blue-500/30">
                Water & Power Sensor
              </span>
              <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white">
                Eco-Cycle 40&deg;C
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-oswald font-bold text-xl text-slate-900 uppercase tracking-wide">
                  Capacity Scheduling
                </h3>
                <p className="font-erode text-xs text-slate-600 leading-relaxed mt-1">
                  Real-time store hours and machine slot quotas prevent plant bottlenecks and delivery backlogs.
                </p>
              </div>
              <span className="font-oswald font-bold text-[11px] text-stone-700 hover:text-stone-900 uppercase tracking-wider">
                Store Admin Managed &rarr;
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Four Dedicated Interfaces ────────────────────────────── */}
      <section className="bg-white border-y border-slate-200/90 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
              Form Factor Specialization
            </span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-slate-900 uppercase tracking-tight">
              One Engine. Four Built-For-Purpose Interfaces.
            </h2>
            <p className="font-erode text-sm sm:text-base text-slate-600 leading-relaxed">
              Every participant gets the exact data density and hardware controls required for their task.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Role 1: Customer */}
            <div className="bg-[#FAF9F6] border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/app_lifestyle.jpg"
                  alt="Customer booking laundry services on smartphone"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Customer App
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="font-oswald font-bold text-xs text-stone-600 uppercase tracking-wider block">
                    React Native Client
                  </span>
                  <h3 className="font-oswald font-bold text-2xl text-slate-900 uppercase tracking-wide mt-0.5">
                    Customer
                  </h3>
                  <p className="font-erode text-xs text-slate-600 leading-relaxed mt-2">
                    Transparent piece-by-piece price sheets, hourly pickup windows, live status milestones, and instant phone OTP authentication.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/70 text-[11px] font-oswald font-bold uppercase tracking-wider text-slate-500">
                  Touch & Location Optimized
                </div>
              </div>
            </div>

            {/* Role 2: Laundry Admin */}
            <div className="bg-[#FAF9F6] border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/hero_app_dashboard.jpg"
                  alt="Laundry store manager reception terminal"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Store Terminal
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="font-oswald font-bold text-xs text-stone-600 uppercase tracking-wider block">
                    Desktop Web & Mobile Portal
                  </span>
                  <h3 className="font-oswald font-bold text-2xl text-slate-900 uppercase tracking-wide mt-0.5">
                    Store Admin
                  </h3>
                  <p className="font-erode text-xs text-slate-600 leading-relaxed mt-2">
                    Socket.IO audio chime alerts for incoming orders, custom service CRUD, daily slot capacity controls, and driver dispatching.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/70 text-[11px] font-oswald font-bold uppercase tracking-wider text-slate-500">
                  High-Density Store Console
                </div>
              </div>
            </div>

            {/* Role 3: Delivery Partner */}
            <div className="bg-[#FAF9F6] border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/doorstep_fleet_logistics.jpg"
                  alt="Delivery partner managing route and garment handshakes"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Field Handset
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="font-oswald font-bold text-xs text-stone-600 uppercase tracking-wider block">
                    Driver Field App
                  </span>
                  <h3 className="font-oswald font-bold text-2xl text-slate-900 uppercase tracking-wide mt-0.5">
                    Delivery Partner
                  </h3>
                  <p className="font-erode text-xs text-slate-600 leading-relaxed mt-2">
                    Separate pickup and return drop task tabs, turn-by-turn customer navigation notes, COD cash logging, and per-drop commissions.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/70 text-[11px] font-oswald font-bold uppercase tracking-wider text-slate-500">
                  Turn-by-Turn Field Module
                </div>
              </div>
            </div>

            {/* Role 4: Super Admin */}
            <div className="bg-[#FAF9F6] border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-lg transition-all">
              <div className="h-44 overflow-hidden relative">
                <img
                  src="/images/facility_hero.jpg"
                  alt="Super admin platform plant telemetry and store governance"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-oswald font-bold uppercase tracking-wider text-white">
                  Platform Oversight
                </span>
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="font-oswald font-bold text-xs text-stone-600 uppercase tracking-wider block">
                    Web Governance Engine
                  </span>
                  <h3 className="font-oswald font-bold text-2xl text-slate-900 uppercase tracking-wide mt-0.5">
                    Super Admin
                  </h3>
                  <p className="font-erode text-xs text-slate-600 leading-relaxed mt-2">
                    Store onboarding auditing, multi-tenant isolation verification, driver commission settlements, and platform accounting CSV exports.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/70 text-[11px] font-oswald font-bold uppercase tracking-wider text-slate-500">
                  Platform Governance & Audit
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Implemented Order Lifecycle Pipeline ──────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
            Verified State Machine
          </span>
          <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-slate-900 uppercase tracking-tight">
            Order Lifecycle Handshakes
          </h2>
          <p className="font-erode text-sm sm:text-base text-slate-600 leading-relaxed">
            Validated by Express router middleware and synchronized across all clients via Socket.IO events.
          </p>
        </div>

        {/* Stepper Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            {
              step: '01',
              title: 'ORDER PLACED',
              role: 'CUSTOMER',
              desc: 'Selects items, pickup slot, and confirms checkout via Razorpay or COD.',
            },
            {
              step: '02',
              title: 'DISPATCH ASSIGNED',
              role: 'STORE ADMIN',
              desc: 'Chime sounds, manager accepts items and assigns available delivery agent.',
            },
            {
              step: '03',
              title: 'ITEMS COLLECTED',
              role: 'DELIVERY PARTNER',
              desc: 'Driver arrives at doorstep, receives garment bag, and departs for plant.',
            },
            {
              step: '04',
              title: 'PLANT INTAKE & WASH',
              role: 'FACILITY',
              desc: 'Garments counted, inspected, washed, dried, pressed, and bagged.',
            },
            {
              step: '05',
              title: 'RETURN TRANSIT',
              role: 'DELIVERY PARTNER',
              desc: 'Driver picks packaged order from counter and navigates to customer.',
            },
            {
              step: '06',
              title: 'DELIVERED & SETTLED',
              role: 'PLATFORM ENGINE',
              desc: 'Customer receives fresh clothes, COD recorded, payouts computed.',
            },
          ].map((stage) => (
            <div
              key={stage.step}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2.5 flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-oswald font-bold text-3xl text-stone-800">
                    {stage.step}
                  </span>
                  <span className="text-[10px] font-oswald font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {stage.role}
                  </span>
                </div>
                <h4 className="font-oswald font-bold text-sm text-slate-900 uppercase tracking-wide mt-2">
                  {stage.title}
                </h4>
                <p className="font-erode text-xs text-slate-600 leading-relaxed mt-1">
                  {stage.desc}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] font-erode text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Backend Verified</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Spatial CTA Banner with Cinematic Facility Backdrop ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-[#070b14] text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-white/10 shadow-2xl">
          {/* Real Photo Background with Gradient Blend */}
          <div className="absolute inset-0 z-0">
            <img
              src="/images/facility_hero.jpg"
              alt="Industrial smart laundry facility operations"
              className="w-full h-full object-cover opacity-25 filter saturate-150 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b14] via-[#070b14]/85 to-transparent" />
          </div>

          {/* Ambient luminous glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#E5C378] animate-pulse" />
              <span className="font-oswald font-bold text-xs uppercase tracking-widest text-[#F0D59E]">
                LaundryWave Enterprise Engine
              </span>
            </div>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl uppercase tracking-tight leading-[0.98]">
              Ready to operate modern laundry logistics?
            </h2>
            <p className="font-erode text-base sm:text-lg text-slate-300 leading-relaxed">
              Explore step-by-step role blueprints, inspect verified feature matrices, or access the store operations portal today.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-oswald font-bold uppercase tracking-wider text-stone-950 bg-white hover:bg-stone-100 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Access Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.PUBLIC.HOW_IT_WORKS}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-oswald font-bold uppercase tracking-wider text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                <span>Interactive Blueprints</span>
              </Link>
              <Link
                to={ROUTES.PUBLIC.ABOUT}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-oswald font-bold uppercase tracking-wider text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 rounded-xl transition-all cursor-pointer"
              >
                <span>About Platform</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
