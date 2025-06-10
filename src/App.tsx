import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import { AppRoutes } from "./routes";

function App() {
  return (
    <Router>
      <AppRoutes />
      <Toaster />
    </Router>
  );
}

export default App;
