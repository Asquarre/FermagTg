// animatedNumbers.js
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Right-align two char arrays (current vs previous) so carries don't scramble indices.
 */
const splitCharsRightAligned = (curr, prev) => {
  const a = String(curr).split('');
  const b = String(prev).split('');
  const len = Math.max(a.length, b.length);
  const pad = (arr) => Array(len - arr.length).fill('').concat(arr);
  return { a: pad(a), b: pad(b), len };
};

const AnimatedNumber = ({ value, className = '' }) => {
  const prevRef = useRef(value);
  const firstRender = useRef(true);
  const reduceMotion = useReducedMotion();

  const { a: currChars, b: prevChars, len } = splitCharsRightAligned(
    value,
    prevRef.current
  );

  useEffect(() => {
    prevRef.current = value;
    firstRender.current = false;
  }, [value]);

  // A gentle, iOS-like spring
  const spring = reduceMotion
    ? { duration: 0 } // no animation if user prefers reduced motion
    : { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 };

  return (
    <span className={`animated-number ${className}`}>
      {Array.from({ length: len }, (_, i) => {
        const posFromRight = len - 1 - i;
        const curr = currChars[i] ?? '';
        const prev = prevChars[i] ?? '';

        // Direction per slot (digits only)
        const isDigit = /\d/.test(curr) && /\d/.test(prev);
        const dir =
          !firstRender.current && isDigit && curr !== prev
            ? Number(curr) > Number(prev)
              ? 1 // up
              : -1 // down
            : 0;

        // Key changes when the character at this slot changes
        const key = `${posFromRight}:${curr}`;

        return (
          <span key={posFromRight} className="digit-wrapper">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={key}
                initial={{
                  y: dir === 0 ? 0 : dir > 0 ? '100%' : '-100%',
                  opacity: reduceMotion ? 1 : 0.001,
                  filter: reduceMotion ? 'none' : 'blur(4px)',
                }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{
                  y: dir === 0 ? 0 : dir > 0 ? '-100%' : '100%',
                  opacity: reduceMotion ? 1 : 0.001,
                }}
                transition={spring}
                className="digit"
              >
                {curr}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
};

export default AnimatedNumber;
