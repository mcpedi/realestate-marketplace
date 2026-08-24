import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME, SESSION_MAX_AGE_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authenticated = await sdk.authenticateRequest(opts.req);
    const { sessionNeedsRotation, ...resolvedUser } = authenticated;
    user = resolvedUser;
    if (sessionNeedsRotation && !authenticated.isCron) {
      const token = await sdk.createSessionToken(resolvedUser.openId, { name: resolvedUser.name ?? "" });
      opts.res.cookie(COOKIE_NAME, token, {
        ...getSessionCookieOptions(opts.req),
        maxAge: SESSION_MAX_AGE_MS,
      });
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
