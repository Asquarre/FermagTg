import React, { useEffect, useState } from 'react';
import './AnimatedNumber.css';

const AnimatedNumber = ({ value, duration = 300 }) => {
  const [previousValue, setPreviousValue] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (value !== previousValue) {
      setAnimating(true);
      const timeout = setTimeout(() => {
        setAnimating(false);
        setPreviousValue(value);
      }, duration);
      return () => clearTimeout(timeout);
    }
  }, [value, previousValue, duration]);

  const newStr = String(value);
  const prevStr = String(previousValue);
  const maxLen = Math.max(newStr.length, prevStr.length);
  const newArr = Array.from({ length: maxLen }, (_, i) =>
    newStr[newStr.length - maxLen + i] || ' '
  );
  const prevArr = Array.from({ length: maxLen }, (_, i) =>
    prevStr[prevStr.length - maxLen + i] || ' '
  );

  return (
    <span className="animated-number">
      {newArr.map((char, idx) => {
        const prevChar = prevArr[idx];
        const isDigit = /\d/.test(char) && /\d/.test(prevChar);
        if (!isDigit) {
          return (
            <span key={idx} className="static-char">
              {char.trim() === '' ? '\u00a0' : char}
            </span>
          );
        }
        const changed = char !== prevChar;
        return (
          <span
            key={idx}
            className={`digit-container ${
              animating && changed ? 'animate' : ''
            }`}
          >
            <span className="digit prev">{prevChar}</span>
            <span className="digit curr">{char}</span>
          </span>
        );
      })}
    </span>
  );
};

export default AnimatedNumber;