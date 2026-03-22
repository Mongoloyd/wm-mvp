/**
 * LazySection — Intersection Observer-based lazy loading wrapper.
 *
 * Facebook traffic is 85%+ mobile. This component:
 * 1. Only renders children when they enter the viewport
 * 2. Reduces initial DOM size and JS execution
 * 3. Shows a lightweight skeleton placeholder until loaded
 * 4. Uses rootMargin to pre-load 200px before visible (smooth UX)
 *
 * Usage:
 *   <LazySection height="400px">
 *     <HeavyComponent />
 *   </LazySection>
 */

import { useRef, useState, useEffect, type ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  /** Minimum height for the placeholder to prevent layout shift */
  height?: string;
  /** CSS class for the placeholder */
  className?: string;
  /** How far before the viewport to start loading (default: 200px) */
  rootMargin?: string;
  /** Show a skeleton animation while loading */
  skeleton?: boolean;
}

export function LazySection({
  children,
  height = "200px",
  className = "",
  rootMargin = "200px",
  skeleton = true,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback for browsers without IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (isVisible) {
    return <>{children}</>;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: height }}
      aria-hidden="true"
    >
      {skeleton && (
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-6 w-48 rounded bg-slate-800/50" />
          <div className="h-4 w-full rounded bg-slate-800/30" />
          <div className="h-4 w-3/4 rounded bg-slate-800/30" />
          <div className="h-20 w-full rounded-lg bg-slate-800/20" />
        </div>
      )}
    </div>
  );
}
