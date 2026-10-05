/**
 * Framer Motion Reusable Animation Presets for LaundryFlow Super Admin.
 * Subdued, fast, professional micro-interactions with prefers-reduced-motion support.
 */

// Check if user prefers reduced motion
const prefersReducedMotion = typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const defaultTransition = {
  duration: prefersReducedMotion ? 0 : 0.25,
  ease: [0.25, 0.1, 0.25, 1.0],
};

export const MOTION = Object.freeze({
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: defaultTransition,
  },

  fadeUp: {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -8 },
    transition: defaultTransition,
  },

  fadeDown: {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : -12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    transition: defaultTransition,
  },

  scaleIn: {
    initial: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 },
    transition: defaultTransition,
  },

  slideIn: {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : -16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: prefersReducedMotion ? 0 : 16 },
    transition: defaultTransition,
  },

  pageTransition: {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -8 },
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },

  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
});

export default MOTION;
