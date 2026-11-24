import {
  DEFAULT_CONFIG,
  DEFAULT_RULES,
  type Applies,
  type CalcType,
  type CommercialValues,
  type FeeRule,
  type FreightConfig,
  type PercentBase,
  type WeightBand,
} from "./freight-rules";
import { normalizeLocality } from "./square-localities";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type VersionLike = {
  id: string;
  carrier_id: string;
  previous_version_id: string | null;
  created_at: string;
  commercial: Json;
  calculation_rules: Json;
  weight_bands: Json;
  configuration: Json;
};
export type CarrierLike = { id: string; legal_name: string; display_name: string; cnpj: string };

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Só a versão mais recente de cada tabela (as que não foram substituídas por outra). */
export function currentVersions<T extends VersionLike>(versions: T[]): T[] {
  const replaced = new Set(versions.map((v) => v.previous_version_id).filter(Boolean));
  return versions.filter((v) => !replaced.has(v.id));
}

/** Histórico de uma tabela, da versão informada até a primeira. */
export function versionChain<T extends VersionLike>(versions: T[], id: string): T[] {
  const byId = new Map(versions.map((v) => [v.id, v]));
  const chain: T[] = [];
  let current = byId.get(id);
  while (current && chain.length < 500) {
    chain.push(current);
    current = current.previous_version_id ? byId.get(current.previous_version_id) : undefined;
  }
  return chain;
}

export const versionNumber = (versions: VersionLike[], id: string) =>
  versionChain(versions, id).length;

/** Pesquisa por razão social, nome de exibição ou CNPJ (com ou sem pontuação). */
export function carrierMatches(carrier: CarrierLike | undefined, term: string) {
  const query = normalizeLocality(term);
  if (!query) return true;
  if (!carrier) return false;
  const digits = term.replace(/\D/g, "");
  return (
    normalizeLocality(carrier.legal_name).includes(query) ||
    normalizeLocality(carrier.display_name).includes(query) ||
    (digits.length >= 3 && carrier.cnpj.replace(/\D/g, "").includes(digits))
  );
}

/** Converte uma versão gravada de volta para o estado do formulário de edição. */
export function versionToForm(v: VersionLike): {
  values: CommercialValues;
  bands: WeightBand[];
  rules: FeeRule[];
  config: FreightConfig;
} {
  const values: CommercialValues = {};
  if (isObject(v.commercial))
    for (const [name, item] of Object.entries(v.commercial)) {
      if (!isObject(item)) continue;
      values[name] = {
        value: typeof item["value"] === "number" ? String(item["value"]) : "",
        na: item["state"] === "not_applicable",
      };
    }

  const bands: WeightBand[] = Array.isArray(v.weight_bands)
    ? (v.weight_bands as unknown[]).filter(isObject).map((b) => ({
        weight: b["weight"] == null ? "" : String(b["weight"]),
        value: b["value"] == null ? "" : String(b["value"]),
      }))
    : [];
  bands.push({ weight: "", value: "" });

  const saved = new Map(
    (Array.isArray(v.calculation_rules) ? (v.calculation_rules as unknown[]) : [])
      .filter(isObject)
      .map((r) => [str(r["component"]), r]),
  );
  const rules = DEFAULT_RULES.map((d) => {
    const r = saved.get(d.key);
    if (!r) return { ...d };
    return {
      ...d,
      mode: str(r["mode"]) === "personalizado" ? ("personalizado" as const) : ("padrao" as const),
      type: (str(r["type"]) || d.type) as CalcType,
      base: (str(r["base"]) || d.base) as PercentBase,
      rate: str(r["rate"]) || d.rate,
      altType: str(r["alt_type"]) as CalcType | "",
      altBase: (str(r["alt_base"]) || d.altBase) as PercentBase,
      altRate: str(r["alt_rate"]),
      minimum: str(r["minimum"]),
      maximum: str(r["maximum"]),
      applies: (str(r["applies"]) || d.applies) as Applies,
      note: str(r["note"]) || d.note,
    };
  });

  const c = isObject(v.configuration) ? v.configuration : {};
  const pick = <K extends keyof FreightConfig>(key: string, allowed: FreightConfig[K][], fb: K) =>
    (allowed as string[]).includes(str(c[key]))
      ? (str(c[key]) as FreightConfig[K])
      : DEFAULT_CONFIG[fb];
  const config: FreightConfig = {
    peso: pick("peso_considerado", ["taxado", "real"], "peso"),
    composicao:
      c["max_freight"] === true && !str(c["composicao"])
        ? "maior"
        : pick("composicao", ["soma", "maior", "so_peso", "so_valor"], "composicao"),
    minimoSobre: pick("frete_minimo_sobre", ["frete_base", "total"], "minimoSobre"),
    icms: pick("icms", ["incluso", "por_dentro"], "icms"),
  };
  return { values, bands, rules, config };
}

/** Próximo campo a receber o cursor ao pressionar Enter. */
export function nextFocusable(current: HTMLElement): HTMLElement | null {
  const scope =
    current.closest<HTMLElement>("[role='dialog'], .modal, form, .panel, section") ?? document.body;
  const fields = Array.from(
    scope.querySelectorAll<HTMLElement>(
      "input:not([type='hidden']):not([type='file']):not([type='checkbox']):not([type='radio']), select, textarea",
    ),
  ).filter((el) => {
    const field = el as HTMLInputElement;
    return !field.disabled && !field.readOnly && el.offsetParent !== null && el.tabIndex >= 0;
  });
  const index = fields.indexOf(current);
  return index >= 0 ? (fields[index + 1] ?? null) : null;
}
