interface MissingItemsListProps {
  missingItems: string[];
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
            key={i}
            className="card-raised"
            style={{
              borderLeft: "4px solid hsl(var(--color-caution))",
              padding: "14px 20px",
              marginBottom: 8,
            }}
          >
            <p className="font-body text-foreground" style={{ fontSize: 14 }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
