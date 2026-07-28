export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  taxRate: number; // e.g. 10 for 10%
  discount: number; // direct discount amount
  status: InvoiceStatus;
  notes?: string;
  currency: string;
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return (subtotal * taxRate) / 100;
}

export function calculateTotal(subtotal: number, tax: number, discount: number): number {
  return Math.max(0, subtotal + tax - discount);
}
