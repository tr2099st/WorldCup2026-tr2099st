const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const ALLOWED_ENDPOINTS = new Set(["standings", "matches"]);
const ALLOWED_COMPETITIONS = new Set(["WC"]);
const CACHE_SECONDS = 60 * 60;

export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const endpoint = requestUrl.pathname.split("/").filter(Boolean).at(-1);
  const competition = requestUrl.searchParams.get("competition") || "WC";
  const season = requestUrl.searchParams.get("season") || "2026";

  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return jsonResponse({ error: "Unsupported endpoint" }, 404);
  }

  if (!ALLOWED_COMPETITIONS.has(competition)) {
    return jsonResponse({ error: "Unsupported competition" }, 400);
  }

  if (!/^\d{4}$/.test(season)) {
    return jsonResponse({ error: "Invalid season" }, 400);
  }

  if (!context.env.FOOTBALL_DATA_API_TOKEN) {
    return jsonResponse({ error: "API token is not configured" }, 500);
  }

  const upstreamUrl = new URL(
    `${FOOTBALL_DATA_BASE_URL}/competitions/${competition}/${endpoint}`,
  );
  upstreamUrl.searchParams.set("season", season);

  const cache = caches.default;
  const cacheKey = new Request(requestUrl.toString(), { method: "GET" });
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) return cachedResponse;

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      "X-Auth-Token": context.env.FOOTBALL_DATA_API_TOKEN,
    },
  });

  const body = await upstreamResponse.text();
  const response = new Response(body, {
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
    context.waitUntil(cache.put(cacheKey, response.clone()));
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
