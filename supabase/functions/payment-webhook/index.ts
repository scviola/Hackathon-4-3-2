// supabase/functions/payment-webhook/index.ts
// Handles IntaSend payment webhook callbacks to verify payments

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Interface for IntaSend webhook payload
interface IntaSendWebhookPayload {
  api_ref: string;
  state: string;
  amount: number;
  currency: string;
  customer: {
    email?: string;
    name?: string;
  };
  metadata?: {
    user_id?: string;
    plan?: string;
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify webhook signature (IntaSend sends signature in header)
  const signature = req.headers.get('x-intasend-signature');
  const webhookSecret = Deno.env.get('INTASEND_WEBHOOK_SECRET');
  
  if (webhookSecret && signature !== webhookSecret) {
    console.error('Invalid webhook signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // Parse webhook payload
    let payload: IntaSendWebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('📥 Received webhook:', payload);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase env variables not set');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract information from payload
    const { api_ref, state, amount, currency, metadata } = payload;
    const userId = metadata?.user_id;
    const plan = metadata?.plan;

    // Check payment state
    const isSuccessful = state === 'COMPLETED' || state === 'SUCCESSFUL';
    
    if (!isSuccessful) {
      console.log(`Payment ${api_ref} not completed. State: ${state}`);
      
      // Log failed payment attempt
      await supabase.from('payment_logs').insert([{
        api_ref,
        user_id: userId,
        plan,
        amount,
        currency,
        state,
        attempted_at: new Date().toISOString(),
        success: false
      }]).catch(() => {}); // Non-critical
      
      return new Response(JSON.stringify({ 
        received: true,
        processed: false,
        reason: `Payment state: ${state}`
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Payment successful - update user status
    console.log(`✅ Payment successful: ${api_ref}, Amount: ${amount} ${currency}`);

    // Update user pro status
    if (userId) {
      try {
        // Try to update by UUID first, then by user_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            is_pro: true, 
            pro_plan: plan,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.log('Update by UUID failed, trying by user_id:', updateError);
          
          // Alternative: store in a separate table
          await supabase.from('user_pro_status').upsert([{
            user_id: userId,
            is_pro: true,
            plan: plan,
            payment_ref: api_ref,
            activated_at: new Date().toISOString()
          }]);
        }
        
        console.log(`✅ User ${userId} upgraded to ${plan}`);
      } catch (updateErr) {
        console.error('Failed to update user status:', updateErr);
      }
    }

    // Log successful payment
    try {
      await supabase.from('payment_logs').insert([{
        api_ref,
        user_id: userId,
        plan,
        amount,
        currency,
        state,
        attempted_at: new Date().toISOString(),
        success: true,
        processed_at: new Date().toISOString()
      }]);
    } catch (logErr) {
      console.log('Failed to log payment (non-critical):', logErr);
    }

    return new Response(JSON.stringify({ 
      received: true,
      processed: true,
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook error:', err);
    
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
