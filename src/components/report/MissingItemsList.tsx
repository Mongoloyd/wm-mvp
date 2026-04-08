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

function renderDetail(item: MissingItemEntry): string | null {
  if (typeof item === "string") return null;
  return item.why_it_matters || null;
}

export default function MissingItemsList({ missingItems }: MissingItemsListProps) {
  if (!missingItems.length) return null;

  return (
    <section className="py-6 px-4 md:px-8 bg-background border-b border-border">
      <div className="max-w-4xl mx-auto">
        <p
          className="font-mono"
          style={{
            fontSize: 10,
            color: "hsl(var(--color-caution))",
            letterSpacing: "0.1em",
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          MISSING FROM QUOTE
        </p>
        {missingItems.map((item, i) => (
          <div
            key={typeof item === "string" ? i : item.id ?? i}
            className="card-raised"
            style={{
              borderLeft: "4px solid hsl(var(--color-caution))",
              padding: "14px 20px",
              marginBottom: 8,
            }}
          >
            <p className="font-body text-foreground font-semibold" style={{ fontSize: 14 }}>
              {renderLabel(item)}
            </p>
            {renderDetail(item) && (
              <p className="font-body text-muted-foreground mt-1" style={{ fontSize: 13 }}>
                {renderDetail(item)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
