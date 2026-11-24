import { Fragment, useMemo, useState } from "react";
import { Calculator, ListChecks, RotateCcw, SlidersHorizontal, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COMMERCIAL_FIELDS,
  CUBAGE_FIELD,
  MIN_FREIGHT_FIELD,
  appliesLabels,
  baseLabels,
  calcTypeLabels,
  defaultRule,
  describeRule,
  isCustomized,
  isNotApplicable,
  missingFields,
  readValue,
  simulate,
  type Applies,
  type CalcType,
  type CommercialValues,
  type FeeRule,
  type FreightConfig,
  type PercentBase,
  type WeightBand,
} from "@/lib/freight-rules";

type Props = {
  values: CommercialValues;
  bands: WeightBand[];
  rules: FeeRule[];
  onRulesChange: (rules: FeeRule[]) => void;
  config: FreightConfig;
  onConfigChange: (config: FreightConfig) => void;
  canWrite: boolean;
};

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function Head({ icon: Icon, title, sub }: { icon: typeof Calculator; title: string; sub: string }) {
  return (
    <div className="panel-head">
      <div className="panel-head-main">
        <span className="panel-icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <div className="panel-title">{title}</div>
          <div className="panel-sub">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function TypeSelect({
  value,
  onChange,
  allowNone,
  disabled,
  label,
}: {
  value: CalcType | "";
  onChange: (v: CalcType | "") => void;
  allowNone?: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as CalcType | "")}
    >
      {allowNone && <option value="">Não comparar</option>}
      {(Object.keys(calcTypeLabels) as CalcType[]).map((t) => (
        <option key={t} value={t}>
          {calcTypeLabels[t]}
        </option>
      ))}
    </select>
  );
}

function FieldSelect({
  value,
  onChange,
  noneLabel,
  disabled,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  noneLabel?: string;
  disabled?: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {noneLabel && <option value="">{noneLabel}</option>}
      {COMMERCIAL_FIELDS.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}

function BaseSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: PercentBase;
  onChange: (v: PercentBase) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as PercentBase)}
    >
      {(Object.keys(baseLabels) as PercentBase[]).map((b) => (
        <option key={b} value={b}>
          Sobre o {baseLabels[b]}
        </option>
      ))}
    </select>
  );
}

export function CalcRulesEditor({
  values,
  bands,
  rules,
  onRulesChange,
  config,
  onConfigChange,
  canWrite,
}: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [sim, setSim] = useState({ nf: "", peso: "", m3: "", icms: "12", condicionais: false });
  const fator = readValue(values, CUBAGE_FIELD);
  const minimo = readValue(values, MIN_FREIGHT_FIELD);
  const result = useMemo(
    () =>
      simulate(
        {
          nf: num(sim.nf),
          pesoReal: num(sim.peso),
          m3: num(sim.m3),
          condicionais: sim.condicionais,
          aliquotaIcms: num(sim.icms),
        },
        values,
        bands,
        rules,
        config,
      ),
    [sim, values, bands, rules, config],
  );
  const hasSim = num(sim.nf) > 0 || num(sim.peso) > 0 || num(sim.m3) > 0;
  const setConfig = <K extends keyof FreightConfig>(key: K, value: FreightConfig[K]) =>
    onConfigChange({ ...config, [key]: value });
  const update = (key: string, patch: Partial<FeeRule>) =>
    onRulesChange(
      rules.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        return { ...next, mode: isCustomized(next) ? "personalizado" : "padrao" };
      }),
    );
  const reset = (key: string) => {
    const d = defaultRule(key);
    if (d) onRulesChange(rules.map((r) => (r.key === key ? { ...d } : r)));
  };
  const customCount = rules.filter((r) => r.mode === "personalizado").length;

  return (
    <div className="calc-editor">
      {!canWrite && (
        <div className="access-note">
          Somente os perfis Administrador e Transportes podem alterar as regras. A simulação está
          liberada.
        </div>
      )}

      <div className="panel">
        <Head
          icon={Workflow}
          title="Como o frete é calculado"
          sub="A sequência é sempre a mesma. Ajuste cada etapa conforme o acordo com a transportadora."
        />
        <div className="panel-body calc-steps">
          <div className="calc-step">
            <span className="calc-step-n">1</span>
            <b>Peso considerado</b>
            <select
              aria-label="Peso considerado"
              value={config.peso}
              disabled={!canWrite}
              onChange={(e) => setConfig("peso", e.target.value as FreightConfig["peso"])}
            >
              <option value="taxado">Peso taxado (maior entre real e cubado)</option>
              <option value="real">Somente o peso real</option>
            </select>
            <small>
              Peso cubado = m³ × fator de cubagem
              {fator !== null ? ` (${fator} kg/m³)` : " (preencha o fator na aba 1)"}.
            </small>
          </div>
          <div className="calc-step">
            <span className="calc-step-n">2</span>
            <b>Frete base</b>
            <select
              aria-label="Composição do frete base"
              value={config.composicao}
              disabled={!canWrite}
              onChange={(e) =>
                setConfig("composicao", e.target.value as FreightConfig["composicao"])
              }
            >
              <option value="soma">Frete Peso + Frete Valor</option>
              <option value="maior">Maior entre Frete Peso e Frete Valor</option>
              <option value="so_peso">Somente Frete Peso</option>
              <option value="so_valor">Somente Frete Valor</option>
            </select>
            <small>O padrão de mercado é somar os dois.</small>
          </div>
          <div className="calc-step">
            <span className="calc-step-n">3</span>
            <b>Frete mínimo</b>
            <select
              aria-label="Frete mínimo aplicado sobre"
              value={config.minimoSobre}
              disabled={!canWrite}
              onChange={(e) =>
                setConfig("minimoSobre", e.target.value as FreightConfig["minimoSobre"])
              }
            >
              <option value="frete_base">Piso do frete base</option>
              <option value="total">Piso do total com taxas</option>
            </select>
            <small>
              {minimo !== null
                ? `Se ficar abaixo de ${brl(minimo)}, cobra-se ${brl(minimo)}.`
                : "Sem frete mínimo informado na aba 1."}
            </small>
          </div>
          <div className="calc-step">
            <span className="calc-step-n">4</span>
            <b>Taxas</b>
            <span className="calc-step-value">
              {rules.length - 2} taxas · {customCount} personalizada(s)
            </span>
            <small>Somadas ao frete base, conforme as regras abaixo.</small>
          </div>
          <div className="calc-step">
            <span className="calc-step-n">5</span>
            <b>ICMS</b>
            <select
              aria-label="ICMS"
              value={config.icms}
              disabled={!canWrite}
              onChange={(e) => setConfig("icms", e.target.value as FreightConfig["icms"])}
            >
              <option value="incluso">Já incluso nos valores da tabela</option>
              <option value="por_dentro">Somar ICMS por dentro (alíquota do CT-e)</option>
            </select>
            <small>
              {config.icms === "incluso"
                ? "O total da tabela já é o valor do CT-e."
                : "Total = subtotal ÷ (1 − alíquota)."}
            </small>
          </div>
        </div>
      </div>

      <div className="panel">
        <Head
          icon={ListChecks}
          title="Regras por taxa"
          sub="Cada taxa já vem com a regra padrão de mercado. Use Personalizar só para casos específicos da transportadora."
        />
        <div className="panel-body">
          <div className="table-wrap">
            <table className="calc-table">
              <thead>
                <tr>
                  <th>Taxa</th>
                  <th>Como é calculada</th>
                  <th>Quando aplica</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const na = isNotApplicable(r, values);
                  const missing = na ? [] : missingFields(r, values);
                  const expanded = open === r.key;
                  return (
                    <Fragment key={r.key}>
                      <tr className={na ? "calc-row-na" : ""}>
                        <td>
                          <b>{r.label}</b>
                        </td>
                        <td>
                          {describeRule(r, values)}
                          {r.note && <small className="calc-note">{r.note}</small>}
                        </td>
                        <td>{appliesLabels[r.applies]}</td>
                        <td>
                          {na ? (
                            <span className="calc-chip gray">Não aplicável</span>
                          ) : missing.length ? (
                            <span className="calc-chip red" title={missing.join(", ")}>
                              Falta valor na aba 1
                            </span>
                          ) : r.mode === "personalizado" ? (
                            <span className="calc-chip blue">Personalizada</span>
                          ) : (
                            <span className="calc-chip green">Padrão</span>
                          )}
                        </td>
                        <td className="calc-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => setOpen(expanded ? null : r.key)}
                          >
                            <SlidersHorizontal />
                            {expanded ? "Fechar" : "Personalizar"}
                          </Button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="calc-edit-row">
                          <td colSpan={5}>
                            <div className="calc-edit">
                              <div className="field">
                                <label>Tipo de cálculo</label>
                                <TypeSelect
                                  label={`Tipo de cálculo ${r.label}`}
                                  value={r.type}
                                  disabled={!canWrite}
                                  onChange={(v) => update(r.key, { type: v as CalcType })}
                                />
                              </div>
                              {r.type === "percentual" && (
                                <div className="field">
                                  <label>Base do percentual</label>
                                  <BaseSelect
                                    label={`Base ${r.label}`}
                                    value={r.base}
                                    disabled={!canWrite}
                                    onChange={(v) => update(r.key, { base: v })}
                                  />
                                </div>
                              )}
                              <div className="field">
                                <label>Valor vem do campo (aba 1)</label>
                                <FieldSelect
                                  label={`Campo ${r.label}`}
                                  value={r.rate}
                                  disabled={!canWrite}
                                  onChange={(v) => update(r.key, { rate: v })}
                                />
                              </div>
                              <div className="field">
                                <label>Comparar com (cobra o maior)</label>
                                <TypeSelect
                                  label={`Comparar ${r.label}`}
                                  value={r.altType}
                                  allowNone
                                  disabled={!canWrite}
                                  onChange={(v) => update(r.key, { altType: v })}
                                />
                              </div>
                              {r.altType && (
                                <>
                                  {r.altType === "percentual" && (
                                    <div className="field">
                                      <label>Base da comparação</label>
                                      <BaseSelect
                                        label={`Base comparação ${r.label}`}
                                        value={r.altBase}
                                        disabled={!canWrite}
                                        onChange={(v) => update(r.key, { altBase: v })}
                                      />
                                    </div>
                                  )}
                                  <div className="field">
                                    <label>Campo da comparação</label>
                                    <FieldSelect
                                      label={`Campo comparação ${r.label}`}
                                      value={r.altRate}
                                      noneLabel="Selecione"
                                      disabled={!canWrite}
                                      onChange={(v) => update(r.key, { altRate: v })}
                                    />
                                  </div>
                                </>
                              )}
                              <div className="field">
                                <label>Valor mínimo</label>
                                <FieldSelect
                                  label={`Mínimo ${r.label}`}
                                  value={r.minimum}
                                  noneLabel="Sem mínimo"
                                  disabled={!canWrite}
                                  onChange={(v) => update(r.key, { minimum: v })}
                                />
                              </div>
                              <div className="field">
                                <label>Valor máximo (R$)</label>
                                <input
                                  aria-label={`Máximo ${r.label}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Sem limite"
                                  value={r.maximum}
                                  disabled={!canWrite}
                                  onChange={(e) => update(r.key, { maximum: e.target.value })}
                                />
                              </div>
                              <div className="field">
                                <label>Quando aplica</label>
                                <select
                                  aria-label={`Quando aplica ${r.label}`}
                                  value={r.applies}
                                  disabled={!canWrite}
                                  onChange={(e) =>
                                    update(r.key, { applies: e.target.value as Applies })
                                  }
                                >
                                  {(Object.keys(appliesLabels) as Applies[]).map((a) => (
                                    <option key={a} value={a}>
                                      {appliesLabels[a]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="field calc-edit-note">
                                <label>Observação (exceções, CEPs, cidades)</label>
                                <input
                                  aria-label={`Observação ${r.label}`}
                                  maxLength={500}
                                  value={r.note}
                                  disabled={!canWrite}
                                  onChange={(e) =>
                                    onRulesChange(
                                      rules.map((x) =>
                                        x.key === r.key ? { ...x, note: e.target.value } : x,
                                      ),
                                    )
                                  }
                                />
                              </div>
                              <div className="calc-edit-actions">
                                <span className="calc-preview">
                                  <b>Resultado:</b> {describeRule(r, values)}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  disabled={!canWrite || r.mode === "padrao"}
                                  onClick={() => reset(r.key)}
                                >
                                  <RotateCcw />
                                  Voltar ao padrão
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <Head
          icon={Calculator}
          title="Simular um CT-e"
          sub="Confira o resultado das regras com um embarque de exemplo antes de salvar."
        />
        <div className="panel-body">
          <div className="calc-sim-inputs">
            <div className="field">
              <label htmlFor="sim-nf">Valor da NF (R$)</label>
              <input
                id="sim-nf"
                type="number"
                min="0"
                step="0.01"
                value={sim.nf}
                onChange={(e) => setSim({ ...sim, nf: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="sim-peso">Peso real (kg)</label>
              <input
                id="sim-peso"
                type="number"
                min="0"
                step="0.01"
                value={sim.peso}
                onChange={(e) => setSim({ ...sim, peso: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="sim-m3">Volume (m³)</label>
              <input
                id="sim-m3"
                type="number"
                min="0"
                step="0.001"
                value={sim.m3}
                onChange={(e) => setSim({ ...sim, m3: e.target.value })}
              />
            </div>
            {config.icms === "por_dentro" && (
              <div className="field">
                <label htmlFor="sim-icms">Alíquota de ICMS (%)</label>
                <input
                  id="sim-icms"
                  type="number"
                  min="0"
                  max="99"
                  step="0.01"
                  value={sim.icms}
                  onChange={(e) => setSim({ ...sim, icms: e.target.value })}
                />
              </div>
            )}
            <label className="calc-sim-check">
              <input
                type="checkbox"
                checked={sim.condicionais}
                onChange={(e) => setSim({ ...sim, condicionais: e.target.checked })}
              />
              Destino com taxas condicionais (TDE, TDA, TRT, EMEX, TRF)
            </label>
          </div>
          {hasSim ? (
            <table className="calc-sim-table">
              <tbody>
                <tr>
                  <td>
                    Peso considerado
                    <small>
                      Real {num(sim.peso)} kg · cubado {result.pesoCubado} kg
                    </small>
                  </td>
                  <td>{result.pesoConsiderado.toLocaleString("pt-BR")} kg</td>
                </tr>
                <tr>
                  <td>Frete Peso</td>
                  <td>{brl(result.fretePeso)}</td>
                </tr>
                <tr>
                  <td>Frete Valor</td>
                  <td>{brl(result.freteValor)}</td>
                </tr>
                <tr className="calc-sim-strong">
                  <td>
                    Frete base
                    {result.minimoAplicado && <small>Frete mínimo aplicado</small>}
                  </td>
                  <td>{brl(result.freteBase)}</td>
                </tr>
                {result.lines.map((l) => (
                  <tr key={l.key}>
                    <td>
                      {l.label}
                      <small>{l.detail}</small>
                    </td>
                    <td>{brl(l.value)}</td>
                  </tr>
                ))}
                {config.icms === "por_dentro" && (
                  <>
                    <tr>
                      <td>Subtotal sem ICMS</td>
                      <td>{brl(result.subtotal)}</td>
                    </tr>
                    <tr>
                      <td>ICMS por dentro ({num(sim.icms)}%)</td>
                      <td>{brl(result.icms)}</td>
                    </tr>
                  </>
                )}
                <tr className="calc-sim-total">
                  <td>Frete calculado</td>
                  <td>{brl(result.total)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="empty">
              Informe o valor da NF, o peso e o volume para ver o cálculo passo a passo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
