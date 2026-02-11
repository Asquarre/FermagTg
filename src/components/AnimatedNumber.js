import React, { useEffect, useMemo, useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

const AnimatedNumber = ({ value, className = '' }) => {
  const previousValueRef = useRef(value);
  const nodeRefs = useRef(new Map());

  const stringValue = useMemo(() => value.toString(), [value]);
  const direction = Number(value) >= Number(previousValueRef.current) ? 'up' : 'down';

  useEffect(() => {
    previousValueRef.current = value;
  }, [value]);
  
const getNodeRef = (digitKey) => {
    if (!nodeRefs.current.has(digitKey)) {
      nodeRefs.current.set(digitKey, React.createRef());
    }
    return nodeRefs.current.get(digitKey);
  };
  return (
    <span className={`animated-number ${className}`}>
     {stringValue.split('').map((char, index) => {
        const digitKey = `${index}-${char}`;
        const nodeRef = getNodeRef(digitKey);

        return (
          <span key={`slot-${index}`} className="digit-wrapper">
            <SwitchTransition mode="out-in">
              <CSSTransition
                key={digitKey}
                nodeRef={nodeRef}
                timeout={300}
                classNames={`digit-${direction}`}
              >
                <span ref={nodeRef} className="digit">
                  {char}
                </span>
              </CSSTransition>
            </SwitchTransition>
          </span>
        );
      })}
    </span>
  );
};

export default AnimatedNumber;
