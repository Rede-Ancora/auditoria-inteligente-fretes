import { describe, expect, it } from "vitest";
import { parseInvoiceCsv } from "./invoice-csv";
import { mutationSchema } from "./audit-schemas";

const catalog = { carriers: [{ id: "c1", cnpj: "12345678000190" }], branches: [{ id: "b1", code: "01", name: "Filial teste" }] };
const header = "numero_fatura;cnpj_transportadora;filial_ancora;numero_cte;data_emissao_fatura;valor_total_fatura;valor_cobrado_cte;gris_cobrado;pedagio_cobrado";
const row = "F001;12345678000190;01;100;2026-11-16;100,00;60,00;0;";
describe("Integridade da importação", () => {
  it("preserva o total do cabeçalho repetido sem somar as linhas", () => {
    const invoices = parseInvoiceCsv(`${header}\n${row}\n${row.replace(";100;", ";101;")}`, catalog);
    expect(invoices).toHaveLength(1);
    expect(invoices[0]?.declared_total).toBe(100);
    expect(invoices[0]?.items).toHaveLength(2);
  });
  it("distingue zero de componente ausente", () => {
    const invoice = parseInvoiceCsv(`${header}\n${row}`, catalog)[0];
    expect(invoice?.items[0]?.charged_components["gris_cobrado"]).toBe(0);
    expect(invoice?.items[0]?.charged_components["pedagio_cobrado"]).toBeNull();
  });
  it("recusa CT-e repetido na mesma fatura", () => {
    expect(() => parseInvoiceCsv(`${header}\n${row}\n${row}`, catalog)).toThrow("CT-e repetido");
  });
  it("não fabrica transportadoras ou filiais", () => {
    expect(() => parseInvoiceCsv(`${header}\n${row}`, { carriers: [], branches: [] })).toThrow("cadastre");
  });
  it("recusa cabeçalhos conflitantes", () => {
    expect(() => parseInvoiceCsv(`${header}\n${row}\n${row.replace(";100;", ";101;").replace("100,00", "120,00")}`, catalog)).toThrow("conflitantes");
  });
  it("mantém fórmulas como texto sem executá-las", () => {
    const result = mutationSchema.safeParse({ kind: "version", value: { carrier_id: "00000000-0000-4000-8000-000000000001", branch_id: "00000000-0000-4000-8000-000000000002", square_id: null, destination: "ES", valid_from: "2026-11-16", valid_until: null, commercial: { GRIS: { value: null, state: "missing" } }, calculation_rules: [{ formula: "PENDENTE" }], weight_bands: [], configuration: { max_freight: true }, notes: "", previous_version_id: null } });
    expect(result.success).toBe(true);
    if (result.success && result.data.kind === "version") expect(result.data.value.calculation_rules[0]?.["formula"]).toBe("PENDENTE");
  });
});