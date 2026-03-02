import type { Handler } from "@netlify/functions";

type OkBody = {
  found: true;
  lat: number;
  lng: number;
  place_name?: string;
};

type NotFoundBody = {
  found: false;
};

type ErrorBody = {
  error: string;
  detail?: unknown;
};

export const handler: Handler = async (event) => {
  try {
    // Support both GET ?q= and POST { q }
    const method = (event.httpMethod || "GET").toUpperCase();

    let q = (event.queryStringParameters?.q || "").trim();

    if (!q && method === "POST" && event.body) {
      try {
        const parsed = JSON.parse(event.body);
        if (typeof parsed?.q === "string") q = parsed.q.trim();
      } catch {
        // ignore JSON parse errors and let validation handle it
      }
    }

    if (!q) {
      const body: ErrorBody = { error: "Missing q" };
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    }

    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) {
      const body: ErrorBody = { error: "MAPBOX_ACCESS_TOKEN not set" };
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    }

    // Mapbox forward geocoding (returns center = [lng, lat])
    const url =
      "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
      encodeURIComponent(q) +
      ".json" +
      `?access_token=${encodeURIComponent(token)}` +
      "&limit=1" +
      "&country=US" +
      "&types=address,place,locality,neighborhood,postcode";

    const resp = await fetch(url);

    if (!resp.ok) {
      const text = await resp.text();
      const body: ErrorBody = { error: "Geocode failed", detail: text };
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    }

    const data: any = await resp.json();
    const feature = data?.features?.[0];

    if (!feature || !Array.isArray(feature.center) || feature.center.length < 2) {
      const body: NotFoundBody = { found: false };
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    }

    const [lng, lat] = feature.center;
    if (typeof lat !== "number" || typeof lng !== "number") {
      const body: NotFoundBody = { found: false };
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    }

    const body: OkBody = {
      found: true,
      lat,
      lng,
      place_name: feature.place_name,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Optional caching (keeps repeated lookups fast)
        "Cache-Control": "public, max-age=3600",
      },
      body: JSON.stringify(body),
    };
  } catch (e: any) {
    const body: ErrorBody = { error: e?.message ?? "Unknown error" };
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  }
};