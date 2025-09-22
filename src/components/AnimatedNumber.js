import React, { useRef, useEffect } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const AnimatedNumber = ({ value, className = '' }) => {
  const previous = useRef(value);
  const direction = Number(value) >= Number(previous.current) ? 'up' : 'down';

  useEffect(() => {
    previous.current = value;
  }, [value]);

  return (
    <span className={`animated-number ${className}`}>
      {value
        .toString()
        .split('')
        .map((char, index) => (
          <span key={index} className="digit-wrapper">
            <TransitionGroup component={null}>
              <CSSTransition
                key={`${char}-${index}`}
                timeout={150}
                classNames={`digit-${direction}`}
              >
                <span className="digit">{char}</span>
              </CSSTransition>
            </TransitionGroup>
          </span>
        ))}
    </span>
  );
};

export default AnimatedNumber;
