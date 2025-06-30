import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analyticsService } from "@/shared/api/analyticsService";

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Inicializar analytics
    analyticsService.initialize();

    // Track page view cuando cambia la ruta
    analyticsService.trackPageView(location.pathname);
  }, [location]);

  return {
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
    trackUserAction: analyticsService.trackUserAction.bind(analyticsService),
    trackError: analyticsService.trackError.bind(analyticsService),
  };
};
