import { describe, expect, it } from "vitest";
import {
  carrierMatches,
  currentVersions,
  versionChain,
  versionToForm,
  type VersionLike,
} from "./table-versions";

const base = {
  carrier_id: "c1",
  commercial: {},
  calculation_rules: [],
  weight_bands: [],
  configuration: {},
};
const v1: VersionLike = { ...base, id: "v1", previous_version_id: null, created_at: "2026-01-01" };
const v2: VersionLike = { ...base, id: "v2", previous_version_id: "v1", created_at: "2026-02-01" };
const other: VersionLike = {
  ...base,
  id: "x1",
  previous_version_id: null,
  created_at: "2026-01-05",
};

describe("versões", () => {
  it("lista só a versão atual de cada tabela e monta o histórico", () => {
    expect(currentVersions([v1, v2, other]).map((v) => v.id)).toEqual(["v2", "x1"]);
    expect(versionChain([v1, v2, other], "v2").map((v) => v.id)).toEqual(["v2", "v1"]);
  });

  it("recarrega valores, faixas, regras e configuração para edição", () => {
    const form = versionToForm({
      ...v1,
      commercial: {
        "GRIS (% SOBRE $ NF)": { value: 0.3, state: "provided" },
        TDE: { value: null, state: "not_applicable" },
      },
      weight_bands: [{ weight: 50, value: 40 }],
      calculation_rules: [{ component: "gris", mode: "personalizado", type: "fixo", rate: "TAS" }],
      configuration: { composicao: "maior", icms: "por_dentro" },
    });
    expect(form.values["GRIS (% SOBRE $ NF)"]).toEqual({ value: "0.3", na: false });
    expect(form.values["TDE"]?.na).toBe(true);
    expect(form.bands).toEqual([
      { weight: "50", value: "40" },
      { weight: "", value: "" },
    ]);
    const gris = form.rules.find((r) => r.key === "gris");
    expect(gris?.type).toBe("fixo");
    expect(gris?.mode).toBe("personalizado");
    expect(form.config.composicao).toBe("maior");
    expect(form.config.icms).toBe("por_dentro");
  });
});

describe("pesquisa de transportadora", () => {
  const carrier = {
    id: "c1",
    legal_name: "Transportes São José Ltda",
    display_name: "São José",
    cnpj: "12.345.678/0001-90",
  };
  it("encontra por parte do nome, sem acento, ou pelo CNPJ", () => {
    expect(carrierMatches(carrier, "sao jo")).toBe(true);
    expect(carrierMatches(carrier, "12345678")).toBe(true);
    expect(carrierMatches(carrier, "rodonaves")).toBe(false);
  });
});
