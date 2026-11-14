import "./globals.css";
export const metadata = { title: "Fiado Fácil — controle de fiado sem mensalidade" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body className="bg-slate-50 text-slate-900 antialiased">{children}</body></html>;
}
