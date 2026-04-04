import { motion } from "framer-motion";

const nodes = [
  { label: "Audit validates scope", angle: 0 },
  { label: "Homeowner gains trust", angle: 72 },
  { label: "Quality contractor wins", angle: 144 },
  { label: "Data strengthens audit", angle: 216 },
  { label: "Network effect grows", angle: 288 },
];

const Flywheel = () => {
  const radius = 120;

  return (
    <div className="relative w-[320px] h-[320px] mx-auto">
      <motion.div
        className="absolute inset-4 rounded-full border border-border/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      <div
        className="absolute inset-0 m-auto w-16 h-16 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--c-glow-orange) / 0.2) 0%, transparent 70%)",
        }}
      />

      {nodes.map((node, i) => {
        const rad = (node.angle - 90) * (Math.PI / 180);
        const x = 160 + radius * Math.cos(rad) - 40;
        const y = 160 + radius * Math.sin(rad) - 20;

        return (
          <motion.div
            key={node.label}
            className="absolute w-20 text-center"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.2 + 0.3,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-primary mx-auto mb-1"
              animate={{
                boxShadow: [
                  "0 0 0px hsl(30 100% 56% / 0.3)",
                  "0 0 12px hsl(30 100% 56% / 0.6)",
                  "0 0 0px hsl(30 100% 56% / 0.3)",
                ],
              }}
              transition={{
                duration: 2.4,
                delay: i * 1.2,
                repeat: Infinity,
              }}
            />
            <span className="text-[10px] leading-tight block text-sky-300">
              {node.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Flywheel;