import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./authOptions";
import {
  sessionStore,
  NextAuthSessionData,
  isLikelySessionIdHex,
} from "../../../utils/sessionStore";
import { verifySmallPayload } from "../../../utils/smallJwt";
import { randomBytes } from "node:crypto";

function getStableTmsSessionId(req: NextApiRequest): string | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || typeof secret !== "string") return null;
  const raw =
    req.cookies["next-auth.session-token"] ??
    req.cookies["__Secure-next-auth.session-token"];
  if (!raw || typeof raw !== "string") return null;
  const verified = verifySmallPayload(raw, secret);
  const sid = verified?.sessionId;
  return sid && isLikelySessionIdHex(sid) ? sid : null;
}

// Request deduplication cache - stores pending requests by user identifier
// This prevents multiple concurrent requests from the same user from blocking each other
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

declare global {
  var sessionRequestCache: Map<string, PendingRequest> | undefined;
}

globalThis.sessionRequestCache ??= new Map();

// Clean up stale cache entries (older than 5 seconds)
const cleanupCache = () => {
  const now = Date.now();
  globalThis.sessionRequestCache!.forEach((value, key) => {
    if (now - value.timestamp > 5000) {
      globalThis.sessionRequestCache!.delete(key);
    }
  });
};

// Get a cache key based on cookies (to identify same user across tabs)
const getCacheKey = (req: NextApiRequest): string => {
  // Use NextAuth session token cookie as identifier
  const sessionToken =
    req.cookies["next-auth.session-token"] ||
    req.cookies["__Secure-next-auth.session-token"];
  return sessionToken || "anonymous";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Ensure we always return JSON so NextAuth client never gets HTML (avoids CLIENT_FETCH_ERROR)
  const sendJson = (status: number, body: object) => {
    try {
      res.status(status).json(body);
    } catch (error: unknown) {
      console.error(
        "Session API: res.json failed, using manual JSON body",
        error,
      );
      try {
        res
          .setHeader("Content-Type", "application/json")
          .status(status)
          .end(JSON.stringify(body));
      } catch (fallbackError: unknown) {
        console.error(
          "Session API: failed to send JSON response",
          fallbackError,
        );
      }
    }
  };

  try {
    if (req.method !== "GET") {
      sendJson(405, { message: "Method not allowed" });
      return;
    }

    // Clean up stale cache entries periodically
    cleanupCache();

    // Get cache key for request deduplication
    const cacheKey = getCacheKey(req);

    // Check if there's already a pending request for this user
    const pendingRequest = globalThis.sessionRequestCache!.get(cacheKey);

    if (pendingRequest && Date.now() - pendingRequest.timestamp < 2000) {
      // If there's a recent pending request (within 2 seconds), wait for it
      try {
        const result = await pendingRequest.promise;
        return sendJson(200, result);
      } catch (error: unknown) {
        console.warn(
          "Session API: coalesced session request failed, retrying",
          error,
        );
        globalThis.sessionRequestCache!.delete(cacheKey);
      }
    }

    // Create a new request promise
    const requestPromise = (async () => {
      try {
        const session = await getServerSession(req, res, authOptions);

        if (!session?.user) {
          throw new Error("Not authenticated");
        }

        // Reuse NextAuth cookie session id so we don't allocate a new TMS row on every GET
        const sessionId =
          getStableTmsSessionId(req) ?? randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create session data
        const sessionData: NextAuthSessionData = {
          user: {
            ...session.user,
          },
          expires: expires.toISOString(),
        };

        // Store session data in memory
        sessionStore.set(sessionId, sessionData);

        // Return session with session ID
        return {
          ...session,
          user: {
            ...session.user,
            sessionId: sessionId,
          },
        };
      } catch (error) {
        console.error("Session API error:", error);
        throw error;
      }
    })();

    // Store the pending request in cache
    globalThis.sessionRequestCache!.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    });

    try {
      const result = await requestPromise;

      // Remove from cache after successful completion
      globalThis.sessionRequestCache!.delete(cacheKey);

      return sendJson(200, result);
    } catch (error: any) {
      // Remove from cache on error
      globalThis.sessionRequestCache!.delete(cacheKey);

      if (error?.message === "Not authenticated") {
        return sendJson(401, { message: "Not authenticated" });
      }

      console.error("Session API error:", error);
      return sendJson(500, { message: "Internal server error" });
    }
  } catch (unexpectedError: any) {
    // Top-level catch: never send HTML; NextAuth expects JSON
    console.error("Session API unexpected error:", unexpectedError);
    sendJson(500, { message: "Internal server error" });
  }
}
