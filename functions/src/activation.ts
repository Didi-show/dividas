import { getFirestore, FieldValue } from "firebase-admin/firestore";
export type ActivationResult = "activated" | "duplicate" | "amount_mismatch" | "not_found";

/** Idempotente: o mesmo eventId nunca ativa duas vezes; valor deve bater com o gravado pelo backend. */
export async function activateLicense(chargeId: string, eventId: string, paidAmountCents: number): Promise<ActivationResult> {
  const db = getFirestore();
  return db.runTransaction(async (tx) => {
    const evRef = db.doc(`webhookEvents/${eventId}`);
    const chRef = db.doc(`charges/${chargeId}`);
    const [ev, ch] = await Promise.all([tx.get(evRef), tx.get(chRef)]);
    if (ev.exists) return "duplicate";
    if (!ch.exists) return "not_found";
    const c = ch.data()!;
    if (c.status === "paid") { tx.set(evRef, { chargeId, at: FieldValue.serverTimestamp(), note: "already_paid" }); return "duplicate"; }
    if (c.amountCents !== paidAmountCents) { tx.set(evRef, { chargeId, at: FieldValue.serverTimestamp(), note: "amount_mismatch" }); return "amount_mismatch"; }
    const licRef = db.doc(`licenses/${c.licenseId}`);
    tx.update(chRef, { status: "paid", paidAt: FieldValue.serverTimestamp() });
    tx.update(licRef, { status: "active", activatedAt: FieldValue.serverTimestamp(), paymentId: chargeId });
    tx.update(db.doc(`establishments/${c.estId}`), { licenseStatus: "active" });
    tx.set(evRef, { chargeId, at: FieldValue.serverTimestamp() });
    tx.set(db.collection(`establishments/${c.estId}/auditLogs`).doc(), { action: "license_activated", chargeId, at: FieldValue.serverTimestamp() });
    return "activated";
  });
}
