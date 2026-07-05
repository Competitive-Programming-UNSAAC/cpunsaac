const siteConfig = {
  org: {
    name: "Competitive Programming UNSAAC",
    logo: "./img/logo.png",
    url: "./index.html",
  },

  pages: [
    { name: "Cuscontest", url: "./index.html" },
    { name: "Eventos", url: "./events.html" },
    { name: "Training Camps", dropdown: [
      { name: "ICPC Latam Training", url: "https://www.icpclatam.org/training" },
      { name: "TC Medellín", url: "https://www.tcmedellin.com/" },
      { name: "TC Argentina", url: "https://www.pc-arg.com/tc-arg" },
      { name: "TC Mexico", url: "https://tcmx2025.icpcmexico.org/" },
      { name: "TC Caribbean", url: "https://campcarib.wordpress.com/" },
      { name: "Maratona SBC de Programação", url: "https://maratona.sbc.org.br/" },
    ]},
  ],

  social: [
    { name: "GitHub", url: "https://github.com/Competitive-Programming-UNSAAC", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>' },
    { name: "LinkedIn", url: "https://www.linkedin.com/company/cp-unsaac", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
    { name: "Codeforces", url: "https://codeforces.com/group/r26zpBFoQS/contests", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 7.5A1.5 1.5 0 016 9v10.5a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 010 19.5V9a1.5 1.5 0 011.5-1.5h3zm9-4.5A1.5 1.5 0 0115 4.5v15a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 19.5v-15A1.5 1.5 0 0110.5 3h3zm9 7.5A1.5 1.5 0 0124 12v7.5a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5h3z"/></svg>' },
    { name: "Virtual Judge", url: "https://vjudge.net/group/cp-unsaac", icon: '<span class="social-text">VJ</span>' },
    { name: "Wiki", url: "https://github.com/Competitive-Programming-UNSAAC/cuscontest-scoreboard/wiki", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 4H3a1 1 0 00-1 1v14a1 1 0 001 1h18a1 1 0 001-1V5a1 1 0 00-1-1zM4 18V6h7v12H4zm9 0V6h7v12h-7zM6 8h3v1.5H6V8zm0 3h3v1.5H6V11zm0 3h3v1.5H6V14zm8-6h3v1.5h-3V8zm0 3h3v1.5h-3V11zm0 3h3v1.5h-3V14z"/></svg>' },
  ],

  contests: [
    { name: "Cuscontest XVII",  year: 2019, contestUrl: "https://codeforces.com/gym/365620", scoreboardUrl: "https://codeforces.com/gym/365620/standings", platform: "Codeforces" },
    { name: "Cuscontest XIX",   year: 2021, contestUrl: null, scoreboardUrl: "https://wozmit.github.io/ccxix/scoreboard", platform: "DOMjudge" },
    { name: "Cuscontest XX",    year: 2022, contestUrl: "https://omegaup.com/arena/cuscontest-xx/", scoreboardUrl: "https://omegaup.com/arena/cuscontest-xx/scoreboard/xabGNtJRMdX7JkMfNqvHCZe2rsfHVH", platform: "OmegaUp" },
    { name: "Cuscontest XXI",   year: 2023, contestUrl: "https://codeforces.com/group/gHgjxYvnJD/contest/541090", scoreboardUrl: "./cuscontest-xxi/index.html", platform: "DOMjudge" },
    { name: "Cuscontest XXII",  year: 2023, contestUrl: "http://codeforces.com/group/gHgjxYvnJD/contest/616018", scoreboardUrl: "./cuscontest-xxii/index.html", platform: "DOMjudge" },
    { name: "Cuscontest XXIII", year: 2024, contestUrl: "https://codeforces.com/group/gHgjxYvnJD/contest/646498", scoreboardUrl: "./cuscontest-xxiii/index.html", platform: "DOMjudge" },
    { name: "Cuscontest XXIV",  year: 2025, contestUrl: null, scoreboardUrl: "./cuscontest-xxiv/index.html", platform: "DOMjudge" },
  ],

  scoreboardGrid: {
    columns: 3,
    slideshowInterval: 6000,
    maxEvents: 6,
  },

  events: [
    { name: "Training Camp Medellín 2026", url: "https://tcmedellin.com/", logo: "tcmedellin.png", startDate: "2026-06-29T09:00:00-05:00", endDate: "2026-07-10T18:00:00-05:00" },
    { name: "Training Camp Mexico 2026", url: "https://icpc.global/regionals/finder/TCMX-2027", logo: "tcmexico.png", startDate: "2026-08-08T09:00:00-05:00", endDate: "2026-08-12T18:00:00-05:00" },
    { name: "Training Camp UCSP 2026", url: "https://dc.ucsp.edu.pe/eventos/2do-training-camp-ucsp/", logo: "ucsp.png", startDate: "2026-07-13T09:00:00-05:00", endDate: "2026-07-17T18:00:00-05:00" },
    { name: "Training Camp Argentina 2026", url: "https://aapc.org.ar/tc/", logo: "tcarg.png", startDate: "2026-07-20T09:00:00-05:00", endDate: "2026-07-31T18:00:00-05:00" },
    { name: "Cuscontest XXV", url: "https://www.facebook.com/ACMUNSAAC", logo: "logo.png", startDate: "2026-08-07T09:00:00-05:00", endDate: "2026-08-07T14:00:00-05:00" },
    { name: "IEEEXtreme 20.0", url: "https://ieeextreme.org/", logo: "ieeextreme.png", startDate: "2026-10-31T00:00:00-05:00", endDate: "2026-11-01T00:00:00-05:00" },
    { name: "ICPC Latin America Regional 2026", url: "https://icpclatam.org/", logo: "icpc.png", startDate: "2026-11-07T09:00:00-05:00", endDate: "2026-11-07T14:00:00-05:00" },
    { name: "ICPC World Finals 2026", url: "https://icpc.global/", logo: "icpc.png", startDate: "2026-11-15T09:00:00-05:00", endDate: "2026-11-20T18:00:00-05:00" },
    { name: "ICPC Latin America Championship 2027", url: "https://icpclatam.org/", logo: "icpc.png", startDate: "2027-03-01T09:00:00-05:00", endDate: "2027-03-08T18:00:00-05:00" },
  ],

  images: [
    "./img/imagen1.webp",
    "./img/imagen2.webp",
    "./img/imagen3.webp",
    "./img/imagen4.webp",
  ],
};
