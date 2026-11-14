// Uso: GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json node scripts/setAdmin.js email@dominio.com [precoCentavos]
const admin = require("firebase-admin");
admin.initializeApp();
(async () => {
  const [email, price] = process.argv.slice(2);
  const u = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(u.uid, { platformAdmin: true });
  if (price) await admin.firestore().doc("platformConfig/pricing").set({ licensePriceCents: parseInt(price, 10) });
  console.log("Admin definido:", u.uid);
})();
