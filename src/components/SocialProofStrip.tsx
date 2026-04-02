import { useEffect, useMemo, useState } from "react";

import { tickerStrings } from "@/data/tickerStrings";
import { cn } from "@/lib/utils";

type SocialProofStripProps = {
  className?: string;
};

const SocialProofStrip = ({ className }: SocialProofStripProps) => {
  const [rotatedItems, setRotatedItems] = useState<string[]>(() => tickerStrings.slice(0, tickerStrings.length));

  useEffect(() => {
    if (tickerStrings.length === 0) {
      setRotatedItems([]);
      return;
    }

    const randomStart = Math.floor(Math.random() * tickerStrings.length);
    const nextItems = tickerStrings.slice(randomStart).concat(tickerStrings.slice(0, randomStart));
    setRotatedItems(nextItems);
  }, []);

  const visibleItems = rotatedItems.length > 0 ? rotatedItems : tickerStrings;

  const desktopTickerItems = useMemo(
    () => visibleItems.map((item, index) => ({ id: `${item}-${index}-original`, label: item })),
    [visibleItems],
  );

  const clonedTickerItems = useMemo(
    () => visibleItems.map((item, index) => ({ id: `${item}-${index}-clone`, label: item })),
    [visibleItems],
  );

  return (
    <section className={cn("w-full overflow-hidden bg-secondary/30 border-y border-border py-3 flex items-center", className)}>
      <p className="sr-only">Representative examples of WindowMan AI scan findings, catches, and savings. Not a live feed.</p>

      <div className="hidden motion-reduce:flex w-full flex-wrap items-center gap-y-2 px-2">
        {visibleItems.slice(0, 12).map((item, index) => (
          <span key={`${item}-${index}-reduced`} className="text-xs sm:text-sm font-mono text-foreground/80 mx-3">
            {item}
            <span className="mx-3 text-foreground/50">•</span>
          </span>
        ))}
      </div>

      <div className="w-full overflow-hidden motion-reduce:hidden">
        <div
          className="flex min-w-max items-center text-xs sm:text-sm font-mono text-foreground/80 whitespace-nowrap will-change-transform [transform:translate3d(0,0,0)] animate-[ticker_50s_linear_infinite] hover:[animation-play-state:paused]"
        >
          {desktopTickerItems.map((item) => (
            <span key={item.id} className="mx-6 flex items-center gap-3">
              <span>{item.label}</span>
              <span className="text-foreground/50">•</span>
            </span>
          ))}

          <span aria-hidden="true" className="contents">
            {clonedTickerItems.map((item) => (
              <span key={item.id} className="mx-6 flex items-center gap-3">
                <span>{item.label}</span>
                <span className="text-foreground/50">•</span>
              </span>
            ))}
          </span>
        </div>
      </div>
    </section>
  );
};

export default SocialProofStrip;
