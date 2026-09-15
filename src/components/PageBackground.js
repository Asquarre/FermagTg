import { useCallback, useEffect, useRef, useState } from 'react';

export default function PageBackground() {
  const firstTile = useRef(null);
  const [count, setCount] = useState(1);
  const update = useCallback(() => {
    const tile = firstTile.current;
    const root = document.getElementById('root');
    if (!tile || !root) return;
    const tileHeight = tile.getBoundingClientRect().height;
    if (tileHeight > 0) {
      setCount(Math.max(1, Math.ceil(Math.max(root.getBoundingClientRect().height, window.innerHeight) / tileHeight)));
    }
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(update);
    observer.observe(document.getElementById('root'));
    observer.observe(firstTile.current);
    window.addEventListener('resize', update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [update]);

  return (
    <div className="page-background" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="page-background-tile" key={index} ref={index === 0 ? firstTile : undefined} />
      ))}
    </div>
  );
}
