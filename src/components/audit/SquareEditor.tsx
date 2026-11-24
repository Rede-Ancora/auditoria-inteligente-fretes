import { useMemo, useState, type ClipboardEvent } from "react";
import { ClipboardPaste, ChevronDown, ChevronUp, MapPin, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuditData } from "./AuditData";
import { errorMessage } from "@/lib/audit-schemas";
import {
  GENERAL_LOCALITY,
  MAX_LOCALITIES,
  normalizeLocality,
  parseLocalities,
} from "@/lib/square-localities";

const UFS =
  "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" ");
type Notice = { tone: "ok" | "error"; text: string } | null;

export function SquareEditor() {
  const { data, canWrite, saveSquare } = useAuditData();
  const [name, setName] = useState("");
  const [uf, setUf] = useState("");
  const [carrier, setCarrier] = useState("");
  const [geral, setGeral] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pasteBox, setPasteBox] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const carrierName = (id: string | null | undefined) => {
    const found = data.carriers.find((c) => c.id === id);
    return found ? found.display_name || found.legal_name : "—";
  };
  const bySquare = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of data.localities) {
      const list = map.get(item.square_id) ?? [];
      list.push(item.name);
      map.set(item.square_id, list);
    }
    return map;
  }, [data.localities]);
  const rows = data.squares.filter((s) => {
    const term = normalizeLocality(search);
    if (!term) return true;
    const haystack = [s.name, s.state, carrierName(s.carrier_id), ...(bySquare.get(s.id) ?? [])]
      .map(normalizeLocality)
      .join(" | ");
    return haystack.includes(term);
  });

  function missingField() {
    if (!name.trim()) return "Informe o nome da praça.";
    if (!uf) return "Selecione a UF.";
    if (!carrier) return "Selecione a transportadora.";
    return "";
  }

  const isGeneral = (id: string) => {
    const list = bySquare.get(id);
    return list?.length === 1 && list[0] === GENERAL_LOCALITY;
  };

  async function importText(text: string) {
    await saveList(parseLocalities(text));
  }

  async function saveList(localities: string[]) {
    const general = localities.length === 1 && localities[0] === GENERAL_LOCALITY;
    if (!localities.length) {
      setNotice({
        tone: "error",
        text: "Nenhuma localidade encontrada. Copie a coluna de localidades na planilha e tente de novo.",
      });
      return;
    }
    if (localities.length > MAX_LOCALITIES) {
      setNotice({ tone: "error", text: "A lista passa do limite de 5.000 localidades." });
      return;
    }
    const existing = data.squares.find(
      (s) =>
        s.carrier_id === carrier &&
        s.state === uf &&
        normalizeLocality(s.name) === normalizeLocality(name),
    );
    if (
      existing &&
      !window.confirm(
        `A praça "${existing.name}" (${uf} · ${carrierName(carrier)}) já existe com ${
          isGeneral(existing.id)
            ? "todas as localidades da UF (Geral)"
            : `${bySquare.get(existing.id)?.length ?? 0} localidade(s)`
        }. Substituir por ${
          general ? "todas as localidades da UF (Geral)" : `uma nova lista com ${localities.length}`
        }?`,
      )
    )
      return;
    setBusy(true);
    try {
      await saveSquare({ name: name.trim(), state: uf, carrier_id: carrier, localities });
      setNotice({
        tone: "ok",
        text: general
          ? `Praça geral "${name.trim()}" salva: vale para todas as localidades de ${uf} (${carrierName(carrier)}).`
          : `${localities.length} localidade(s) importada(s) para a praça "${name.trim()}" (${uf} · ${carrierName(carrier)}).`,
      });
      setPasteBox(false);
      setName("");
      setGeral(false);
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function importFromClipboard() {
    const problem = missingField();
    if (problem) {
      setNotice({ tone: "error", text: problem });
      return;
    }
    setNotice(null);
    if (geral) {
      await saveList([GENERAL_LOCALITY]);
      return;
    }
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      setPasteBox(true);
      return;
    }
    await importText(text);
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    event.preventDefault();
    void importText(event.clipboardData.getData("text"));
  }

  function edit(id: string) {
    const square = data.squares.find((s) => s.id === id);
    if (!square) return;
    setName(square.name);
    setUf(square.state);
    setCarrier(square.carrier_id ?? "");
    setGeral(isGeneral(id));
    setNotice({
      tone: "ok",
      text: isGeneral(id)
        ? `Editando "${square.name}" (Geral). Desmarque Geral para trocar por uma lista de localidades.`
        : `Editando "${square.name}". Copie a nova lista na planilha e clique em Importar praça para substituir as localidades.`,
    });
  }

  return (
    <div className="square-editor">
      <div className="panel table-panel">
        <div className="panel-head">
          <div className="panel-head-main">
            <span className="panel-icon" aria-hidden="true">
              <MapPin />
            </span>
            <div>
              <div className="panel-title">Nova praça</div>
              <div className="panel-sub">
                Dê um nome, escolha a UF e a transportadora. Depois copie a coluna de localidades na
                planilha do Excel e clique em Importar praça. Para a UF inteira, marque Geral.
              </div>
            </div>
          </div>
        </div>
        <div className="panel-body square-form-new">
          <div className="field">
            <label htmlFor="square-new-name">Nome da praça *</label>
            <input
              id="square-new-name"
              placeholder="Ex.: Grande Vitória"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="square-new-uf">UF *</label>
            <select id="square-new-uf" value={uf} onChange={(e) => setUf(e.target.value)}>
              <option value="">Selecione</option>
              {UFS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="square-new-carrier">Transportadora *</label>
            <select
              id="square-new-carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="">Selecione</option>
              {data.carriers
                .filter((c) => c.active || c.id === carrier)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || c.legal_name}
                  </option>
                ))}
            </select>
          </div>
          <label className="square-general">
            <input
              type="checkbox"
              checked={geral}
              onChange={(e) => {
                setGeral(e.target.checked);
                if (e.target.checked && !name.trim()) setName("Geral");
                setPasteBox(false);
              }}
            />
            <span>
              <b>Geral</b>
              <small>Abrange todas as localidades da UF</small>
            </span>
          </label>
          <Button
            variant="approved"
            size="approved"
            type="button"
            className="btn-primary square-import"
            disabled={busy || !canWrite}
            title={canWrite ? undefined : "Seu perfil não pode cadastrar praças"}
            onClick={() => void importFromClipboard()}
          >
            <ClipboardPaste />
            {busy ? "Salvando…" : geral ? "Salvar praça geral" : "Importar praça"}
          </Button>
        </div>
        {pasteBox && (
          <div className="square-paste">
            <p>
              O navegador não liberou a leitura automática da área de transferência. Clique na caixa
              abaixo e pressione <b>Ctrl+V</b>.
            </p>
            <textarea
              autoFocus
              aria-label="Colar lista de localidades"
              placeholder="Pressione Ctrl+V aqui"
              onPaste={onPaste}
              readOnly={busy}
            />
            <Button
              variant="approved"
              size="approved"
              type="button"
              onClick={() => setPasteBox(false)}
            >
              Cancelar
            </Button>
          </div>
        )}
        {notice && (
          <p
            className={`square-notice ${notice.tone}`}
            role={notice.tone === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}
      </div>

      <div className="panel table-panel">
        <div className="panel-head">
          <div className="panel-head-main">
            <span className="panel-icon" aria-hidden="true">
              <MapPin />
            </span>
            <div>
              <div className="panel-title">Praças cadastradas</div>
              <div className="panel-sub">
                Cada praça reúne as localidades de uma UF atendidas por uma transportadora.
              </div>
            </div>
          </div>
          <span className="badge-count">{data.squares.length} praça(s)</span>
        </div>
        <div className="panel-body">
          <label className="search-field square-search">
            <Search />
            <input
              aria-label="Pesquisar praças"
              placeholder="Pesquisar praça, UF, transportadora ou localidade"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Praça</th>
                  <th>UF</th>
                  <th>Transportadora</th>
                  <th>Localidades</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((s) => {
                    const list = bySquare.get(s.id) ?? [];
                    const open = expanded === s.id;
                    return [
                      <tr key={s.id}>
                        <td>
                          <b>{s.name}</b>
                        </td>
                        <td>{s.state}</td>
                        <td>{carrierName(s.carrier_id)}</td>
                        <td>
                          {isGeneral(s.id) ? (
                            <span className="calc-chip blue">Geral · todas da UF</span>
                          ) : (
                            list.length
                          )}
                        </td>
                        <td className="square-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={!list.length || isGeneral(s.id)}
                            onClick={() => setExpanded(open ? null : s.id)}
                          >
                            {open ? <ChevronUp /> : <ChevronDown />}
                            {open ? "Ocultar" : "Ver localidades"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={!canWrite}
                            onClick={() => edit(s.id)}
                          >
                            <Pencil />
                            Editar
                          </Button>
                        </td>
                      </tr>,
                      open && (
                        <tr key={`${s.id}-list`} className="square-list-row">
                          <td colSpan={5}>
                            <div className="square-chips">
                              {list.map((item) => (
                                <span key={item}>{item}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ),
                    ];
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      {search
                        ? "Nenhuma praça encontrada para a pesquisa."
                        : "Nenhuma praça cadastrada."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
