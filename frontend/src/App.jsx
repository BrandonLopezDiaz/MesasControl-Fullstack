// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Mesas from "./pages/Mesas";
import AgregarProductos from "./pages/AgregarProducto";
import ComandaCliente from "./pages/ComandaCliente";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Mesas />} />
        <Route
          path="/mesa/:mesaId/agregar"
          element={<AgregarProductos />}
        />
        
        <Route
          path="/mesa/:mesaId/comandaCliente"
          element={<ComandaCliente />}
        />
        {/* ¡No dejes rutas genéricas como "/mesa/:mesaId" sin especificar! */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
