import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPage from "./AdminPage";
import UserPage from "./UserPage";
import "./index.css";

// Routage minimal par chemin : /admin rend l'espace administrateur,
// tout autre chemin rend la vitrine.
const isAdminRoute = window.location.pathname.replace(/\/+$/, "") === "/admin";
const isUserRoute = window.location.pathname.startsWith("/utilisateur/");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{isAdminRoute ? <AdminPage /> : isUserRoute ? <UserPage /> : <App />}</React.StrictMode>
);
