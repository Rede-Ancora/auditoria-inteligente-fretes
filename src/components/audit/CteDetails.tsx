import { FileText, Scale, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatFreight, getDacteUrl, type CteRecord } from "./cte-detail-data";

export function CteDetails({ record, onClose }: { record: CteRecord | null; onClose: () => void }) {
  const dacte = getDacteUrl(record?.dacteUrl);
  return (
    <Dialog
      open={record !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="cte-dialog">
        <div className="detail-heading">
          <div className="eyebrow">AUDITORIA DOCUMENTAL E COMERCIAL</div>
          <DialogTitle>CT-e {record?.number}</DialogTitle>
          <DialogDescription>
            {record?.carrier} · {record?.branch}
          </DialogDescription>
        </div>
        {record && (
          <>
            <div className="cte-identification">
              <div>
                <span>Chave de acesso</span>
                <b>{record.key}</b>
              </div>
              <div>
                <span>Destinatário</span>
                <b>{record.recipient}</b>
              </div>
              <div>
                <span>Fatura associada</span>
                <b>{record.invoice || "Sem fatura"}</b>
              </div>
              <div>
                <span>Situação</span>
                <b>{record.status}</b>
              </div>
            </div>
            <div className="comparison-table table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Componente de frete</th>
                    <th>
                      <Truck /> Transportadora · XML / CT-e
                    </th>
                    <th>
                      <Scale /> Auditoria · tabela comercial
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.components.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty">
                        Decomposição não disponível neste documento.
                      </td>
                    </tr>
                  ) : (
                    record.components.map((component) => (
                      <tr key={component.name}>
                        <td>
                          <strong>{component.name}</strong>
                        </td>
                        <td>{formatFreight(component.carrier)}</td>
                        <td>{formatFreight(component.audited)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total do frete</td>
                    <td>{formatFreight(record.freight)}</td>
                    <td>{formatFreight(record.audited)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="calculation-evidence">
              <h3>Memória de cálculo</h3>
              <p>{record.tableVersion || "Tabela e versão não identificadas."}</p>
              <p>
                {record.calculationMemory ||
                  "Memória de cálculo não disponível. Nenhum valor foi estimado."}
              </p>
            </div>
            <div className="detail-footer">
              {!dacte && <span className="small-note">DACTE não disponível para este CT-e.</span>}
              {dacte ? (
                <Button asChild variant="approved" size="approved" className="btn-primary">
                  <a href={dacte} target="_blank" rel="noopener noreferrer">
                    <FileText /> Abrir DACTE (PDF)
                  </a>
                </Button>
              ) : (
                <Button variant="approved" size="approved" disabled>
                  <FileText /> Abrir DACTE (PDF)
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CteRows({
  records,
  onSelect,
}: {
  records: CteRecord[];
  onSelect: (record: CteRecord) => void;
}) {
  return (
    <tbody id="cte-list">
      {records.length === 0 ? (
        <tr>
          <td colSpan={13} className="empty">
            Nenhum registro disponível. Base não conectada.
          </td>
        </tr>
      ) : (
        records.map((record) => (
          <tr
            key={record.id}
            className="clickrow"
            tabIndex={0}
            aria-label={`Detalhar CT-e ${record.number}`}
            onClick={() => onSelect(record)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(record);
              }
            }}
          >
            <td>{record.issuedAt}</td>
            <td>
              <strong>{record.number}</strong>
              <small className="cte-key">{record.key}</small>
            </td>
            <td>{record.carrier}</td>
            <td>{record.branch}</td>
            <td>{record.recipient}</td>
            <td>{formatFreight(record.merchandise)}</td>
            <td>{record.weight}</td>
            <td>{record.volumes}</td>
            <td>{record.invoices}</td>
            <td>{formatFreight(record.freight)}</td>
            <td>{formatFreight(record.audited)}</td>
            <td>{record.invoice || "Sem fatura"}</td>
            <td>{record.status}</td>
          </tr>
        ))
      )}
    </tbody>
  );
}
