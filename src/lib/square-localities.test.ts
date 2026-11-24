import { describe, expect, it } from "vitest";
import { parseLocalities } from "./square-localities";

describe("parseLocalities", () => {
  it("lê uma localidade por linha, como vem do Excel", () => {
    expect(parseLocalities("Vitória\r\nVila Velha\r\nSerra\r\n")).toEqual([
      "Vitória",
      "Vila Velha",
      "Serra",
    ]);
  });

  it("ignora cabeçalho, linhas vazias e repetidos sem diferenciar acento", () => {
    expect(parseLocalities("Município\nCariacica\n\n  cariacica \nVITORIA\nVitória")).toEqual([
      "Cariacica",
      "VITORIA",
    ]);
  });

  it("usa a primeira coluna quando várias colunas são copiadas", () => {
    expect(parseLocalities("Guarapari\tES\nAnchieta\tES")).toEqual(["Guarapari", "Anchieta"]);
  });
});
