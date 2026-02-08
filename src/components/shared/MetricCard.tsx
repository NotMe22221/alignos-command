import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "conflict" | "pending" | "success";
  className?: string;
}

const variantStyles = {
  default: "border-border/50 bg-card",
  conflict: "border-conflict/20 bg-gradient-to-br from-conflict/5 to-transparent",
  pending: "border-pending/20 bg-gradient-to-br from-pending/5 to-transparent",
  success: "border-update/20 bg-gradient-to-br from-update/5 to-transparent",
};

const iconBgStyles = {
  default: "bg-muted",
  conflict: "bg-conflict/10",
  pending: "bg-pending/10",
  success: "bg-update/10",
};

// Animated counter hook
function useAnimatedNumber(value: number, duration = 500) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = displayValue;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeOut);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = "default",
  className,
}: MetricCardProps) {
  const numericValue = typeof value === "number" ? value : parseInt(value) || 0;
  const animatedValue = useAnimatedNumber(numericValue);
  const displayValue = typeof value === "number" ? animatedValue : value;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-5 shadow-soft-sm transition-shadow duration-200 hover:shadow-soft-md",
        variantStyles[variant],
        className
      )}
    >
      {/* Subtle pattern overlay for non-default variants */}
      {variant !== "default" && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "16px 16px"
          }}
        />
      )}

      <div className="relative flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <motion.p 
              key={displayValue}
              className="text-3xl font-semibold tracking-tight"
            >
              {displayValue}
            </motion.p>
            {trend && (
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trend === "up" && "text-update",
                trend === "down" && "text-conflict",
                trend === "neutral" && "text-muted-foreground"
              )}>
                <TrendIcon className="h-3 w-3" />
                {trendValue && <span>{trendValue}</span>}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
            iconBgStyles[variant]
          )}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
