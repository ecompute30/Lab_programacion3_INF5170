"""
Práctica 5.3 — genera un gráfico de la prueba de estrés a partir del NDJSON
que exporta k6 (--out json=reportes/prueba-estres-metricas.json).

Agrupa los puntos en ventanas de 5 segundos y calcula, por ventana:
  - cantidad de solicitudes HTTP
  - porcentaje de solicitudes con error (status != 200)
  - usuarios virtuales activos (vus)

Genera reportes/grafico-estres.png con dos ejes: VUs (barras) y
porcentaje de error (línea), para visualizar en qué punto de concurrencia
la Rick and Morty API empieza a responder 429 (rate limit de Cloudflare).
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

RUTA_ENTRADA = Path(__file__).parent / "prueba-estres-metricas.json"
RUTA_SALIDA = Path(__file__).parent / "grafico-estres.png"
TAMANO_VENTANA_SEGUNDOS = 5


def parsear_tiempo(valor):
    return datetime.fromisoformat(valor.replace("Z", "+00:00")).astimezone(timezone.utc)


puntos_http = []
puntos_vus = []

with open(RUTA_ENTRADA, encoding="utf-8") as f:
    for linea in f:
        linea = linea.strip()
        if not linea:
            continue
        registro = json.loads(linea)
        if registro.get("type") != "Point":
            continue
        metrica = registro.get("metric")
        datos = registro["data"]
        if metrica == "http_reqs":
            puntos_http.append((parsear_tiempo(datos["time"]), datos["tags"].get("status")))
        elif metrica == "vus":
            puntos_vus.append((parsear_tiempo(datos["time"]), datos["value"]))

inicio = min(t for t, _ in puntos_http)


def ventana_de(t):
    return int((t - inicio).total_seconds() // TAMANO_VENTANA_SEGUNDOS)


ventanas = {}
for t, status in puntos_http:
    w = ventana_de(t)
    ventanas.setdefault(w, {"total": 0, "errores": 0})
    ventanas[w]["total"] += 1
    if status != "200":
        ventanas[w]["errores"] += 1

vus_por_ventana = {}
for t, valor in puntos_vus:
    w = ventana_de(t)
    vus_por_ventana.setdefault(w, []).append(valor)

n_ventanas = max(ventanas.keys()) + 1
etiquetas_tiempo = [w * TAMANO_VENTANA_SEGUNDOS for w in range(n_ventanas)]
porcentaje_error = [
    (ventanas[w]["errores"] / ventanas[w]["total"] * 100) if w in ventanas and ventanas[w]["total"] else 0
    for w in range(n_ventanas)
]
vus_promedio = [
    (sum(vus_por_ventana[w]) / len(vus_por_ventana[w])) if w in vus_por_ventana else 0
    for w in range(n_ventanas)
]

fig, ax1 = plt.subplots(figsize=(10, 5))

color_vus = "#17499f"
ax1.set_xlabel("Tiempo transcurrido (segundos)")
ax1.set_ylabel("Usuarios virtuales (VUs)", color=color_vus)
ax1.step(etiquetas_tiempo, vus_promedio, where="mid", color=color_vus, linewidth=2, label="VUs activos")
ax1.tick_params(axis="y", labelcolor=color_vus)
ax1.set_ylim(bottom=0)

ax2 = ax1.twinx()
color_error = "#b3261e"
ax2.set_ylabel("Solicitudes con error (%)", color=color_error)
ax2.plot(etiquetas_tiempo, porcentaje_error, color=color_error, linewidth=2, marker="o", markersize=3, label="% error (HTTP != 200)")
ax2.tick_params(axis="y", labelcolor=color_error)
ax2.set_ylim(bottom=0, top=max(105, max(porcentaje_error) + 5))

plt.title("Prueba de estrés — Rick and Morty API\nVUs vs. % de solicitudes con error (ventanas de 5s)")
fig.tight_layout()
plt.savefig(RUTA_SALIDA, dpi=150)
print(f"Gráfico guardado en {RUTA_SALIDA}")

# Resumen en texto para el reporte HTML
for w in range(n_ventanas):
    total = ventanas.get(w, {}).get("total", 0)
    errores = ventanas.get(w, {}).get("errores", 0)
    vus = vus_promedio[w]
    pct = porcentaje_error[w]
    print(f"t={w*TAMANO_VENTANA_SEGUNDOS:>3}s  VUs~{vus:4.1f}  solicitudes={total:3}  errores={errores:3}  %error={pct:5.1f}")
