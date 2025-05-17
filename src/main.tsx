
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// We are removing the direct CSS imports for Geist fonts here,
// as per your request to use JS imports.
// These will now be handled in App.tsx.

createRoot(document.getElementById("root")!).render(<App />);
