
import React, { useEffect } from 'react'; // Added useEffect
import { GeistSans } from "geist/font/sans"; // Your requested import
import { GeistMono } from "geist/font/mono"; // Your requested import

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/Index";
import CreateEventPage from "./pages/CreateEventPage";
import JoinEventPage from "./pages/JoinEventPage";
import EventPage from "./pages/EventPage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Attempt to apply font variables to the html element
    // This follows the pattern from Geist documentation for Next.js,
    // adapted for a client-side React (Vite) application.
    document.documentElement.classList.add(GeistSans.variable);
    document.documentElement.classList.add(GeistMono.variable);

    // Cleanup function to remove classes when component unmounts
    return () => {
      document.documentElement.classList.remove(GeistSans.variable);
      document.documentElement.classList.remove(GeistMono.variable);
    };
  }, []); // Empty dependency array ensures this runs once on mount and unmount

  return (
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
};

export default App;
