import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const CinematicDivider = () => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section ref={ref} className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
      <motion.img
        src="/images/contractors-divider.avif"
        alt=""
        loading="lazy"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ y }}
        className="absolute inset-0 w-full h-[120%] object-cover -top-[10%]"
      />

      {/* Top */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[hsl(216,43%,7%)] to-transparent pointer-events-none z-10" />
      {/* Bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[hsl(216,43%,7%)] to-transparent pointer-events-none z-10" />
      {/* Left */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[hsl(216,43%,7%)] to-transparent pointer-events-none z-10" />
      {/* Right */}
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[hsl(216,43%,7%)] to-transparent pointer-events-none z-10" />
    </section>
  );
};

export default CinematicDivider;
