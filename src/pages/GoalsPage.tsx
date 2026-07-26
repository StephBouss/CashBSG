import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useProfile } from "@/hooks/useProfile";
import { GoalsGallery } from "@/components/goals/GoalsGallery";
import { NewGoalModal } from "@/components/goals/NewGoalModal";
import { UpsellCard } from "@/components/plan/UpsellCard";
import { canAccessGoals } from "@/lib/plan";

export default function GoalsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: goals = [], refetch } = useGoals();
  const { data: profile } = useProfile();

  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Objectifs financiers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suivi de votre épargne</p>
      </div>

      {profile && !canAccessGoals(profile.plan) ? (
        <UpsellCard
          title="Les objectifs financiers sont réservés aux offres payantes"
          description="Passez à Iwadu Essentiel ou Iwadu Pro pour définir des objectifs illimités (voyage, fonds d'urgence, projet…) et suivre votre progression étape par étape."
        />
      ) : (
        <>
          <GoalsGallery goals={goals} onChanged={() => refetch()} onAddClick={() => setModalOpen(true)} />
          {modalOpen && <NewGoalModal onClose={() => setModalOpen(false)} onCreated={() => refetch()} />}
        </>
      )}
    </div>
  );
}
