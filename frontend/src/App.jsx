// src/App.jsx
import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Mesas from "./pages/Mesas";
import AgregarProductos from "./pages/AgregarProducto";
import ComandaCliente from "./pages/ComandaCliente";
import Cocina from "./pages/Cocina";
import Finanzas from "./pages/Finanzas";
import Catalogo from "./pages/Catalogo";
import ConfigPage from "./pages/ConfigPage";

const NAV_ITEMS = [
  { path: "/", label: "Mesas", emoji: "🪑" },
  { path: "/cocina", label: "Cocina", emoji: "🍳" },
  { path: "/finanzas", label: "Finanzas", emoji: "📊" },
  { path: "/config", label: "Ajustes", emoji: "⚙️" },
  { path: "/catalogo", label: "Catálogos", emoji: "📦" },
];

function NavBar() {
  const { pathname } = useLocation();
  // Hide nav on operational screens (agregar / comanda)
  if (pathname.includes("/agregar") || pathname.includes("/comandaCliente")) return null;
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "var(--sj-paper)",
      borderTop: "2px solid var(--sj-line)",
      display: "flex",
      zIndex: 100,
    }}>
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          style={({ isActive }) => ({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "8px 0",
            textDecoration: "none",
            fontFamily: "'Patrick Hand', cursive",
            fontSize: 12,
            color: isActive ? "var(--sj-green-d)" : "var(--sj-ink-2)",
            borderTop: isActive ? "3px solid var(--sj-green)" : "3px solid transparent",
            background: isActive ? "var(--sj-green-l)" : "transparent",
          })}
        >
          <span style={{ fontSize: 22 }}>{item.emoji}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div style={{ paddingBottom: 64 }}>
          <Routes>
            <Route path="/" element={<Mesas />} />
            <Route path="/mesa/:mesaId/agregar" element={<AgregarProductos />} />
            <Route path="/mesa/:mesaId/comandaCliente" element={<ComandaCliente />} />
            <Route path="/cocina" element={<Cocina />} />
            <Route path="/finanzas" element={<Finanzas />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/catalogo" element={<Catalogo />} />
          </Routes>
          <NavBar />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
