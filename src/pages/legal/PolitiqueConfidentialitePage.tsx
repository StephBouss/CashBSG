import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="6 août 2026">
      <LegalSection title="1. Données collectées">
        <p>Iwadu Cash collecte les données suivantes :</p>
        <ul className="list-disc list-inside flex flex-col gap-1">
          <li>Données de compte : email, nom (le cas échéant fourni via Google), préférences (langue, devise, pays, thème).</li>
          <li>Données financières saisies volontairement : revenus, dépenses, catégories, objectifs, comptes d&apos;épargne/investissement.</li>
          <li>Historique des échanges avec l&apos;assistant IA.</li>
          <li>Données techniques minimales en cas d&apos;erreur applicative (message d&apos;erreur, page concernée), utilisées uniquement à des fins de diagnostic.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Finalité du traitement">
        <p>
          Ces données sont utilisées exclusivement pour fournir le service (calculs de budget, rapports, assistant
          IA, tableau de bord) et améliorer sa fiabilité. Elles ne sont ni vendues, ni louées, ni utilisées à des
          fins publicitaires.
        </p>
      </LegalSection>

      <LegalSection title="3. Assistant IA et sous-traitants">
        <p>
          Lorsque l&apos;utilisateur sollicite l&apos;assistant IA (« Iwadu »), un résumé de sa situation financière
          (revenus et dépenses agrégés par catégorie et par statut, objectifs d&apos;épargne, message saisi et les 10
          derniers échanges de la conversation en cours) est transmis à l&apos;API de DeepSeek, le prestataire
          d&apos;intelligence artificielle utilisé par Iwadu Cash, aux seules fins de générer une réponse. Aucune
          donnée d&apos;identification directe (nom, email, identifiant de compte) ni aucun libellé brut de
          transaction n&apos;est transmis à ce prestataire.
        </p>
        <p>
          L&apos;hébergement des données et l&apos;exécution des fonctions serveur sont assurés par Supabase Inc.
          (infrastructure Amazon Web Services).
        </p>
      </LegalSection>

      <LegalSection title="4. Sécurité">
        <p>
          L&apos;accès aux données est protégé par authentification et par des règles de sécurité au niveau de la
          base de données (Row Level Security) garantissant que chaque utilisateur ne peut consulter, modifier ou
          supprimer que ses propres données. Les échanges avec l&apos;application sont chiffrés (HTTPS).
        </p>
      </LegalSection>

      <LegalSection title="5. Conservation des données">
        <p>
          Les données sont conservées tant que le compte est actif. En cas de suppression du compte, les données
          associées sont supprimées, sous réserve des durées de conservation imposées par la loi applicable.
        </p>
      </LegalSection>

      <LegalSection title="6. Droits de l'utilisateur">
        <p>
          Conformément à la réglementation applicable en matière de protection des données personnelles,
          l&apos;utilisateur dispose d&apos;un droit d&apos;accès, de rectification, de suppression et de
          portabilité de ses données. Le droit de rectification (modifier ses informations) et le droit de
          suppression (supprimer définitivement son compte) peuvent être exercés directement depuis la page «
          Paramètres » de l&apos;application. L&apos;export/la portabilité des données n&apos;est pas encore
          disponible en libre-service dans l&apos;application : pour l&apos;exercer, ou pour toute autre demande,
          écrire à stephboussougou@gmail.com.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies">
        <p>
          Iwadu Cash utilise uniquement des cookies/stockage local strictement nécessaires au fonctionnement du
          service (maintien de la session de connexion, préférences d&apos;affichage). Aucun cookie publicitaire ou
          de traçage tiers n&apos;est utilisé.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>
          Pour toute question relative à cette politique de confidentialité ou pour exercer vos droits :
          stephboussougou@gmail.com.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
