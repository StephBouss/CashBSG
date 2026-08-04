// Le FCFA (XAF/XOF) n'a pas de sous-unité en usage courant ; les autres
// devises proposées (EUR, USD, ...) en ont deux — le nombre de décimales
// affichées dépend donc de la devise, pas d'une règle globale.
const NO_DECIMAL_CURRENCIES = new Set(["FCFA", "XAF", "XOF"]);

const montantFormatters = new Map<string, Intl.NumberFormat>();

function montantFormatter(devise: string): Intl.NumberFormat {
  let formatter = montantFormatters.get(devise);
  if (!formatter) {
    const fractionDigits = NO_DECIMAL_CURRENCIES.has(devise) ? 0 : 2;
    formatter = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    montantFormatters.set(devise, formatter);
  }
  return formatter;
}

export function formatMontant(montant: number, devise = "FCFA"): string {
  return `${montantFormatter(devise).format(montant)} ${devise}`;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(isoDateTime: string): string {
  return dateTimeFormatter.format(new Date(isoDateTime));
}
