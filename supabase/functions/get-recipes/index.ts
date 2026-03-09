/// <reference path="./types.d.ts" />

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface RequestBody {
  ingredients: string | string[];
  user_id?: string;
  dietary_filters?: string[];
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// ============================================
// CONFIGURATION (Environment Variables)
// ============================================
const CONFIG = {
  // Rate limiting
  RATE_LIMIT_MAX_REQUESTS: parseInt(Deno.env.get('RATE_LIMIT_MAX_REQUESTS') || '10', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(Deno.env.get('RATE_LIMIT_WINDOW_MS') || '60000', 10), // 1 minute
  
  // Cache
  CACHE_TTL_SECONDS: parseInt(Deno.env.get('CACHE_TTL_SECONDS') || '86400', 10), // 24 hours
  
  // Input validation
  MAX_INGREDIENTS_LENGTH: parseInt(Deno.env.get('MAX_INGREDIENTS_LENGTH') || '500', 10),
  MAX_INGREDIENT_COUNT: parseInt(Deno.env.get('MAX_INGREDIENT_COUNT') || '20', 10),
  
  // Recipe limits
  MAX_RECIPES: parseInt(Deno.env.get('MAX_RECIPES') || '3', 10),
};

// ============================================
// INPUT SANITIZATION
// ============================================
function sanitizeInput(input: string | string[]): string {
  const str = Array.isArray(input) ? input.join(', ') : input;
  
  // Remove potentially dangerous characters
  const sanitized = str
    .replace(/[<>\"'&]/g, '') // Remove HTML/script chars
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, CONFIG.MAX_INGREDIENTS_LENGTH);
  
  return sanitized;
}

function validateIngredients(ingredients: string | string[]): { valid: boolean; error?: string } {
  // Empty ingredients are allowed if dietary filters are provided
  if (!ingredients || (typeof ingredients === 'string' && ingredients.trim().length === 0)) {
    return { valid: true }; // Will be validated elsewhere for filters
  }
  
  const str = Array.isArray(ingredients) ? ingredients.join(', ') : ingredients;
  
  if (str.trim().length === 0) {
    return { valid: true }; // Allow empty, will check filters elsewhere
  }
  
  if (str.length > CONFIG.MAX_INGREDIENTS_LENGTH) {
    return { valid: false, error: `Ingredients too long. Maximum ${CONFIG.MAX_INGREDIENTS_LENGTH} characters allowed` };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /eval\s*\(/i,
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(str)) {
      return { valid: false, error: 'Invalid characters in input' };
    }
  }
  
  return { valid: true };
}

// ============================================
// RATE LIMITING (In-Memory Store)
// ============================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window
    const resetTime = now + CONFIG.RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - 1, resetTime };
  }
  
  if (record.count >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    // Rate limited
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);
  
  return { 
    allowed: true, 
    remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - record.count,
    resetTime: record.resetTime 
  };
}

// ============================================
// CACHE MANAGEMENT
// ============================================
async function getCachedRecipe(supabase: any, normalizedPrompt: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("recipe_cache")
      .select("response, created_at")
      .eq("prompt", normalizedPrompt)
      .single();
    
    if (error || !data) return null;
    
    // Check if cache is still valid based on TTL
    const cachedTime = new Date(data.created_at).getTime();
    const now = Date.now();
    const ttlMs = CONFIG.CACHE_TTL_SECONDS * 1000;
    
    if (now - cachedTime > ttlMs) {
      // Cache expired, delete it
      await supabase
        .from("recipe_cache")
        .delete()
        .eq("prompt", normalizedPrompt);
      return null;
    }
    
    return data.response;
  } catch (e) {
    console.log('Cache check failed:', e);
    return null;
  }
}

async function cleanupOldCache(supabase: any): Promise<void> {
  try {
    const cutoffTime = new Date(Date.now() - (CONFIG.CACHE_TTL_SECONDS * 1000)).toISOString();
    await supabase
      .from("recipe_cache")
      .delete()
      .lt("created_at", cutoffTime);
    console.log('Cache cleanup completed');
  } catch (e) {
    console.log('Cache cleanup failed (non-critical):', e);
  }
}

// Build prompt based on ingredients and dietary filters
function buildPrompt(ingredients: string, filters: string[]): string {
  const hasIngredients = ingredients && ingredients.trim().length > 0;
  const hasFilters = filters.length > 0;
  const filterStr = filters.join(', ');
  
  if (hasIngredients && hasFilters) {
    // Both ingredients and filters
    return `Create 3 diverse and creative ${filterStr} recipes using these ingredients: ${ingredients}`;
  } else if (hasFilters) {
    // Only filters - random recipes with dietary preference
    return `Create 3 diverse and creative ${filterStr} recipes. Provide variety in cuisine types and cooking methods.`;
  } else {
    // Only ingredients
    return `Create 3 diverse and creative recipes using these ingredients: ${ingredients}`;
  }
}

serve(async (req: Request): Promise<Response> => {
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { ingredients, user_id, dietary_filters } = body;
    
    // Validate and sanitize dietary filters
    const validFilters = ['vegan', 'vegetarian', 'gluten-free', 'keto', 'dairy-free', 'nut-free'];
    const sanitizedFilters = Array.isArray(dietary_filters) 
      ? dietary_filters.filter(f => validFilters.includes(f))
      : [];
    
    // ============================================
    // INPUT VALIDATION
    // ============================================
    // Sanitize input
    const sanitizedIngredients = sanitizeInput(ingredients);
    
    // Check if we have either ingredients or dietary filters
    const hasIngredients = sanitizedIngredients && sanitizedIngredients.trim().length > 0;
    const hasFilters = sanitizedFilters.length > 0;
    
    if (!hasIngredients && !hasFilters) {
      return new Response(JSON.stringify({ error: 'Please provide ingredients or select a dietary preference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const validation = validateIngredients(ingredients);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ============================================
    // RATE LIMITING
    // ============================================
    // Use user_id if provided, otherwise use IP address
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
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Remaining': '0'
        }
      });
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase env variables not set');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Normalize ingredients for caching
    const normalizedIngredients = (Array.isArray(sanitizedIngredients) ? sanitizedIngredients : [sanitizedIngredients])
      .map(i => i.trim().toLowerCase())
      .sort()
      .join(', ');

    // ============================================
    // CHECK CACHE
    // ============================================
    try {
      const cachedResponse = await getCachedRecipe(supabase, normalizedIngredients);
      if (cachedResponse) {
        return new Response(JSON.stringify({ 
          recipes: cachedResponse, 
          source: 'cache' 
        }), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString()
          }
        });
      }
    } catch (cacheError) {
      console.log('Cache check failed (non-critical):', cacheError);
    }

    // Call OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) throw new Error('OpenAI API key not configured');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a professional chef AI assistant specializing in creative recipe generation. 
Given a list of ingredients, suggest 3 unique and delicious recipes that prominently feature those ingredients.
${sanitizedFilters.length > 0 ? `All recipes must be: ${sanitizedFilters.join(', ')}.` : ''}
Respond with a short, helpful recipe answer under 150 words.
Return ONLY valid JSON in this structure:
[
  {
    "id": "unique_recipe_id_1",
    "name": "Recipe Name",
    "description": "Brief, appetizing description",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": ["step 1", "step 2"]
  }
]`
          },
          {
            role: 'user',
            content: buildPrompt(sanitizedIngredients, sanitizedFilters)
          }
        ],
        max_tokens: 1000,
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}: ${errorText}`);
    }

    const openaiData = await openaiResponse.json();

    // Parse and validate AI response
    let recipes: Recipe[];
    try {
      const content = openaiData?.choices?.[0]?.message?.content || '';
      const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
      recipes = JSON.parse(jsonContent);

      // Ensure structure & unique IDs, limit to max recipes
      recipes = recipes.map((r, index) => ({
        id: r.id || `recipe_${Date.now()}_${index}_${Math.random().toString(36).slice(2,7)}`,
        name: r.name || `Recipe ${index+1}`,
        description: r.description || 'A delicious recipe for you to try!',
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        instructions: Array.isArray(r.instructions) ? r.instructions : []
      })).slice(0, CONFIG.MAX_RECIPES);

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Raw OpenAI content:', openaiData?.choices?.[0]?.message?.content);
      recipes = [];
    }

    // Save to cache (non-critical)
    try {
      await supabase.from("recipe_cache").insert([{ 
        prompt: normalizedIngredients, 
        response: recipes 
      }]);
    } catch (cacheError) {
      console.log('Cache save failed (non-critical):', cacheError);
    }

    // Random cache cleanup (1% chance)
    if (Math.random() < 0.01) {
      cleanupOldCache(supabase);
    }

    // Return response
    return new Response(JSON.stringify({ 
      recipes, 
      source: 'openai', 
      ingredients_used: sanitizedIngredients,
      dietary_filters: sanitizedFilters
    }), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimit.remaining.toString()
      }
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Edge Function error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate recipes', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
