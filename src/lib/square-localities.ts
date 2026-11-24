export const MAX_LOCALITIES = 5000;
/** Marcador gravado como única localidade de uma praça "Geral" (todas as localidades da UF). */
export const GENERAL_LOCALITY = "*";
const HEADERS = new Set([
  "municipio",
  "municipios",
  "cidade",
  "cidades",
  "localidade",
  "localidades",
  "nome",
  "praca",
  "pracas",
]);

export function normalizeLocality(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Lê o texto copiado de uma planilha (uma localidade por linha; se vierem várias
 * colunas, usa a primeira), ignora linhas vazias, um cabeçalho na primeira linha
 * e nomes repetidos (sem diferenciar maiúsculas nem acentos).
 */
export function parseLocalities(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((line, index) => {
    const cell = (line.split("\t")[0] ?? "").replace(/^"|"$/g, "").trim().replace(/\s+/g, " ");
    if (!cell || cell === GENERAL_LOCALITY) return;
    const key = normalizeLocality(cell);
    if (index === 0 && HEADERS.has(key)) return;
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cell.slice(0, 120));
  });
  return result;
}
