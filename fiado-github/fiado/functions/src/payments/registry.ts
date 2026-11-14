import { PaymentProvider } from "./PaymentProvider";
import { mockProvider } from "./providers/mock";
export const isEmulator = () => process.env.FUNCTIONS_EMULATOR === "true";
export function getProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  if (name === "mock") {
    if (!isEmulator()) throw new Error("PAYMENT_UNAVAILABLE: nenhum intermediador configurado em produção.");
    return mockProvider;
  }
  // case "mercadopago": return mercadoPagoProvider;
  // case "asaas": return asaasProvider;
  throw new Error("PAYMENT_UNAVAILABLE: provedor desconhecido: " + name);
}
