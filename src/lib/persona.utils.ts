import { Heart, Home, User, Users } from "lucide-react";

export const compositionConfig = {
  solo: {
    icon: User,
    gradient: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-500/20",
  },
  group: {
    icon: Users,
    gradient: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-500/20",
  },
  couple: {
    icon: Heart,
    gradient: "from-pink-500/10 to-pink-600/5",
    border: "border-pink-200 dark:border-pink-800",
    text: "text-pink-700 dark:text-pink-300",
    iconBg: "bg-pink-500/20",
  },
  family: {
    icon: Home,
    gradient: "from-green-500/10 to-green-600/5",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    iconBg: "bg-green-500/20",
  },
};
