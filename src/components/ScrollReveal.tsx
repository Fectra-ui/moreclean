import { motion, type TargetAndTransition } from "framer-motion";
import { ReactNode } from "react";

type AnimVariant =
  | "fade-up"
  | "fade"
  | "scale"
  | "slide-left"
  | "slide-right"
  | "blur";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: AnimVariant;
}

const variants: Record<
  AnimVariant,
  {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
  }
> = {
  "fade-up": {
    initial: {
      opacity: 0,
      y: 50,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
  },

  fade: {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
    },
  },

  scale: {
    initial: {
      opacity: 0,
      scale: 0.94,
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
  },

  "slide-left": {
    initial: {
      opacity: 0,
      x: -70,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
  },

  "slide-right": {
    initial: {
      opacity: 0,
      x: 70,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
  },

  blur: {
    initial: {
      opacity: 0,
      filter: "blur(18px)",
      y: 20,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
    },
  },
};

const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  variant = "fade-up",
}: ScrollRevealProps) => {
  const v = variants[variant];

  return (
    <motion.div
      initial={v.initial}
      whileInView={v.animate}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;