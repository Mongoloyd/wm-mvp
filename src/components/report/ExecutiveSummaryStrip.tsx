interface ExecutiveSummaryStripProps {
  summary: string | null | undefined;
  pricePerOpening?: number | null;
  pricePerOpeningBand?: "low" | "market" | "high" | "extreme" | null;
}

export default function ExecutiveSummaryStrip({
  summary,
  pricePerOpening,
  pricePerOpeningBand,
}: ExecutiveSummaryStripProps) {
  if (!summary) return null;

  return (
    <section className="py-6 px-4 md:px-8 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto">
        <p
          className="font-mono"
          style={{
            fontSize: 10,
            color: "hsl(var(--color-cyan))",
            letterSpacing: "0.1em",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          EXECUTIVE SUMMARY
        </p>
        <p
          className="font-body text-foreground"
          style={{ fontSize: 15, lineHeight: 1.7 }}
        >
          {summary}
        </p>
        {pricePerOpening != null && (
          <p
            className="font-mono text-muted-foreground"
            style={{ fontSize: 12, marginTop: 10, letterSpacing: "0.04em" }}
          >
            Est. price per opening: ${pricePerOpening.toLocaleString()}
            {pricePerOpeningBand
              ? ` · ${pricePerOpeningBand.toUpperCase()} BAND`
              : ""}
          </p>
        )}
      </div>
    </section>
  );
}
