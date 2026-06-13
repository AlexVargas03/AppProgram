# Instrucciones generales
- Responde siempre en español
- Explica de forma clara y sencilla
- Prioriza soluciones prácticas
- No des respuestas demasiado largas, a menos que te lo pida
- Si no entiendes algo, pregunta antes de asumir
- Cuando corrijas un bug, explica brevemente por qué ocurrió

# Proyecto: Vital Watch & Sami (Concurso / Hackathon)
- **Objetivo:** Monitoreo biométrico pasivo y activo en médicos para prevenir el burnout y sugerir micro-pausas adaptativas.
- **UI:** Interfaz optimizada para pantallas pequeñas (reloj inteligente / mobile), usando Tailwind CSS + `cn()`.
- **Estrategia de Red:** Offline-First. Si falla la red o está offline, los datos se respaldan en LocalStorage (`vital_watch_cache`).

# Métricas Clave del Sistema
1. **Telemetría Biométrica (Pasiva):**
   - HRV (Variabilidad Cardíaca en ms) -> Predictor principal.
   - RHR (Frecuencia Cardíaca en Reposo en LPM) -> Indicador de fatiga acumulada.
   - Sueño (Minutos totales) -> Alerta crítica por debajo de 5.4 horas (324 min).
   - Sensor Confidence (0-100%) -> Si baja de cierto umbral, dispara vibración háptica para reajuste.
2. **Interacción Subjetiva (Activa):**
   - Slider de Fatiga Percibida (Entero del 0 al 100).
   - Tasa de Respuesta a Intervenciones (Booleano: Aceptado/Ignorado).
3. **Adherencia (Logs):**
   - Wear Time (% de uso en la guardia, meta > 83.2% para activar "Rachas de Autocuidado").
   - Eventos de Latencia (Modo caché activo).

# Flujos Técnicos Principales
- **Flujo 1 (Ingesta y Control de Ruido):** Front -> Azure Function. Si Sensor Confidence < Umbral -> Trigger Háptico (Vibración).
- **Flujo 2 (Intervención de IA):** Azure Function detecta fatiga crónica -> Invoca Azure OpenAI (Sami) -> Front despliega chat empático.
- **Flujo 3 (Engagement y Cierre):** Envío de Slider + Wear Time -> Azure Cosmos DB -> Cálculo de Racha de Autocuidado.

# Convenciones del código
- Componentes en `/src/components` y rutas/vistas en `/src/routes` (TanStack Router).
- Cliente de integración en `src/services/azureApi.ts` utilizando `import.meta.env.VITE_AZURE_API_URL`.
- Simular datos biométricos o usar mocks interactivos en la UI para la Demo (entorno web/PWA actual).
- Usar siempre `===` en vez de `==`.
- Sin `console.log()` innecesarios que ensucien la telemetría simulada.

# Cómo trabajar conmigo
- Antes de escribir código, confirma que entendiste el requerimiento
- Si hay más de una solución, dame las opciones con pros y contras breves
- Cuando generes código nuevo, sigue las convenciones existentes del proyecto
- Si detectas código muerto o sin usar, avísame antes de tocarlo
- Prioriza no romper lo que ya funciona

# Contexto técnico
- graphify-ts instalado — el grafo del proyecto está en graphify-out/ (regenerado en esta máquina)
- Usa el MCP de graphify-ts o GRAPH_REPORT.md para entender la arquitectura antes de responder
- Los god nodes críticos son: cn(), useAuth(), Button, usePantry(), useHistorial()
- El grafo actual tiene 437 nodos y 588 aristas — más actualizado que el anterior

# Lo que NO debes hacer
- No instales dependencias sin preguntarme primero
- No refactorices código que no está relacionado con lo que te pedí
- No cambies nombres de variables o funciones sin avisarme
- No asumas que algo está mal solo porque no lo entiendes