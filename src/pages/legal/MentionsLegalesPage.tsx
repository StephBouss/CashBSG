import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="6 août 2026">
      <LegalSection title="Éditeur du site">
        <p>
          Le site et l&apos;application Iwadu Cash sont édités par :{" "}
          <strong>DÉCISION/INFORMATION À FOURNIR PAR LE PROPRIÉTAIRE DU PRODUIT</strong> (raison sociale, forme
          juridique, numéro d&apos;immatriculation et siège social — identité légale de l&apos;éditeur non
          déterminable depuis le code source, à compléter par le propriétaire du produit).
        </p>
        <p>Responsable de la publication : DÉCISION/INFORMATION À FOURNIR PAR LE PROPRIÉTAIRE DU PRODUIT.</p>
        <p>Contact : stephboussougou@gmail.com.</p>
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
        <p>Pour toute question relative à ces mentions légales : stephboussougou@gmail.com.</p>
      </LegalSection>
    </LegalLayout>
  );
}
