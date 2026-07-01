import {
  Briefcase,
  TrendingUp,
  Users,
  Church,
  ShoppingBag,
  Car,
  Utensils,
  HeartPulse,
  Gift,
  Landmark,
  CircleDollarSign,
  PiggyBank,
  Wallet,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Briefcase,
  TrendingUp,
  Users,
  Church,
  ShoppingBag,
  Car,
  Utensils,
  HeartPulse,
  Gift,
  Landmark,
  CircleDollarSign,
  PiggyBank,
  Wallet,
  HandCoins,
};

export function CategoryIcon({ name, size = 20 }: { name: string; size?: number }) {
  const Icon = MAP[name] ?? CircleDollarSign;
  return <Icon size={size} strokeWidth={2} />;
}
