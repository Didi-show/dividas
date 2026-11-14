export type PaymentStatus = "pending" | "paid" | "expired" | "refunded" | "failed";
export interface CreatePixChargeInput {
  chargeId: string; amountCents: number; description: string;
  payer: { name: string; email: string; document?: string }; expiresInMinutes: number;
}
export interface PixCharge { externalId: string; qrCodeBase64: string; copyAndPaste: string; expiresAt: Date; }
export interface NormalizedWebhookEvent { eventId: string; externalId: string; status: PaymentStatus; amountCents: number; }
export interface PaymentProvider {
  readonly name: string;
  createPixCharge(i: CreatePixChargeInput): Promise<PixCharge>;
  getChargeStatus(externalId: string): Promise<{ status: PaymentStatus; amountCents: number }>;
  /** Retorna null se a assinatura for inválida. */
  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): NormalizedWebhookEvent | null;
}
