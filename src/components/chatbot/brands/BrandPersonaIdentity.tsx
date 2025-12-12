import { cn } from "@/lib/utils";
import {
  Calendar,
  Users,
  MapPin,
  Globe,
  Sparkles,
  User,
  UserCheck,
  Heart,
  Home,
} from "lucide-react";

interface BrandPersonaIdentityProps {
  ageRange?: string;
  gender?: string;
  locationFocus?: string;
  targetGeography?: string;
  lifeStage?: string;
  compositionMode?: "solo" | "group" | "couple" | "family";
}

const compositionConfig = {
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

export function BrandPersonaIdentity({
  ageRange,
  gender,
  locationFocus,
  targetGeography,
  lifeStage,
  compositionMode,
}: BrandPersonaIdentityProps) {
  const identityItems = [
    { icon: Calendar, label: "Age", value: ageRange },
    { icon: UserCheck, label: "Gender", value: gender },
    { icon: MapPin, label: "Location", value: locationFocus },
    { icon: Globe, label: "Geography", value: targetGeography },
    { icon: Sparkles, label: "Life Stage", value: lifeStage },
  ].filter((item) => item.value);

  return (
    <div className="space-y-2">
      {/* Identity Snapshot */}
      {identityItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <div className="w-0.5 h-2.5 bg-primary rounded-full" />
            Identity Snapshot
          </h4>
          <div className="grid grid-cols-1 gap-1.5">
            {identityItems.map(({ icon: Icon, label, value }, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                  <Icon className="w-3 h-3 text-primary" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {label}
                  </div>
                  <div className="text-xs font-medium truncate leading-tight">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composition - Enhanced Card */}
      {compositionMode && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <div className="w-0.5 h-2.5 bg-primary rounded-full" />
            Composition
          </h4>
          {(() => {
            const config = compositionConfig[compositionMode];
            const CompositionIcon = config.icon;
            return (
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg border p-3 bg-gradient-to-br transition-all hover:shadow-sm",
                  config.gradient,
                  config.border
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                      config.iconBg
                    )}
                  >
                    <CompositionIcon
                      className={cn("w-4 h-4", config.text)}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground font-medium leading-tight">
                      Shoot Type
                    </div>
                    <div
                      className={cn(
                        "text-xs font-bold truncate leading-tight",
                        config.text
                      )}
                    >
                      {compositionMode.charAt(0).toUpperCase() +
                        compositionMode.slice(1)}
                    </div>
                  </div>
                </div>
                {/* Decorative element */}
                <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-xl pointer-events-none" />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
