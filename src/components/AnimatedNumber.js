// AnimatedNumber.jsx
import React, { useRef, useEffect } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

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
  const { a: currChars, b: prevChars, len } = splitCharsRightAligned(value, prevRef.current);

  useEffect(() => {
    prevRef.current = value;
    firstRender.current = false;
  }, [value]);

  return (
    <span className={`animated-number ${className}`}>
      {Array.from({ length: len }, (_, i) => {
        const posFromRight = len - 1 - i;
        const curr = currChars[i];
        const prev = prevChars[i];
        const isDigit = /\d/.test(curr) && /\d/.test(prev);
        let dir = 'none';
        if (!firstRender.current && isDigit && curr !== prev) {
          dir = Number(curr) > Number(prev) ? 'up' : 'down';
        }
        const key = `${posFromRight}:${curr}`;

        return (
          <span key={posFromRight} className="digit-wrapper">
            <TransitionGroup component={null}>
              <CSSTransition
                key={key}
                timeout={220} // slightly longer for smoother feel
                classNames={dir === 'none' ? 'digit-none' : `digit-${dir}`}
              >
                <span className="digit">{curr}</span>
              </CSSTransition>
            </TransitionGroup>
          </span>
        );
      })}
    </span>
  );
};

export default AnimatedNumber;
