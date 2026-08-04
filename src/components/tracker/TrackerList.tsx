import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { AmountInput } from "@/components/ui/AmountInput";
import { formatMontant, formatDateTime } from "@/lib/formatters";
import { categoryColor, categoryIcon } from "@/lib/categoryStyle";
import { updateTrackedExpense, deleteTrackedExpense } from "@/hooks/useExpenseTracker";
import { useProfile } from "@/hooks/useProfile";
import type { Category, TrackedExpense } from "@/types/budget";

interface TrackerListProps {
  expenses: TrackedExpense[];
  categories: Category[];
  onChanged: () => void;
}

interface EditValues {
  nom: string;
  categoryId: string;
  montant: number | undefined;
}

const inputStyle = {
  background: "rgba(0,0,0,0.04)",
  border: "1px solid rgba(0,0,0,0.1)",
};

export function TrackerList({ expenses, categories, onChanged }: TrackerListProps) {
  const { data: profile } = useProfile();
  const devise = profile?.devise ?? "FCFA";
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const depenseCategories = categories.filter((c) => c.type === "depense");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ nom: "", categoryId: "", montant: undefined });

  const startEdit = (expense: TrackedExpense) => {
    setEditingId(expense.id);
    setEditValues({ nom: expense.nom, categoryId: expense.categoryId, montant: expense.montant });
  };

  const saveEdit = async (id: string) => {
    if (!editValues.nom.trim() || !editValues.categoryId || !editValues.montant || editValues.montant <= 0) return;
    await updateTrackedExpense(id, {
      nom: editValues.nom.trim(),
      categoryId: editValues.categoryId,
      montant: editValues.montant,
    });
    setEditingId(null);
    onChanged();
  };

  const remove = async (id: string) => {
    await deleteTrackedExpense(id);
    onChanged();
  };

  return (
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
      {expenses.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">Aucune dépense trackée pour l&apos;instant.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {expenses.map((expense) => {
            const category = categoryById.get(expense.categoryId);
            const nom = category?.nom ?? "Sans catégorie";
            const color = categoryColor(nom, category?.couleur);
            const icon = categoryIcon(nom, category?.icone);
            const isEditing = editingId === expense.id;

            if (isEditing) {
              return (
                <div key={expense.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <input
                    value={editValues.nom}
                    onChange={(e) => setEditValues((v) => ({ ...v, nom: e.target.value }))}
                    className="flex-1 min-w-[140px] rounded-lg px-3 py-2 text-sm text-foreground"
                    style={inputStyle}
                  />
                  <select
                    value={editValues.categoryId}
                    onChange={(e) => setEditValues((v) => ({ ...v, categoryId: e.target.value }))}
                    className="rounded-lg px-3 py-2 text-sm text-foreground"
                    style={{ ...inputStyle, width: "160px" }}
                  >
                    {depenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ ...inputStyle, width: "140px" }}>
                    <AmountInput
                      value={editValues.montant}
                      onChange={(v) => setEditValues((prev) => ({ ...prev, montant: v }))}
                      className="w-full bg-transparent outline-none text-foreground text-right"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => saveEdit(expense.id)}
                      className="p-2 rounded-lg"
                      style={{ background: "rgba(16,185,129,0.15)", color: "var(--color-primary)" }}
                      aria-label="Enregistrer"
                    >
                      <Icon i="check" size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.06)" }}
                      aria-label="Annuler"
                    >
                      <Icon i="x" size={14} />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, color }}
                >
                  <Icon i={icon} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{expense.nom}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {nom} · {formatDateTime(expense.createdAt)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-danger flex-shrink-0">-{formatMontant(expense.montant, devise)}</p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(expense)}
                    className="p-1.5 rounded text-xs"
                    style={{ background: "rgba(0,0,0,0.06)", color: "var(--color-ink)" }}
                    aria-label="Modifier"
                  >
                    <Icon i="edit-2" size={13} />
                  </button>
                  <button
                    onClick={() => remove(expense.id)}
                    className="p-1.5 rounded text-xs"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                    aria-label="Supprimer"
                  >
                    <Icon i="trash-2" size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
