# Fiado Fácil — controle de fiado (licença única por estabelecimento)

Next.js + TypeScript + Tailwind • Firebase Auth • Firestore • Cloud Functions.

## Status
| Etapa | Estado |
|---|---|
| Arquitetura, auth, Firestore + regras | ✅ |
| Estabelecimentos, licenças, checkout Pix (camada de provedor, webhook idempotente, mock só em dev) | ✅ |
| Clientes, produtos, vendas fiadas, parcelas, pagamentos | ⏳ Etapa 4 |
| Dashboard, relatórios, recibos, WhatsApp | ⏳ Etapa 5 |
| Painel admin completo, auditoria ampliada, LGPD | ⏳ Etapa 6 |

## Rodar localmente
```bash
npm i -g firebase-tools
cp .env.example web/.env.local      # preencha NEXT_PUBLIC_*; deixe NEXT_PUBLIC_USE_EMULATORS=true
cp .env.example functions/.env      # PAYMENT_PROVIDER=mock
npm --prefix functions i && npm --prefix web i
firebase emulators:start --project demo-fiado    # terminal 1 (rode `npm --prefix functions run build` antes)
npm --prefix web run dev                          # terminal 2 → http://localhost:3000
```
No emulador, crie `platformConfig/pricing` com `{ licensePriceCents: 9900 }` pela UI do emulador (http://localhost:4000).

## Testes
`npm --prefix functions test`

## Publicar
```bash
firebase login && firebase use --add
firebase deploy --only firestore,functions
node scripts/setAdmin.js seu@email.com 9900   # com GOOGLE_APPLICATION_CREDENTIALS definido
```
Hospede o `web/` com Firebase App Hosting (conecte o repositório GitHub no console) ou Vercel.

## Escolher o intermediador Pix depois
1. Copie `functions/src/payments/providers/_template.ts` e implemente `PaymentProvider` (Mercado Pago ou Asaas).
2. Registre em `registry.ts` e defina `PAYMENT_PROVIDER`.
3. Guarde segredos com `firebase functions:secrets:set` (nunca no repositório/frontend).
4. Aponte o webhook do provedor para a URL da função `paymentWebhook`.

## Garantias de segurança já implementadas
- Preço lido só do backend (`platformConfig/pricing`); cliente nunca envia valor.
- Webhook: assinatura + consulta direta ao provedor + conferência de valor + idempotência por `eventId` em transação.
- Mock bloqueado fora do emulador; sem provedor em produção → "pagamento indisponível".
- Firestore Rules: isolamento por estabelecimento, dados operacionais só com licença ativa, saldo e escrita financeira só via servidor.
