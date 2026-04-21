export interface Debt {
  id: number;
  description: string;
  amount: number;
  currency: string;
  debtorPhone: string;
  isPaid: boolean;
  dueDate?: string | Date;
  currentInstallment?: number;
  totalInstallments?: number;
}
