export interface NormalizedDeductible {
  label: string;
  amount: number;
}

export interface NormalizedInvoiceSnapshot {
  companyName: string;
  companyTrn: string;
  invoiceTypeLabel: string;
  issuedDate: string | null;
  memberCode: string;
  team: string;
  subteam: string;
  customerOrDeveloper: string;
  projectOrParticular: string;
  unitNumber: string;
  buyerName: string;
  tinNumber: string;
  categoryTitle: string;
  currency: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  deductibles: NormalizedDeductible[];
  totalDeductibles: number;
  totalAmount: number;
  commissionReceived: number;
  commissionRate: number;
  remarks: string;
}

export function normalizeInvoiceSnapshot(
  rawSnap: Record<string, any> | null | undefined
): NormalizedInvoiceSnapshot;

