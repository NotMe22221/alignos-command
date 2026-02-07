import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Ingest from "./pages/Ingest";
import Graph from "./pages/Graph";
import Ledger from "./pages/Ledger";
import Propagation from "./pages/Propagation";
import Conflicts from "./pages/Conflicts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ingest" element={<Ingest />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/propagation" element={<Propagation />} />
          <Route path="/conflicts" element={<Conflicts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
