import { useState } from "react";
import {
  Building2,
  Truck,
  Users,
  SlidersHorizontal,
  ShieldCheck,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Link2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuditData } from "./AuditData";
import { useAuditSession } from "./AuditSession";
import { errorMessage } from "@/lib/audit-schemas";

const sections = [
  { id: "users", label: "Usuários", icon: Users },
  { id: "branches", label: "Filiais", icon: Building2 },
  { id: "carriers", label: "Transportadoras", icon: Truck },
  { id: "parameters", label: "Parametrizações", icon: SlidersHorizontal },
  { id: "access", label: "Acessos e histórico", icon: ShieldCheck },
  { id: "connection", label: "Conexões", icon: Link2 },
] as const;
type Section = (typeof sections)[number]["id"];
const forms = {
  users: {
    title: "Cadastrar usuário",
    columns: ["Nome", "E-mail", "Equipe", "Perfil de acesso", "Situação"],
    fields: ["Nome completo", "E-mail", "Equipe"],
  },
  branches: {
    title: "Cadastrar filial",
    columns: ["Código", "Filial", "CNPJ", "Município / UF", "Situação"],
    fields: ["Código da filial", "Nome da filial", "CNPJ", "Município", "UF", "Endereço"],
  },
  carriers: {
    title: "Cadastrar transportadora",
    columns: ["Razão social", "Nome de exibição", "CNPJ", "Situação", "Última alteração"],
    fields: ["Razão social", "Nome de exibição", "CNPJ"],
  },
};
type Registration = keyof typeof forms;

export function AuditSettings({ onCarrier }: { onCarrier: () => void }) {
  const { data, save, canWrite, admin, error } = useAuditData();
  const { user } = useAuditSession();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Record<string, string> | null>(null);
  const [page, setPage] = useState(1);
  const [section, setSection] = useState<Section>(admin ? "users" : "branches");
  const visibleSections = sections.filter((item) => item.id !== "users" || admin);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [search, setSearch] = useState("");
  const form =
    section === "users" || section === "branches" || section === "carriers" ? forms[section] : null;
  const rows = (section === "branches" ? data.branches.map((b) => ({ key: b.id, cells: [b.code, b.name, b.cnpj, `${b.city} / ${b.state}`, b.active ? "Ativo" : "Inativo"], fields: { id: b.id, "Código da filial": b.code, "Nome da filial": b.name, CNPJ: b.cnpj, Município: b.city, UF: b.state, Endereço: b.address, active: String(b.active) } })) : section === "carriers" ? data.carriers.map((c) => ({ key: c.id, cells: [c.legal_name, c.display_name, c.cnpj, c.active ? "Ativo" : "Inativo", new Date(c.created_at).toLocaleDateString("pt-BR")], fields: {} })) : data.access.map((a) => ({ key: a.email, cells: [a.name, a.email, a.team, a.role === "admin" ? "Administrador" : a.role === "transportes" ? "Transportes" : "Consulta", a.active ? "Ativo" : "Inativo"], fields: { "Nome completo": a.name, "E-mail": a.email, Equipe: a.team, role: a.role, active: String(a.active) } }))).filter((r) => r.cells.join(" ").toLowerCase().includes(search.toLowerCase()));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registration) return;
    const values = new FormData(event.currentTarget);
    const get = (name: string) => String(values.get(name) ?? "").trim();
    setBusy(true);
    try {
      if (registration === "branches") await save({ kind: "branch", value: { id: editing?.["id"], code: get("Código da filial"), name: get("Nome da filial"), cnpj: get("CNPJ"), city: get("Município"), state: get("UF"), address: get("Endereço"), active: get("active") === "true" } });
      else await save({ kind: "access", value: { email: get("E-mail"), name: get("Nome completo"), team: get("Equipe"), role: get("role"), active: get("active") === "true" } });
      setRegistration(null); setEditing(null); setMessage(registration === "users" ? (get("active") === "true" ? "Acesso liberado. No primeiro acesso, o usuário clica em \"Primeiro acesso\" na tela de login e cria a senha com este e-mail." : "Acesso bloqueado. O usuário não consegue mais abrir o sistema.") : "Filial salva.");
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return (
    <section className="view active settings-view">
      <div className="page-head">
        <div>
          <div className="eyebrow">ADMINISTRAÇÃO DA OPERAÇÃO</div>
          <h1>Configurações</h1>
          <p className="subtitle">Cadastros, parâmetros comerciais e governança.</p>
        </div>
        <span className="connection-badge">
          <Link2 /> Lovable Cloud conectado
        </span>
      </div>
      <nav className="settings-tabs" aria-label="Áreas de configurações">
        {visibleSections.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="approved"
            size="approved"
            aria-pressed={section === id}
            className={section === id ? "active" : ""}
            onClick={() => {
              setSection(id);
              setSearch("");
              setPage(1);
            }}
          >
            <Icon />
            {label}
          </Button>
        ))}
      </nav>
      <div className="connection-notice">
        <Link2 />
        <div>
          <b>{user ? data.roles.length ? "Cadastros operacionais conectados" : "Acesso pendente de autorização" : "Entre para consultar e cadastrar"}</b>
          <p>
            A base original de CT-es e os documentos DACTE ainda aguardam integração.
          </p>
        </div>
      </div>
      {(message || error) && <p role="status" className="settings-message">{message || error}</p>}
      {section === "users" && admin && (
        <div className="admin-note">
          <ShieldCheck aria-hidden="true" />
          <p>
            <b>Administrador principal:</b> gedson.garcia@redeancora.com.br (fixo, não pode ser
            alterado nem bloqueado). Para liberar outra pessoa, cadastre o e-mail dela abaixo e
            escolha o perfil: <b>Administrador</b> gerencia usuários e tudo o mais,{" "}
            <b>Transportes</b> edita cadastros, tabelas e importações, e <b>Consulta</b> só
            visualiza. Para tirar o acesso, edite e mude a situação para Inativo.
          </p>
        </div>
      )}
      {form ? (
        <>
          <div className="settings-toolbar">
            <h2>{sections.find((item) => item.id === section)?.label}</h2>
            <div className="settings-commands">
              <label className="search-field">
                <Search />
                <input
                  aria-label="Pesquisar cadastros"
                  placeholder="Pesquisar cadastros"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Button
                variant="approved"
                size="approved"
                className="btn-primary"
                disabled={section === "users" ? !admin : !canWrite}
                onClick={() => {
                  setEditing(null);
                  if (section === "carriers") onCarrier();
                  else if (section === "users" || section === "branches") setRegistration(section);
                }}
              >
                <Plus />
                {form.title}
              </Button>
            </div>
          </div>
          <div className="settings-registers table-wrap">
            <table>
              <thead>
                <tr>
                  {form.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? rows.slice((page - 1) * 10, page * 10).map((r) => <tr key={r.key}>{r.cells.map((cell, i) => <td key={i}>{cell}{i === 0 && section !== "carriers" && <Button variant="outline" size="sm" disabled={section === "users" ? !admin : !canWrite} onClick={() => { setEditing(r.fields); setRegistration(section === "users" ? "users" : "branches"); }}>Editar</Button>}</td>)}</tr>) : <tr>
                  <td colSpan={form.columns.length} className="empty">
                    {search
                      ? "Nenhum cadastro disponível para a pesquisa."
                      : "Nenhum cadastro disponível."}
                  </td>
                </tr>}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>{rows.length} registros</span>
            <div>
              <Button variant="approved" size="approved" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft />
              </Button>
              <span>{rows.length ? page : 0} de {Math.ceil(rows.length / 10)}</span>
              <Button variant="approved" size="approved" aria-label="Próxima página" disabled={page * 10 >= rows.length} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      ) : section === "parameters" ? (
        <div className="settings-section">
          <h2>Parâmetros da auditoria</h2>
          <div className="parameter-lines">
            <div>
              <b>Tabelas comerciais e regras de cálculo</b>
              <span>Componentes, faixas de peso, composição e arredondamento.</span>
              <Button asChild variant="approved" size="approved">
                <Link to="/tabelas-frete">Abrir tabelas de frete</Link>
              </Button>
            </div>
            <div>
              <b>Vigências, versões e praças</b>
              <span>Condições negociadas por filial, destino e período.</span>
              <Button asChild variant="approved" size="approved">
                <Link to="/tabelas-frete">Abrir parametrizações</Link>
              </Button>
            </div>
            <div>
              <b>Conciliação de faturas</b>
              <span>Mapeamento de rubricas, duplicidades e pendências de associação.</span>
              <span className="tag gray">Aguardando conexão</span>
            </div>
          </div>
        </div>
      ) : section === "access" ? (
        <div className="settings-section">
          <h2>Acessos e rastreabilidade</h2>
          <div className="parameter-lines">
            <div>
              <b>Administradores</b>
              <span>Gestão de usuários, permissões e configurações.</span>
              <span className="tag gray">Aguardando validação</span>
            </div>
            <div>
              <b>Transportes</b>
              <span>Cadastros comerciais, tabelas, regras, vigências e tratativas.</span>
              <span className="tag gray">Aguardando validação</span>
            </div>
            <div>
              <b>Consulta</b>
              <span>Consulta das informações autorizadas, sem edição comercial.</span>
              <span className="tag gray">Aguardando validação</span>
            </div>
          </div>
          <h3>Histórico de alterações</h3>
          <p className="empty">Nenhuma alteração disponível na base conectada.</p>
        </div>
      ) : (
        <div className="settings-section">
          <h2>Base de documentos e cadastros</h2>
          <div className="parameter-lines">
            <div>
              <b>Base original de CT-es</b>
              <span>Não conectada</span>
              <span className="tag gray">Pendente</span>
            </div>
            <div>
              <b>Documentos DACTE / PDF</b>
              <span>Origem e permissões ainda não verificadas.</span>
              <span className="tag gray">Pendente</span>
            </div>
          </div>
          <p className="connection-instructions">
            Lovable Cloud conectado para cadastros e importações. Integração da base original de CT-es pendente.
          </p>
        </div>
      )}
      <Dialog
        open={registration !== null}
        onOpenChange={(open) => {
          if (!open) setRegistration(null);
        }}
      >
        <DialogContent className="registration-dialog">
          <DialogTitle>{registration ? forms[registration].title : "Cadastro"}</DialogTitle>
          <DialogDescription>
            {registration === "users" ? "Libere o acesso pelo e-mail da pessoa. Ela cria a própria senha em \"Primeiro acesso\", na tela de login." : "Cadastro operacional da filial."}
          </DialogDescription>
          <form key={editing?.["id"] || editing?.["E-mail"] || registration} onSubmit={submit}>
            <div className="form-grid">
              {registration &&
                forms[registration].fields.map((field, index) => (
                  <div className="field" key={field}>
                    <label htmlFor={`settings-field-${index}`}>{field}</label>
                    <input
                      id={`settings-field-${index}`}
                      name={field}
                      defaultValue={editing?.[field] ?? ""}
                      type={field === "E-mail" ? "email" : "text"}
                      readOnly={field === "E-mail" && Boolean(editing?.["E-mail"])}
                      required
                      maxLength={field === "UF" ? 2 : undefined}
                    />
                  </div>
                ))}
              {registration === "users" && (
                <div className="field">
                  <label htmlFor="settings-role">Perfil de acesso</label>
                  <select id="settings-role" name="role" defaultValue={editing?.["role"] ?? ""} required>
                    <option value="" disabled>
                      Selecionar
                    </option>
                    <option value="consulta">Consulta</option>
                    <option value="transportes">Transportes</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}
              <div className="field">
                <label htmlFor="settings-status">Situação</label>
                <select id="settings-status" name="active" defaultValue={editing?.["active"] ?? "true"}>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
            <div className="detail-footer">
              <Button
                variant="approved"
                size="approved"
                type="button"
                onClick={() => setRegistration(null)}
              >
                <X />
                Cancelar
              </Button>
              <Button
                variant="approved"
                size="approved"
                className="btn-primary"
                type="submit"
                disabled={busy || (registration === "users" ? !admin : !canWrite)}
              >
                Salvar cadastro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
