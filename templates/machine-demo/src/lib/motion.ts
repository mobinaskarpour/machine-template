import type { Transition, Variants } from "framer-motion";

export const timing = {
  hover: 0.12,
  click: 0.18,
  panel: 0.3,
  page: 0.45,
  hero: 0.7,
  voice: 1.0,
} as const;

export const spring = {
  gentle: { type: "spring", stiffness: 120, damping: 20 } as Transition,
  soft: { type: "spring", stiffness: 80, damping: 18 } as Transition,
  snappy: { type: "spring", stiffness: 200, damping: 25 } as Transition,
  hero: { type: "spring", stiffness: 55, damping: 16 } as Transition,
  panel: { type: "spring", stiffness: 90, damping: 20 } as Transition,
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...spring.soft, duration: timing.page },
  },
  exit: {
    opacity: 0,
    y: -3,
    transition: { ...spring.gentle, duration: timing.page * 0.45 },
  },
};

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: spring.soft,
  },
};

export const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
  },
  item: fadeUp,
  fast: {
    animate: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
  },
  hero: {
    animate: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
  },
};

export const cardHover = { y: -2, transition: spring.gentle };
export const cardTap = { scale: 0.985, transition: spring.snappy };

export const loopTween = {
  type: "tween" as const,
  duration: 5,
  repeat: Infinity,
  ease: [0.45, 0, 0.55, 1] as const,
};

export const breathe = {
  animate: {
    scale: [1, 1.035, 1],
    opacity: [0.82, 1, 0.82],
  },
  transition: loopTween,
};

export const chartForm = (delay = 0): Transition => ({
  ...spring.soft,
  delay,
  duration: timing.hero,
});

export function variantsSafe(reduced: boolean, variants: Variants): Variants {
  if (!reduced) return variants;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.01 } },
    exit: { opacity: 0, transition: { duration: 0.01 } },
  };
}
