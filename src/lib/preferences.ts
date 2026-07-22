export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "Anglais", flag: "🇬🇧" },
  { code: "es", label: "Espagnol", flag: "🇪🇸" },
  { code: "ar", label: "Arabe", flag: "🇸🇦" },
  { code: "zh", label: "Mandarin", flag: "🇨🇳" },
];

export interface CurrencyOption {
  code: string;
  label: string;
  flag: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "FCFA", label: "Franc CFA", flag: "🌍" },
  { code: "EUR", label: "Euro", flag: "🇪🇺" },
  { code: "USD", label: "Dollar américain", flag: "🇺🇸" },
  { code: "CNY", label: "Yuan (monnaie chinoise)", flag: "🇨🇳" },
  { code: "GBP", label: "Livre sterling (anglaise)", flag: "🇬🇧" },
  { code: "AED", label: "Dirham des Émirats (arabe)", flag: "🇦🇪" },
];

export interface CountryOption {
  code: string;
  label: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "SN", label: "Sénégal", flag: "🇸🇳" },
  { code: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "ML", label: "Mali", flag: "🇲🇱" },
  { code: "BF", label: "Burkina Faso", flag: "🇧🇫" },
  { code: "BJ", label: "Bénin", flag: "🇧🇯" },
  { code: "TG", label: "Togo", flag: "🇹🇬" },
  { code: "NE", label: "Niger", flag: "🇳🇪" },
  { code: "GW", label: "Guinée-Bissau", flag: "🇬🇼" },
  { code: "CM", label: "Cameroun", flag: "🇨🇲" },
  { code: "GA", label: "Gabon", flag: "🇬🇦" },
  { code: "CG", label: "Congo-Brazzaville", flag: "🇨🇬" },
  { code: "CD", label: "RD Congo", flag: "🇨🇩" },
  { code: "TD", label: "Tchad", flag: "🇹🇩" },
  { code: "CF", label: "Centrafrique", flag: "🇨🇫" },
  { code: "GQ", label: "Guinée équatoriale", flag: "🇬🇶" },
  { code: "GN", label: "Guinée", flag: "🇬🇳" },
  { code: "MR", label: "Mauritanie", flag: "🇲🇷" },
  { code: "MA", label: "Maroc", flag: "🇲🇦" },
  { code: "DZ", label: "Algérie", flag: "🇩🇿" },
  { code: "TN", label: "Tunisie", flag: "🇹🇳" },
  { code: "EG", label: "Égypte", flag: "🇪🇬" },
  { code: "NG", label: "Nigéria", flag: "🇳🇬" },
  { code: "GH", label: "Ghana", flag: "🇬🇭" },
  { code: "SA", label: "Arabie Saoudite", flag: "🇸🇦" },
  { code: "AE", label: "Émirats Arabes Unis", flag: "🇦🇪" },
  { code: "FR", label: "France", flag: "🇫🇷" },
  { code: "BE", label: "Belgique", flag: "🇧🇪" },
  { code: "CH", label: "Suisse", flag: "🇨🇭" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "GB", label: "Royaume-Uni", flag: "🇬🇧" },
  { code: "US", label: "États-Unis", flag: "🇺🇸" },
  { code: "ES", label: "Espagne", flag: "🇪🇸" },
  { code: "CN", label: "Chine", flag: "🇨🇳" },
  { code: "OTHER", label: "Autre", flag: "🌍" },
];
