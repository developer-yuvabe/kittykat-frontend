import { Variants } from "framer-motion";

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export const popVariants: Variants = {
  collapsed: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(6px)",
  },
  open: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

export const expandVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        duration: 0.4,
        ease: "easeOut",
      },
      opacity: {
        duration: 0.25,
        delay: 0.1,
      },
    },
  },
};
