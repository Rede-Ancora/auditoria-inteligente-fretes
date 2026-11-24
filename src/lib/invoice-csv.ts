import Papa from "papaparse";
import { z } from "zod";
import { cnpjSchema } from "./audit-schemas";

const optionalMoney = z.string().transform((v) => {
  const value = v.trim();
  if (!value) return null;
  const parsed = Number(value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Valor monetário ou peso inválido: " + value);
  return parsed;
});
const date = z.string().transform((v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v) ? v.split("/").reverse().join("-") : v).refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Data de emissão inválida.");
const rowSchema = z.object({ numero_fatura: z.string().min(1).max(100), cnpj_transportadora: cnpjSchema, filial_ancora: z.string().min(1).max(100), numero_cte: z.string().min(1).max(100), chave_cte: z.string().regex(/^(\d{44})?$/).default(""), data_emissao_fatura: date, data_vencimento: z.union([z.literal(""), date]).default(""), valor_total_fatura: optionalMoney.default(""), valor_cobrado_cte: optionalMoney.default(""), peso_base_calculo_kg: optionalMoney.default("") }).passthrough();
type Catalog = { carriers: { id: string; cnpj: string }[]; branches: { id: string; code: string; name: string }[] };
type Invoice = { carrier_id: string; number: string; issued_on: string; due_on: string | null; declared_total: number | null; items: { branch_id: string; cte_key: string | null; cte_number: string; charged_total: number | null; weight_kg: number | null; charged_components: Record<string, number | null>; source_row: Record<string, string> }[] };
export function parseInvoiceCsv(csv: string, catalog: Catalog): Invoice[] {
  const result = Papa.parse<Record<string, string>>(csv.replace(/^\uFEFF/, ""), { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim(), transform: (v) => v.trim() });
  if (result.errors.length) throw new Error("CSV inválido. Confira o separador e as colunas do modelo.");
  if (!result.data.length || result.data.length > 10000) throw new Error("O CSV deve conter de 1 a 10.000 linhas.");
  const bills = new Map<string, Invoice>();
  const items = new Set<string>();
  result.data.forEach((source, index) => {
    const checked = rowSchema.safeParse(source);
    if (!checked.success) throw new Error(`Linha ${index + 2}: ${checked.error.issues[0]?.message ?? "campos inválidos"}`);
    const row = checked.data;
    const carrier = catalog.carriers.find((c) => c.cnpj === row.cnpj_transportadora);
    const branch = catalog.branches.find((b) => b.code === row.filial_ancora || b.name === row.filial_ancora);
    if (!carrier || !branch) throw new Error(`Linha ${index + 2}: cadastre a transportadora e a filial antes de importar.`);
    const key = `${carrier.id}:${row.numero_fatura}`;
    let bill = bills.get(key);
    if (!bill) {
      bill = { carrier_id: carrier.id, number: row.numero_fatura, issued_on: row.data_emissao_fatura, due_on: row.data_vencimento || null, declared_total: row.valor_total_fatura, items: [] };
      bills.set(key, bill);
    } else if (bill.issued_on !== row.data_emissao_fatura || bill.due_on !== (row.data_vencimento || null) || bill.declared_total !== row.valor_total_fatura) throw new Error(`Linha ${index + 2}: cabeçalho da mesma fatura possui valores conflitantes.`);
    const itemKey = `${key}:${branch.id}:${row.numero_cte}`;
    if (items.has(itemKey)) throw new Error(`Linha ${index + 2}: CT-e repetido na mesma fatura e filial.`);
    items.add(itemKey);
    const components = Object.fromEntries(Object.entries(source).filter(([name]) => /_(cobrado|cobrada|cobrados)$/.test(name) && name !== "valor_cobrado_cte").map(([name, value]) => [name, optionalMoney.parse(value)]));
    bill.items.push({ branch_id: branch.id, cte_key: row.chave_cte || null, cte_number: row.numero_cte, charged_total: row.valor_cobrado_cte, weight_kg: row.peso_base_calculo_kg, charged_components: components, source_row: source });
  });
  return [...bills.values()];
}