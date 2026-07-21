import { createClient } from "@supabase/supabase-js";

// Bypasses RLS entirely -- only call this after the caller's identity has
// already been verified (e.g. via requireUser()), and only for operations
// RLS can't currently be trusted for. Right now that's just avatar uploads:
// Supabase Storage wasn't recognizing an otherwise-valid, correctly
// authenticated session (confirmed via debug logging -- same user id from
// both requireUser() and supabase.auth.getUser() at the moment of upload,
// yet every storage.objects RLS policy still rejected the insert).
// NEVER import this into a Client Component -- this key must never reach the browser.
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
