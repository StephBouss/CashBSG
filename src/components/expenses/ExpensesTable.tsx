import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatMontant } from "@/lib/formatters";
import { markExpensePaid, deleteExpense, updateExpense } from "@/hooks/useExpenses";
import type { Category, Expense } from "@/types/budget";

interface ExpensesTableProps {
  expenses: Expense[];
  categories: Category[];
  onChanged: () => void;
  onAddClick: () => void;
}

const statusColors: Record<string, string> = {
  paye: "var(--color-primary)",
  a_venir: "#F59E0B",
  en_retard: "#EF4444",
};

const statusLabels: Record<string, string> = {
  paye: "Payé",
  a_venir: "À venir",
  en_retard: "Retard",
};

const priorityColors: Record<string, string> = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "var(--color-secondary)",
};

const priorityLabels: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export function ExpensesTable({ expenses, categories, onChanged, onAddClick }: ExpensesTableProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ nom: "", montant: "", dateEcheance: "" });

  const totalPaye = expenses.filter((e) => e.statut === "paye").reduce((s, e) => s + e.montant, 0);
  const totalAVenir = expenses.filter((e) => e.statut === "a_venir").reduce((s, e) => s + e.montant, 0);
  const totalEnRetard = expenses.filter((e) => e.statut === "en_retard").reduce((s, e) => s + e.montant, 0);

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setEditValues({ nom: expense.nom, montant: String(expense.montant), dateEcheance: expense.dateEcheance });
  };

  const saveEdit = async (expenseId: string) => {
    await updateExpense(expenseId, {
      nom: editValues.nom,
      montant: Number(editValues.montant),
      dateEcheance: editValues.dateEcheance,
    });
    setEditingId(null);
    onChanged();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Dépenses</p>
          <p className="text-xs text-muted-foreground mt-0.5">Gérez et suivez vos dépenses</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
          }}
        >
          <Icon i="plus" size={14} className="text-white" />
          Ajouter
        </button>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
          boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
        }}
      >
        <div
          className="flex items-center px-6 py-4 font-semibold text-xs uppercase tracking-wide"
          style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.08)", color: "#949494" }}
        >
          <div style={{ width: "32px" }} />
          <div style={{ flex: 1 }}>Dépense</div>
          <div style={{ width: "100px" }}>Catégorie</div>
          <div style={{ width: "100px", textAlign: "right" }}>Montant</div>
          <div style={{ width: "120px" }}>Échéance</div>
          <div style={{ width: "80px" }}>Priorité</div>
          <div style={{ width: "80px" }}>Statut</div>
          <div style={{ width: "60px" }} />
        </div>

        {expenses.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Aucune dépense ce mois-ci.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            {expenses.map((expense) => {
              const category = categoryById.get(expense.categoryId ?? "");
              const checked = expense.statut === "paye";
              const isEditing = editingId === expense.id;

              return (
                <div
                  key={expense.id}
                  className="flex items-center px-6 py-3.5 text-sm"
                  style={{ background: checked ? "rgba(16,185,129,0.06)" : "transparent" }}
                >
                  <div
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onClick={() => !checked && markExpensePaid(expense.id).then(onChanged)}
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 cursor-pointer"
                    style={{
                      background: checked ? "var(--color-primary)" : "rgba(0,0,0,0.1)",
                      border: checked ? "1px solid var(--color-primary)" : "1px solid rgba(0,0,0,0.15)",
                    }}
                  >
                    {checked && <Icon i="check" size={12} className="text-white" />}
                  </div>

                  {isEditing ? (
                    <>
                      <input
                        value={editValues.nom}
                        onChange={(e) => setEditValues((v) => ({ ...v, nom: e.target.value }))}
                        className="ml-3 flex-1 bg-white/60 rounded px-2 py-1 text-sm"
                      />
                      <div style={{ width: "100px" }} className="text-xs text-muted-foreground">
                        {category?.nom ?? "—"}
                      </div>
                      <input
                        value={editValues.montant}
                        onChange={(e) => setEditValues((v) => ({ ...v, montant: e.target.value }))}
                        type="number"
                        style={{ width: "96px" }}
                        className="bg-white/60 rounded px-2 py-1 text-sm text-right"
                      />
                      <input
                        value={editValues.dateEcheance}
                        onChange={(e) => setEditValues((v) => ({ ...v, dateEcheance: e.target.value }))}
                        type="date"
                        style={{ width: "128px" }}
                        className="bg-white/60 rounded px-2 py-1 text-xs"
                      />
                      <div style={{ width: "80px" }} />
                      <div style={{ width: "80px" }} />
                      <div style={{ width: "60px" }} className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveEdit(expense.id)}
                          className="p-1.5 rounded text-xs"
                          style={{ background: "rgba(16,185,129,0.15)", color: "var(--color-primary)" }}
                        >
                          <Icon i="check" size={13} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded text-xs"
                          style={{ background: "rgba(0,0,0,0.06)" }}
                        >
                          <Icon i="x" size={13} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="ml-3 flex-1 font-medium text-foreground truncate"
                        style={{ textDecoration: checked ? "line-through" : "none" }}
                      >
                        {expense.nom}
                      </div>
                      <div style={{ width: "100px" }} className="text-xs text-muted-foreground truncate">
                        {category?.nom ?? "—"}
                      </div>
                      <div
                        style={{ width: "100px", textAlign: "right", color: expense.statut === "en_retard" ? "#EF4444" : "var(--color-ink)" }}
                        className="font-semibold"
                      >
                        -{formatMontant(expense.montant)}
                      </div>
                      <div style={{ width: "120px" }} className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(expense.dateEcheance))}
                      </div>
                      <div style={{ width: "80px" }}>
                        {expense.priorite && priorityColors[expense.priorite] ? (
                          <div
                            className="px-2 py-1 rounded text-xs font-medium text-center"
                            style={{
                              background: `${priorityColors[expense.priorite]}20`,
                              color: priorityColors[expense.priorite],
                              border: `1px solid ${priorityColors[expense.priorite]}30`,
                            }}
                          >
                            {priorityLabels[expense.priorite]}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                      <div style={{ width: "80px" }}>
                        <div
                          className="px-2 py-1 rounded text-xs font-medium text-center"
                          style={{
                            background: `${statusColors[expense.statut]}20`,
                            color: statusColors[expense.statut],
                            border: `1px solid ${statusColors[expense.statut]}40`,
                          }}
                        >
                          {statusLabels[expense.statut]}
                        </div>
                      </div>
                      <div style={{ width: "60px" }} className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(expense)}
                          className="p-1.5 rounded text-xs"
                          style={{ background: "rgba(0,0,0,0.06)", color: "var(--color-ink)" }}
                        >
                          <Icon i="edit-2" size={13} />
                        </button>
                        <button
                          onClick={() => deleteExpense(expense.id).then(onChanged)}
                          className="p-1.5 rounded text-xs"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                        >
                          <Icon i="trash-2" size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <div className="flex-1 p-4 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-xs text-muted-foreground">Total payé</p>
          <p className="text-lg font-semibold text-primary mt-1">{formatMontant(totalPaye)}</p>
        </div>
        <div className="flex-1 p-4 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-xs text-muted-foreground">À venir</p>
          <p className="text-lg font-semibold" style={{ color: "#F59E0B" }}>{formatMontant(totalAVenir)}</p>
        </div>
        <div className="flex-1 p-4 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-xs text-muted-foreground">En retard</p>
          <p className="text-lg font-semibold text-danger">{formatMontant(totalEnRetard)}</p>
        </div>
      </div>
    </div>
  );
}
