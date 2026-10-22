import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Apple,
  Laptop,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ROUTES } from '../../routes/routeConstants';

export const Download = () => {
  const shouldReduceMotion = useReducedMotion();

  const fadeIn = {
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' },
  };

  return (
    <div className="space-y-16 pb-20 bg-[#FAF9F6] font-erode">
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
              <Smartphone className="w-3.5 h-3.5 text-stone-700" />
              <span>Mobile Distribution Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-oswald font-bold text-stone-900 tracking-tight uppercase">
              Mobile application release status.
            </h1>
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-erode">
              Transparent distribution status for our React Native mobile application across Android and iOS platforms.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Honest Distribution Cards ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Verification Status Banner */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200/90 text-stone-800 flex items-start gap-3.5 shadow-2xs">
          <Info className="w-5 h-5 text-stone-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <span className="font-bold text-stone-900 block font-oswald uppercase text-base">Repository Release Disclosure</span>
            <p className="leading-relaxed text-stone-600 font-erode">
              The React Native mobile codebase is complete in the project repository (<code className="text-stone-800 font-mono bg-stone-100 px-1 py-0.5 rounded">mobile/</code> directory). Compiled binary releases (<code className="text-stone-700 font-mono">.apk</code> / <code className="text-stone-700 font-mono">.ipa</code>) and public store listings are currently in packaging stages. No speculative download URLs or mock store buttons are presented.
            </p>
          </div>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Platform 1: Android APK */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE7DD] border border-[#DDD5C7] flex items-center justify-center text-stone-800">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold uppercase tracking-wide border border-stone-200">
                  Build Staging
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-oswald font-bold text-stone-900 uppercase">Android APK</h3>
                <span className="text-xs text-stone-500 font-medium">
                  Direct Package Download (.apk)
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-erode">
                Direct distribution package for Android devices (v8.0 Oreo and above). Contains complete Consumer, Delivery Partner, and Store Admin mobile modules.
              </p>

              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600 font-erode">
                <div className="flex items-center justify-between">
                  <span>Architecture</span>
                  <span className="font-semibold text-stone-900">ARM64 & x86_64</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Distribution</span>
                  <span className="font-semibold text-stone-900">Direct Sideload</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-semibold text-stone-700">Ready in Repo</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-stone-100">
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl bg-stone-100 text-stone-400 font-semibold text-xs text-center border border-stone-200 cursor-not-allowed uppercase font-oswald"
              >
                Binary Download Activates Post-Build
              </button>
              <p className="text-[11px] text-center text-stone-500 font-erode">
                Release link will activate upon build signing
              </p>
            </div>
          </div>

          {/* Platform 2: Google Play Store */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE7DD] border border-[#DDD5C7] flex items-center justify-center text-stone-800">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold uppercase tracking-wide border border-stone-200">
                  Coming Soon
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-oswald font-bold text-stone-900 uppercase">Google Play Store</h3>
                <span className="text-xs text-stone-500 font-medium">
                  Official Android Store Listing
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-erode">
                Google Play Store release undergoing policy verification and internal closed-track testing prior to general consumer availability.
              </p>

              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600 font-erode">
                <div className="flex items-center justify-between">
                  <span>Target Format</span>
                  <span className="font-semibold text-stone-900">Android App Bundle (.aab)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Push Service</span>
                  <span className="font-semibold text-stone-900">FCM Push Configured</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Listing Status</span>
                  <span className="font-semibold text-stone-700">In Preparation</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-stone-100">
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl bg-stone-100 text-stone-400 font-semibold text-xs text-center border border-stone-200 cursor-not-allowed uppercase font-oswald"
              >
                Google Play &mdash; In Review
              </button>
              <p className="text-[11px] text-center text-stone-500 font-erode">
                Store listing URL will be posted post-review
              </p>
            </div>
          </div>

          {/* Platform 3: Apple App Store */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE7DD] border border-[#DDD5C7] flex items-center justify-center text-stone-800">
                  <Apple className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-[11px] font-bold uppercase tracking-wide border border-stone-200">
                  Coming Soon
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-oswald font-bold text-stone-900 uppercase">Apple App Store</h3>
                <span className="text-xs text-stone-500 font-medium">
                  iOS & iPadOS Native Client
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-erode">
                iOS application built with React Native for iPhones running iOS 14.0 or later, currently preparing for TestFlight distribution.
              </p>

              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600 font-erode">
                <div className="flex items-center justify-between">
                  <span>Compatibility</span>
                  <span className="font-semibold text-stone-900">iOS 14.0+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Framework</span>
                  <span className="font-semibold text-stone-900">React Native 0.76</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Channel</span>
                  <span className="font-semibold text-stone-700">TestFlight Staging</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-stone-100">
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl bg-stone-100 text-stone-400 font-semibold text-xs text-center border border-stone-200 cursor-not-allowed uppercase font-oswald"
              >
                App Store &mdash; In Preparation
              </button>
              <p className="text-[11px] text-center text-stone-500 font-erode">
                TestFlight and App Store links will be published here
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Live Web Portals Banner ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-oswald">
                Live & Operational Today
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-oswald font-bold text-stone-900 uppercase">
              Web Admin & Super Admin Management Portals
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed font-erode">
              While the mobile binaries are in release preparation, the web application is fully operational for authorized laundry store managers and platform administrators.
            </p>
          </div>

          <Link
            to={ROUTES.AUTH.LOGIN}
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3.5 text-sm font-oswald font-bold text-white bg-stone-900 hover:bg-black rounded-xl shadow-xs transition-colors uppercase tracking-wider"
          >
            <Laptop className="w-4 h-4" />
            <span>Open Admin Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Download;
