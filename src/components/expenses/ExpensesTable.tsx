import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatMontant } from "@/lib/formatters";
import { markExpensePaid, deleteExpense, updateExpense } from "@/hooks/useExpenses";
import { useProfile } from "@/hooks/useProfile";
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

// Colonnes à largeur fixe : flexShrink 0 partout pour empêcher le tassement/
// chevauchement du montant et de l'échéance quand le tableau est plus large
// que son conteneur (le défilement horizontal prend le relais).
const CATEGORIE_W = 130;
const MONTANT_W = 140;
const ECHEANCE_W = 110;
const PRIORITE_W = 90;
const STATUT_W = 90;
const ACTIONS_W = 72;
const NOM_W = 200;
const ROW_GAP = 8; // correspond à gap-2 (Tailwind), 7 espaces entre les 8 colonnes
const MIN_TABLE_WIDTH = 32 + NOM_W + CATEGORIE_W + MONTANT_W + ECHEANCE_W + PRIORITE_W + STATUT_W + ACTIONS_W + 7 * ROW_GAP;
const fixedCol = (width: number) => ({ width: `${width}px`, flexShrink: 0 });
const nomCol = { flex: `1 1 ${NOM_W}px`, minWidth: `${NOM_W}px` };

export function ExpensesTable({ expenses, categories, onChanged, onAddClick }: ExpensesTableProps) {
  const { data: profile } = useProfile();
  const devise = profile?.devise ?? "FCFA";
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
        <div className="overflow-x-auto">
        <div style={{ minWidth: `${MIN_TABLE_WIDTH}px` }}>
        <div
          className="flex items-center gap-2 px-6 py-4 font-semibold text-xs uppercase tracking-wide"
          style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.08)", color: "#949494" }}
        >
          <div style={{ width: "32px", flexShrink: 0 }} />
          <div style={nomCol}>Dépense</div>
          <div style={fixedCol(CATEGORIE_W)}>Catégorie</div>
          <div style={{ ...fixedCol(MONTANT_W), textAlign: "right" }}>Montant</div>
          <div style={fixedCol(ECHEANCE_W)}>Échéance</div>
          <div style={fixedCol(PRIORITE_W)}>Priorité</div>
          <div style={fixedCol(STATUT_W)}>Statut</div>
          <div style={fixedCol(ACTIONS_W)} />
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
                  className="flex items-center gap-2 px-6 py-3.5 text-sm"
                  style={{ background: checked ? "rgba(16,185,129,0.06)" : "transparent" }}
                >
                  <div
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onClick={() => !checked && markExpensePaid(expense.id).then(onChanged)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !checked) {
                        e.preventDefault();
                        markExpensePaid(expense.id).then(onChanged);
                      }
                    }}
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
                        style={nomCol}
                        className="bg-white/60 rounded px-2 py-1 text-sm"
                      />
                      <div style={fixedCol(CATEGORIE_W)} className="text-xs text-muted-foreground truncate pr-2">
                        {category?.nom ?? "—"}
                      </div>
                      <input
                        value={editValues.montant}
                        onChange={(e) => setEditValues((v) => ({ ...v, montant: e.target.value }))}
                        type="number"
                        style={fixedCol(MONTANT_W)}
                        className="bg-white/60 rounded px-2 py-1 text-sm text-right"
                      />
                      <input
                        value={editValues.dateEcheance}
                        onChange={(e) => setEditValues((v) => ({ ...v, dateEcheance: e.target.value }))}
                        type="date"
                        style={fixedCol(ECHEANCE_W)}
                        className="bg-white/60 rounded px-2 py-1 text-xs"
                      />
                      <div style={fixedCol(PRIORITE_W)} />
                      <div style={fixedCol(STATUT_W)} />
                      <div style={fixedCol(ACTIONS_W)} className="flex items-center justify-end gap-1">
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
                        className="font-medium text-foreground truncate"
                        style={{ ...nomCol, textDecoration: checked ? "line-through" : "none" }}
                      >
                        {expense.nom}
                      </div>
                      <div style={fixedCol(CATEGORIE_W)} className="text-xs text-muted-foreground truncate pr-2">
                        {category?.nom ?? "—"}
                      </div>
                      <div
                        style={{
                          ...fixedCol(MONTANT_W),
                          textAlign: "right",
                          whiteSpace: "nowrap",
                          color: expense.statut === "en_retard" ? "#EF4444" : "var(--color-ink)",
                        }}
                        className="font-semibold"
                      >
                        -{formatMontant(expense.montant, devise)}
                      </div>
                      <div style={{ ...fixedCol(ECHEANCE_W), whiteSpace: "nowrap" }} className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(expense.dateEcheance))}
                      </div>
                      <div style={fixedCol(PRIORITE_W)}>
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
                      <div style={fixedCol(STATUT_W)}>
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
                      <div style={fixedCol(ACTIONS_W)} className="flex items-center justify-end gap-1">
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
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <div className="flex-1 p-4 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-xs text-muted-foreground">Total payé</p>
          <p className="text-lg font-semibold text-primary mt-1">{formatMontant(totalPaye, devise)}</p>
        </div>
        <div className="flex-1 p-4 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <p className="text-xs text-muted-foreground">À venir</p>
          <p className="text-lg font-semibold" style={{ color: "#F59E0B" }}>{formatMontant(totalAVenir, devise)}</p>
        </div>
        <div className="flex-1 p-4 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-xs text-muted-foreground">En retard</p>
          <p className="text-lg font-semibold text-danger">{formatMontant(totalEnRetard, devise)}</p>
        </div>
      </div>
    </div>
  );
}
