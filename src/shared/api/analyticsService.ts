interface DataLayerEvent {
  event: string;
  page?: string;
  page_path?: string;
  page_location?: string;
  page_title?: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  event_category?: string;
  event_action?: string;
  event_label?: string;
  errorMessage?: string;
  errorStack?: string;
  error_message?: string;
  error_stack?: string;
  fatal?: boolean;
  gtm?: {
    start: number;
  };
  "gtm.start"?: number;
  "ga4.config"?: string;
}

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
    gtag: (command: string, ...args: unknown[]) => void;
  }
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;
  private readonly gtmId: string;
  private readonly gaId: string;

  private constructor() {
    // Inicializar dataLayer si no existe
    window.dataLayer = window.dataLayer || [];
    this.gtmId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    this.gaId = "G-N2LF4MP83S"; // ID de GA4
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private loadGTM() {
    if (!import.meta.env.PROD || !this.gtmId) return;

    const script = document.createElement("script");
    script.innerHTML = `
      (function(w,d,s,l,i){
        w[l]=w[l]||[];
        w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),
            dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;
        j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${this.gtmId}');
    `;
    document.head.appendChild(script);

    // Agregar el noscript para GTM
    const noscript = document.createElement("noscript");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${this.gtmId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    // Configurar GA4 a través de GTM
    window.dataLayer.push({
      event: "gtm.js",
      "gtm.start": new Date().getTime(),
      "ga4.config": this.gaId,
    });
  }

  initialize() {
    if (this.isInitialized) return;

    // Verificar que tenemos el ID de GTM
    if (!this.gtmId) {
      console.warn("GTM ID no encontrado en las variables de entorno");
      return;
    }

    this.loadGTM();
    this.isInitialized = true;
  }

  // Track page views
  trackPageView(path: string) {
    if (!import.meta.env.PROD) return;
    window.dataLayer.push({
      event: "pageview",
      page: path,
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }

  // Track events
  trackEvent(category: string, action: string, label?: string) {
    if (!import.meta.env.PROD) return;
    window.dataLayer.push({
      event: "customEvent",
      event_category: category,
      event_action: action,
      event_label: label,
    });
  }

  // Track user actions
  trackUserAction(action: string, label?: string) {
    this.trackEvent("User Action", action, label);
  }

  // Track errors
  trackError(error: Error, fatal: boolean = false) {
    if (!import.meta.env.PROD) return;
    window.dataLayer.push({
      event: "error",
      error_message: error?.message ?? "",
      error_stack: error?.stack ?? "",
      fatal: !!fatal,
    });
  }
}

export const analyticsService = AnalyticsService.getInstance();
