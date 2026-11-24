import { createFileRoute } from "@tanstack/react-router";
import { ApprovedAudit } from "@/components/audit/ApprovedAudit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral | Auditoria de Fretes · Rede ANCORA" },
      {
        name: "description",
        content:
          "Visão Geral da Logística Nacional Rede ANCORA. Conciliação documental e comercial de fretes.",
      },
      { property: "og:title", content: "Visão Geral | Rede ANCORA" },
      {
        property: "og:description",
        content: "Auditoria Inteligente de Fretes da Logística Nacional Rede ANCORA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
function Page() {
  return <ApprovedAudit view="overview" />;
}
