// Same-origin SSE proxy. Browser calls `/api/campaigns/stream` (Next route); upstream hits
// `{root}/api/campaigns/stream` when BACKEND_ROOT has no `/api` path; otherwise `{root}/campaigns/stream`.
// Prefer NEXT_PUBLIC_OUTBOUND_SSE_URL (e.g. SSH tunnel); else NEXT_PUBLIC_BACKEND_URL.

import { Readable } from "node:stream";

function backendRoot() {
  const sse = process.env.NEXT_PUBLIC_OUTBOUND_SSE_URL?.trim();
  if (sse) return sse;
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/";
}

function normalizeBase(url) {
  const u = String(url || "").trim();
  if (!u) return "http://localhost:8000/";
  return u.endsWith("/") ? u : `${u}/`;
}

/** Strip trailing `/`; linear in path length (no regex backtracking). */
function trimTrailingSlashes(pathname) {
  let s = pathname;
  while (s.endsWith("/")) {
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * Path after BACKEND_ROOT: always ensure a single `/api` before `campaigns/stream`.
 * @param {string} baseNormalized
 * @returns {URL}
 */
function upstreamCampaignsStreamUrl(baseNormalized, companyId) {
  const parsed = new URL(baseNormalized);
  const pathTrim = trimTrailingSlashes(parsed.pathname) || "";
  const endsWithApi = pathTrim === "/api" || pathTrim.endsWith("/api");
  const relativePath = endsWithApi
    ? "campaigns/stream"
    : "api/campaigns/stream";
  const upstreamUrl = new URL(relativePath, baseNormalized);
  upstreamUrl.searchParams.set("company_id", String(companyId));
  return upstreamUrl;
}

/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const companyId = req.query.company_id;
  if (
    companyId == null ||
    companyId === "" ||
    (typeof companyId === "string" && companyId.trim() === "")
  ) {
    return res.status(400).json({ message: "company_id is required" });
  }

  const base = normalizeBase(backendRoot());
  const upstreamUrl = upstreamCampaignsStreamUrl(base, companyId);
  const abortController = new AbortController();
  const onDisconnect = () => {
    try {
      abortController.abort();
    } catch {
      // ignore
    }
  };
  req.on("close", onDisconnect);
  req.on("aborted", onDisconnect);
  res.on("close", onDisconnect);

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "text/event-stream, application/json",
      },
      signal: abortController.signal,
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      if (!res.headersSent) {
        res.status(upstream.status).send(text || upstream.statusText);
      }
      return;
    }

    const contentType =
      upstream.headers.get("content-type") || "text/event-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, no-transform, must-revalidate",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    });

    if (!upstream.body) {
      res.end();
      return;
    }

    const nodeReadable = Readable.fromWeb(upstream.body);

    nodeReadable.on("error", (err) => {
      if (err.name === "AbortError") return;
      console.error("[campaigns/stream] upstream read error:", err?.message);
      if (!res.writableEnded) res.destroy();
    });

    res.on("close", () => {
      nodeReadable.destroy();
    });

    nodeReadable.pipe(res);
  } catch (err) {
    if (err?.name === "AbortError") return;
    console.error("[campaigns/stream]", err);
    if (!res.headersSent) {
      res.status(502).json({
        message: "Upstream stream failed",
        details: String(err?.message ?? err),
      });
    }
  }
}
