import { createFileRoute } from "@tanstack/react-router";
import { createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — HiperGestão" },
      { name: "description", content: "Defina uma nova senha para sua conta HiperGestão." },
      { property: "og:title", content: "Nova senha — HiperGestão" },
      { property: "og:description", content: "Defina uma nova senha para sua conta HiperGestão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setMsg("A senha precisa ter pelo menos 6 caracteres.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setMsg(error.message);
    window.location.href = "/app";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-bold text-foreground">Defina sua nova senha</h1>
        <input
          type="password"
          required
          placeholder="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
        {msg && <p className="text-sm text-destructive">{msg}</p>}
        <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Salvar senha
        </button>
      </form>
    </div>
  );
}
