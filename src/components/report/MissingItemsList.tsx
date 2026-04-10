import { getFlagReasoning } from "@/utils/flagReasoningMap";

interface MissingItem {
  id?: string;
  label?: string;
  why_it_matters?: string;
}

type MissingItemEntry = string | MissingItem;

interface MissingItemsListProps {
  missingItems: MissingItemEntry[];
}

function renderLabel(item: MissingItemEntry): string {
  if (typeof item === "string") return item;
  return item.label || item.id || "Unknown item";
}

export default function MissingItemsList({ missingItems }: MissingItemsListProps) {
  if (!missingItems.length) return null;

  return (
    <section
      className="py-8 px-4 md:px-8 border-b border-border"
      style={{ backgroundColor: "#FAF9F6", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto">
        <p
          style={{
            fontSize: 11,
            color: "hsl(var(--color-caution))",
            letterSpacing: "0.1em",
            fontWeight: 700,
            marginBottom: 16,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          MISSING FROM QUOTE
        </p>

        {missingItems.map((item, i) => {
          const label = renderLabel(item);
          const backendDetail = typeof item !== "string" ? item.why_it_matters : null;
          const reasoning = backendDetail || getFlagReasoning(label);

          return (
            <div
              key={typeof item === "string" ? i : item.id ?? i}
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
                {label}
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
