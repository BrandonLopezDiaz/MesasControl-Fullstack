import React, { useState, useEffect } from "react";

/* === FUNCIONES DE CAMBIO (sin cambios) === */
const MONEDAS = [1, 2, 5, 10, 20];
const BILLETES = [20, 50, 100, 200, 500, 1000];
const DENOMINACIONES = [...MONEDAS, ...BILLETES].sort((a, b) => b - a);

function generarCombinaciones(cambio, limite = 3000) {
  const resultados = new Set();
  function backtrack(remaining, combo, start) {
    if (resultados.size > limite) return;
    if (remaining === 0) {
      resultados.add(JSON.stringify(combo.slice().sort((a, b) => b - a)));
      return;
    }
    for (let i = start; i < DENOMINACIONES.length; i++) {
      const denom = DENOMINACIONES[i];
      if (denom <= remaining) {
        combo.push(denom);
        backtrack(remaining - denom, combo, i);
        combo.pop();
      }
    }
  }
  backtrack(cambio, [], 0);
  return Array.from(resultados).map((c) => JSON.parse(c));
}

function contarDenominaciones(arr) {
  return arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function clasificarCombinaciones(combos) {
  const mixtas = [];
  const soloMonedas = [];
  const soloBilletes = [];

  for (let c of combos) {
    const keys = new Set(c);
    const esMonedas = [...keys].every((d) => MONEDAS.includes(d));
    const esBilletes = [...keys].every((d) => BILLETES.includes(d));
    const obj = contarDenominaciones(c);

    if (esMonedas && soloMonedas.length < 2) soloMonedas.push(obj);
    else if (esBilletes && soloBilletes.length < 1) soloBilletes.push(obj);
    else if (!esMonedas && !esBilletes && mixtas.length < 3) mixtas.push(obj);

    if (
      mixtas.length === 3 &&
      soloMonedas.length === 2 &&
      soloBilletes.length === 1
    )
      break;
  }
  return [...mixtas, ...soloMonedas, ...soloBilletes];
}

function obtenerMasCombinaciones(todas, usadas, limite = 6) {
  const usadasStr = usadas.map((u) => JSON.stringify(u));
  const nuevas = [];
  for (let combo of todas) {
    const obj = contarDenominaciones(combo);
    const str = JSON.stringify(obj);
    if (!usadasStr.includes(str)) nuevas.push(obj);
    if (nuevas.length === limite) break;
  }
  return nuevas;
}

function obtenerCombinacionesCambio(cambio) {
  const todas = generarCombinaciones(cambio);
  return { todas, iniciales: clasificarCombinaciones(todas) };
}

/* === COMPONENTE PRINCIPAL (restyled) === */
const CambioSugerencias = ({ dineroRecibido, totalAPagar }) => {
  const cambio = dineroRecibido - totalAPagar;
  const [combinaciones, setCombinaciones] = useState([]);
  const [todas, setTodas] = useState([]);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (cambio > 0) {
      const { todas, iniciales } = obtenerCombinacionesCambio(cambio);
      setTodas(todas);
      setCombinaciones(iniciales);
      setIndice(iniciales.length);
    } else {
      setCombinaciones([]);
      setTodas([]);
      setIndice(0);
    }
  }, [cambio]);

  const handleVerMas = () => {
    const nuevas = obtenerMasCombinaciones(todas, combinaciones, 6);
    if (nuevas.length > 0) {
      setCombinaciones([...combinaciones, ...nuevas]);
      setIndice(indice + nuevas.length);
    }
  };

  if (cambio <= 0) {
    return <p className="wf-sm">No hay cambio que devolver.</p>;
  }

  return (
    <div>
      <div className="wf-sm" style={{ marginBottom: 6 }}>
        Combinaciones posibles
      </div>

      {combinaciones.map((combo, idx) => (
        <div key={idx} className="cambio-combo">
          {Object.entries(combo).map(([denom, cantidad]) => (
            <div key={denom} className="cambio-denom">
              <img
                src={`/assets/dinero/${denom}.png`}
                alt={`$${denom}`}
                onError={(e) => {
                  // Fallback if image doesn't exist
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="wf-chip"
                style={{
                  display: "none",
                  fontSize: 16,
                  fontFamily: "'Caveat', cursive",
                  fontWeight: 700,
                }}
              >
                ${denom}
              </div>
              <span className="cambio-denom__qty">{cantidad}</span>
            </div>
          ))}
        </div>
      ))}

      {indice < todas.length && (
        <button
          className="wf-btn sm ghost"
          onClick={handleVerMas}
          style={{ marginTop: 4 }}
        >
          ver más combinaciones →
        </button>
      )}
    </div>
  );
};

export default CambioSugerencias;
