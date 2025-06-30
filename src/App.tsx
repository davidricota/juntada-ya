import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes";
import RootLayout from "./app/layout";

function App() {
  return (
    <Router>
      <RootLayout>
        <AppRoutes />
      </RootLayout>
    </Router>
  );
}

export default App;
