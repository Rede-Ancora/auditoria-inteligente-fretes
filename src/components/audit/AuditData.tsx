import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { readAuditData, saveAuditRecord, importInvoices, saveSquare } from "@/lib/audit.functions";
import { mutationSchema, squareImportSchema, errorMessage } from "@/lib/audit-schemas";
import { useAuditSession } from "./AuditSession";

type Data = Awaited<ReturnType<typeof readAuditData>>;
const empty: Data = { roles: [], carriers: [], branches: [], squares: [], versions: [], invoices: [], items: [], access: [], localities: [] };
const DataContext = createContext<{ data: Data; canWrite: boolean; admin: boolean; loading: boolean; error: string; save: (value: unknown) => Promise<void>; saveSquare: (value: unknown) => Promise<void>; importFile: (file: File) => Promise<number> } | null>(null);
export function AuditDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuditSession();
  const client = useQueryClient();
  const read = useServerFn(readAuditData);
  const saveFn = useServerFn(saveAuditRecord);
  const importFn = useServerFn(importInvoices);
  const squareFn = useServerFn(saveSquare);
  const query = useQuery({ queryKey: ["audit-data", user?.id], queryFn: () => read(), enabled: Boolean(user), retry: false });
  const data = user ? query.data ?? empty : empty;
  const admin = data.roles.includes("admin");
  return <DataContext.Provider value={{ data, canWrite: admin || data.roles.includes("transportes"), admin, loading: query.isLoading && Boolean(user), error: query.error ? errorMessage(query.error) : "", save: async (value) => {
    const checked = mutationSchema.parse(value);
    await saveFn({ data: checked });
    await client.invalidateQueries({ queryKey: ["audit-data"] });
  }, saveSquare: async (value) => {
    const checked = squareImportSchema.parse(value);
    await squareFn({ data: checked });
    await client.invalidateQueries({ queryKey: ["audit-data"] });
  }, importFile: async (file) => {
    if (file.size > 5_000_000) throw new Error("O arquivo excede o limite de 5 MB.");
    const result = await importFn({ data: { csv: await file.text(), file_name: file.name } });
    await client.invalidateQueries({ queryKey: ["audit-data"] });
    return result.count;
  } }}>{children}</DataContext.Provider>;
}
export function useAuditData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("Dados da auditoria indisponíveis.");
  return value;
}
