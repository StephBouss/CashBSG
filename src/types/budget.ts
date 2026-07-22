export type CategoryType = "revenu" | "depense";

export interface Category {
  id: string;
  userId: string;
  nom: string;
  type: CategoryType;
  couleur: string | null;
  icone: string | null;
}

export interface Income {
  id: string;
  userId: string;
  categoryId: string | null;
  nom: string;
  montant: number;
  frequence: string | null;
  date: string;
}

export type ExpenseStatut = "paye" | "a_venir" | "en_retard";

export interface Expense {
  id: string;
  userId: string;
  categoryId: string | null;
  nom: string;
  montant: number;
  dateEcheance: string;
  priorite: string | null;
  statut: ExpenseStatut;
  datePaiement: string | null;
}

export interface Profile {
  id: string;
  nom: string | null;
  devise: string;
  langue: string;
  theme: string;
  pays: string | null;
  isAdmin: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  label: string;
  icone: string;
  couleur: string;
  montantCible: number;
  montantEpargne: number;
  dateCible: string | null;
  contributionMensuelle: number;
}

export type SavingsAccountType = "epargne" | "investissement";
export type SavingsContributionMode = "montant" | "pourcentage";

export interface SavingsAccount {
  id: string;
  userId: string;
  type: SavingsAccountType;
  nom: string;
  mode: SavingsContributionMode;
  montantFixe: number | null;
  pourcentage: number | null;
  categoryId: string | null;
  createdAt: string;
}

export interface SavingsMovement {
  id: string;
  userId: string;
  accountId: string;
  montant: number;
  date: string;
}

export type AiMessageRole = "user" | "assistant";

export interface AiMessage {
  id: string;
  userId: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}
