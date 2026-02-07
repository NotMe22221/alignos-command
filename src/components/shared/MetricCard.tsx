import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "conflict" | "pending" | "success";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  conflict: "border-conflict/30 bg-conflict/5",
  pending: "border-pending/30 bg-pending/5",
  success: "border-update/30 bg-update/5",
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm transition-all hover-lift",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-update",
                  trend === "down" && "text-conflict",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {trend === "neutral" && "→"}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
