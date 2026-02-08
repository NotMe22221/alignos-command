import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Upload,
  Network,
  BookOpen,
  Radio,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Command Center", href: "/", icon: LayoutDashboard, description: "Dashboard overview" },
  { name: "Ingest", href: "/ingest", icon: Upload, description: "Add new information" },
  { name: "Knowledge Graph", href: "/graph", icon: Network, description: "Visual relationships" },
  { name: "Decision Ledger", href: "/ledger", icon: BookOpen, description: "Track decisions" },
  { name: "Propagation", href: "/propagation", icon: Radio, description: "Awareness tracking" },
  { name: "Conflicts", href: "/conflicts", icon: AlertTriangle, description: "Resolve issues" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/50 bg-sidebar">
          <div className="flex h-full flex-col">
            {/* Logo with subtle gradient border bottom */}
            <div className="relative flex h-16 items-center gap-2.5 border-b border-sidebar-border/50 px-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-soft-sm">
                <Zap className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
                AlignOS
              </span>
              {/* Subtle gradient overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sidebar-border/50 to-transparent" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-5">
              {navigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft-xs"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-sidebar-primary/10"
                            : "bg-transparent group-hover:bg-sidebar-accent/50"
                        )}>
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive
                                ? "text-sidebar-primary"
                                : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                            )}
                          />
                        </div>
                        <span className={cn(
                          "transition-colors",
                          isActive ? "text-sidebar-accent-foreground" : ""
                        )}>
                          {item.name}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {item.description}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>

            {/* Footer with softer pulse */}
            <div className="border-t border-sidebar-border/50 p-4">
              <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/30 px-3 py-2 text-xs text-sidebar-foreground/70">
                <div className="relative flex h-2 w-2 items-center justify-center">
                  <div className="absolute h-2 w-2 animate-ping rounded-full bg-update/50" />
                  <div className="h-2 w-2 rounded-full bg-update" />
                </div>
                <span>System operational</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 pl-64">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </TooltipProvider>
  );
}
