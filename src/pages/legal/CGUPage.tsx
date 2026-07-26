import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export default function CGUPage() {
  return (
    <LegalLayout title="Conditions générales d'utilisation" updatedAt="23 juillet 2026">
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et l&apos;utilisation de
          l&apos;application Iwadu Cash, un service de gestion de budget personnel (suivi des revenus, dépenses,
          épargne, investissements, objectifs financiers et assistant IA).
        </p>
      </LegalSection>

      <LegalSection title="2. Création de compte">
        <p>
          L&apos;utilisation d&apos;Iwadu Cash nécessite la création d&apos;un compte (par email/mot de passe ou via
          Google). L&apos;utilisateur s&apos;engage à fournir des informations exactes et à préserver la
          confidentialité de ses identifiants. Chaque compte est personnel et incessible.
        </p>
      </LegalSection>

      <LegalSection title="3. Offres et tarifs">
        <p>
          Iwadu Cash propose une offre gratuite (Iwadu Free) et des offres payantes (Iwadu Essentiel, Iwadu Pro)
          donnant accès à des fonctionnalités additionnelles (objectifs financiers illimités, historique complet des
          rapports, assistant IA). Le détail des offres et de leurs tarifs est disponible sur la page
          d&apos;accueil, section « Tarifs ». Les modalités de paiement seront précisées lors de la mise en place de
          la facturation.
        </p>
      </LegalSection>

      <LegalSection title="4. Assistant IA">
        <p>
          L&apos;assistant IA d&apos;Iwadu Cash génère des recommandations à partir des données financières saisies
          par l&apos;utilisateur, transmises à un prestataire tiers d&apos;intelligence artificielle pour traitement.
          Ces recommandations sont fournies à titre indicatif uniquement et ne sauraient engager la responsabilité
          d&apos;Iwadu Cash quant aux décisions financières prises par l&apos;utilisateur.
        </p>
      </LegalSection>

      <LegalSection title="5. Utilisation raisonnable du service">
        <p>
          L&apos;utilisateur s&apos;engage à ne pas détourner le service de sa finalité, notamment à ne pas
          solliciter de manière excessive ou automatisée l&apos;assistant IA ou les autres fonctionnalités du
          service. Des limites d&apos;usage (par exemple, un nombre maximal de messages envoyés à l&apos;assistant
          IA sur une période donnée) peuvent être appliquées pour garantir la disponibilité du service à
          l&apos;ensemble des utilisateurs.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilité du service">
        <p>
          Iwadu Cash met en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité du service,
          sans garantie d&apos;absence d&apos;interruption. Des opérations de maintenance peuvent temporairement
          rendre le service indisponible.
        </p>
      </LegalSection>

      <LegalSection title="7. Résiliation">
        <p>
          L&apos;utilisateur peut cesser d&apos;utiliser le service et demander la suppression de son compte et de
          ses données à tout moment, en écrivant à [email de contact à compléter].
        </p>
      </LegalSection>

      <LegalSection title="8. Modification des CGU">
        <p>
          Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés de toute
          modification substantielle. La poursuite de l&apos;utilisation du service vaut acceptation des CGU
          modifiées.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
