import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createCanonicalEvent } from "../../../../src/lib/tracking/canonical/createCanonicalEvent.ts";
import type { CreateCanonicalEventInput } from "../../../../src/lib/tracking/canonical/types.ts";

export async function persistCanonicalEvent(
  supabase: SupabaseClient,
  input: CreateCanonicalEventInput,
): Promise<void> {
  await createCanonicalEvent(input, {
    db: {
      from(table: string) {
        const query = supabase.from(table);
        return {
          insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
            return query.insert(payload as never).select();
          },
          upsert(payload: Record<string, unknown>, options?: { onConflict?: string }) {
            return query.upsert(payload as never, options as never).select();
          },
          select(columns: string) {
            return {
              eq(column: string, value: string) {
                return {
                  maybeSingle() {
                    return query.select(columns).eq(column, value).maybeSingle();
                  },
                };
              },
            };
          },
        };
      },
    },
  });
}
