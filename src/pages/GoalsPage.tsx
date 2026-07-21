import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { GoalsGallery } from "@/components/goals/GoalsGallery";
import { NewGoalModal } from "@/components/goals/NewGoalModal";

export default function GoalsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: goals = [], refetch } = useGoals();

  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Objectifs financiers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Suivi de votre épargne</p>
      </div>

      <GoalsGallery goals={goals} onChanged={() => refetch()} onAddClick={() => setModalOpen(true)} />

      {modalOpen && <NewGoalModal onClose={() => setModalOpen(false)} onCreated={() => refetch()} />}
    </div>
  );
}
