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

```javascript
{ name: "Cuscontest XXVI", year: 2026, url: "https://codeforces.com/gym/...", platform: "Codeforces" },
```

Para scoreboards estáticos (DOMjudge exportado), crear carpeta `docs/cuscontest-xxvi/` y usar URL relativa:

```javascript
{ name: "Cuscontest XXVI", year: 2026, url: "./cuscontest-xxvi/index.html", platform: "DOMjudge" },
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

Abrir `docs/index.html` en el navegador.
