const PALETTE = ["#3B82F6", "#F59E0B", "#6366F1", "#10B981", "#EC4899", "#14B8A6", "#EF4444"];

const KEYWORD_ICONS: Array<[RegExp, string]> = [
  [/salaire|revenu|freelance|activité/i, "briefcase"],
  [/logement|loyer/i, "credit-card"],
  [/transport|taxi|bus/i, "bus"],
  [/nourriture|alimentation|marché/i, "shopping-bag"],
  [/assurance|remboursement/i, "heart"],
  [/soin|santé|pharmacie/i, "heart"],
  [/loisir|sortie|cinéma|restaurant/i, "sparkles"],
  [/factur|électricité|eau|internet/i, "zap"],
  [/impr[eé]vu|autre/i, "alert-triangle"],
];

/** Couleur déterministe pour une catégorie (basée sur son nom), utilisée quand
 * aucune couleur n'est enregistrée en base. */
export function categoryColor(nom: string, couleur?: string | null): string {
  if (couleur) return couleur;
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = (hash << 5) - hash + nom.charCodeAt(i);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** Icône Lucide déterministe pour une catégorie, basée sur des mots-clés dans
 * son nom, avec repli sur une icône générique. */
export function categoryIcon(nom: string, icone?: string | null): string {
  if (icone) return icone;
  const match = KEYWORD_ICONS.find(([pattern]) => pattern.test(nom));
  return match ? match[1] : "dollar-sign";
}
