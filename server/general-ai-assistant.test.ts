import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const llmMocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
const dbMocks = vi.hoisted(() => ({ getProperties: vi.fn() }));
vi.mock("./_core/llm", () => llmMocks);
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
function context(): TrpcContext {
  const user: AuthenticatedUser = { id: 99, openId: "general-ai-user", name: "Amina Wanjiku", email: "amina@example.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}
function llmResponse(payload: Record<string, unknown>) { return { choices: [{ message: { content: JSON.stringify(payload) } }] }; }

describe("modern general AI assistant", () => {
  beforeEach(() => vi.clearAllMocks());

  it("answers an everyday question without querying property inventory and passes only the client first name in context", async () => {
    llmMocks.invokeLLM.mockResolvedValue(llmResponse({ intent: "general", reply: "I’m doing well, Amina. A short walk and a glass of water can be a gentle reset.", location: "", propertyType: "", listingType: "any", minBedrooms: 0, maxPrice: 0 }));
    const result = await appRouter.createCaller(context()).modern.aiAssistant({ message: "How can I reset after a long day?" });
    expect(result).toMatchObject({ intent: "general", results: [], total: 0 });
    expect(dbMocks.getProperties).not.toHaveBeenCalled();
    const systemPrompt = llmMocks.invokeLLM.mock.calls[0]?.[0]?.messages?.[0]?.content as string;
    expect(systemPrompt).toContain("Amina");
    expect(systemPrompt).not.toContain("Wanjiku");
  });

  it("keeps property search as a live listing lookup", async () => {
    llmMocks.invokeLLM.mockResolvedValue(llmResponse({ intent: "property_search", reply: "I found homes in Migori within your budget.", location: "Migori", propertyType: "apartment", listingType: "rent", minBedrooms: 2, maxPrice: 25000 }));
    dbMocks.getProperties.mockResolvedValue({ items: [{ id: 4, title: "Migori apartment" }], total: 1 });
    const result = await appRouter.createCaller(context()).modern.aiAssistant({ message: "Find a 2 bedroom rental in Migori under KSh 25,000" });
    expect(result.intent).toBe("property_search");
    expect(result.total).toBe(1);
    expect(dbMocks.getProperties).toHaveBeenCalledWith(expect.objectContaining({ location: "Migori", propertyType: "apartment", listingType: "rent", bedrooms: 2, maxPrice: 25000 }));
  });

  it("requires an authenticated client", async () => {
    const anonymous: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
    await expect(appRouter.createCaller(anonymous).modern.aiAssistant({ message: "Hello" })).rejects.toThrow();
  });
});
