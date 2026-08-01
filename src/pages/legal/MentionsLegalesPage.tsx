import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="23 juillet 2026">
      <LegalSection title="Éditeur du site">
        <p>
          Le site et l&apos;application Iwadu Cash sont édités par : <strong>[Raison sociale / nom de l&apos;éditeur à compléter]</strong>,
          [forme juridique à compléter, ex : entreprise individuelle / société], immatriculée sous le numéro
          [numéro d&apos;immatriculation à compléter], dont le siège est situé à [adresse à compléter].
        </p>
        <p>Responsable de la publication : [nom du responsable à compléter].</p>
        <p>Contact : [email de contact à compléter].</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          L&apos;application et les données qu&apos;elle contient sont hébergées par Supabase Inc., qui s&apos;appuie
          sur l&apos;infrastructure cloud d&apos;Amazon Web Services (AWS). Les fonctions serveur (conseiller IA,
          tableau de bord administrateur) sont exécutées via les Edge Functions de Supabase.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site et de l&apos;application Iwadu Cash (textes, logo, charte graphique,
          code source) est protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation,
          totale ou partielle, sans autorisation préalable, est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Nature du service">
        <p>
          Iwadu Cash est un outil de gestion de budget personnel. Les conseils fournis par l&apos;assistant IA sont
          générés automatiquement à partir des données saisies par l&apos;utilisateur et ne constituent en aucun cas
          un conseil financier, comptable, fiscal ou juridique professionnel.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Pour toute question relative à ces mentions légales : [email de contact à compléter].</p>
      </LegalSection>
    </LegalLayout>
  );
}
