import { motion } from 'framer-motion';

/**
 * InkTransition
 * Wraps children and provides a "radial ink bleed" reveal/hide animation.
 */
export function InkTransition({ children, isVisible = true, id = 'ink-mask' }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        initial={false}
        animate={{
          WebkitMaskImage: isVisible 
            ? 'radial-gradient(circle at center, black 100%, transparent 100%)' 
            : 'radial-gradient(circle at center, black 0%, transparent 0%)',
          maskImage: isVisible 
            ? 'radial-gradient(circle at center, black 100%, transparent 100%)' 
            : 'radial-gradient(circle at center, black 0%, transparent 0%)',
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{
          filter: 'url(#inkBleed)', // Apply the organic filter to the mask edges
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
