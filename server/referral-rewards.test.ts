import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getReferralProfile: vi.fn(), createReferralProfile: vi.fn(), createModuleAuditLog: vi.fn(), getReferralRewardsDashboard: vi.fn(),
  getReferralClaimByReferredUserId: vi.fn(), getReferralProfileByCode: vi.fn(), createReferralClaim: vi.fn(),
  getReferralClaims: vi.fn(), getReferralClaimById: vi.fn(), reviewReferralClaim: vi.fn(), getUserById: vi.fn(), createRewardLedgerEntry: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(role: "user" | "admin" = "user", id = 7): TrpcContext {
  const user: AuthenticatedUser = { id, openId: `rewards-${id}`, email: `rewards-${id}@example.com`, name: "Rewards User", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("protected referrals and rewards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a private profile lazily and returns only the caller's dashboard", async () => {
    dbMocks.getReferralProfile.mockResolvedValue(undefined);
    dbMocks.createReferralProfile.mockResolvedValue({ id: 2, userId: 7, referralCode: "N360-AB12CD34", active: true });
    dbMocks.getReferralRewardsDashboard.mockResolvedValue({ profile: { id: 2, userId: 7, referralCode: "N360-AB12CD34" }, claims: [], ledger: [], balance: 0, earned: 0, spent: 0 });
    const caller = appRouter.createCaller(context());
    await expect(caller.referralRewards.dashboard()).resolves.toMatchObject({ balance: 0, profile: { userId: 7 } });
    expect(dbMocks.createReferralProfile).toHaveBeenCalledWith(7, expect.stringMatching(/^N360-[A-Z0-9]{8}$/));
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "referral_profile.create", actorUserId: 7 }));
  });

  it("accepts one explicit external referral claim and rejects self or duplicate attribution", async () => {
    dbMocks.getReferralClaimByReferredUserId.mockResolvedValue(undefined);
    dbMocks.getReferralProfileByCode.mockResolvedValue({ id: 3, userId: 9, referralCode: "N360-AB12CD34", active: true });
    dbMocks.createReferralClaim.mockResolvedValue({ id: 4, referrerUserId: 9, referredUserId: 7, status: "pending" });
    const caller = appRouter.createCaller(context());
    await expect(caller.referralRewards.claim({ referralCode: "N360-AB12CD34" })).resolves.toMatchObject({ status: "pending" });
    expect(dbMocks.createReferralClaim).toHaveBeenCalledWith(expect.objectContaining({ referrerUserId: 9, referredUserId: 7, status: "pending" }));

    dbMocks.getReferralClaimByReferredUserId.mockResolvedValue({ id: 4 });
    await expect(caller.referralRewards.claim({ referralCode: "N360-AB12CD34" })).rejects.toThrow();
    dbMocks.getReferralClaimByReferredUserId.mockResolvedValue(undefined);
    dbMocks.getReferralProfileByCode.mockResolvedValue({ id: 3, userId: 7, active: true });
    await expect(caller.referralRewards.claim({ referralCode: "N360-AB12CD34" })).rejects.toThrow();
  });

  it("keeps claim review and reward adjustments administrator-only and auditable", async () => {
    const userCaller = appRouter.createCaller(context());
    await expect(userCaller.adminRewards.reviewClaim({ id: 4, status: "qualified" })).rejects.toThrow();
    const adminCaller = appRouter.createCaller(context("admin", 1));
    dbMocks.getReferralClaimById.mockResolvedValue({ id: 4, referrerUserId: 9 });
    dbMocks.reviewReferralClaim.mockResolvedValue(true);
    await expect(adminCaller.adminRewards.reviewClaim({ id: 4, status: "qualified" })).resolves.toEqual({ success: true });
    dbMocks.getUserById.mockResolvedValue({ id: 9 });
    dbMocks.createRewardLedgerEntry.mockResolvedValue({ id: 12, userId: 9, points: 100, status: "earned" });
    await expect(adminCaller.adminRewards.addPoints({ userId: 9, points: 100, status: "earned", note: "Qualified referral reward", referralClaimId: 4 })).resolves.toMatchObject({ id: 12, points: 100 });
    expect(dbMocks.createModuleAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "reward_ledger.create", actorUserId: 1 }));
  });

  it("validates referral format and prevents unrelated reward recipients", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.referralRewards.claim({ referralCode: "not-a-code" })).rejects.toThrow();
    const adminCaller = appRouter.createCaller(context("admin", 1));
    dbMocks.getUserById.mockResolvedValue({ id: 9 });
    dbMocks.getReferralClaimById.mockResolvedValue({ id: 4, referrerUserId: 99 });
    await expect(adminCaller.adminRewards.addPoints({ userId: 9, points: 100, status: "earned", note: "Qualified referral reward", referralClaimId: 4 })).rejects.toThrow();
    expect(dbMocks.createRewardLedgerEntry).not.toHaveBeenCalled();
  });
});
