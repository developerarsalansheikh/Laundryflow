import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Smartphone,
  Store,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag,
  Clock,
  Layers,
  FileText,
  UserCheck,
  Coins,
  Headphones,
} from 'lucide-react';

const ROLES = [
  {
    id: 'customer',
    label: 'Customer',
    badge: 'Mobile App',
    icon: Smartphone,
    image: '/images/app_lifestyle.jpg',
    description:
      'Step-by-step customer journey from location-based store discovery to door-to-door garment return.',
    steps: [
      {
        number: '1',
        title: 'Browse Available Laundries',
        icon: MapPin,
        desc: 'Customer opens the mobile app, selects their city/location or uses current coordinates to view verified nearby laundry stores with operational status.',
      },
      {
        number: '2',
        title: 'Select Laundry & Services',
        icon: Layers,
        desc: 'Inspect store rating, turnaround SLA, and browse categorized services such as Wash & Fold, Wash & Iron, Dry Cleaning, or Premium Care.',
      },
      {
        number: '3',
        title: 'Configure Garment Cart',
        icon: ShoppingBag,
        desc: 'Add individual garment items (shirts, trousers, ethnic wear, suits, bed linens) with quantities and custom washing or packaging instructions.',
      },
      {
        number: '4',
        title: 'Schedule Pickup & Delivery Windows',
        icon: Calendar,
        desc: 'Select or add a saved delivery address and pick available store time slots for both pickup collection and return delivery.',
      },
      {
        number: '5',
        title: 'Place Order with Flexible Payment',
        icon: CreditCard,
        desc: 'Confirm order breakdown including service subtotal, delivery fee, taxes, and choose between Razorpay online payment or Cash on Delivery (COD).',
      },
      {
        number: '6',
        title: 'Track Live Progress & Receive Alerts',
        icon: Clock,
        desc: 'Monitor real-time status updates as the driver picks up items, facility cleans and presses them, and items are returned back to the doorstep.',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Laundry Store Admin',
    badge: 'Web & Mobile',
    icon: Store,
    image: '/images/hero_app_dashboard.jpg',
    description:
      'Facility operations from order intake and catalog management to capacity time-slots and driver dispatch.',
    steps: [
      {
        number: '1',
        title: 'Access the Laundry Dashboard',
        icon: Store,
        desc: 'Log in to the web or mobile management portal to see real-time store metrics: pending orders, active processing batches, and today’s revenue.',
      },
      {
        number: '2',
        title: 'Review & Accept Incoming Orders',
        icon: Clock,
        desc: 'Listen for real-time sound-enabled Socket.IO incoming order alerts, inspect itemized customer garment lists, and accept orders into queue.',
      },
      {
        number: '3',
        title: 'Manage Service Prices & Garment Catalog',
        icon: Layers,
        desc: 'Add, update, or pause specific cleaning categories, set per-piece rates, turnaround commitments (e.g. 24h, 48h), and custom care add-ons.',
      },
      {
        number: '4',
        title: 'Configure Capacity Time Slots',
        icon: Calendar,
        desc: 'Specify working hours, weekly offs, and hourly booking quotas to prevent intake bottlenecks during peak morning or evening hours.',
      },
      {
        number: '5',
        title: 'Assign Delivery Agents to Tasks',
        icon: Truck,
        desc: 'Dispatch available delivery partners for pickup runs from customer homes or delivery drops once clothes are washed and ironed.',
      },
      {
        number: '6',
        title: 'Track Store Revenue & Reviews',
        icon: Coins,
        desc: 'Inspect store-level financial metrics, commission deductions, customer ratings, and export order history.',
      },
    ],
  },
  {
    id: 'driver',
    label: 'Delivery Partner',
    badge: 'Driver Field App',
    icon: Truck,
    image: '/images/doorstep_fleet_logistics.jpg',
    description:
      'Field logistics execution: accepting tasks, doorstep pickups, handover handshakes, and return drops.',
    steps: [
      {
        number: '1',
        title: 'Log In & Set Online Availability',
        icon: Truck,
        desc: 'Driver opens the mobile handset app, switches status to Online, and views assigned tasks organized by Pickup and Drop tabs.',
      },
      {
        number: '2',
        title: 'Review Pickup Address & Navigation',
        icon: MapPin,
        desc: 'Open navigation notes, contact the customer directly from the handset, and navigate to the apartment or residential address.',
      },
      {
        number: '3',
        title: 'Collect Bag & Verify Status',
        icon: CheckCircle2,
        desc: 'Receive bagged garments from the customer, mark the order as Picked Up in the app, and transport the laundry bag to the assigned store.',
      },
      {
        number: '4',
        title: 'Handover at Laundry Facility',
        icon: Store,
        desc: 'Deposit the bag at the store reception counter, allowing facility intake staff to verify garment counts and begin washing.',
      },
      {
        number: '5',
        title: 'Pickup Clean Orders for Return Drop',
        icon: ShoppingBag,
        desc: 'Once the facility marks the garments Ready, the driver collects the sealed packaging and drives back to the customer doorstep.',
      },
      {
        number: '6',
        title: 'Complete Delivery & Record COD',
        icon: Coins,
        desc: 'Deliver fresh garments, collect cash if the order is Cash on Delivery, mark the order as Delivered, and view earned commission.',
      },
    ],
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    badge: 'Governance Web Engine',
    icon: ShieldCheck,
    image: '/images/facility_hero.jpg',
    description:
      'Platform-wide auditing, store approval governance, SLA compliance monitoring, and financial settlement.',
    steps: [
      {
        number: '1',
        title: 'Audit & Approve New Stores',
        icon: UserCheck,
        desc: 'Inspect pending store applications, review legal paperwork, business addresses, and verify or suspend merchant accounts.',
      },
      {
        number: '2',
        title: 'Monitor Live Network Telemetry',
        icon: Clock,
        desc: 'Maintain platform oversight across all connected stores, inspect open order counts, and detect processing delays.',
      },
      {
        number: '3',
        title: 'Review Multi-Tenant Isolation',
        icon: Layers,
        desc: 'Ensure strict cryptographic and database separation across tenant stores, customer records, and dispatch rosters.',
      },
      {
        number: '4',
        title: 'Manage System-Wide Catalogs & Taxes',
        icon: FileText,
        desc: 'Standardize primary fabric categories, oversee regional GST or VAT tax configurations, and set platform commission rates.',
      },
      {
        number: '5',
        title: 'Manage Platform Support & Disputes',
        icon: Headphones,
        desc: 'Handle multi-tier support tickets submitted by customers, drivers, or store admins regarding damaged garments, delays, or billing issues.',
      },
      {
        number: '6',
        title: 'Process Driver & Store Payouts & CSV Reports',
        icon: FileText,
        desc: 'Calculate weekly net payouts after platform commissions, record payout settlements, and export detailed CSV reports for bookkeeping.',
      },
    ],
  },
];

export const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const shouldReduceMotion = useReducedMotion();

  const currentRole = ROLES.find((r) => r.id === activeTab) || ROLES[0];

  return (
    <div className="space-y-20 pb-20 bg-[#FAF9F6]">
      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <section className="bg-[#F6F3EE] border-b border-[#E7E2D8] py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EDE7DD] border border-[#DDD5C7] text-xs font-oswald font-bold uppercase tracking-wider text-stone-700">
              <Clock className="w-3.5 h-3.5 text-stone-700" />
              <span>Operational Blueprint</span>
            </div>
            <h1 className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl text-stone-900 tracking-tight leading-[0.98] uppercase">
              How the LaundryWave platform operates.
            </h1>
            <p className="font-erode text-lg sm:text-xl text-stone-600 leading-relaxed">
              Explore the verified operational flows for all four ecosystem roles. Select any participant to examine their complete workflow from order placement to final delivery.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Interactive Role Tabs ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Buttons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 p-1.5 bg-[#EDE7DD]/60 rounded-2xl max-w-4xl mx-auto border border-stone-200/80">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = activeTab === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveTab(role.id)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-oswald font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600 cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-stone-800' : 'text-stone-400'}`} />
                <span>{role.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRole.id}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              {/* Role Header Banner with Real Image Card */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 overflow-hidden">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-oswald font-bold text-xs uppercase tracking-wider text-stone-700 bg-[#F5F2EB] px-2.5 py-1 rounded-full border border-[#DDD5C7]">
                      {currentRole.badge}
                    </span>
                    <span className="text-xs text-stone-400">&bull;</span>
                    <span className="font-erode text-xs text-stone-500 font-medium">6 Verified Stages</span>
                  </div>
                  <h2 className="font-oswald font-bold text-3xl sm:text-4xl text-stone-900 uppercase">
                    {currentRole.label} Journey
                  </h2>
                  <p className="font-erode text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
                    {currentRole.description}
                  </p>
                </div>
                {currentRole.image && (
                  <div className="w-full lg:w-72 h-40 rounded-2xl overflow-hidden border border-stone-200/80 shadow-inner flex-shrink-0 relative group">
                    <img
                      src={currentRole.image}
                      alt={currentRole.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                      <span className="font-oswald font-bold text-xs uppercase tracking-wider text-white">
                        {currentRole.label} Interface
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Numbered Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentRole.steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <div
                      key={step.number}
                      className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs space-y-4 relative flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-lg bg-[#F5F2EB] border border-[#DDD5C7] text-stone-800 font-oswald font-bold text-base flex items-center justify-center">
                            {step.number}
                          </span>
                          <StepIcon className="w-4 h-4 text-stone-400" />
                        </div>
                        <h3 className="font-oswald font-bold text-lg text-stone-900 uppercase">{step.title}</h3>
                        <p className="font-erode text-xs text-stone-600 leading-relaxed">{step.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex items-center gap-1.5 text-[11px] font-erode text-stone-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-700 flex-shrink-0" />
                        <span>Verified in repository code</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── 3. High-Level Coordination Diagram (Responsive) ──────────── */}
      <section className="bg-[#FAF9F6] border-y border-stone-200/90 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="font-oswald font-bold text-xs uppercase tracking-widest text-stone-600">
              Architecture Coordination
            </span>
            <h2 className="font-oswald font-bold text-4xl sm:text-5xl text-stone-900 uppercase tracking-tight">
              Real-time synchronization across all four participants
            </h2>
            <p className="font-erode text-stone-600 text-sm sm:text-base leading-relaxed">
              How state updates cascade through the Node.js Socket.IO engine to each client handset.
            </p>
          </div>

          {/* Desktop Responsive Sequence Grid */}
          <div className="hidden lg:grid grid-cols-7 gap-3 items-center">
            {/* Step 1 */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 text-center space-y-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#EDE7DD] text-stone-800 font-oswald font-bold text-sm flex items-center justify-center mx-auto">
                1
              </div>
              <span className="font-oswald font-bold text-xs text-stone-900 block uppercase">Customer App</span>
              <span className="font-erode text-[11px] text-stone-500 block leading-tight">
                Sends POST /orders via REST with item choices & time slot
              </span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-stone-500" />
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 text-center space-y-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#EDE7DD] text-stone-800 font-oswald font-bold text-sm flex items-center justify-center mx-auto">
                2
              </div>
              <span className="font-oswald font-bold text-xs text-stone-900 block uppercase">Express & Socket.IO</span>
              <span className="font-erode text-[11px] text-stone-500 block leading-tight">
                Saves to MongoDB, emits order:new to specific store room
              </span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-stone-500" />
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 text-center space-y-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#EDE7DD] text-stone-800 font-oswald font-bold text-sm flex items-center justify-center mx-auto">
                3
              </div>
              <span className="font-oswald font-bold text-xs text-stone-900 block uppercase">Store Portal</span>
              <span className="font-erode text-[11px] text-stone-500 block leading-tight">
                Plays audio chime, accepts order, assigns delivery agent
              </span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-stone-500" />
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 text-center space-y-2 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#EDE7DD] text-stone-800 font-oswald font-bold text-sm flex items-center justify-center mx-auto">
                4
              </div>
              <span className="font-oswald font-bold text-xs text-stone-900 block uppercase">Driver Handset</span>
              <span className="font-erode text-[11px] text-stone-500 block leading-tight">
                Receives assigned pickup notification and navigation coordinates
              </span>
            </div>
          </div>

          {/* Mobile & Tablet Vertical Flow */}
          <div className="lg:hidden space-y-3 max-w-md mx-auto">
            {[
              {
                num: '1',
                actor: 'Customer Mobile App',
                action: 'Sends POST /orders via REST with garment items, custom instructions, and chosen pickup window.',
              },
              {
                num: '2',
                actor: 'Backend API & Socket.IO Mesh',
                action: 'Validates payload, creates database record, and emits order:new event to the store room channel.',
              },
              {
                num: '3',
                actor: 'Laundry Store Operations Portal',
                action: 'Browser sounds chime alert, manager accepts order into plant queue, and dispatches an available driver.',
              },
              {
                num: '4',
                actor: 'Delivery Partner Handset',
                action: 'Driver app receives task assignment notification with customer contact and navigation coordinates.',
              },
            ].map((item, idx, arr) => (
              <div key={item.num} className="space-y-2">
                <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
                  <span className="w-7 h-7 rounded-full bg-[#EDE7DD] text-stone-800 font-oswald font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.num}
                  </span>
                  <div>
                    <h4 className="font-oswald font-bold text-xs text-stone-900 uppercase">{item.actor}</h4>
                    <p className="font-erode text-xs text-stone-600 leading-relaxed mt-0.5">{item.action}</p>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-4 h-4 text-stone-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
