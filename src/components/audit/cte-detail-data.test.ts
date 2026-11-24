import { describe, expect, it } from "vitest";
import { formatFreight, getDacteUrl } from "./cte-detail-data";

describe("Integridade da decomposição do frete", () => {
  it("preserva valor zero informado como valor monetário", () => {
    expect(formatFreight({ status: "informed", value: 0 })).toBe("R$\u00a00,00");
  });
  it("mantém rubricas ausentes distintas de valores zero", () => {
    expect(formatFreight({ status: "missing" })).not.toBe(
      formatFreight({ status: "informed", value: 0 }),
    );
    expect(
      new Set(
        ["missing", "not-applicable", "unidentified", "pending"].map((status) =>
          formatFreight({
            status: status as "missing" | "not-applicable" | "unidentified" | "pending",
          }),
        ),
      ).size,
    ).toBe(4);
  });
  it("não fabrica uma URL quando o DACTE não está disponível", () => {
    expect(getDacteUrl()).toBeUndefined();
  });
  it("aceita URLs HTTPS de documentos e rejeita esquemas inseguros", () => {
    expect(getDacteUrl("https://example.com/documentos/cte.pdf")).toBe(
      "https://example.com/documentos/cte.pdf",
    );
    expect(getDacteUrl("javascript:alert(1)")).toBeUndefined();
    expect(getDacteUrl("data:application/pdf;base64,abc")).toBeUndefined();
  });
});
