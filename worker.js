const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const ALLOWED_ENDPOINTS = new Set(["standings", "matches"]);
const CACHE_SECONDS = 60 * 60;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleApiRequest(request, env, ctx) {
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, {
      Allow: "GET",
    });
  }

  const url = new URL(request.url);
  const endpoint = url.pathname.split("/").filter(Boolean).at(-1);
  const competition = url.searchParams.get("competition") || "WC";
  const season = url.searchParams.get("season") || "2026";

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return jsonResponse({ error: "Unsupported endpoint" }, 404);
  }

  if (competition !== "WC") {
    return jsonResponse({ error: "Unsupported competition" }, 400);
  }

  if (!/^\d{4}$/.test(season)) {
    return jsonResponse({ error: "Invalid season" }, 400);
  }

  if (!env.FOOTBALL_DATA_API_TOKEN) {
    return jsonResponse({ error: "API token is not configured" }, 500);
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) return cachedResponse;

  const upstreamUrl = new URL(
    `${FOOTBALL_DATA_BASE_URL}/competitions/${competition}/${endpoint}`,
  );
  upstreamUrl.searchParams.set("season", season);

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      "X-Auth-Token": env.FOOTBALL_DATA_API_TOKEN,
    },
  });

  const response = new Response(await upstreamResponse.text(), {
    status: upstreamResponse.status,
    headers: {
      "Content-Type":
        upstreamResponse.headers.get("Content-Type") ||
        "application/json; charset=utf-8",
      "Cache-Control": upstreamResponse.ok
        ? `public, max-age=${CACHE_SECONDS}`
        : "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

  if (upstreamResponse.ok) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

function jsonResponse(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
