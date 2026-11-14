import { PaymentProvider } from "../PaymentProvider";
// SOMENTE DESENVOLVIMENTO (emulador). O registry impede o uso em produção.
const store = new Map<string, { amountCents: number; paid: boolean }>();
export const mockProvider: PaymentProvider = {
  name: "mock",
  async createPixCharge(i) {
    const externalId = "mock_" + i.chargeId;
    store.set(externalId, { amountCents: i.amountCents, paid: false });
    return { externalId, qrCodeBase64: "", copyAndPaste: "MOCK-PIX-" + i.chargeId, expiresAt: new Date(Date.now() + i.expiresInMinutes * 60000) };
  },
  async getChargeStatus(id) { const c = store.get(id); return { status: c?.paid ? "paid" : "pending", amountCents: c?.amountCents ?? 0 }; },
  verifyWebhook() { return null; },
};
export function mockMarkPaid(externalId: string) { const c = store.get(externalId); if (c) c.paid = true; }
