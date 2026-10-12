import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HiperGestão" },
      { name: "description", content: "HiperGestão — gestão financeira pessoal." },
      { property: "og:title", content: "HiperGestão" },
      { property: "og:description", content: "HiperGestão — gestão financeira pessoal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
