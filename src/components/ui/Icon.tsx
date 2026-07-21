import {
  Plus,
  Edit2,
  Trash2,
  Target,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Table as TableIcon,
  FileText,
  BarChart2,
  PieChart as PieChartIcon,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Settings,
  Send,
  X,
  DollarSign,
  Calendar,
  Check,
  LayoutDashboard,
  CreditCard,
  Bot,
  ShoppingBag,
  Zap,
  Briefcase,
  Bus,
  Heart,
  AlertTriangle,
  Car,
  CalendarClock,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  plus: Plus,
  "edit-2": Edit2,
  "trash-2": Trash2,
  target: Target,
  "piggy-bank": PiggyBank,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  table: TableIcon,
  "file-text": FileText,
  "bar-chart-2": BarChart2,
  "pie-chart": PieChartIcon,
  search: Search,
  bell: Bell,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  sparkles: Sparkles,
  settings: Settings,
  send: Send,
  x: X,
  "dollar-sign": DollarSign,
  calendar: Calendar,
  check: Check,
  "layout-dashboard": LayoutDashboard,
  "credit-card": CreditCard,
  bot: Bot,
  "shopping-bag": ShoppingBag,
  zap: Zap,
  briefcase: Briefcase,
  bus: Bus,
  heart: Heart,
  "alert-triangle": AlertTriangle,
  car: Car,
  "calendar-clock": CalendarClock,
  eye: Eye,
  "eye-off": EyeOff,
};

interface IconProps {
  i: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ i, size = 16, className, style }: IconProps) {
  const LucideIconComponent = icons[i];

  if (!LucideIconComponent) {
    if (import.meta.env.DEV) {
      console.warn(`Icon "${i}" is not registered in src/components/ui/Icon.tsx`);
    }
    return null;
  }

  return <LucideIconComponent size={size} className={className} style={style} />;
}
