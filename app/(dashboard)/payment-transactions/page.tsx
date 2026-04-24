import { TransactionsStats } from "@/features/payment-transactions/components/transactions-stats";
import { TransactionsTable } from "@/features/payment-transactions/components/transactions-table";
import { transactions } from "@/features/payment-transactions/utils/transaction-data";

export default function PaymentTransactionsPage() {
  return (
    <>
      <div className="px-4 lg:px-6 py-4 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Báo cáo giao dịch</h1>
        <p className="text-muted-foreground">
          Xem và quản lý tất cả giao dịch trên hệ thống.
        </p>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <TransactionsStats />
        <TransactionsTable data={transactions} />
      </div>
    </>
  );
}
