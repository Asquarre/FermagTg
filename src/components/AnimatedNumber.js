import React, { useRef, useEffect } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const AnimatedNumber = ({ value, className = '' }) => {
  const previous = useRef(value);
  const previousDirection = useRef('up');
  const direction = Number(value) === Number(previous.current)
    ? previousDirection.current
    : Number(value) > Number(previous.current) ? 'up' : 'down';

  useEffect(() => {
    previous.current = value;
    previousDirection.current = direction;
  }, [value, direction]);

  return (
    <span className={`animated-number ${className}`}>
      {value
        .toString()
        .split('')
        .map((char, index) => (
          <span key={index} className="digit-wrapper">
            <TransitionGroup
              component={null}
              // Exiting children otherwise retain the direction from their last render.
              childFactory={(child) => React.cloneElement(child, { classNames: `digit-${direction}` })}
            >
              <CSSTransition
                key={`${char}-${index}`}
                timeout={300}
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
