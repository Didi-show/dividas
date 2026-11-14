import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { getProvider, isEmulator } from "./payments/registry";
import { mockMarkPaid } from "./payments/providers/mock";
import { activateLicense } from "./activation";

initializeApp();
const db = getFirestore();
const need = (cond: unknown, msg: string) => { if (!cond) throw new HttpsError("invalid-argument", msg); };

async function priceCents(): Promise<number> {
  const s = await db.doc("platformConfig/pricing").get();
  const v = s.data()?.licensePriceCents;
  if (!Number.isInteger(v) || v <= 0) throw new HttpsError("failed-precondition", "Preço da licença não configurado.");
  return v;
}

export const getLicensePrice = onCall(async () => ({ licensePriceCents: await priceCents() }));

export const createEstablishment = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Faça login.");
  const nome = String(req.data?.nome ?? "").trim();
  need(nome.length >= 2 && nome.length <= 80, "Nome inválido.");
  const uid = req.auth.uid;
  const est = db.collection("establishments").doc();
  const lic = db.collection("licenses").doc();
  const batch = db.batch();
  batch.set(est, { nome, ownerUid: uid, licenseStatus: "pending", licenseId: lic.id, createdAt: FieldValue.serverTimestamp() });
  batch.set(est.collection("members").doc(uid), { role: "owner", createdAt: FieldValue.serverTimestamp() });
  batch.set(lic, { estId: est.id, ownerUid: uid, status: "pending", createdAt: FieldValue.serverTimestamp() });
  batch.set(db.doc(`users/${uid}`), { email: req.auth.token.email ?? null }, { merge: true });
  await batch.commit();
  return { estId: est.id };
});

export const createPixCharge = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Faça login.");
  const estId = String(req.data?.estId ?? "");
  const estSnap = await db.doc(`establishments/${estId}`).get();
  if (!estSnap.exists || estSnap.data()!.ownerUid !== req.auth.uid) throw new HttpsError("permission-denied", "Apenas o proprietário compra a licença.");
  const est = estSnap.data()!;
  if (est.licenseStatus === "active") throw new HttpsError("already-exists", "Licença já ativa.");
  let provider;
  try { provider = getProvider(); } catch { throw new HttpsError("failed-precondition", "Pagamento indisponível no momento."); }
  const amountCents = await priceCents(); // valor SEMPRE do backend
  const ref = db.collection("charges").doc();
  const pix = await provider.createPixCharge({
    chargeId: ref.id, amountCents, description: `Licença ${est.nome}`,
    payer: { name: est.nome, email: String(req.auth.token.email ?? "") }, expiresInMinutes: 60,
  });
  await ref.set({ estId, licenseId: est.licenseId, ownerUid: req.auth.uid, amountCents, provider: provider.name,
    externalId: pix.externalId, status: "pending", createdAt: FieldValue.serverTimestamp() });
  return { chargeId: ref.id, copyAndPaste: pix.copyAndPaste, qrCodeBase64: pix.qrCodeBase64, amountCents };
});

export const paymentWebhook = onRequest(async (req, res) => {
  try {
    const provider = getProvider();
    const ev = provider.verifyWebhook(req.rawBody, req.headers);
    if (!ev) { res.status(401).send("invalid signature"); return; }
    if (ev.status !== "paid") { res.status(200).send("ignored"); return; }
    const q = await db.collection("charges").where("externalId", "==", ev.externalId).limit(1).get();
    if (q.empty) { res.status(200).send("unknown charge"); return; }
    const real = await provider.getChargeStatus(ev.externalId); // confirmação direta no provedor
    if (real.status !== "paid") { res.status(200).send("not paid"); return; }
    const r = await activateLicense(q.docs[0].id, `${provider.name}_${ev.eventId}`, real.amountCents);
    res.status(200).send(r);
  } catch (e) { console.error(e); res.status(500).send("error"); }
});

// SOMENTE EMULADOR: simula pagamento. Em produção retorna erro.
export const devSimulatePayment = onCall(async (req) => {
  if (!isEmulator()) throw new HttpsError("failed-precondition", "Indisponível em produção.");
  if (!req.auth) throw new HttpsError("unauthenticated", "Faça login.");
  const ch = await db.doc(`charges/${String(req.data?.chargeId)}`).get();
  if (!ch.exists || ch.data()!.ownerUid !== req.auth.uid) throw new HttpsError("permission-denied", "Cobrança inválida.");
  mockMarkPaid(ch.data()!.externalId);
  return { result: await activateLicense(ch.id, "dev_" + ch.id, ch.data()!.amountCents) };
});
