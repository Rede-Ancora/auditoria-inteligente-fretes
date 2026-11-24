/**
 * Regras de cálculo do frete rodoviário (padrão de mercado para carga fracionada),
 * com valores padrão por taxa e possibilidade de personalização por tabela.
 *
 * Ordem do cálculo:
 * 1. Peso considerado (real ou taxado = maior entre real e cubado)
 * 2. Frete base = composição de Frete Peso e Frete Valor
 * 3. Frete mínimo (piso sobre o frete base ou sobre o total)
 * 4. Taxas (GRIS, Ad Valorem, Pedágio, Despacho, TDE, TDA…)
 * 5. ICMS (já incluso na tabela ou somado "por dentro")
 */

export type CalcType = "faixa_peso" | "por_kg" | "por_100kg" | "percentual" | "fixo";
export type PercentBase = "nf" | "frete_peso" | "frete_base";
export type Applies = "sempre" | "condicional";
export type RuleMode = "padrao" | "personalizado";

export type FeeRule = {
  key: string;
  label: string;
  mode: RuleMode;
  type: CalcType;
  base: PercentBase;
  rate: string;
  altType: CalcType | "";
  altBase: PercentBase;
  altRate: string;
  minimum: string;
  maximum: string;
  applies: Applies;
  note: string;
};

export type FreightConfig = {
  peso: "taxado" | "real";
  composicao: "soma" | "maior" | "so_peso" | "so_valor";
  minimoSobre: "frete_base" | "total";
  icms: "incluso" | "por_dentro";
};

export type CommercialValue = { value: string; na: boolean };
export type CommercialValues = Record<string, CommercialValue>;
export type WeightBand = { weight: string; value: string };

/** Campos da tabela comercial (aba 1), na ordem da tabela da transportadora. */
export const COMMERCIAL_FIELDS = [
  "FRETE VALOR (% SOBRE $ NF)",
  "FRETE PESO (GATILHO)",
  "FRETE MÍNIMO",
  "GRIS (% SOBRE $ NF)",
  "GRIS MÍNIMO",
  "AD VALOREM (% SOBRE $ NF)",
  "ADV MÍNIMO",
  "PEDÁGIO",
  "DESPACHO (OU COLETA)",
  "FATOR DE CUBAGEM",
  "TDE",
  "TDA",
  "SEC/CAT",
  "TAS",
  "TRT",
  "TRT MÍNIMO",
  "EMEX (R$/100KG)",
  "EMEX (%)",
  "EMEX MÍNIMO",
  "TRF (%)",
  "TRF (R$)",
];

/** Unidade esperada de cada campo, mostrada na aba 1. */
export function fieldUnit(field: string) {
  if (field === "FRETE PESO (GATILHO)") return "R$/kg — excedente acima da última faixa de peso";
  if (field === "FATOR DE CUBAGEM") return "kg por m³ (ex.: 300)";
  if (field.includes("R$/100KG") || field === "PEDÁGIO") return "R$ por fração de 100 kg";
  if (field.includes("%") || ["TRT"].includes(field)) return "% (ex.: 0,30 para 0,30%)";
  return "R$ por CT-e";
}

export const CUBAGE_FIELD = "FATOR DE CUBAGEM";
export const MIN_FREIGHT_FIELD = "FRETE MÍNIMO";

export const DEFAULT_CONFIG: FreightConfig = {
  peso: "taxado",
  composicao: "soma",
  minimoSobre: "frete_base",
  icms: "incluso",
};

export const calcTypeLabels: Record<CalcType, string> = {
  faixa_peso: "Faixa de peso + excedente por kg",
  por_kg: "R$ por kg",
  por_100kg: "R$ por fração de 100 kg",
  percentual: "Percentual (%)",
  fixo: "Valor fixo por CT-e",
};
export const baseLabels: Record<PercentBase, string> = {
  nf: "valor da NF",
  frete_peso: "Frete Peso",
  frete_base: "frete base (peso + valor)",
};
export const appliesLabels: Record<Applies, string> = {
  sempre: "Sempre",
  condicional: "Condicional (destino exige)",
};

function rule(
  key: string,
  label: string,
  type: CalcType,
  rate: string,
  extra: Partial<FeeRule> = {},
): FeeRule {
  return {
    key,
    label,
    mode: "padrao",
    type,
    base: "nf",
    rate,
    altType: "",
    altBase: "nf",
    altRate: "",
    minimum: "",
    maximum: "",
    applies: "sempre",
    note: "",
    ...extra,
  };
}

/** Regras padrão por taxa — o ponto de partida de toda tabela nova. */
export const DEFAULT_RULES: FeeRule[] = [
  rule("frete_peso", "Frete Peso", "faixa_peso", "FRETE PESO (GATILHO)", {
    note: "Valor da faixa em que o peso se encaixa; acima da última faixa, soma o excedente em R$/kg. Sem faixas, usa R$/kg × peso.",
  }),
  rule("frete_valor", "Frete Valor", "percentual", "FRETE VALOR (% SOBRE $ NF)"),
  rule("gris", "GRIS", "percentual", "GRIS (% SOBRE $ NF)", { minimum: "GRIS MÍNIMO" }),
  rule("ad_valorem", "Ad Valorem", "percentual", "AD VALOREM (% SOBRE $ NF)", {
    minimum: "ADV MÍNIMO",
  }),
  rule("pedagio", "Pedágio", "por_100kg", "PEDÁGIO", {
    note: "Cada fração de 100 kg conta inteira (ex.: 130 kg = 2 frações).",
  }),
  rule("despacho", "Despacho / Coleta", "fixo", "DESPACHO (OU COLETA)"),
  rule("sec_cat", "SEC/CAT", "fixo", "SEC/CAT"),
  rule("tas", "TAS", "fixo", "TAS"),
  rule("tde", "TDE — dificuldade de entrega", "fixo", "TDE", { applies: "condicional" }),
  rule("tda", "TDA — difícil acesso", "fixo", "TDA", { applies: "condicional" }),
  rule("trt", "TRT — restrição de trânsito", "percentual", "TRT", {
    base: "frete_peso",
    minimum: "TRT MÍNIMO",
    applies: "condicional",
  }),
  rule("emex", "EMEX — emergência excepcional", "por_100kg", "EMEX (R$/100KG)", {
    altType: "percentual",
    altBase: "frete_peso",
    altRate: "EMEX (%)",
    minimum: "EMEX MÍNIMO",
    applies: "condicional",
  }),
  rule("trf", "TRF", "percentual", "TRF (%)", {
    base: "frete_base",
    altType: "fixo",
    altRate: "TRF (R$)",
    applies: "condicional",
  }),
];

export const defaultRule = (key: string) => DEFAULT_RULES.find((r) => r.key === key);

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const pct = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function readValue(values: CommercialValues, field: string): number | null {
  const item = values[field];
  if (!field || !item || item.na || item.value.trim() === "") return null;
  const number = Number(item.value.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function termText(type: CalcType, base: PercentBase, field: string, values: CommercialValues) {
  const v = readValue(values, field);
  const shown = (fmt: (n: number) => string) => (v === null ? `[${field || "sem campo"}]` : fmt(v));
  switch (type) {
    case "percentual":
      return `${shown(pct)} × ${baseLabels[base]}`;
    case "fixo":
      return `${shown(brl)} por CT-e`;
    case "por_kg":
      return `${shown(brl)}/kg × peso`;
    case "por_100kg":
      return `${shown(brl)} × frações de 100 kg`;
    case "faixa_peso":
      return `valor da faixa de peso (excedente: ${shown(brl)}/kg)`;
  }
}

/** Texto claro da regra, com os valores da tabela comercial. */
export function describeRule(r: FeeRule, values: CommercialValues): string {
  const main = termText(r.type, r.base, r.rate, values);
  const terms = r.altType ? [main, termText(r.altType, r.altBase, r.altRate, values)] : [main];
  const min = r.minimum ? readValue(values, r.minimum) : null;
  if (r.minimum) terms.push(min === null ? `[${r.minimum}]` : brl(min));
  let text = terms.length > 1 ? `Maior entre ${terms.join(" e ")}` : main;
  text = text.charAt(0).toUpperCase() + text.slice(1);
  const max = Number(r.maximum);
  if (r.maximum && Number.isFinite(max) && max > 0) text += `, limitado a ${brl(max)}`;
  return text;
}

/** Campos da tabela comercial que a regra usa e que não foram preenchidos. */
export function missingFields(r: FeeRule, values: CommercialValues): string[] {
  return [r.rate, r.altType ? r.altRate : "", r.minimum]
    .filter(Boolean)
    .filter((f) => values[f]?.na !== true && readValue(values, f) === null);
}

export function isNotApplicable(r: FeeRule, values: CommercialValues) {
  return Boolean(values[r.rate]?.na) && (!r.altType || Boolean(values[r.altRate]?.na));
}

export type SimulationInput = {
  nf: number;
  pesoReal: number;
  m3: number;
  condicionais: boolean;
  aliquotaIcms: number;
};
export type SimulationLine = { key: string; label: string; value: number; detail: string };
export type SimulationResult = {
  pesoCubado: number;
  pesoConsiderado: number;
  fretePeso: number;
  freteValor: number;
  freteBase: number;
  minimoAplicado: boolean;
  lines: SimulationLine[];
  subtotal: number;
  icms: number;
  total: number;
};

function bandFreight(peso: number, bands: WeightBand[], excedente: number | null) {
  const list = bands
    .map((b) => ({ weight: Number(b.weight), value: Number(b.value) }))
    .filter((b) => b.weight > 0 && Number.isFinite(b.value))
    .sort((a, b) => a.weight - b.weight);
  if (!list.length) return (excedente ?? 0) * peso;
  const band = list.find((b) => peso <= b.weight);
  if (band) return band.value;
  const last = list[list.length - 1]!;
  return last.value + (peso - last.weight) * (excedente ?? 0);
}

function term(
  type: CalcType,
  base: PercentBase,
  field: string,
  values: CommercialValues,
  ctx: { nf: number; peso: number; fretePeso: number; freteBase: number; bands: WeightBand[] },
) {
  const v = readValue(values, field);
  switch (type) {
    case "faixa_peso":
      return bandFreight(ctx.peso, ctx.bands, v);
    case "por_kg":
      return (v ?? 0) * ctx.peso;
    case "por_100kg":
      return (v ?? 0) * Math.ceil(ctx.peso / 100);
    case "fixo":
      return v ?? 0;
    case "percentual": {
      const amount = base === "nf" ? ctx.nf : base === "frete_peso" ? ctx.fretePeso : ctx.freteBase;
      return ((v ?? 0) / 100) * amount;
    }
  }
}

function applyRule(
  r: FeeRule,
  values: CommercialValues,
  ctx: { nf: number; peso: number; fretePeso: number; freteBase: number; bands: WeightBand[] },
) {
  let value = term(r.type, r.base, r.rate, values, ctx);
  if (r.altType) value = Math.max(value, term(r.altType, r.altBase, r.altRate, values, ctx));
  const min = r.minimum ? readValue(values, r.minimum) : null;
  if (min !== null) value = Math.max(value, min);
  const max = Number(r.maximum);
  if (r.maximum && Number.isFinite(max) && max > 0) value = Math.min(value, max);
  return round2(value);
}

/** Simula o frete de um CT-e com as regras e os valores informados. */
export function simulate(
  input: SimulationInput,
  values: CommercialValues,
  bands: WeightBand[],
  rules: FeeRule[],
  config: FreightConfig,
): SimulationResult {
  const fator = readValue(values, CUBAGE_FIELD) ?? 0;
  const pesoCubado = round2(input.m3 * fator);
  const pesoConsiderado =
    config.peso === "taxado" ? Math.max(input.pesoReal, pesoCubado) : input.pesoReal;
  const ctx = { nf: input.nf, peso: pesoConsiderado, fretePeso: 0, freteBase: 0, bands };
  const byKey = (key: string) => rules.find((r) => r.key === key);
  const pesoRule = byKey("frete_peso");
  const valorRule = byKey("frete_valor");
  const fretePeso =
    pesoRule && !isNotApplicable(pesoRule, values) ? applyRule(pesoRule, values, ctx) : 0;
  ctx.fretePeso = fretePeso;
  const freteValor =
    valorRule && !isNotApplicable(valorRule, values) ? applyRule(valorRule, values, ctx) : 0;
  let freteBase =
    config.composicao === "soma"
      ? fretePeso + freteValor
      : config.composicao === "maior"
        ? Math.max(fretePeso, freteValor)
        : config.composicao === "so_peso"
          ? fretePeso
          : freteValor;
  const minimo = readValue(values, MIN_FREIGHT_FIELD);
  let minimoAplicado = false;
  if (config.minimoSobre === "frete_base" && minimo !== null && freteBase < minimo) {
    freteBase = minimo;
    minimoAplicado = true;
  }
  ctx.freteBase = round2(freteBase);

  const lines: SimulationLine[] = [];
  for (const r of rules) {
    if (r.key === "frete_peso" || r.key === "frete_valor") continue;
    if (isNotApplicable(r, values)) continue;
    if (r.applies === "condicional" && !input.condicionais) continue;
    const value = applyRule(r, values, ctx);
    if (value > 0)
      lines.push({ key: r.key, label: r.label, value, detail: describeRule(r, values) });
  }
  let subtotal = round2(ctx.freteBase + lines.reduce((sum, l) => sum + l.value, 0));
  if (config.minimoSobre === "total" && minimo !== null && subtotal < minimo) {
    subtotal = minimo;
    minimoAplicado = true;
  }
  const icms =
    config.icms === "por_dentro" && input.aliquotaIcms > 0 && input.aliquotaIcms < 100
      ? round2(subtotal / (1 - input.aliquotaIcms / 100) - subtotal)
      : 0;
  return {
    pesoCubado,
    pesoConsiderado: round2(pesoConsiderado),
    fretePeso,
    freteValor,
    freteBase: ctx.freteBase,
    minimoAplicado,
    lines,
    subtotal,
    icms,
    total: round2(subtotal + icms),
  };
}

/** Converte a regra para o formato gravado em calculation_rules (somente texto). */
export function ruleToRecord(r: FeeRule, values: CommercialValues): Record<string, string> {
  return {
    component: r.key,
    label: r.label,
    mode: r.mode,
    type: r.type,
    base: r.base,
    rate: r.rate,
    alt_type: r.altType,
    alt_base: r.altBase,
    alt_rate: r.altRate,
    minimum: r.minimum,
    maximum: r.maximum,
    applies: r.applies,
    note: r.note,
    formula: describeRule(r, values),
  };
}

export function isCustomized(r: FeeRule) {
  const d = defaultRule(r.key);
  if (!d) return true;
  const keys: (keyof FeeRule)[] = [
    "type",
    "base",
    "rate",
    "altType",
    "altBase",
    "altRate",
    "minimum",
    "maximum",
    "applies",
  ];
  return keys.some((k) => d[k] !== r[k]);
}
