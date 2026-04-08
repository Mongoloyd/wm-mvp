import type { WarningItem, WarningEntry } from "@/types/reportHybrid";

interface RedFlagsListProps {
  warnings: WarningEntry[];
}

function renderHeadline(item: WarningEntry): string {
  if (typeof item === "string") return item;
  return item.headline || item.detail || item.id || "Unknown warning";
}

function renderDetail(item: WarningEntry): string | null {
  if (typeof item === "string") return null;
  // Only show detail if it's different from headline
  if (item.detail && item.detail !== item.headline) return item.detail;
  return null;
}

export default function RedFlagsList({ warnings }: RedFlagsListProps) {
  if (!warnings.length) return null;

  return (
    <section className="py-6 px-4 md:px-8 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto">
        <p
          className="font-mono"
          style={{
            fontSize: 10,
            color: "hsl(var(--color-danger))",
            letterSpacing: "0.1em",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          RED FLAGS
        </p>
        {warnings.map((warning, i) => (
          <div
            key={typeof warning === "string" ? i : warning.id ?? i}
            className="card-raised"
            style={{
              borderLeft: "4px solid hsl(var(--color-danger))",
              padding: "14px 20px",
              marginBottom: 8,
            }}
          >
            <p className="font-body text-foreground font-semibold" style={{ fontSize: 14 }}>
              {renderHeadline(warning)}
            </p>
            {renderDetail(warning) && (
              <p className="font-body text-muted-foreground mt-1" style={{ fontSize: 13 }}>
                {renderDetail(warning)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
