/* Animated gradient blobs — pure CSS, GPU-composited, respects prefers-reduced-motion via Tailwind */
  <div
    className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    aria-hidden="true"
  >
    {/* Blue blob — upper left */}
    <div
      className="absolute animate-blob-drift-1"
      style={{
        top: "5%",
        left: "-10%",
        width: "clamp(400px, 50vw, 800px)",
        height: "clamp(400px, 50vw, 800px)",
        borderRadius: "50%",
        background: "hsl(var(--primary) / 0.06)",
        filter: "blur(120px)",
        willChange: "transform",
      }}
    />

    {/* Orange blob — center right */}
    <div
      className="absolute animate-blob-drift-2"
      style={{
        top: "25%",
        right: "-8%",
        width: "clamp(350px, 40vw, 700px)",
        height: "clamp(350px, 40vw, 700px)",
        borderRadius: "50%",
        background: "hsl(var(--color-vivid-orange) / 0.045)",
        filter: "blur(130px)",
        willChange: "transform",
      }}
    />

    {/* Blue blob — lower left */}
    <div
      className="absolute animate-blob-drift-3"
      style={{
        top: "55%",
        left: "-5%",
        width: "clamp(300px, 45vw, 750px)",
        height: "clamp(300px, 45vw, 750px)",
        borderRadius: "50%",
        background: "hsl(var(--primary) / 0.05)",
        filter: "blur(140px)",
        willChange: "transform",
      }}
    />

    {/* Orange glow — bottom right */}
    <div
      className="absolute animate-blob-drift-4"
      style={{
        top: "78%",
        right: "-5%",
        width: "clamp(300px, 35vw, 600px)",
        height: "clamp(300px, 35vw, 600px)",
        borderRadius: "50%",
        background: "hsl(var(--color-vivid-orange) / 0.04)",
        filter: "blur(120px)",
        willChange: "transform",
      }}
    />
  </div>
);

export default HomepageBackdrop;
