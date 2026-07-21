import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { categoryColor, categoryIcon } from "@/lib/categoryStyle";
import type { Category, Expense, Income } from "@/types/budget";

interface RecentTransactionsProps {
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
}

interface TxRow {
  id: string;
  nom: string;
  categoryNom: string;
  amount: number;
  date: string;
  couleur: string;
  icone: string;
}

function fmt(n: number) {
  const abs = Math.abs(n).toLocaleString("fr-FR");
  return `${n < 0 ? "-" : "+"} ${abs} FCFA`;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export function RecentTransactions({ incomes, expenses, categories }: RecentTransactionsProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const rows: TxRow[] = [
    ...incomes.map((income) => {
      const category = categoryById.get(income.categoryId ?? "");
      const nom = category?.nom ?? "Revenus";
      return {
        id: `income-${income.id}`,
        nom: income.nom,
        categoryNom: nom,
        amount: income.montant,
        date: income.date,
        couleur: categoryColor(nom, category?.couleur),
        icone: categoryIcon(nom, category?.icone),
      };
    }),
    ...expenses.map((expense) => {
      const category = categoryById.get(expense.categoryId ?? "");
      const nom = category?.nom ?? "Autres";
      return {
        id: `expense-${expense.id}`,
        nom: expense.nom,
        categoryNom: nom,
        amount: -expense.montant,
        date: expense.dateEcheance,
        couleur: categoryColor(nom, category?.couleur),
        icone: categoryIcon(nom, category?.icone),
      };
    }),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">Transactions récentes</p>
        <Link to="/depenses" className="text-xs font-medium" style={{ color: "#10B981" }}>
          Voir tout
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune transaction ce mois-ci.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${tx.couleur}18`, color: tx.couleur }}
              >
                <Icon i={tx.icone} size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight truncate">{tx.nom}</p>
                <p className="text-xs text-muted-foreground">{tx.categoryNom}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold" style={{ color: tx.amount < 0 ? "#EF4444" : "#10B981" }}>
                  {fmt(tx.amount)}
                </p>
                <p className="text-xs text-muted-foreground">{dateFormatter.format(new Date(tx.date))}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
