import { supabase } from "@/integrations/supabase/client";

type Row = { id: number; [k: string]: unknown };
const TABLES = {
  txs: "transactions",
  cards: "cards",
  buds: "budgets",
  recs: "recurrences",
  fats: "invoice_payments",
} as const;
type Key = keyof typeof TABLES;

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

// Last state confirmed in the database, used to send only what changed.
const synced: Record<string, Map<number, string>> = {};
let syncedCats = "";
let queue: Promise<void> = Promise.resolve();

export function createHgCloud(onSignOut: () => void) {
  return {
    async getUser() {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const userId = u.user.id;
      const { data } = await supabase.from("profiles").select("name,email,celular").eq("id", userId).maybeSingle();
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      return {
        id: userId,
        username: data?.name || u.user.email || "",
        email: u.user.email || "",
        celular: data?.celular || "",
        role: isAdmin ? "admin" : "user",
        active: true,
      };
    },
    async signIn(email: string, password: string) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === "Invalid login credentials" ? "E-mail ou senha inválidos" : error.message === "Email not confirmed" ? "Confirme seu e-mail pelo link enviado antes de entrar" : error.message);
    },
    async signUp(name: string, email: string, celular: string, password: string) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, celular }, emailRedirectTo: window.location.origin + "/app" },
      });
      if (error) {
        const m = error.message;
        if (/weak|easy to guess|pwned/i.test(m)) throw new Error("Essa senha é muito comum. Escolha uma senha mais forte.");
        if (/not allowed|invalid/i.test(m) && /email/i.test(m)) throw new Error("Esse e-mail não é válido.");
        if (/already registered/i.test(m)) throw new Error("E-mail já cadastrado.");
        if (/rate limit/i.test(m)) throw new Error("Muitas tentativas. Aguarde alguns minutos.");
        throw error;
      }
    },
    async resetPassword(email: string) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
      if (error) throw error;
    },
    async listUsers() {
      const { data } = await supabase.from("profiles").select("id,name,email,celular").order("created_at");
      return (data ?? []).map((p) => ({ id: p.id, username: p.name || p.email, email: p.email, celular: p.celular, role: "user", active: true }));
    },
    async load() {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(TABLES) as Key[]) {
        const { data, error } = await supabase.from(TABLES[k]).select("id,data").order("id");
        if (error) throw error;
        const rows = (data ?? []).map((r) => ({ ...(r.data as object), id: Number(r.id) }) as Row);
        synced[k] = new Map(rows.map((r) => [r.id, JSON.stringify(r)]));
        out[k] = rows;
      }
      const { data: c } = await supabase.from("user_categories").select("data").maybeSingle();
      out["cats"] = c?.data ?? null;
      syncedCats = c ? JSON.stringify(c.data) : "";
      return out;
    },
    save(state: Record<string, unknown>) {
      const snapshot = JSON.parse(JSON.stringify(state));
      queue = queue.then(async () => {
        const userId = await uid();
        for (const k of Object.keys(TABLES) as Key[]) {
          const rows = (snapshot[k] as Row[]) ?? [];
          const prev = synced[k] ?? new Map();
          const next = new Map(rows.map((r) => [Number(r.id), JSON.stringify(r)]));
          const upserts = rows.filter((r) => prev.get(Number(r.id)) !== next.get(Number(r.id)));
          const removed = [...prev.keys()].filter((id) => !next.has(id));
          if (upserts.length) {
            const { error } = await supabase.from(TABLES[k]).upsert(
              upserts.map((r) => ({ user_id: userId, id: Number(r.id), data: r as never, updated_at: new Date().toISOString() })),
            );
            if (error) throw error;
          }
          if (removed.length) {
            const { error } = await supabase.from(TABLES[k]).delete().in("id", removed);
            if (error) throw error;
          }
          synced[k] = next;
        }
        const cats = JSON.stringify(snapshot["cats"] ?? null);
        if (snapshot["cats"] && cats !== syncedCats) {
          const { error } = await supabase
            .from("user_categories")
            .upsert({ user_id: userId, data: snapshot["cats"], updated_at: new Date().toISOString() });
          if (error) throw error;
          syncedCats = cats;
        }
      }).catch((e) => {
        console.error(e);
        alert("Não foi possível salvar na nuvem: " + (e?.message ?? e));
      });
      return queue;
    },
    async updateEmail(email: string) {
      const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: window.location.origin });
      if (error) throw error;
    },
    async updatePassword(current: string, password: string) {
      const { error } = await supabase.auth.updateUser({ password, current_password: current } as never);
      if (error) throw error;
    },
    async signOut() {
      await supabase.auth.signOut();
      onSignOut();
    },
  };
}
