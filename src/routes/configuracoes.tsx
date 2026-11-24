import { createFileRoute } from "@tanstack/react-router";
import { ApprovedAudit } from "@/components/audit/ApprovedAudit";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Auditoria de Fretes · Rede ANCORA" },
      {
        name: "description",
        content:
          "Cadastros de usuários, filiais e transportadoras, parametrizações e governança da auditoria de fretes Rede ANCORA.",
      },
      { property: "og:title", content: "Configurações da Auditoria de Fretes | Rede ANCORA" },
      {
        property: "og:description",
        content:
          "Administração dos cadastros, parâmetros comerciais e acessos da operação de auditoria de fretes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ApprovedAudit view="settings" />,
});
