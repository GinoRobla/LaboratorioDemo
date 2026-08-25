import { useState } from "react";
import CatalogoView from "./CatalogoView.jsx";
import HistorialView from "./HistorialView.jsx";

export default function App() {
  const [tab, setTab] = useState("catalogo");

  return (
    <div className="app">
      <header>
        <h1>Panel del Laboratorio</h1>
        <nav>
          <button className={tab === "catalogo" ? "active" : ""} onClick={() => setTab("catalogo")}>
            Catálogo
          </button>
          <button className={tab === "historial" ? "active" : ""} onClick={() => setTab("historial")}>
            Historial
          </button>
        </nav>
      </header>
      <main>{tab === "catalogo" ? <CatalogoView /> : <HistorialView />}</main>
    </div>
  );
}
