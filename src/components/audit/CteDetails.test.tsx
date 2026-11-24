import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
import { CteDetails, CteRows } from "./CteDetails";
import type { CteRecord } from "./cte-detail-data";

// Isolated fixture: never rendered in the operational application.
const record: CteRecord = {
  id: "fixture-1",
  number: "987",
  key: "1".repeat(44),
  issuedAt: "13/11/2026",
  carrier: "Transportadora de teste",
  branch: "Filial de teste",
  recipient: "Destinatário de teste",
  merchandise: { status: "missing" },
  weight: "Não informado",
  volumes: "Não informado",
  invoices: "Não informado",
  freight: { status: "informed", value: 100 },
  audited: { status: "informed", value: 90 },
  invoice: "",
  status: "Teste",
  components: [
    {
      name: "FRETE PESO",
      carrier: { status: "informed", value: 100 },
      audited: { status: "informed", value: 90 },
    },
  ],
};
function Flow() {
  const [selected, setSelected] = useState<CteRecord | null>(null);
  return (
    <>
      <table>
        <CteRows records={[record]} onSelect={setSelected} />
      </table>
      <CteDetails record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
afterEach(cleanup);
describe("Detalhamento de CT-e", () => {
  it("abre a decomposição do registro selecionado ao clicar na linha", () => {
    render(<Flow />);
    fireEvent.click(screen.getByRole("row", { name: "Detalhar CT-e 987" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "FRETE PESO" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir DACTE (PDF)" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("abre pelo teclado e preserva o link real do DACTE", () => {
    render(<Flow />);
    fireEvent.keyDown(screen.getByRole("row", { name: "Detalhar CT-e 987" }), { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    cleanup();
    render(
      <CteDetails
        record={{ ...record, dacteUrl: "https://example.com/cte.pdf" }}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("link", { name: "Abrir DACTE (PDF)" })).toHaveAttribute(
      "href",
      "https://example.com/cte.pdf",
    );
  });
});
