import { NextResponse } from "next/server";

interface InstagramMedia {
  id: string;
  permalink: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
}

interface InstagramOEmbed {
  html: string;
  width: number;
  height: number;
}

export async function GET() {
  try {
    // Check if Instagram credentials are configured
    const igUserId = process.env.IG_USER_ID;
    const igToken = process.env.IG_USER_TOKEN;
    const fbAppId = process.env.FB_APP_ID;
    const fbAppSecret = process.env.FB_APP_SECRET;

    if (!igUserId || !igToken || !fbAppId || !fbAppSecret) {
      console.warn("Instagram credentials not configured");
      return NextResponse.json(
        {
          html: null,
          error: "Instagram not configured",
          fallback: true,
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=1800",
          },
        },
      );
    }

    // Step 1: Get media from Instagram Graph API (fetch more to find latest video)
    const mediaUrl = new URL(
      `https://graph.facebook.com/v23.0/${igUserId}/media`,
    );
    mediaUrl.searchParams.set(
      "fields",
      "permalink,media_type,media_url,thumbnail_url,timestamp",
    );
    mediaUrl.searchParams.set("limit", "25");
    mediaUrl.searchParams.set("access_token", igToken);

    const mediaResponse = await fetch(mediaUrl.toString());

    if (!mediaResponse.ok) {
      console.error(
        "Instagram Graph API error:",
        mediaResponse.status,
        mediaResponse.statusText,
      );
      return NextResponse.json(
        {
          html: null,
          error: "Failed to fetch Instagram media",
          fallback: true,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
          },
        },
      );
    }

    const mediaData = await mediaResponse.json();
    const allMedia = (mediaData?.data ?? []) as InstagramMedia[];

    // Sort by timestamp descending (newest first) - API order is not guaranteed
    const sortedByNewest = [...allMedia].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Prefer latest VIDEO (reel) - when new video uploaded, it auto-shows
    const latestVideo = sortedByNewest.find((m) => m.media_type === "VIDEO");
    const latestMedia = latestVideo ?? sortedByNewest[0];

    if (!latestMedia?.permalink) {
      console.warn("No Instagram media found");
      return NextResponse.json(
        {
          html: null,
          error: "No Instagram media found",
          fallback: true,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
          },
        },
      );
    }

    // Step 2: Get oEmbed HTML for the permalink
    const oembedUrl = new URL(
      "https://graph.facebook.com/v23.0/instagram_oembed",
    );
    oembedUrl.searchParams.set("url", latestMedia.permalink);
    oembedUrl.searchParams.set("access_token", `${fbAppId}|${fbAppSecret}`);

    const oembedResponse = await fetch(oembedUrl.toString());

    if (!oembedResponse.ok) {
      console.error(
        "Instagram oEmbed API error:",
        oembedResponse.status,
        oembedResponse.statusText,
      );
      return NextResponse.json(
        {
          html: null,
          error: "Failed to fetch Instagram embed",
          fallback: true,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
          },
        },
      );
    }

    const oembedData = (await oembedResponse.json()) as InstagramOEmbed;

    if (!oembedData?.html) {
      console.warn("No Instagram embed HTML received");
      return NextResponse.json(
        {
          html: null,
          error: "No Instagram embed HTML",
          fallback: true,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
          },
        },
      );
    }

    // Success - return the embed HTML with caching
    return NextResponse.json(
      {
        html: oembedData.html,
        mediaType: latestMedia.media_type,
        permalink: latestMedia.permalink,
        timestamp: latestMedia.timestamp,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Instagram API error:", error);
    return NextResponse.json(
      {
        html: null,
        error: "Instagram API failed",
        fallback: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
        },
      },
    );
  }
}
