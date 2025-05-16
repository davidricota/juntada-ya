
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner"; // sonner es shadcn para notificaciones más ricas
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";

// Nuevas páginas
import HomePage from "./pages/Index"; // Index.tsx ahora es HomePage
import CreateEventPage from "./pages/CreateEventPage";
import JoinEventPage from "./pages/JoinEventPage";
import EventPage from "./pages/EventPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster /> {/* Para useToast de shadcn/ui */}
      <Sonner /> {/* Para toast de sonner (más versátil) */}
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create-event" element={<CreateEventPage />} />
            <Route path="/join" element={<JoinEventPage />} />
            <Route path="/join/:accessCode" element={<JoinEventPage />} /> {/* Para unirse con código en URL */}
            <Route path="/event/:eventId" element={<EventPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
