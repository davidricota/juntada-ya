
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importar GeistSans y GeistMono
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Aplicar las clases de variables de fuente al elemento <html>
// Esto asume que .variable funciona de manera similar a Next.js, inyectando los estilos necesarios.
if (typeof window !== 'undefined') {
  document.documentElement.classList.add(GeistSans.variable);
  document.documentElement.classList.add(GeistMono.variable);
}

createRoot(document.getElementById("root")!).render(<App />);
