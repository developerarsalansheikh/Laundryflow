import { motion, useReducedMotion } from 'framer-motion';
import {
  Smartphone,
  Store,
  Truck,
  ShieldCheck,
  Activity,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

const FEATURE_CATEGORIES = [
  {
    category: 'Customer Mobile Experience',
    badge: 'Mobile App',
    icon: Smartphone,
    image: '/images/app_lifestyle.jpg',
    imageAlt: 'Customer ordering laundry via mobile client',
    secondaryImage: '/images/order_tracking.jpg',
    secondaryImageAlt: 'Live GPS courier order tracking interface',
    secondaryTitle: 'Real-Time Pickup & Route Tracking',
    description:
      'Engineered in React Native for rapid ordering, price transparency, and seamless tracking.',
    features: [
      {
        title: 'Geographic Store Discovery',
        desc: 'Filter verified laundry providers by city and radius to ensure fast collection and localized delivery fees.',
      },
      {
        title: 'Multi-Category Garment Catalog',
        desc: 'Transparent piece-by-piece price sheets for Wash & Fold, Wash & Iron, Dry Cleaning, and delicate fabric handling.',
      },
      {
        title: 'Dynamic Cart & Price Breakdown',
        desc: 'Real-time computation of item subtotal, delivery charges, express fees, and coupon discounts prior to order submission.',
      },
      {
        title: 'Address Management & Geocoding',
        desc: 'Save and nickname multiple delivery locations (Home, Office, Apartment) with contact numbers and landmark notes.',
      },
      {
        title: 'Scheduled Time-Slot Booking',
        desc: 'Choose matching pickup and drop-off windows aligned with store capacity to guarantee driver presence.',
      },
      {
        title: 'Multi-Stage Order Timeline',
        desc: 'Visual progression indicators showing exactly when clothes are picked up, washing, ready, and on route.',
      },
    ],
  },
  {
    category: 'Laundry Business Operations',
    badge: 'Store Portal & App',
    icon: Store,
    image: '/images/hero_app_dashboard.jpg',
    imageAlt: 'Laundry store manager terminal and atelier reception',
    secondaryImage: '/images/store_counter.jpg',
    secondaryImageAlt: 'Boutique garment reception counter and bag tags',
    secondaryTitle: 'Atelier Intake & Service Counter',
    description:
      'Comprehensive workspace for facility managers to accept orders, manage pricing, and coordinate drivers.',
    features: [
      {
        title: 'Real-Time Order Kanban & Feed',
        desc: 'Instant visual and sound alerts for incoming orders with ability to view customer special instructions and garment counts.',
      },
      {
        title: 'Custom Price & Service CRUD',
        desc: 'Full autonomous control to create services, set garment rates, turnaround SLAs, and toggle item availability.',
      },
      {
        title: 'Capacity & Operating Window Control',
        desc: 'Set daily opening/closing hours and configure maximum order quotas per hourly window to avoid plant overloading.',
      },
      {
        title: 'Direct Delivery Agent Dispatching',
        desc: 'Assign specific drivers to inbound pickups and outbound drop-offs with immediate push coordination.',
      },
      {
        title: 'Store Performance Metrics',
        desc: 'Review store-level metrics: today’s completed orders, active in-wash volume, customer counts, and net earnings.',
      },
      {
        title: 'Customer Directory & Order History',
        desc: 'Maintain verified records of regular customers, repeat order frequencies, and address history.',
      },
    ],
  },
  {
    category: 'Delivery Partner Workflows',
    badge: 'Driver Field App',
    icon: Truck,
    image: '/images/doorstep_fleet_logistics.jpg',
    imageAlt: 'Electric delivery fleet courier at residential door',
    secondaryImage: '/images/doorstep_delivery.jpg',
    secondaryImageAlt: 'Driver handing freshly cleaned garments to customer at door',
    secondaryTitle: 'Doorstep Custody Verification',
    description:
      'Touch-optimized field handset module for last-mile collection and return logistics.',
    features: [
      {
        title: 'Active Task Queue',
        desc: 'Real-time separation of pending doorstep pickups versus outbound clean garment returns.',
      },
      {
        title: 'Turn-by-Turn Pickup Details',
        desc: 'Inspect customer phone, delivery address notes, and scheduled pickup hour for prompt arrival.',
      },
      {
        title: 'Milestone Handover Verification',
        desc: 'One-tap status updates (Reached Customer, Items Collected, Transferred to Laundry) ensuring full accountability.',
      },
      {
        title: 'COD Cash Collection Logger',
        desc: 'Clear indicators on orders requiring cash collection upon doorstep handover with confirmation safeguards.',
      },
      {
        title: 'Driver Earnings Ledger',
        desc: 'Transparent review of per-drop commissions, total completed runs, and pending weekly payouts.',
      },
    ],
  },
  {
    category: 'Super Admin Platform Management',
    badge: 'Web Control Center',
    icon: ShieldCheck,
    image: '/images/facility_hero.jpg',
    imageAlt: 'Super admin platform facility management',
    secondaryImage: '/images/empty_orders.jpg',
    secondaryImageAlt: 'Cross-tenant auditing ledger and compliance monitors',
    secondaryTitle: 'Platform Ledger & Compliance Audit',
    description:
      'Complete centralized platform administration, auditing, financial governance, and support desk.',
    features: [
      {
        title: 'Multi-Tenant Store Auditing',
        desc: 'Inspect pending laundry registration applications, verify tax/business paperwork, and approve or suspend stores.',
      },
      {
        title: 'Platform-Wide Order Oversight',
        desc: 'Search, filter, and inspect any active or historical order across all stores with full status logs and timestamps.',
      },
      {
        title: 'Driver Settlement & Commission Engine',
        desc: 'Automated breakdown of platform commission shares, driver earnings, and store payouts with audit status tags.',
      },
      {
        title: 'CSV Reports & Analytics Export',
        desc: 'Download CSV reports covering gross transaction volume, completed orders, and store growth for external bookkeeping.',
      },
      {
        title: 'Multi-Tier Support Ticket Desk',
        desc: 'Built-in support system enabling customers and store operators to file tickets, attach notes, and track resolutions.',
      },
      {
        title: 'Employee Access & RBAC Governance',
        desc: 'Invite platform operators, assign granular permission roles, and enforce session security.',
      },
    ],
  },
  {
    category: 'Garment Finishing & Steam Care',
    badge: 'Plant Craftsmanship',
    icon: Activity,
    image: '/images/bespoke_garment_arch.jpg',
    imageAlt: 'Exquisitely folded garments with steam and eco hangtags',
    secondaryImage: '/images/folded_clothes.jpg',
    secondaryImageAlt: 'Folded crisp cotton and linen textiles with eco seal',
    secondaryTitle: 'Eco-Packaging & Fold Standard',
    description:
      'Artisanal garment care, steam finishing, delicate fabric cycles, and biodegradable packaging.',
    features: [
      {
        title: 'Dedicated Wool & Silk Profiles',
        desc: 'Automatic spin velocity and temperature curve presets matching fragile fabric compositions.',
      },
      {
        title: 'Steam Finishing & Collar Press',
        desc: 'Wrinkle removal and anti-static treatments ensuring presentation-ready garment return.',
      },
      {
        title: 'Biodegradable Eco-Packaging',
        desc: 'Garments sealed with recyclable paper wraps and barcode tags for contactless customer delivery.',
      },
      {
        title: 'Multi-Point Quality Inspection',
        desc: 'Before packaging, every piece is inspected against the intake ledger for stain removal and button integrity.',
      },
    ],
  },
  {
    category: 'Payments & Infrastructure',
    badge: 'Core Services',
    icon: CreditCard,
    image: '/images/laundry_washing.jpg',
    imageAlt: 'Commercial washing drums with water sensors',
    secondaryImage: '/images/washing_machine.jpg',
    secondaryImageAlt: 'Modern smart front-load washing drums in active cycle',
    secondaryTitle: 'Eco Water Sensors & Plant Telemetry',
    description:
      'Secure transaction processing alongside enterprise cloud media uploads and Socket.IO mesh.',
    features: [
      {
        title: 'Razorpay Payment Gateway',
        desc: 'Direct server-side Razorpay order creation (`rzp_order_id`) and HMAC SHA-256 signature verification.',
      },
      {
        title: 'Cash on Delivery (COD) Safeguards',
        desc: 'Full backend validation for cash orders, ensuring proper transaction tracking without online payment flags.',
      },
      {
        title: 'Cloudinary CDN Integration',
        desc: 'Multer + Cloudinary storage pipeline for store profile images, service thumbnails, and garment condition photos.',
      },
      {
        title: 'Socket.IO Room Isolation',
        desc: 'Store rooms and driver queues isolated by tenant id to guarantee private, zero-leak event dispatching.',
      },
    ],
  },
];

export const Features = () => {
  const shouldReduceMotion = useReducedMotion();

  const fadeIn = {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' },
  };

  return (
    <div className="space-y-20 pb-20 bg-[#FAF9F6] font-erode">
      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <section className="bg-[#F6F3EE] border-b border-[#E7E2D8] py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-3xl space-y-3.5"
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EDE7DD] border border-[#DDD5C7] text-xs font-oswald font-bold uppercase tracking-wider text-stone-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-700" />
              <span>Audited Platform Features</span>
            </div>
            <h1 className="font-oswald font-bold text-4xl sm:text-5xl lg:text-6xl text-stone-900 tracking-tight leading-[0.98] uppercase">
              Verified platform capabilities.
            </h1>
            <p className="font-erode text-base sm:text-lg text-stone-600 leading-relaxed">
              Every feature listed below is verified against active source code in the LaundryWave web, backend, and mobile repositories. No speculative or unbuilt claims.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Categorized Feature Matrix ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {FEATURE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.category} className="space-y-6">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/90">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#EDE7DD] border border-[#DDD5C7] text-stone-800 flex items-center justify-center shadow-2xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-oswald font-bold text-xs uppercase tracking-wider text-stone-600 block">
                      {cat.badge}
                    </span>
                    <h2 className="font-oswald font-bold text-2xl sm:text-3xl text-stone-900 uppercase">
                      {cat.category}
                    </h2>
                  </div>
                </div>
                <p className="font-erode text-xs sm:text-sm text-stone-600 max-w-md sm:text-right leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Feature Cards Grid with Visual Spotlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Visual Category Spotlight Card 1 */}
                {cat.image && (
                  <div className="rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm relative group h-full min-h-[240px] flex flex-col justify-end p-6 bg-stone-900">
                    <img
                      src={cat.image}
                      alt={cat.imageAlt || cat.category}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />
                    <div className="relative z-10 space-y-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-stone-800/80 backdrop-blur-md text-[10px] font-oswald font-bold uppercase tracking-wider text-stone-200 border border-stone-700/60">
                        {cat.badge}
                      </span>
                      <h3 className="font-oswald font-bold text-xl text-white uppercase tracking-wide leading-tight">
                        {cat.category}
                      </h3>
                      <p className="font-erode text-xs text-stone-300 line-clamp-2">
                        {cat.imageAlt}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visual Category Spotlight Card 2 (Added to every section!) */}
                {cat.secondaryImage && (
                  <div className="rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm relative group h-full min-h-[240px] flex flex-col justify-end p-6 bg-stone-900">
                    <img
                      src={cat.secondaryImage}
                      alt={cat.secondaryImageAlt || cat.secondaryTitle}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />
                    <div className="relative z-10 space-y-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-stone-800/80 backdrop-blur-md text-[10px] font-oswald font-bold uppercase tracking-wider text-amber-200 border border-stone-700/60">
                        Atelier Focus
                      </span>
                      <h3 className="font-oswald font-bold text-xl text-white uppercase tracking-wide leading-tight">
                        {cat.secondaryTitle}
                      </h3>
                      <p className="font-erode text-xs text-stone-300 line-clamp-2">
                        {cat.secondaryImageAlt}
                      </p>
                    </div>
                  </div>
                )}

                {/* Individual Feature Cards */}
                {cat.features.map((item) => (
                  <div
                    key={item.title}
                    className="p-6 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-stone-900">
                        <CheckCircle2 className="w-4 h-4 text-stone-700 flex-shrink-0" />
                        <h3 className="font-oswald font-bold text-base uppercase tracking-wide">
                          {item.title}
                        </h3>
                      </div>
                      <p className="font-erode text-xs text-stone-600 leading-relaxed pl-6">
                        {item.desc}
                      </p>
                    </div>
                    <div className="pt-2 pl-6 font-oswald font-bold text-[10px] text-stone-400 uppercase tracking-widest">
                      Implemented &bull; Verified
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Features;
