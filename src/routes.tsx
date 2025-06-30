import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { PlayerProvider } from "@/app/providers/PlayerContext";
import { AuthProvider } from "@/app/providers/AuthContext";
import { useAnalytics } from "@/shared/hooks/useAnalytics";

import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Index";
import CreatePlanPage from "./pages/CreatePlanPage";
import JoinEventPage from "./pages/JoinEventPage";
import PlanPage from "./pages/PlanPage";
import MyPlansPage from "./pages/MyPlansPage";
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
                <Route path="/create" element={<CreatePlanPage />} />
                <Route path="/join" element={<JoinEventPage />} />
                <Route path="/join/:accessCode" element={<JoinEventPage />} />
                <Route path="/plan/:planId" element={<PlanPage />} />
                <Route path="/my-plans" element={<MyPlansPage />} />
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
