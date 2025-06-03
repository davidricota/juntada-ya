import React from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "@/contexts/PlayerContext";

import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Index";
import CreateEventPage from "./pages/CreateEventPage";
import JoinEventPage from "./pages/JoinEventPage";
import EventPage from "./pages/EventPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlayerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create-event" element={<CreateEventPage />} />
                <Route path="/join" element={<JoinEventPage />} />
                <Route path="/join/:accessCode" element={<JoinEventPage />} />
                <Route path="/event/:eventId" element={<EventPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </PlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
