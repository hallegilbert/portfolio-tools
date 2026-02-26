// Netlify Function: proxies Claude API calls so your API key stays server-side
// Rate limited to ~10 uses per day per IP across all tools

const DAILY_LIMIT = 10;

// Simple in-memory rate limiting (resets on cold start, ~every few hours)
// For a portfolio demo this is fine. For production, use a database.
const rateLimitMap = new Map();

function getRateLimitKey(ip) {
  const today = new Date().toISOString().split("T")[0];
  return `${ip}:${today}`;
}

function checkRateLimit(ip) {
  const key = getRateLimitKey(ip);
  const current = rateLimitMap.get(key) || 0;

  // Clean old entries (different day)
  for (const [k] of rateLimitMap) {
    if (!k.endsWith(new Date().toISOString().split("T")[0])) {
      rateLimitMap.delete(k);
    }
  }

  if (current >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  rateLimitMap.set(key, current + 1);
  return { allowed: true, remaining: DAILY_LIMIT - current - 1 };
}

export default async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit check
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: "Daily demo limit reached. This is a portfolio demo — thanks for exploring! Come back tomorrow.",
        limit: DAILY_LIMIT,
        remaining: 0,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = await req.json();

    // Only allow specific models (prevent abuse)
    const allowedModels = ["claude-sonnet-4-20250514"];
    if (!allowedModels.includes(body.model)) {
      body.model = "claude-sonnet-4-20250514";
    }

    // Cap max tokens
    if (!body.max_tokens || body.max_tokens > 2500) {
      body.max_tokens = 2000;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Something went wrong. Try again." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};

export const config = {
  path: "/api/claude",
};
