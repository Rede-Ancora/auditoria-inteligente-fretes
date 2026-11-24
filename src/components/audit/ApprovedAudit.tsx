import { createElement, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Download,
  Plus,
  Upload,
  LayoutDashboard,
  Files,
  FileCheck,
  TableProperties,
  Flag,
  X,
  Settings,
  Search,
  Pencil,
  Sun,
  Moon,
  Monitor,
  TriangleAlert,
  Wallet,
  Link2,
  FileX,
  FileText,
  BarChart3,
  Lightbulb,
  History,
  Truck,
  MapPin,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { AuditSettings } from "./AuditSettings";
import { CteDetails, CteRows } from "./CteDetails";
import type { CteRecord } from "./cte-detail-data";
import layout from "./approved-layout.json";
import { useAuditData } from "./AuditData";
import { useAuditSession } from "./AuditSession";
import { UserMenu } from "./AuditGate";
import { SquareEditor } from "./SquareEditor";
import { CalcRulesEditor } from "./CalcRulesEditor";
import {
  COMMERCIAL_FIELDS,
  DEFAULT_CONFIG,
  DEFAULT_RULES,
  fieldUnit,
  ruleToRecord,
  type CommercialValues,
  type FeeRule,
  type FreightConfig,
} from "@/lib/freight-rules";
import {
  carrierMatches,
  currentVersions,
  nextFocusable,
  versionChain,
  versionNumber,
  versionToForm,
} from "@/lib/table-versions";
import { GENERAL_LOCALITY } from "@/lib/square-localities";
import { errorMessage } from "@/lib/audit-schemas";

const LOGO_URL =
  "https://cdn.redeancora.com.br/Manual_da_Marca/Logotipo_Oficial/Logotipo_Oficial_Rede_ANCORA.png";
type ThemeMode = "system" | "light" | "dark";
const themeOptions: { mode: ThemeMode; label: string; Icon: LucideIcon }[] = [
  { mode: "system", label: "Seguir o sistema", Icon: Monitor },
  { mode: "light", label: "Claro", Icon: Sun },
  { mode: "dark", label: "Escuro", Icon: Moon },
];
function textOf(node: LayoutNode): string {
  return typeof node === "string" ? node : node.children.map(textOf).join(" ");
}
function findClass(node: LayoutNode, name: string): LayoutNode | undefined {
  if (typeof node === "string") return undefined;
  const classes = String(node.attrs["class"] || "").split(" ");
  if (classes.includes(name)) return node;
  for (const child of node.children) {
    const found = findClass(child, name);
    if (found) return found;
  }
  return undefined;
}
function kpiIcon(label: string): LucideIcon {
  const t = label.toLowerCase();
  if (t.includes("alerta") || t.includes("diverg")) return TriangleAlert;
  if (t.includes("valor")) return Wallet;
  if (t.includes("sem fatura")) return FileX;
  if (t.includes("associad") || t.includes("conciliad") || t.includes("com fatura")) return Link2;
  if (t.includes("fatura")) return Files;
  return FileText;
}
function panelIcon(title: string): { Icon: LucideIcon; tone: "" | "red" | "green" } {
  const t = title.toLowerCase();
  if (t.includes("volume")) return { Icon: BarChart3, tone: "" };
  if (t.includes("alerta") || t.includes("ocorrência")) return { Icon: TriangleAlert, tone: "red" };
  if (t.includes("insight")) return { Icon: Lightbulb, tone: "green" };
  if (t.includes("resumo")) return { Icon: Scale, tone: "green" };
  if (t.includes("histórico")) return { Icon: History, tone: "" };
  if (t.includes("arquivo")) return { Icon: Upload, tone: "" };
  if (t.includes("transportadora")) return { Icon: Truck, tone: "" };
  if (t.includes("praça")) return { Icon: MapPin, tone: "" };
  if (t.includes("tabela") || t.includes("condiç") || t.includes("leiaute"))
    return { Icon: TableProperties, tone: "" };
  if (t.includes("ct-e")) return { Icon: FileCheck, tone: "" };
  if (t.includes("fatura")) return { Icon: Files, tone: "" };
  return { Icon: FileText, tone: "" };
}
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  const time = now
    ? now.toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";
  return (
    <div className="live-clock" aria-label={`Hora de Brasília ${time}`}>
      <b>{time}</b>
      <span>
        Hora de Brasília
        <br />
        ao vivo
      </span>
    </div>
  );
}
function todayLabel() {
  return new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type LayoutNode =
  | string
  | { tag: string; attrs: Record<string, string | number | boolean>; children: LayoutNode[] };
export type AuditView =
  "overview" | "upload" | "invoices" | "ctes" | "tables" | "alerts" | "settings";
const destinations = {
  overview: "/",
  upload: "/importar-faturas",
  invoices: "/auditoria-faturas",
  ctes: "/auditoria-ctes",
  tables: "/tabelas-frete",
  alerts: "/central-alertas",
  settings: "/configuracoes",
} as const;
const names = {
  overview: "Visão Geral",
  upload: "Importar Faturas",
  invoices: "Auditoria de Faturas",
  ctes: "Auditoria de CT-es",
  tables: "Tabelas de Frete",
  alerts: "Central de Alertas",
  settings: "Configurações",
};
const icons = {
  overview: LayoutDashboard,
  upload: Upload,
  invoices: Files,
  ctes: FileCheck,
  tables: TableProperties,
  alerts: Flag,
  settings: Settings,
};
const commercial = COMMERCIAL_FIELDS;
const headers = [
  "numero_fatura",
  "cnpj_transportadora",
  "razao_social_transportadora",
  "data_emissao_fatura",
  "data_vencimento",
  "filial_ancora",
  "chave_cte",
  "numero_cte",
  "peso_base_calculo_kg",
  "frete_peso_cobrado",
  "frete_fixo_cobrado",
  "ad_valorem_cobrado",
  "gris_cobrado",
  "pedagio_cobrado",
  "taxa_despacho_cobrada",
  "trt_cobrado",
  "tde_cobrado",
  "taxa_dificuldade_entrega_cobrada",
  "outros_adicionais_cobrados",
  "acrescimos_cobrados",
  "descontos_cobrados",
  "valor_cobrado_cte",
  "valor_total_fatura",
];
function downloadTemplate() {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + headers.join(";") + "\r\n"], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo_fatura_ancora.csv";
  a.click();
  URL.revokeObjectURL(url);
}
function Options({ values }: { values: string[] }) {
  return (
    <>
      {values.map((v) => (
        <option key={v}>{v}</option>
      ))}
    </>
  );
}
export function ApprovedAudit({ view, ctes = [] }: { view: AuditView; ctes?: CteRecord[] }) {
  const { data, canWrite, save, importFile, error, loading } = useAuditData();
  const { user } = useAuditSession();
  const [busy, setBusy] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedCte, setSelectedCte] = useState<CteRecord | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [tab, setTab] = useState("commercial");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [commercialValues, setCommercialValues] = useState<CommercialValues>({});
  const [rules, setRules] = useState<FeeRule[]>(() => DEFAULT_RULES.map((r) => ({ ...r })));
  const [freightConfig, setFreightConfig] = useState<FreightConfig>(DEFAULT_CONFIG);
  const [tableSearch, setTableSearch] = useState("");
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const fillRuleForm = (values: Record<string, string>) =>
    window.setTimeout(() => {
      for (const [fieldId, value] of Object.entries(values)) {
        const element = document.getElementById(fieldId);
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement)
          element.value = value;
      }
    }, 0);
  const openRuleEditor = (versionId: string | null) => {
    const version = versionId ? data.versions.find((v) => v.id === versionId) : undefined;
    const form = version ? versionToForm(version) : null;
    setCommercialValues(form?.values ?? {});
    setRules(form?.rules ?? DEFAULT_RULES.map((r) => ({ ...r })));
    setFreightConfig(form?.config ?? DEFAULT_CONFIG);
    setBands(form?.bands ?? [{ weight: "", value: "" }]);
    setEditingVersion(version?.id ?? null);
    setFilters((old) => ({ ...old, "rule-carrier": version?.carrier_id ?? "" }));
    setTab("commercial");
    setModal("modal-rule");
    const config =
      version && typeof version.configuration === "object" && !Array.isArray(version.configuration)
        ? (version.configuration as Record<string, unknown>)
        : {};
    fillRuleForm({
      "rule-edit-id": version?.id ?? "",
      "rule-carrier": version?.carrier_id ?? "",
      "rule-branch": version?.branch_id ?? "",
      "rule-destination": version?.destination ?? "",
      "rule-square": version?.square_id ?? "",
      "rule-mode": typeof config["mode"] === "string" ? config["mode"] : "fracionado",
      "rule-min-goods": typeof config["min_goods"] === "number" ? String(config["min_goods"]) : "",
      "rule-notes": version?.notes ?? "",
      "rule-start": version?.valid_from ?? "",
      "rule-end": version?.valid_until ?? "",
    });
  };
  const onEnterNext = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (target instanceof HTMLInputElement && ["checkbox", "radio", "file"].includes(target.type))
      return;
    event.preventDefault();
    const next = nextFocusable(target);
    if (next) {
      next.focus();
      if (next instanceof HTMLInputElement && next.type !== "checkbox") next.select();
    }
  };
  const setCommercial = (name: string, patch: Partial<{ value: string; na: boolean }>) =>
    setCommercialValues((old) => ({
      ...old,
      [name]: { value: old[name]?.value ?? "", na: old[name]?.na ?? false, ...patch },
    }));
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [today, setToday] = useState("");
  useEffect(() => {
    const stored = window.localStorage.getItem("ancora-theme");
    if (stored === "light" || stored === "dark" || stored === "system") setThemeMode(stored);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(media.matches);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    setToday(todayLabel());
    return () => media.removeEventListener("change", onChange);
  }, []);
  const chooseTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    window.localStorage.setItem("ancora-theme", mode);
  };
  const dark = themeMode === "dark" || (themeMode === "system" && systemDark);
  const [bands, setBands] = useState([{ weight: "", value: "" }]);
  const unavailable = () =>
    setMessage(
      "A conciliação depende da base original de CT-es e das regras de cálculo. Os cadastros e a importação estão disponíveis para usuários autorizados.",
    );
  const field = (id: string) => {
    const element = document.getElementById(id);
    return element instanceof HTMLInputElement || element instanceof HTMLSelectElement ? element.value.trim() : "";
  };
  async function persist(id: string) {
    setBusy(true);
    try {
      if (id === "save-carrier") {
        await save({ kind: "carrier", value: { id: field("carrier-edit-id") || undefined, legal_name: field("carrier-legal"), cnpj: field("carrier-cnpj"), display_name: field("carrier-short"), active: field("carrier-active") !== "Inativa" && field("carrier-active") !== "Inativo" } });
      } else if (id === "save-rule") {
        const commercialRecord = Object.fromEntries(
          commercial.map((name) => {
            const item = commercialValues[name];
            const raw = item?.value.trim() ?? "";
            const value = raw === "" ? NaN : Number(raw.replace(",", "."));
            const state = item?.na ? "not_applicable" : Number.isFinite(value) ? "provided" : "missing";
            return [name, { value: state === "provided" ? value : null, state }];
          }),
        );
        const calculation_rules = rules.map((r) => ruleToRecord(r, commercialValues));
        await save({ kind: "version", value: { carrier_id: field("rule-carrier"), branch_id: field("rule-branch"), square_id: field("rule-square") || null, destination: field("rule-destination"), valid_from: field("rule-start"), valid_until: field("rule-end") || null, commercial: commercialRecord, calculation_rules, weight_bands: bands.filter((b) => b.weight || b.value).map((b) => ({ weight: b.weight ? Number(b.weight) : NaN, value: b.value ? Number(b.value) : NaN })), configuration: { max_freight: freightConfig.composicao === "maior", mode: field("rule-mode"), min_goods: field("rule-min-goods") ? Number(field("rule-min-goods")) : null, peso_considerado: freightConfig.peso, composicao: freightConfig.composicao, frete_minimo_sobre: freightConfig.minimoSobre, icms: freightConfig.icms, weight_integration: "faixa_peso_com_excedente" }, notes: field("rule-notes"), previous_version_id: field("rule-edit-id") || null } });
      } else if (file) {
        const count = await importFile(file);
        setMessage(`${count} fatura(s) importada(s). Associação aos CT-es e auditoria pendentes.`);
        setFile(null);
        return;
      }
      setMessage(id === "save-rule" ? (editingVersion ? "Nova versão da tabela salva. A versão anterior foi preservada no histórico." : "Tabela salva.") : "Cadastro salvo.");
      setModal(null);
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }
  const money = (value: number | null) => value === null ? "Não informado" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const emptyRow = (columns: number, text?: string) => <tr><td colSpan={columns} className="empty">{loading ? "Carregando registros…" : error || text || (user ? data.roles.length ? "Nenhum registro cadastrado." : "Acesso pendente de autorização do administrador." : "Entre para consultar os registros.")}</td></tr>;
  const dateBr = (value: string) => {
    const [y, m, d] = value.split("-");
    return y && m && d ? `${d}/${m}/${y}` : value;
  };
  const close = () => {
    if (
      modal &&
      document.querySelector(`#${modal} input:not([type=hidden]):not([readonly])`) &&
      !window.confirm("Fechar o formulário? Os dados não salvos serão descartados.")
    )
      return;
    setModal(null);
  };
  function render(node: LayoutNode, key: string): ReactNode {
    if (typeof node === "string") return node.includes("Campos legados preservados") ? null : node.replaceAll("Nenhum registro disponível. Base não conectada.", "Nenhum registro disponível.");
    const { tag, attrs, children } = node;
    const id = String(attrs["id"] || "");
    const cls = String(attrs["class"] || "");
    if (cls === "topright") return null;
    if (["carrier-list", "square-list", "rule-list", "invoice-list", "upload-history", "rule-history-list"].includes(id)) {
      if (id === "carrier-list") return <tbody key={key}>{data.carriers.filter((c) => carrierMatches(c, tableSearch)).length ? data.carriers.filter((c) => carrierMatches(c, tableSearch)).map((c) => <tr key={c.id}><td>{c.legal_name}</td><td>{c.cnpj}</td><td>{c.display_name}</td><td>{new Date(c.created_at).toLocaleDateString("pt-BR")}</td><td>{c.active ? "Ativo" : "Inativo"}</td><td><Button variant="outline" disabled={!canWrite} onClick={() => { setModal("modal-carrier"); setTimeout(() => { for (const [id, value] of Object.entries({ "carrier-edit-id": c.id, "carrier-legal": c.legal_name, "carrier-cnpj": c.cnpj, "carrier-short": c.display_name, "carrier-active": c.active ? "Ativo" : "Inativo" })) { const e = document.getElementById(id); if (e instanceof HTMLInputElement || e instanceof HTMLSelectElement) e.value = value; } }, 0); }}>Editar</Button></td></tr>) : emptyRow(6, tableSearch ? "Nenhuma transportadora encontrada para a pesquisa." : undefined)}</tbody>;
      if (id === "square-list") return <tbody key={key}>{data.squares.length ? data.squares.map((s) => <tr key={s.id}><td>{s.name}</td><td>{s.state}</td><td>{s.code}</td><td>{s.notes}</td><td>Cadastrada</td><td>—</td></tr>) : emptyRow(6)}</tbody>;
      if (id === "rule-list") {
        const list = currentVersions(data.versions).filter((v) =>
          carrierMatches(data.carriers.find((c) => c.id === v.carrier_id), tableSearch),
        );
        return (
          <tbody key={key}>
            {list.length
              ? list.map((v) => {
                  const carrier = data.carriers.find((c) => c.id === v.carrier_id);
                  const square = data.squares.find((sq) => sq.id === v.square_id);
                  const config = (v.configuration ?? {}) as Record<string, unknown>;
                  const commercialData = (v.commercial ?? {}) as Record<string, { value?: number | null }>;
                  const minFreight = commercialData["FRETE MÍNIMO"]?.value;
                  return (
                    <tr key={v.id}>
                      <td>
                        <b>{carrier?.display_name || carrier?.legal_name}</b>
                        <small className="cell-sub">{carrier?.cnpj}</small>
                      </td>
                      <td>{square ? `${square.name} · ${square.state}` : "Todas"}</td>
                      <td>
                        {dateBr(v.valid_from)} a {v.valid_until ? dateBr(v.valid_until) : "sem término"}
                      </td>
                      <td>{data.branches.find((b) => b.id === v.branch_id)?.name}</td>
                      <td>{v.destination || "—"}</td>
                      <td>{typeof config["min_goods"] === "number" ? money(config["min_goods"]) : "—"}</td>
                      <td>{typeof minFreight === "number" ? money(minFreight) : "—"}</td>
                      <td>v{versionNumber(data.versions, v.id)}</td>
                      <td>{v.status}</td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canWrite}
                          onClick={() => openRuleEditor(v.id)}
                        >
                          <Pencil />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })
              : emptyRow(10, tableSearch ? "Nenhuma tabela encontrada para a pesquisa." : undefined)}
          </tbody>
        );
      }
      if (id === "rule-history-list") {
        const chain = editingVersion ? versionChain(data.versions, editingVersion) : [];
        return (
          <tbody key={key}>
            {chain.length
              ? chain.map((v, i) => (
                  <tr key={v.id}>
                    <td>v{chain.length - i}</td>
                    <td>
                      {dateBr(v.valid_from)} a {v.valid_until ? dateBr(v.valid_until) : "sem término"}
                    </td>
                    <td>{new Date(v.created_at).toLocaleString("pt-BR")}</td>
                    <td>Transportes</td>
                    <td>{v.notes || v.status}</td>
                  </tr>
                ))
              : emptyRow(5, "Tabela nova: ainda não há versões anteriores.")}
          </tbody>
        );
      }
      const bills = data.invoices.filter((v) => v.number.toLowerCase().includes(invoiceFilter.toLowerCase()) && (!filters["inv-from"] || v.issued_on >= filters["inv-from"]) && (!filters["inv-to"] || v.issued_on <= filters["inv-to"]) && (!filters["inv-carrier"] || v.carrier_id === filters["inv-carrier"]) && (!filters["inv-branch"] || data.items.some((i) => i.invoice_id === v.id && i.branch_id === filters["inv-branch"])));
      return <tbody key={key}>{bills.length ? bills.map((v) => <tr key={v.id}>{(id === "upload-history" ? [v.number, data.carriers.find((c) => c.id === v.carrier_id)?.legal_name, [...new Set(data.items.filter((i) => i.invoice_id === v.id).map((i) => data.branches.find((b) => b.id === i.branch_id)?.name))].join(", "), v.issued_on] : [v.number, v.issued_on, data.carriers.find((c) => c.id === v.carrier_id)?.legal_name, [...new Set(data.items.filter((i) => i.invoice_id === v.id).map((i) => data.branches.find((b) => b.id === i.branch_id)?.name))].join(", ")]).map((text, index) => <td key={index}>{text}</td>)}<td>Pendente</td><td>{money(v.declared_total)}</td><td>{v.status}</td><td>—</td></tr>) : emptyRow(8)}</tbody>;
    }
    if (tag === "select" && (id.endsWith("-carrier") || id.endsWith("-branch") || id === "rule-square")) {
      const entries = id.endsWith("-carrier")
        ? data.carriers.map((c) => ({ id: c.id, name: c.legal_name }))
        : id.endsWith("-branch")
          ? data.branches
          : data.squares
              .filter((sq) => !filters["rule-carrier"] || !sq.carrier_id || sq.carrier_id === filters["rule-carrier"])
              .map((sq) => ({
                id: sq.id,
                name: `${sq.name} · ${sq.state}${
                  data.localities.some((l) => l.square_id === sq.id && l.name === GENERAL_LOCALITY)
                    ? " (Geral)"
                    : ""
                }`,
              }));
      return <select key={key} id={id} required={Boolean(attrs["required"] !== undefined)} onChange={(e) => setFilters((old) => ({ ...old, [id]: e.target.value }))}><option value="">{id.startsWith("rule-") ? "Selecionar" : "Todos"}</option>{entries.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>;
    }
    if (tag === "body")
      return (
        <div key={key} className={`app ${dark ? "theme-dark" : ""}`} onKeyDown={onEnterNext}>
          {children.map((c, i) => render(c, `${key}-${i}`))}
          <CteDetails record={selectedCte} onClose={() => setSelectedCte(null)} />
          {message && (
            <div role="status" className="audit-status" onClick={() => setMessage("")}>
              {message}
            </div>
          )}
        </div>
      );
    if (cls.split(" ").includes("view") && id !== `view-${view}`) return null;
    if (cls === "modal-back" && modal !== id) return null;
    if (cls === "content" && view === "settings")
      return (
        <div key={key} className="content">
          <AuditSettings onCarrier={() => setModal("modal-carrier")} />
        </div>
      );
    if (id === "cte-list") return <CteRows key={key} records={ctes} onSelect={setSelectedCte} />;
    if (cls === "side-foot")
      return (
        <div key={key} className="side-foot">
          <Button
            variant="approved"
            size="approved"
            className={`settings-link ${view === "settings" ? "active" : ""}`}
            asChild
          >
            <Link to="/configuracoes" title="Configurações">
              <Settings />
              <span className="nav-text">Configurações</span>
            </Link>
          </Button>
          <span className="side-label">Tema</span>
          <div className="theme-switch" role="group" aria-label="Tema">
            {themeOptions.map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={themeMode === mode}
                onClick={() => chooseTheme(mode)}
              >
                <Icon />
              </button>
            ))}
          </div>
        </div>
      );
    if (cls === "topbar")
      return (
        <header key={key} className="topbar">
          <img className="top-logo" src={LOGO_URL} alt="Rede ANCORA" />
          <div className="top-title">
            <span className="top-eyebrow">Logística · Rede ANCORA</span>
            <h1>
              Auditoria de Fretes · <span>{names[view]}</span>
            </h1>
            <span className="top-sub">
              <i className="dot" aria-hidden="true" />
              {loading
                ? "Carregando cadastros…"
                : "Cadastros no Lovable Cloud · base de CT-es aguardando conexão"}
              {today && ` · ${today}`}
            </span>
          </div>
          <div className="top-actions">
            <UserMenu />
            <LiveClock />
          </div>
        </header>
      );
    if (id === "crumb-current") return <b key={key}>{names[view]}</b>;
    if (cls === "brand" || cls === "nav-label") return null;
    if (cls === "kpi-label") {
      const Icon = kpiIcon(textOf(node));
      return (
        <div key={key} className="kpi-label">
          <Icon aria-hidden="true" />
          {children.map((c, i) => render(c, `${key}-${i}`))}
        </div>
      );
    }
    if (cls === "panel-head") {
      const titleNode = findClass(node, "panel-title");
      const { Icon, tone } = panelIcon(titleNode ? textOf(titleNode) : "");
      const [first, ...rest] = children;
      return (
        <div key={key} className="panel-head">
          <div className="panel-head-main">
            <span className={`panel-icon ${tone}`} aria-hidden="true">
              <Icon />
            </span>
            {first !== undefined && render(first, `${key}-0`)}
          </div>
          {rest.map((c, i) => render(c, `${key}-${i + 1}`))}
        </div>
      );
    }
    if (tag === "button" && attrs["data-view"] === "upload") return null;
    if (cls === "nav-ico" || id === "toast") return null;
    if (id === "commercial-components")
      return (
        <div key={key} className="comm-grid">
          {commercial.map((name, i) => {
            const item = commercialValues[name];
            return (
              <div className={`comm-card ${item?.na ? "is-na" : ""}`} key={name}>
                <div className="comm-head">
                  <label className="comm-name" htmlFor={`commercial-${i}`}>
                    {name}
                  </label>
                  <label className="na-check">
                    <input
                      type="checkbox"
                      checked={item?.na ?? false}
                      onChange={(e) => setCommercial(name, { na: e.target.checked })}
                    />
                    Não aplicável
                  </label>
                </div>
                <input
                  id={`commercial-${i}`}
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="Valor comercial"
                  disabled={item?.na ?? false}
                  value={item?.value ?? ""}
                  onChange={(e) => setCommercial(name, { value: e.target.value })}
                />
                <div className="comm-unit">{fieldUnit(name)}</div>
              </div>
            );
          })}
        </div>
      );
    if (id === "weightRows")
      return (
        <tbody key={key}>
          {bands.map((row, i) => (
            <tr key={i}>
              {(["weight", "value"] as const).map((field) => (
                <td key={field}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    aria-label={`${field === "weight" ? "Peso até" : "Valor do frete"} ${i + 1}`}
                    value={row[field]}
                    onChange={(e) =>
                      setBands((previous) => {
                        const next = previous.map((r, j) =>
                          j === i ? { ...r, [field]: e.target.value } : r,
                        );
                        const last = next.at(-1);
                        return last?.weight && last.value
                          ? [...next, { weight: "", value: "" }]
                          : next;
                      })
                    }
                  />
                </td>
              ))}
              <td>
                <Button
                  variant="approved"
                  size="approved"
                  title="Excluir faixa"
                  aria-label={`Excluir faixa ${i + 1}`}
                  onClick={() =>
                    setBands((prev) =>
                      prev.length === 1
                        ? [{ weight: "", value: "" }]
                        : prev.filter((_, j) => i !== j),
                    )
                  }
                >
                  <X />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      );
    if (cls === "table-extra")
      return (
        <div key={key} className="table-search">
          <label className="search-field">
            <Search aria-hidden="true" />
            <input
              type="search"
              aria-label="Pesquisar transportadora"
              placeholder="Pesquisar transportadora pelo nome, parte do nome ou CNPJ"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </label>
          {tableSearch && (
            <span className="small-note">
              {data.carriers.filter((c) => carrierMatches(c, tableSearch)).length} transportadora(s) ·{" "}
              {
                currentVersions(data.versions).filter((v) =>
                  carrierMatches(data.carriers.find((c) => c.id === v.carrier_id), tableSearch),
                ).length
              }{" "}
              tabela(s)
            </span>
          )}
        </div>
      );
    if (id === "rule-modal-title")
      return (
        <span key={key} id={id}>
          {editingVersion ? "Editar tabela de frete" : "Cadastrar tabela de frete"}
        </span>
      );
    if (id === "current-version")
      return (
        <b key={key} id={id}>
          {editingVersion
            ? `Nova versão (v${versionNumber(data.versions, editingVersion) + 1})`
            : "Primeira versão"}
        </b>
      );
    if (id === "current-changed") {
      const version = data.versions.find((v) => v.id === editingVersion);
      return (
        <b key={key} id={id}>
          {version ? new Date(version.created_at).toLocaleString("pt-BR") : "—"}
        </b>
      );
    }
    if (id === "editor-squares")
      return (
        <div key={key} id={id} className={`editor-pane ${tab === "squares" ? "active" : ""}`}>
          <SquareEditor />
        </div>
      );
    if (id === "editor-calculation")
      return (
        <div key={key} id={id} className={`editor-pane ${tab === "calculation" ? "active" : ""}`}>
          <CalcRulesEditor
            values={commercialValues}
            bands={bands}
            rules={rules}
            onRulesChange={setRules}
            config={freightConfig}
            onConfigChange={setFreightConfig}
            canWrite={canWrite}
          />
        </div>
      );
    if (
      cls === "field" &&
      children.some((c) => typeof c !== "string" && c.attrs["id"] === "weight-integration")
    )
      return null;
    if (cls === "chart")
      return (
        <div className="empty-chart" key={key}>
          Nenhum dado disponível no período.
        </div>
      );
    const props: Record<string, unknown> = { key };
    for (const [name, value] of Object.entries(attrs)) {
      if (name === "class") props["className"] = value;
      else if (name === "value") props["defaultValue"] = value;
      else if (name === "readonly") props["readOnly"] = true;
      else if (name === "maxlength") props["maxLength"] = Number(value);
      else if (name === "colspan") props["colSpan"] = Number(value);
      else if (["required", "disabled", "hidden"].includes(name)) props[name] = true;
      else if (name !== "style") props[name] = value;
    }
    if (cls.split(" ").includes("view")) props["className"] = "view active";
    if (cls === "modal-back") {
      props["className"] = "modal-back open";
      props["role"] = "dialog";
      props["aria-modal"] = true;
      props["aria-label"] =
        id === "modal-rule" ? "Cadastrar tabela de frete" : "Cadastrar transportadora";
    }
    if (cls.split(" ").includes("editor-pane"))
      props["className"] = `editor-pane ${id === `editor-${tab}` ? "active" : ""}`;
    if (id === "inv-number") { props["value"] = invoiceFilter; props["onChange"] = (e: React.ChangeEvent<HTMLInputElement>) => setInvoiceFilter(e.target.value); }
    if (id === "inv-from" || id === "inv-to") { delete props["defaultValue"]; props["onChange"] = (e: React.ChangeEvent<HTMLInputElement>) => setFilters((old) => ({ ...old, [id]: e.target.value })); }
    if (tag === "label") {
      if (!props["htmlFor"]) {
        const child = children.find(
          (c) => typeof c !== "string" && ["input", "select", "textarea"].includes(c.tag),
        );
        if (child && typeof child !== "string") props["htmlFor"] = child.attrs["id"];
      }
      const parentChildren = children;
      return createElement(
        tag,
        props,
        parentChildren.map((c, i) => render(c, `${key}-${i}`)),
      );
    }
    if (tag === "input" && attrs["type"] === "file")
      props["onChange"] = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFile(e.target.files?.[0] || null);
    if (id === "file-box") props["className"] = `file-box ${file ? "show" : ""}`;
    if (id === "file-name") return <b key={key}>{file?.name}</b>;
    if (id === "validation")
      return (
        <div key={key} className="validation">
          {file
            ? "Arquivo selecionado para importação. Associação documental e cálculo permanecem pendentes."
            : "Aguardando leitura do arquivo."}
        </div>
      );
    if (tag === "form") props["onSubmit"] = (e: React.FormEvent) => e.preventDefault();
    if (tag === "button") {
      const target = String(attrs["data-view"] || attrs["data-goto"] || "");
      if (target && target in destinations) {
        const v = target as AuditView;
        const Icon = icons[v];
        return (
          <Button
            key={key}
            variant="approved"
            size="approved"
            className={`${cls
              .split(" ")
              .filter((name) => name !== "active")
              .join(" ")} ${attrs["data-view"] && view === v ? "active" : ""}`}
            asChild
          >
            <Link to={destinations[v]} title={names[v]}>
              {attrs["data-view"] && <Icon />}
              {children.map((c, i) => render(c, `${key}-${i}`))}
            </Link>
          </Button>
        );
      }
      let action = unavailable;
      if (id === "add-carrier") action = () => setModal("modal-carrier");
      if (["save-rule", "save-carrier", "process-invoice"].includes(id)) action = () => { void persist(id); };
      if (id === "add-rule") action = () => openRuleEditor(null);
      if (cls === "close" || children.includes("Cancelar") || children.includes("Fechar"))
        action = close;
      if (id === "download-template") action = downloadTemplate;
      if (id === "choose-file") action = () => document.getElementById("invoice-file")?.click();
      if (id === "remove-file") action = () => setFile(null);
      if (id === "ov-clear")
        action = () => {
          document.querySelectorAll("#view-overview .filters input").forEach((e) => {
            if (e instanceof HTMLInputElement) e.value = "";
          });
          document.querySelectorAll("#view-overview .filters select").forEach((e) => {
            if (e instanceof HTMLSelectElement) e.selectedIndex = 0;
          });
        };
      if (attrs["data-editor-tab"]) action = () => setTab(String(attrs["data-editor-tab"]));
      if (children.some((c) => typeof c === "string" && c.includes("Adicionar faixa")))
        action = () => setBands((prev) => [...prev, { weight: "", value: "" }]);
      const saving = ["save-rule", "save-carrier", "process-invoice"].includes(id);
      return (
        <Button
          {...props}
          key={key}
          variant="approved"
          size="approved"
          type="button"
          disabled={saving ? busy || !canWrite || (id === "process-invoice" && !file) : Boolean(props["disabled"])}
          title={saving && !canWrite ? "Entre com um perfil autorizado para salvar" : undefined}
          className={`${attrs["data-editor-tab"] ? cls.replace(/\bactive\b/, "").trim() : cls} ${attrs["data-editor-tab"] === tab ? "active" : ""}`}
          onClick={action}
        >
          {cls === "close" ? (
            <X />
          ) : (
            children.map((c, i) =>
              render(typeof c === "string" ? (id === "process-invoice" ? busy ? "Importando…" : "Importar faturas" : c.replace(/^[⇩＋⇧]\s*/, "")) : c, `${key}-${i}`),
            )
          )}
          {id.includes("export") && <Download />}
          {id === "add-rule" && <Plus />}
        </Button>
      );
    }
    return createElement(tag, props, ...children.map((c, i) => render(c, `${key}-${i}`)));
  }
  return <>{render(layout as LayoutNode, "layout")}</>;
}
