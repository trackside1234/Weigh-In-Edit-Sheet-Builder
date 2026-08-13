const TAB_BASE = "https://api.tab.co.nz/affiliates/v1/racing";

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function cleanDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return value;
}

function cleanEventId(value) {
  // TAB event IDs observed are UUIDs. Restricting this prevents the proxy
  // from being used to request arbitrary upstream paths.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || "")) {
    return null;
  }
  return value;
}

async function fetchTab(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "WeighInReviewBuilder/1.0",
    },
    cf: {
      // Results can change after protests/corrections; keep edge caching short.
      cacheTtl: 30,
      cacheEverything: false,
    },
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    return jsonResponse(
      {
        error: "TAB API request failed",
        status: response.status,
        upstream: body,
      },
      response.status
    );
  }
  return jsonResponse(body, 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true, service: "weigh-in-review-builder" });
    }

    if (url.pathname === "/api/meetings") {
      if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

      const date = cleanDate(url.searchParams.get("date"));
      if (!date) {
        return jsonResponse({ error: "Use /api/meetings?date=YYYY-MM-DD" }, 400);
      }

      const upstream = new URL(`${TAB_BASE}/meetings`);
      upstream.searchParams.set("category", "T");
      upstream.searchParams.set("country", "NZ");
      upstream.searchParams.set("date_from", date);
      upstream.searchParams.set("date_to", date);
      upstream.searchParams.set("enc", "json");
      upstream.searchParams.set("limit", "200");

      return fetchTab(upstream.toString());
    }

    if (url.pathname.startsWith("/api/event/")) {
      if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

      const id = cleanEventId(url.pathname.slice("/api/event/".length));
      if (!id) return jsonResponse({ error: "Invalid TAB event ID" }, 400);

      const upstream = `${TAB_BASE}/events/${encodeURIComponent(id)}?enc=json`;
      return fetchTab(upstream);
    }

    // Static site is served from Workers Static Assets.
    return env.ASSETS.fetch(request);
  },
};