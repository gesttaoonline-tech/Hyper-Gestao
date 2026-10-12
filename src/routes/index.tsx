import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HiperGestão" },
      { name: "description", content: "HiperGestão — gestão financeira pessoal." },
      { property: "og:title", content: "HiperGestão" },
      { property: "og:description", content: "HiperGestão — gestão financeira pessoal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/hipergestao.html"
      title="HiperGestão"
      className="fixed inset-0 h-screen w-screen border-0"
    />
  );
}
