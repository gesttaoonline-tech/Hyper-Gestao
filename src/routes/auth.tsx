import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — HiperGestão" },
      { name: "description", content: "Entre ou crie sua conta no HiperGestão." },
      { property: "og:title", content: "Entrar — HiperGestão" },
      { property: "og:description", content: "Entre ou crie sua conta no HiperGestão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";
const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/app" });
      } else if (mode === "signup") {
        if (password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMsg({ ok: true, text: "Conta criada! Confirme seu e-mail pelo link enviado e depois entre." });
        setMode("login");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg({ ok: true, text: "Enviamos um link para redefinir sua senha." });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setMsg({ ok: false, text: m === "Invalid login credentials" ? "E-mail ou senha inválidos." : m });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">HiperGestão</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Entre na sua conta" : mode === "signup" ? "Crie sua conta" : "Recuperar senha"}
          </p>
        </div>
        {mode === "signup" && (
          <input className={input} placeholder="Nome" required value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input className={input} type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode !== "forgot" && (
          <input className={input} type="password" placeholder="Senha" required value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
        {msg && <p className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>}
        <button
          disabled={busy}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? "Aguarde..." : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
        </button>
        <div className="flex justify-between text-sm">
          {mode !== "login" ? (
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setMode("login")}>Já tenho conta</button>
          ) : (
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setMode("signup")}>Criar conta</button>
          )}
          {mode === "login" && (
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setMode("forgot")}>Esqueci a senha</button>
          )}
        </div>
      </form>
    </div>
  );
}
