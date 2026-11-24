import { createFileRoute } from "@tanstack/react-router";
import { ApprovedAudit } from "@/components/audit/ApprovedAudit";

export const Route = createFileRoute("/importar-faturas")({
  head: () => ({
    meta: [
      { title: "Importar Faturas | Auditoria de Fretes · Rede ANCORA" },
      {
        name: "description",
        content:
          "Importar Faturas da Logística Nacional Rede ANCORA. Conciliação documental e comercial de fretes.",
      },
      { property: "og:title", content: "Importar Faturas | Rede ANCORA" },
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
  return <ApprovedAudit view="upload" />;
}
