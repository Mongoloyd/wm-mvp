import { getFlagReasoning } from "@/utils/flagReasoningMap";

interface WarningItem {
  id?: string;
  headline?: string;
  detail?: string;
  pillar?: string;
  severity?: string;
}

type WarningEntry = string | WarningItem;

interface RedFlagsListProps {
  warnings: WarningEntry[];
}

function renderHeadline(item: WarningEntry): string {
  if (typeof item === "string") return item;
  return item.headline || item.detail || item.id || "Unknown warning";
}

export default function RedFlagsList({ warnings }: RedFlagsListProps) {
  if (!warnings.length) return null;

  return (
    <section
      className="py-8 px-4 md:px-8 border-b border-border"
      style={{ backgroundColor: "#FAF9F6", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto">
        <p
          style={{
            fontSize: 11,
            color: "hsl(var(--color-danger))",
            letterSpacing: "0.1em",
            fontWeight: 700,
            marginBottom: 16,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          RED FLAGS
        </p>

        {warnings.map((warning, i) => {
          const headline = renderHeadline(warning);
          const reasoning = getFlagReasoning(headline);

          return (
            <div
              key={typeof warning === "string" ? i : warning.id ?? i}
              className={i > 0 ? "border-t border-slate-200" : ""}
              style={{ padding: "16px 0" }}
            >
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "hsl(215 25% 15%)",
                  lineHeight: 1.4,
                  margin: 0,
                }}
              >
                {headline}
              </p>
              {reasoning && (
                <p
                  style={{
                    fontSize: 13,
                    color: "hsl(215 15% 45%)",
                    lineHeight: 1.55,
                    marginTop: 6,
                    marginBottom: 0,
                  }}
                >
                  {reasoning}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
