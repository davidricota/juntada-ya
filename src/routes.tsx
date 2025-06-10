import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";

import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Index";
import CreateEventPage from "./pages/CreateEventPage";
import JoinEventPage from "./pages/JoinEventPage";
import EventPage from "./pages/EventPage";
import MyEventsPage from "./pages/MyEventsPage";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient();

export const AppRoutes = () => {
  // Inicializar analytics
  useAnalytics();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <PlayerProvider>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create-event" element={<CreateEventPage />} />
                <Route path="/join" element={<JoinEventPage />} />
                <Route path="/join/:accessCode" element={<JoinEventPage />} />
                <Route path="/event/:eventId" element={<EventPage />} />
                <Route path="/my-events" element={<MyEventsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          </PlayerProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
