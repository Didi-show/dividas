"use client";
import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, functions, db, brl } from "@/lib/firebase";

const call = <T,>(n: string, d?: unknown) => httpsCallable<unknown, T>(functions, n)(d).then(r => r.data);
type Est = { id: string; nome: string; licenseStatus: string };

export default function Painel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState("");
  const [ests, setEsts] = useState<Est[]>([]); const [nome, setNome] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [pix, setPix] = useState<{ chargeId: string; copyAndPaste: string } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) return;
    call<{ licensePriceCents: number }>("getLicensePrice").then(d => setPrice(d.licensePriceCents)).catch(() => setPrice(null));
    return onSnapshot(query(collection(db, "establishments"), where("ownerUid", "==", user.uid)),
      s => setEsts(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Est, "id">) }))));
  }, [user]);

  const run = async (f: () => Promise<unknown>) => { setMsg(""); try { await f(); } catch (e: any) { setMsg(e.message); } };

  if (!user) return (
    <main className="mx-auto max-w-sm p-6"><h1 className="mb-4 text-2xl font-bold">Entrar / Cadastrar</h1>
      <input className="mb-2 w-full rounded border p-2" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="mb-2 w-full rounded border p-2" type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} />
      <button className="mr-2 rounded bg-brand px-4 py-2 text-white" onClick={() => run(() => signInWithEmailAndPassword(auth, email, senha))}>Entrar</button>
      <button className="rounded border px-4 py-2" onClick={() => run(() => createUserWithEmailAndPassword(auth, email, senha))}>Cadastrar</button>
      <p className="mt-3 text-red-600">{msg}</p></main>);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Meus estabelecimentos</h1>
        <button onClick={() => signOut(auth)} className="text-sm underline">Sair</button></div>
      <div className="my-4 flex gap-2">
        <input className="flex-1 rounded border p-2" placeholder="Nome do estabelecimento" value={nome} onChange={e => setNome(e.target.value)} />
        <button className="rounded bg-brand px-4 text-white" onClick={() => run(async () => { await call("createEstablishment", { nome }); setNome(""); })}>Cadastrar</button>
      </div>
      {ests.map(e => (
        <div key={e.id} className="mb-3 rounded-xl bg-white p-4 shadow">
          <b>{e.nome}</b> — licença: {e.licenseStatus === "active" ? "✅ ativa" : "⏳ pendente"}
          {e.licenseStatus !== "active" && <div className="mt-2">
            <p>Valor da licença: {price ? brl(price) : "indisponível"}</p>
            <button className="mt-1 rounded bg-brand px-3 py-1 text-white" onClick={() => run(async () => setPix(await call("createPixCharge", { estId: e.id })))}>Pagar com Pix</button>
          </div>}
        </div>))}
      {pix && <div className="rounded-xl bg-white p-4 shadow"><p className="font-semibold">Pix Copia e Cola</p>
        <code className="block break-all text-xs">{pix.copyAndPaste}</code>
        {process.env.NEXT_PUBLIC_USE_EMULATORS === "true" &&
          <button className="mt-2 rounded border px-3 py-1" onClick={() => run(() => call("devSimulatePayment", { chargeId: pix.chargeId }))}>[DEV] Simular pagamento</button>}
      </div>}
      <p className="mt-3 text-red-600">{msg}</p>
    </main>);
}
