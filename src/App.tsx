import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Kanban from "./pages/Kanban";
import Calendario from "./pages/Calendario";
import Biblioteca from "./pages/Biblioteca";
import Analytics from "./pages/Analytics";
import Campanhas from "./pages/Campanhas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/biblioteca" element={<Biblioteca />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/campanhas" element={<Campanhas />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
