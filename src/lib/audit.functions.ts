import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mutationSchema, importSchema, squareImportSchema } from "./audit-schemas";
import { parseInvoiceCsv } from "./invoice-csv";

export const readAuditData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const activation = await supabase.rpc("audit_activate_account");
    if (activation.error) throw new Error("Não foi possível verificar o acesso.");
    const roleResult = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleResult.error) throw new Error("Não foi possível verificar as permissões.");
    const roles = roleResult.data.map((r) => r.role);
    const [carriers, branches, squares, versions, invoices, items, access, localities] =
      await Promise.all([
        supabase.from("carriers").select("*").order("legal_name"),
        supabase.from("branches").select("*").order("name"),
        supabase.from("freight_squares").select("*").order("name"),
        supabase
          .from("freight_table_versions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("invoice_items").select("*"),
        supabase.from("audit_access_grants").select("*").order("name"),
        supabase
          .from("freight_square_localities")
          .select("id,square_id,name,position")
          .order("position"),
      ]);
    if (
      [carriers, branches, squares, versions, invoices, items, access, localities].some(
        (r) => r.error,
      )
    )
      throw new Error("Não foi possível carregar os registros. Tente novamente.");
    return {
      roles,
      carriers: carriers.data ?? [],
      branches: branches.data ?? [],
      squares: squares.data ?? [],
      versions: versions.data ?? [],
      invoices: invoices.data ?? [],
      items: items.data ?? [],
      access: access.data ?? [],
      localities: localities.data ?? [],
    };
  });

export const saveAuditRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => mutationSchema.parse(value))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const permission = await supabase.rpc(
      data.kind === "access" ? "has_role" : "audit_can_write",
      data.kind === "access" ? { _user_id: context.userId, _role: "admin" } : undefined,
    );
    if (permission.error || !permission.data)
      throw new Error("Seu perfil não possui permissão para alterar este cadastro.");
    let error;
    if (data.kind === "carrier") {
      const { id, ...value } = data.value;
      ({ error } = id
        ? await supabase.from("carriers").update(value).eq("id", id)
        : await supabase.from("carriers").insert(value));
    } else if (data.kind === "branch") {
      const { id, ...value } = data.value;
      ({ error } = id
        ? await supabase.from("branches").update(value).eq("id", id)
        : await supabase.from("branches").insert(value));
    } else if (data.kind === "version")
      ({ error } = await supabase
        .from("freight_table_versions")
        .insert({ ...data.value, status: "PENDENTE DE PARAMETRIZAÇÃO" }));
    else ({ error } = await supabase.from("audit_access_grants").upsert(data.value));
    if (error)
      throw new Error(
        error.code === "23505"
          ? "Este cadastro já existe. Confira o CNPJ ou código."
          : "Não foi possível salvar. Confira os campos e as permissões.",
      );
    return { saved: true };
  });

export const importInvoices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => importSchema.parse(value))
  .handler(async ({ data, context }) => {
    const permission = await context.supabase.rpc("audit_can_write");
    if (permission.error || !permission.data)
      throw new Error("Seu perfil não possui permissão para importar faturas.");
    const [carriers, branches] = await Promise.all([
      context.supabase.from("carriers").select("id,cnpj").eq("active", true),
      context.supabase.from("branches").select("id,code,name").eq("active", true),
    ]);
    if (carriers.error || branches.error)
      throw new Error("Não foi possível conferir os cadastros.");
    const invoices = parseInvoiceCsv(data.csv, {
      carriers: carriers.data,
      branches: branches.data,
    });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.csv));
    const content_hash = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const result = await context.supabase.rpc("audit_import_invoices", {
      payload: { file_name: data.file_name, content_hash, invoices },
    });
    if (result.error)
      throw new Error(
        result.error.code === "23505"
          ? "Este arquivo, fatura ou CT-e já foi importado. Nenhum registro foi duplicado."
          : "Não foi possível importar. Nenhum registro deste arquivo foi salvo.",
      );
    return { count: result.data };
  });

export const saveSquare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value: unknown) => squareImportSchema.parse(value))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("audit_save_square", {
      _name: data.name,
      _state: data.state,
      _carrier_id: data.carrier_id,
      _localities: data.localities,
    });
    if (result.error)
      throw new Error(
        result.error.code === "42501"
          ? "Seu perfil não possui permissão para cadastrar praças."
          : "Não foi possível salvar a praça. Nenhuma localidade foi alterada.",
      );
    return { id: result.data };
  });
