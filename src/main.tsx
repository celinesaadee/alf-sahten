import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./components/Collections.css";
import "./i18n";
import App from "./App.tsx";
import "./ModernUi.css";
import { AuthProvider } from "./context/AuthContext";

createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);