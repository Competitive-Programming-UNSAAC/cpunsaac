# Cuscontest Scoreboard

Sitio web de Competitive Programming UNSAAC para scoreboards y eventos de programación competitiva.

Desplegado con GitHub Pages desde `docs/`.

## Configuración

Todo se gestiona en `docs/config.js`.

### Eventos

```javascript
{ name: "Evento", url: "https://...", logo: "logo.png", startDate: "2026-08-03T09:00:00-05:00", endDate: "2026-08-15T18:00:00-05:00" },
```

- `logo`: archivo en `docs/img/`
- Fechas en formato ISO 8601 con timezone (`-05:00` para Perú)
- Se ordenan automáticamente por `startDate`
- Solo se muestran los próximos (máximo: `scoreboardGrid.maxEvents`)

### Scoreboards

Desde el servidor DOMjudge, exportar los endpoints del [ICPC Contest API](https://ccs-specs.icpc.io/contest_api):

```
GET /api/v4/contests                          # Lista de concursos
GET /api/v4/contests/{id}/scoreboard          # Ranking en tiempo real
GET /api/v4/contests/{id}/submissions         # Envíos de los equipos
GET /api/v4/contests/{id}/judgements          # Evaluaciones de envíos
GET /api/v4/contests/{id}/runs                # Ejecuciones individuales
GET /api/v4/contests/{id}/teams               # Equipos registrados
GET /api/v4/contests/{id}/problems            # Problemas del concurso
GET /api/v4/contests/{id}/groups              # Grupos
GET /api/v4/contests/{id}/organizations       # Categorías
GET /api/v4/contests/{id}/accounts            # Cuentas
GET /api/v4/contests/{id}/balloons            # Globos pendientes
GET /api/v4/contests/{id}/awards              # Premios
GET /api/v4/contests/{id}/state               # Estado del concurso
```

Guardar cada respuesta como archivo JSON y colocar todos los JSON en `docs/data/cuscontest-xxv/`:

```
docs/data/cuscontest-xxv/
├── scoreboard.json
├── teams.json
├── problems.json
├── contests.json
├── organizations.json
├── groups.json
├── submissions.json
├── judgements.json
├── submissions-data.json
└── ...
```

Finalmente, agregar entrada en config.js

```javascript
{ name: "Cuscontest XXVI", year: 2027, contestUrl: null, scoreboardUrl: "./scoreboard/index.html?contest=cuscontest-xxvi", platform: "DOMjudge" },
```

### Plataformas

El campo `platform` muestra un ícono en la tarjeta. Mapeo en `docs/route.js`:

```javascript
const platformIcons = {
  "Codeforces": "./img/codeforces.png",
  "OmegaUp": "./img/omegaup.png",
  "DOMjudge": "./img/domjudge.svg",
};
```

Para nueva plataforma: agregar ícono en `docs/img/` y entrada en `platformIcons`.

### Navegación

```javascript
pages: [
  { name: "Scoreboards", url: "./index.html" },
  { name: "Eventos", url: "./events.html" },
  { name: "Dropdown", dropdown: [
    { name: "Enlace", url: "https://..." },
  ]},
],
```

## Desarrollo Local

```bash
cd docs
python3 -m http.server 3000
```

Abrir http://localhost:3000
