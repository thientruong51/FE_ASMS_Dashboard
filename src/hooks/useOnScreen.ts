import { useEffect, useState, useRef } from "react";

export function useOnScreen<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T | null>(null);
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setIntersecting(entries[0].isIntersecting),
      { root: null, rootMargin, threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isIntersecting };
}
