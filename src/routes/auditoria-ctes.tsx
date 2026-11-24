import { createFileRoute } from "@tanstack/react-router";
import { ApprovedAudit } from "@/components/audit/ApprovedAudit";

export const Route = createFileRoute("/auditoria-ctes")({
  head: () => ({
    meta: [
      { title: "Auditoria de CT-es | Auditoria de Fretes · Rede ANCORA" },
      {
        name: "description",
        content:
          "Auditoria de CT-es da Logística Nacional Rede ANCORA. Conciliação documental e comercial de fretes.",
      },
      { property: "og:title", content: "Auditoria de CT-es | Rede ANCORA" },
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
  return <ApprovedAudit view="ctes" />;
}
