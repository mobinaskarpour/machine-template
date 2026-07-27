"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { pageTransition, variantsSafe, spring } from "@/lib/motion";
import { useReducedMotion } from "./MotionProvider";

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const variants = variantsSafe(reduced, pageTransition);

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={
        reduced ? { opacity: 0 } : { opacity: 0, y: 8 }
      }
      animate={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, y: 0 }
      }
      transition={
        reduced
          ? { duration: 0.01 }
          : { delay, ...spring.soft }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
