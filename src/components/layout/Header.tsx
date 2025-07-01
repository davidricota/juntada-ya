import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { useParticipantStore } from "@/shared/stores/participantStore";
import { LogOut, Menu, X } from "lucide-react";

const Header: React.FC = () => {
  const location = useLocation();
  const { getUserStorage, clearParticipant } = useParticipantStore();
  const userStorage = getUserStorage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearParticipant();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-card text-card-foreground shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-primary">
              Plancito
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Inicio
              </Link>
              {userStorage && (
                <>
                  <Link
                    to="/my-plans"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === "/my-plans" ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Mis Planes
                  </Link>
                  <Link
                    to="/create"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === "/create" ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Crear Plan
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {userStorage ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleLogout()}
                  className="hidden md:flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </Button>
                <Button variant="ghost" onClick={() => toggleMobileMenu()} className="md:hidden">
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6 text-primary" />
                  )}
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default">Iniciar Sesión</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              {userStorage && (
                <>
                  <Link
                    to="/my-plans"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === "/my-plans" ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mis Planes
                  </Link>
                  <Link
                    to="/create"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === "/create" ? "text-primary" : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Crear Plan
                  </Link>
                  <Button
                    onClick={() => handleLogout()}
                    className="bg-primary text-primary-foreground flex items-center gap-2 justify-center"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
