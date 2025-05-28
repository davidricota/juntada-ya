import React from "react";

const Header: React.FC = () => {
  return (
    <header className="bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center space-x-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <span>juntadaYa!</span>
        </a>
        <nav className="space-x-4">
          {/* Podríamos agregar links de navegación más adelante */}
          {/* <a href="#features" className="text-spotify-text-muted hover:text-spotify-text transition-colors">Características</a> */}
          {/* <a href="#login" className="bg-spotify-green text-spotify-dark font-semibold px-4 py-2 rounded-full hover:bg-opacity-80 transition-opacity">Iniciar Sesión</a> */}
        </nav>
      </div>
    </header>
  );
};

export default Header;
