

## Fix: TypeScript errors in dispatchWorker.ts and dispatchWorker.test.ts

### Problem Summary

Three type errors stem from the `DBLike` interface shape and a readonly tuple access pattern.

---

### Fix 1 — `dispatchWorker.ts` line 92: Arithmetic on readonly tuple value

`RETRY_DELAYS_MINUTES[retryIndex as keyof typeof RETRY_DELAYS_MINUTES]` resolves to `5 | 30 | 120 | 720 | undefined`. The `if (!minutes) return null` guard eliminates `undefined` at runtime but TS still sees the union as not purely `number`.

**Change**: Cast the accessed value to `number | undefined` explicitly:

```ts
const minutes = RETRY_DELAYS_MINUTES[retryIndex] as number | undefined;
```

This lets the `!minutes` guard narrow to `number` cleanly.

---

### Fix 2 — `dispatchWorker.ts` line 130 & `DBLike` interface (lines 33-36)

The `syncEventDispatchStatus` function chains `.select().eq().in().order()`, but the `DBLike` interface defines `.eq().in()` as returning `{ then?: never }` — no `.order()` method.

**Change**: Update the `DBLike` interface so `.eq().in()` returns an object with `.order()`:

```ts
eq(column: string, value: string): {
  in(column: string, value: string[]): {
    order(column: string, options?: { ascending?: boolean }): Promise<{
      data: Array<Record<string, unknown>> | null;
      error: { message?: string } | null;
    }>;
  };
  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
};
```

---

### Fix 3 — `dispatchWorker.test.ts` MockDB (lines ~44-55)

The MockDB's `.select().eq().in()` chain returns `{ order: () => Promise<...> }`, but the old `DBLike` type expected `{ then?: never }`. With Fix 2 applied, the interface now expects `.order()`, so the MockDB already provides the right shape. However, the TS error persists because the MockDB's `order()` return type includes the concrete `WMDispatchStatus` union in `dispatch_status` rather than `Record<string, unknown>`.

**Change**: Widen the MockDB's `order()` return type to use `Record<string, unknown>` for the data array items, or cast `db` as `DBLike` (via `as unknown as DBLike`) at each call site. The cleanest fix: keep the mock structure and cast `new MockDB([row]) as unknown as DBLike` when passing to `runDispatchWorker`.

Alternatively, change the `order()` return in MockDB to `Promise<{ data: any[]; error: any }>` which satisfies the interface.

---

### Files Changed

| File | Change |
|------|--------|
| `src/lib/tracking/canonical/dispatchWorker.ts` | Fix tuple access cast (line 90); update `DBLike.eq().in()` to include `.order()` (lines 33-36) |
| `src/lib/tracking/canonical/__tests__/dispatchWorker.test.ts` | Cast `MockDB` instances via `as unknown as DBLike` or widen mock return types |

