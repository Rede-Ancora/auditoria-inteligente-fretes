export type FreightAmount =
  | { status: "informed"; value: number }
  | { status: "missing" | "not-applicable" | "unidentified" | "pending" };

export interface CteRecord {
  id: string;
  number: string;
  key: string;
  issuedAt: string;
  carrier: string;
  branch: string;
  recipient: string;
  merchandise: FreightAmount;
  weight: string;
  volumes: string;
  invoices: string;
  freight: FreightAmount;
  audited: FreightAmount;
  invoice: string;
  status: string;
  tableVersion?: string;
  calculationMemory?: string;
  dacteUrl?: string;
  components: { name: string; carrier: FreightAmount; audited: FreightAmount }[];
}

export function formatFreight(amount: FreightAmount): string {
  if (amount.status === "informed") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      amount.value,
    );
  }
  return {
    missing: "Não informado",
    "not-applicable": "Não aplicável",
    unidentified: "Não identificado",
    pending: "Pendente de parametrização",
  }[amount.status];
}

export function getDacteUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
