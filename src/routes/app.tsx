import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { createHgCloud } from "@/lib/hg-cloud";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Painel — HiperGestão" },
      { name: "description", content: "Seu painel de finanças pessoais no HiperGestão." },
      { property: "og:title", content: "Painel — HiperGestão" },
      { property: "og:description", content: "Seu painel de finanças pessoais no HiperGestão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  if (typeof window !== "undefined") {
    (window as unknown as { hgCloud: unknown }).hgCloud = createHgCloud(() => {
      queryClient.clear();
      window.location.reload();
    });
  }
  return (
    <iframe src="/hipergestao.html" title="HiperGestão" className="fixed inset-0 h-screen w-screen border-0" />
  );
}
