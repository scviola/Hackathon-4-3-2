// supabase/functions/create-checkout/index.ts
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// ✅ CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// ============================================
// CONFIGURATION (Environment Variables)
// ============================================
const CONFIG = {
  // Pricing - all values in KES
  PLAN_PRICES: {
    pro: parseInt(Deno.env.get('PLAN_PRICE_PRO') || '500', 10),
  },
  
  // Currency
  CURRENCY: Deno.env.get('PAYMENT_CURRENCY') || 'KES',
  
  // URLs
  SUCCESS_URL: Deno.env.get('PAYMENT_SUCCESS_URL') || 'https://savorai.netlify.app/payment-success',
  CANCEL_URL: Deno.env.get('PAYMENT_CANCEL_URL') || 'https://savorai.netlify.app/payment-cancel',
  
  // Rate limiting
  RATE_LIMIT_MAX: parseInt(Deno.env.get('RATE_LIMIT_CHECKOUT_MAX') || '5', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(Deno.env.get('RATE_LIMIT_WINDOW_MS') || '60000', 10),
};

// ============================================
// RATE LIMITING
// ============================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    const resetTime = now + CONFIG.RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX - 1, resetTime };
  }
  
  if (record.count >= CONFIG.RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  rateLimitStore.set(identifier, record);
  
  return { 
    allowed: true, 
    remaining: CONFIG.RATE_LIMIT_MAX - record.count,
    resetTime: record.resetTime 
  };
}

// ============================================
// INPUT VALIDATION
// ============================================
function validateInput(user_id: string | undefined, plan: string | undefined): { valid: boolean; error?: string } {
  if (!user_id || !plan) {
    return { valid: false, error: "Missing user_id or plan" };
  }
  
  // Validate user_id format (should be alphanumeric with underscores)
  if (!/^[a-zA-Z0-9_@-]+$/.test(user_id)) {
    return { valid: false, error: "Invalid user_id format" };
  }
  
  // Validate plan
  const validPlans = ['pro'];
  if (!validPlans.includes(plan)) {
    return { valid: false, error: "Invalid plan selected" };
  }
  
  return { valid: true };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    // Parse request body
    let body: { user_id?: string; plan?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({
        error: "Invalid JSON body"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { user_id, plan } = body;
    
    // ============================================
    // INPUT VALIDATION
    // ============================================
    const validation = validateInput(user_id, plan);
    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: validation.error
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ============================================
    // RATE LIMITING
    // ============================================
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const identifier = user_id || clientIP;
    
    const rateLimit = checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        retry_after: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      });
    }

    // ✅ Get IntaSend secret key from Supabase environment
    const INTASEND_SECRET_KEY = Deno.env.get("INTASEND_SECRET_KEY");
    if (!INTASEND_SECRET_KEY) {
      throw new Error("IntaSend secret key not configured in environment");
    }

    // ✅ Get plan price from config
    const amount = CONFIG.PLAN_PRICES[plan as keyof typeof CONFIG.PLAN_PRICES];
    if (!amount) {
      return new Response(JSON.stringify({
        error: "Invalid plan selected"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ✅ Generate unique reference
    const apiRef = `savorai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // ✅ Payload for IntaSend Checkout API
    const payload = {
      first_name: "SavorAI",
      last_name: "User",
      email: `${user_id}@example.com`,
      amount,
      currency: CONFIG.CURRENCY,
      api_ref: apiRef,
      redirect_url: CONFIG.SUCCESS_URL,
      callback_url: `${CONFIG.SUCCESS_URL}?ref=${apiRef}`,
      hosted: true,
      metadata: {
        user_id: user_id,
        plan: plan
      }
    };
    
    console.log("🚀 Sending payload to IntaSend:", payload);

    // ✅ Determine API endpoint (sandbox vs production)
    const isProduction = Deno.env.get('ENVIRONMENT') === 'production';
    const intasendBaseUrl = isProduction 
      ? 'https://payment.intasend.com/api/v1/checkout/'
      : 'https://sandbox.intasend.com/api/v1/checkout/';
    
    // ✅ Call IntaSend Checkout API
    const response = await fetch(intasendBaseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${INTASEND_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log("✅ IntaSend response:", data);
    
    if (!response.ok) {
      throw new Error(`IntaSend error: ${JSON.stringify(data)}`);
    }

    // ✅ Return checkout URL to frontend
    return new Response(JSON.stringify({
      checkout_url: data.url,
      api_ref: apiRef
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Edge function error:", errorMessage);
    return new Response(JSON.stringify({
      error: errorMessage || "Checkout failed"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
