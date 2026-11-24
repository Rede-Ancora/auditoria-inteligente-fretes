import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  DEFAULT_RULES,
  describeRule,
  simulate,
  type CommercialValues,
} from "./freight-rules";

const values: CommercialValues = {
  "FRETE PESO (GATILHO)": { value: "0.50", na: false },
  "FRETE VALOR (% SOBRE $ NF)": { value: "0.5", na: false },
  "FRETE MÍNIMO": { value: "60", na: false },
  "GRIS (% SOBRE $ NF)": { value: "0.3", na: false },
  "GRIS MÍNIMO": { value: "5", na: false },
  "AD VALOREM (% SOBRE $ NF)": { value: "0", na: true },
  PEDÁGIO: { value: "4.5", na: false },
  "DESPACHO (OU COLETA)": { value: "12", na: false },
  "FATOR DE CUBAGEM": { value: "300", na: false },
  TDE: { value: "80", na: false },
};
const bands = [
  { weight: "50", value: "40" },
  { weight: "100", value: "70" },
];

describe("simulate", () => {
  it("usa o peso cubado quando maior e cobra o excedente acima da última faixa", () => {
    // 0,5 m³ × 300 = 150 kg cubado > 120 kg real → 70 + 50 kg × 0,50 = 95
    const r = simulate(
      { nf: 10000, pesoReal: 120, m3: 0.5, condicionais: false, aliquotaIcms: 0 },
      values,
      bands,
      DEFAULT_RULES,
      DEFAULT_CONFIG,
    );
    expect(r.pesoConsiderado).toBe(150);
    expect(r.fretePeso).toBe(95);
    expect(r.freteValor).toBe(50);
    expect(r.freteBase).toBe(145);
    const get = (k: string) => r.lines.find((l) => l.key === k)?.value;
    expect(get("gris")).toBe(30);
    expect(get("pedagio")).toBe(9); // 150 kg = 2 frações
    expect(get("despacho")).toBe(12);
    expect(get("ad_valorem")).toBeUndefined(); // não aplicável
    expect(get("tde")).toBeUndefined(); // condicional desligada
    expect(r.total).toBe(196);
  });

  it("aplica o frete mínimo, o mínimo do GRIS e o ICMS por dentro", () => {
    const r = simulate(
      { nf: 1000, pesoReal: 20, m3: 0, condicionais: true, aliquotaIcms: 12 },
      values,
      bands,
      DEFAULT_RULES,
      { ...DEFAULT_CONFIG, icms: "por_dentro" },
    );
    expect(r.minimoAplicado).toBe(true);
    expect(r.freteBase).toBe(60);
    expect(r.lines.find((l) => l.key === "gris")?.value).toBe(5);
    expect(r.lines.find((l) => l.key === "tde")?.value).toBe(80);
    expect(r.subtotal).toBe(161.5);
    expect(r.icms).toBe(22.02);
  });
});

describe("describeRule", () => {
  it("escreve a regra com os valores da tabela comercial", () => {
    const gris = DEFAULT_RULES.find((r) => r.key === "gris")!;
    expect(describeRule(gris, values).replace(/\u00a0/g, " ")).toBe(
      "Maior entre 0,3% × valor da NF e R$ 5,00",
    );
  });
});
