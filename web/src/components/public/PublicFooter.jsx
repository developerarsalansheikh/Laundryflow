import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConstants';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const PublicFooter = () => {
  return (
    <footer className="bg-[#161412] text-stone-300 border-t border-[#2B2620] mt-auto font-erode">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand Info (col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            <Link
              to={ROUTES.PUBLIC.HOME}
              className="inline-flex items-center gap-3.5 focus-visible:outline-none rounded-lg group"
            >
              <img
                src="/logo.svg"
                onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                alt="LaundryWave Logo"
                className="w-11 h-11 object-contain rounded-2xl shadow-2xs group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-wider text-white font-oswald uppercase group-hover:text-stone-300 transition-colors">
                  LaundryWave
                </span>
                <span className="text-[11px] font-medium text-[#C5A059] tracking-wider uppercase -mt-0.5 font-oswald">
                  Garment Care &bull; Multi-Tenant Platform
                </span>
              </div>
            </Link>

            <p className="text-sm text-stone-400 max-w-sm leading-relaxed font-erode">
              An end-to-end multi-sided laundry marketplace connecting consumers, independent laundry facilities, delivery drivers, and platform operators through unified web and mobile technology.
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 text-xs text-stone-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Express API &amp; Socket.IO Services Operational</span>
            </div>
          </div>

          {/* Site Navigation (col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-100 font-oswald">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to={ROUTES.PUBLIC.HOME}
                  className="text-stone-400 hover:text-stone-100 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.PUBLIC.ABOUT}
                  className="text-stone-400 hover:text-stone-100 transition-colors"
                >
                  About the Platform
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.PUBLIC.HOW_IT_WORKS}
                  className="text-stone-400 hover:text-stone-100 transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.PUBLIC.FEATURES}
                  className="text-stone-400 hover:text-stone-100 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.PUBLIC.DOWNLOAD}
                  className="text-stone-400 hover:text-stone-100 transition-colors"
                >
                  Download App
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem Roles (col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-100 font-oswald">
              Ecosystem
            </h3>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>Customer App</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>Store Admin</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>Delivery Partner</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C5A059] flex-shrink-0" />
                <span>Super Admin</span>
              </li>
            </ul>
          </div>

          {/* Admin Operations Access (col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-100 font-oswald">
              Staff &amp; Operations
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed font-erode">
              Secure operational access for registered laundry facility managers and system administrators.
            </p>
            <div>
              <Link
                to={ROUTES.AUTH.LOGIN}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-oswald font-bold uppercase tracking-wider text-stone-900 bg-stone-100 hover:bg-white rounded-xl transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Access Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#2B2620] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-erode">
          <p>
            LaundryWave &copy; {new Date().getFullYear()} &bull; Multi-Tenant Laundry Platform.
          </p>
          <div className="flex items-center gap-4 text-stone-500">
            <span>React Native &bull; React 18 &bull; Express 5 &bull; MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
