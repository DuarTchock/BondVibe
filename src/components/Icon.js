import React from "react";
import {
  PartyPopper,
  Dumbbell,
  UtensilsCrossed,
  Palette,
  BookOpen,
  Mountain,
  Heart,
  Music,
  Gamepad2,
  TreePine,
  Wine,
  Briefcase,
  PawPrint,
  Plane,
  MapPin,
  Calendar,
  Clock,
  Users,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Plus,
  Settings,
  User,
  Home,
  Bell,
  MessageCircle,
  Star,
  Tag,
  DollarSign,
  Gift,
  Repeat,
  Globe,
  Filter,
} from "lucide-react-native";

// Category icon mapping
const CATEGORY_ICONS = {
  social: PartyPopper,
  sports: Dumbbell,
  food: UtensilsCrossed,
  arts: Palette,
  learning: BookOpen,
  adventure: Mountain,
  wellness: Heart,
  music: Music,
  games: Gamepad2,
  outdoors: TreePine,
  nightlife: Wine,
  networking: Briefcase,
  pets: PawPrint,
  travel: Plane,
};

// Location icon mapping
const LOCATION_ICONS = {
  all: Globe,
  tulum: MapPin,
  "playa-del-carmen": MapPin,
  cancun: MapPin,
};

// UI icon mapping
const UI_ICONS = {
  // Navigation
  back: ChevronLeft,
  forward: ChevronRight,
  down: ChevronDown,
  close: X,
  check: Check,
  plus: Plus,

  // Actions
  search: Search,
  filter: Filter,
  settings: Settings,

  // Content
  calendar: Calendar,
  clock: Clock,
  location: MapPin,
  users: Users,
  user: User,
  home: Home,
  bell: Bell,
  message: MessageCircle,
  star: Star,
  tag: Tag,
  dollar: DollarSign,
  gift: Gift,
  repeat: Repeat,
  globe: Globe,
};

/**
 * Icon Component
 *
 * @param {string} name - Icon name (category id, location id, or UI icon name)
 * @param {number} size - Icon size (default: 24)
 * @param {string} color - Icon color (default: currentColor)
 * @param {number} strokeWidth - Stroke width (default: 2)
 * @param {string} type - Icon type: "category" | "location" | "ui" (default: "ui")
 */
export default function Icon({
  name,
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  type = "ui",
  style,
}) {
  let IconComponent;

  switch (type) {
    case "category":
      IconComponent = CATEGORY_ICONS[name?.toLowerCase()] || PartyPopper;
      break;
    case "location":
      IconComponent = LOCATION_ICONS[name?.toLowerCase()] || MapPin;
      break;
    case "ui":
    default:
      IconComponent = UI_ICONS[name?.toLowerCase()] || Star;
      break;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}

// Export individual icon getters for flexibility
export const getCategoryIcon = (categoryId) => {
  return CATEGORY_ICONS[categoryId?.toLowerCase()] || PartyPopper;
};

export const getLocationIcon = (locationId) => {
  return LOCATION_ICONS[locationId?.toLowerCase()] || MapPin;
};

export const getUIIcon = (iconName) => {
  return UI_ICONS[iconName?.toLowerCase()] || Star;
};

// Export all mappings for direct access if needed
export { CATEGORY_ICONS, LOCATION_ICONS, UI_ICONS };
