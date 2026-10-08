import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Transition configuration optimized for smooth 60fps micro-interactions
const transitionConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// GPU-accelerated variants utilizing ONLY transform and opacity
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitionConfig },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 }, // Using y (translateY) instead of margin
  visible: { opacity: 1, y: 0, transition: transitionConfig },
  exit: { opacity: 0, y: 30, transition: { duration: 0.2 } },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitionConfig },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

interface MicroInteractionEngineProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slideUp' | 'scale';
  isVisible?: boolean;
  className?: string;
  layoutId?: string;
}

/**
 * MicroInteractionEngine ensures hardware-accelerated animations for low-end Android devices.
 * It strictly avoids CPU-bound properties like height, width, and margins.
 */
export const MicroInteractionEngine: React.FC<MicroInteractionEngineProps> = ({
  children,
  animationType = 'fade',
  isVisible = true,
  className = '',
  layoutId,
}) => {
  let variants = fadeVariants;
  if (animationType === 'slideUp') variants = slideUpVariants;
  if (animationType === 'scale') variants = scaleVariants;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          layoutId={layoutId}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          className={className}
          // The willChange hint helps browsers promote the element to its own composite layer
          style={{ willChange: 'transform, opacity' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MicroInteractionEngine;
