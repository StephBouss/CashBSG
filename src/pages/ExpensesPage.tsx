import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { ExpensesTable } from "@/components/expenses/ExpensesTable";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";

export default function ExpensesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: expenses = [], refetch } = useExpenses(undefined, {
    source: "facture",
    includeBacklog: true,
  });
  const { data: categories = [] } = useCategories();

  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Dépenses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Suivi des dépenses du mois. Pour un pointage rapide d'une dépense déjà réglée, utilisez le Tracker.
        </p>
      </div>

      <ExpensesTable
        expenses={expenses}
        categories={categories}
        onChanged={() => refetch()}
        onAddClick={() => setModalOpen(true)}
      />

      {modalOpen && (
        <AddTransactionModal
          onClose={() => setModalOpen(false)}
          onCreated={() => refetch()}
          defaultType="depense"
        />
      )}
    </div>
  );
}
