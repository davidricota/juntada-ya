import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-card py-8 text-center">
      <div className="container mx-auto px-4">
        <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} juntadaYa!. Inspirado con ❤️.</p>
        <p className="text-xs text-gray-600 mt-1">
          Para funcionalidades completas como creación de eventos y colaboración, se requiere integración con Supabase.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
