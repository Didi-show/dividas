import Link from "next/link";
const itens = ["Clientes e saldo devedor automático", "Vendas fiadas com parcelas e vencimentos", "Cobrança pelo WhatsApp", "Relatórios e recibos", "Equipe sem custo extra por funcionário"];
export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold text-brand">Fiado Fácil</h1>
      <p className="mt-4 text-lg">Controle o fiado do seu comércio. <b>Pague uma vez, use para sempre</b> — sem mensalidade.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">{itens.map(i => <li key={i} className="rounded-xl bg-white p-4 shadow">{i}</li>)}</ul>
      <Link href="/painel" className="mt-10 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-white">Criar conta grátis</Link>
    </main>
  );
}
