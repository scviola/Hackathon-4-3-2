// Type declarations for Deno Edge Functions
// This file helps TypeScript understand Deno-specific URL imports

// Deno global declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://deno.land/std@0.208.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
  export function serveTls(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      auth?: {
        autoRefreshToken?: boolean;
        persistSession?: boolean;
        detectSessionInUrl?: boolean;
      };
    }
  ): any;
}
