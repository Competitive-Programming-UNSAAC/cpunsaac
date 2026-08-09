/**
 * DOMjudge Scoreboard Renderer
 * Generates HTML identical to DOMjudge's static scoreboard export from ICPC Contest API JSON.
 *
 * Usage:
 *   ScoreboardRenderer.init({ dataPath: '../data/cuscontest-xxv', flagsPath: '../scoreboard/flags/4x3' });
 */
const ScoreboardRenderer = (() => {

  // ISO 3166-1 alpha-3 to alpha-2 mapping (common countries in ICPC)
  const COUNTRY_MAP = {
    'PER': 'pe', 'COL': 'co', 'BRA': 'br', 'ARG': 'ar', 'CHL': 'cl',
    'MEX': 'mx', 'ECU': 'ec', 'BOL': 'bo', 'URY': 'uy', 'PRY': 'py',
    'VEN': 've', 'CRI': 'cr', 'PAN': 'pa', 'GTM': 'gt', 'HND': 'hn',
    'SLV': 'sv', 'NIC': 'ni', 'DOM': 'do', 'CUB': 'cu', 'USA': 'us',
    'CAN': 'ca', 'ESP': 'es', 'FRA': 'fr', 'DEU': 'de', 'GBR': 'gb',
    'ITA': 'it', 'PRT': 'pt', 'NLD': 'nl', 'JPN': 'jp', 'CHN': 'cn',
    'KOR': 'kr', 'IND': 'in', 'RUS': 'ru', 'AUS': 'au',
  };

  const COUNTRY_NAMES = {
    'PER': 'Peru', 'COL': 'Colombia', 'BRA': 'Brazil', 'ARG': 'Argentina',
    'CHL': 'Chile', 'MEX': 'Mexico', 'ECU': 'Ecuador', 'BOL': 'Bolivia',
    'URY': 'Uruguay', 'PRY': 'Paraguay', 'VEN': 'Venezuela', 'USA': 'United States',
    'NLD': 'Netherlands',
  };

  let config = {
    dataPath: '../data/cuscontest-xxv',
    flagsPath: '../scoreboard/flags/4x3',
  };

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) return null;
    return res.json();
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function darkenColor(hex) {
    if (!hex || hex.length < 7) return '#000000';
    const r = Math.floor(parseInt(hex.slice(1, 3), 16) * 0.75);
    const g = Math.floor(parseInt(hex.slice(3, 5), 16) * 0.75);
    const b = Math.floor(parseInt(hex.slice(5, 7), 16) * 0.75);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  }

  function textColorForBg(hex) {
    if (!hex || hex.length < 7) return '#ffffff';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff';
  }

  function getFlagCode(nationality) {
    if (!nationality) return null;
    return COUNTRY_MAP[nationality.toUpperCase()] || nationality.toLowerCase().slice(0, 2);
  }

  function getCountryName(nationality) {
    if (!nationality) return '';
    return COUNTRY_NAMES[nationality.toUpperCase()] || nationality;
  }

  async function init(opts = {}) {
    Object.assign(config, opts);

    const [scoreboard, teams, problems, contests, organizations] = await Promise.all([
      loadJSON(`${config.dataPath}/scoreboard.json`),
      loadJSON(`${config.dataPath}/teams.json`),
      loadJSON(`${config.dataPath}/problems.json`),
      loadJSON(`${config.dataPath}/contests.json`),
      loadJSON(`${config.dataPath}/organizations.json`),
    ]);

    if (!scoreboard || !teams || !problems) {
      document.getElementById('scoreboard-container').innerHTML = '<p class="text-danger">Error loading scoreboard data.</p>';
      return;
    }

    const teamMap = {};
    teams.forEach(t => { teamMap[t.id] = t; });

    const orgMap = {};
    if (organizations) {
      organizations.forEach(o => { orgMap[o.id] = o; });
    }

    const contest = contests ? contests[0] : {};
    const contestName = contest.formal_name || contest.name || '';

    const container = document.getElementById('scoreboard-container');
    container.innerHTML = buildHTML(scoreboard, teamMap, orgMap, problems, contestName);

    // Initialize submission detail clicks (Bootstrap 5 compatible)
    initSubmissionClicks();
  }

  function initSubmissionClicks() {
    document.querySelectorAll('[data-submissions-url]').forEach(function(linkEl) {
      linkEl.addEventListener('click', function(e) {
        e.preventDefault();
        const templateModal = document.querySelector('[data-submissions-modal] .modal');
        if (!templateModal) return;

        const modalEl = templateModal.cloneNode(true);
        document.body.appendChild(modalEl);

        const teamId = linkEl.dataset.teamId;
        const problemId = linkEl.dataset.problemId;
        const teamRow = document.querySelector(`[data-team-external-id="${teamId}"]`);
        const problemTh = document.querySelector(`[data-problem-external-id="${problemId}"]`);

        const teamName = teamRow ? teamRow.dataset.teamName : teamId;
        const problemBadge = problemTh ? problemTh.dataset.problemBadge : problemId;
        const problemName = problemTh ? problemTh.dataset.problemName : '';

        modalEl.querySelector('[data-team]').textContent = teamName;
        if (problemBadge) modalEl.querySelector('[data-problem-badge]').innerHTML = problemBadge;
        modalEl.querySelector('[data-problem-name]').textContent = problemName;

        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();

        modalEl.addEventListener('hidden.bs.modal', function() {
          modalEl.remove();
        });

        modalEl.addEventListener('shown.bs.modal', function() {
          const modalBody = modalEl.querySelector('.modal-body');
          loadSubmissionData(linkEl, modalBody);
        });
      });
    });
  }

  function loadSubmissionData(linkEl, modalBody) {
    const url = linkEl.dataset.submissionsUrl;
    const teamId = linkEl.dataset.teamId;
    const problemId = linkEl.dataset.problemId;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const teamKey = `team-${teamId}`;
        const problemKey = `problem-${problemId}`;
        if (!data.submissions || !data.submissions[teamKey] || !data.submissions[teamKey][problemKey]) {
          modalBody.innerHTML = '<div class="alert alert-warning">No submissions</div>';
          return;
        }

        const submissions = data.submissions[teamKey][problemKey];
        if (submissions.length === 0) {
          modalBody.innerHTML = '<div class="alert alert-warning">No submissions</div>';
          return;
        }

        let tableHtml = `<table class="data-table table table-hover table-striped table-sm submissions-table">
          <thead class="thead-light"><tr><th scope="col">time</th><th scope="col">language</th><th scope="col">result</th></tr></thead><tbody>`;
        for (const sub of submissions) {
          tableHtml += `<tr><td>${sub.time}</td><td class="langid">${sub.language}</td><td>${sub.verdict}</td></tr>`;
        }
        tableHtml += '</tbody></table>';

        modalBody.innerHTML = tableHtml;
      })
      .catch(() => {
        modalBody.innerHTML = '<div class="alert alert-warning">No submissions</div>';
      });
  }

  function buildHTML(scoreboard, teamMap, orgMap, problems, contestName) {
    let html = '';

    // Card header
    html += `<div class="card" data-ajax-refresh-stop="1">
  <div class="card-header" style="font-family: Roboto, sans-serif;">
    <div class="row">
      <div class="col-md-6 col-12"><span style="font-weight: bold;">${escapeHtml(contestName)}</span></div>
      <div class="col-md-6 col-12 text-md-end text-start"><span id="contesttimer">final standings</span></div>
    </div>
  </div>
</div>
<br>`;

    // Desktop table
    html += `<table class="d-none d-md-table scoreboard desktop-scoreboard center">
<colgroup>
  <col id="scoremedal"/>
  <col id="scorerank"/>
  <col id="scoreflags"/>
  <col id="scorehearts"/>
  <col id="scoreteamname"/>
</colgroup>
<colgroup>
  <col id="scoresolv"/>
  <col id="scoretotal"/>
</colgroup>
<colgroup>
  ${problems.map(() => '<col class="scoreprob"/>').join('\n  ')}
</colgroup>
<thead>${buildDesktopHeader(problems)}</thead>
<tbody>${buildDesktopRows(scoreboard.rows, teamMap, problems)}
${buildSummaryRow(scoreboard.rows, problems)}</tbody>
</table>`;

    // Mobile table
    html += `<table class="d-md-none scoreboard mobile-scoreboard center">
<colgroup>
  <col id="scorerankmobile"/>
  <col id="scoreflagsmobile"/>
  <col id="scoreheartmobile"/>
  <col id="scoreteamnamemobile"/>
</colgroup>
<colgroup>
  <col id="scoresolvmobile"/>
</colgroup>
<thead>${buildMobileHeader()}</thead>
<tbody>${buildMobileRows(scoreboard.rows, teamMap, problems)}</tbody>
</table>`;

    // Team modals
    html += buildModals(scoreboard.rows, teamMap, orgMap);

    // Legend
    html += `<br>
<table class="d-none d-md-table scoreboard scorelegend" id="cell_legend">
<thead><tr><th scope="col">Cell colours</th></tr></thead>
<tbody>
<tr class="score_correct score_first"><td>Solved first</td></tr>
<tr class="score_correct"><td>Solved</td></tr>
<tr class="score_incorrect"><td>Tried, incorrect</td></tr>
<tr class="score_pending"><td>Tried, pending</td></tr>
<tr class="score_neutral"><td>Untried</td></tr>
</tbody>
</table>`;

    // Submissions modal template
    html += `
<div data-submissions-modal>
  <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Submissions for team <span data-team></span> on problem <span data-problem-badge></span> <span data-problem-name></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</div>

<script type="text/template" id="empty-submission-list">
  <div class="alert alert-warning">No submissions</div>
</script>

<script type="text/template" id="submission-list">
  <table class="data-table table table-hover table-striped table-sm submissions-table">
    <thead class="thead-light">
      <tr><th scope="col">time</th><th scope="col">language</th><th scope="col">result</th></tr>
    </thead>
    <tbody data-submission-list></tbody>
  </table>
</script>

<script type="text/template" id="submission-list-item">
  <tr><td data-time></td><td class="langid" data-language-id></td><td data-verdict></td></tr>
</script>`;

    return html;
  }

  function buildDesktopHeader(problems) {
    let html = `<tr class="scoreheader" data-static="1">
<th colspan="2" scope="col" title="rank">rank</th>
<th colspan="3" scope="col" title="team name">team</th>
<th colspan="2" scope="col" title="# solved / penalty time">score</th>`;

    for (const p of problems) {
      const rgb = p.rgb || '#000000';
      const border = darkenColor(rgb);
      const color = textColorForBg(rgb);
      const name = p.name || `Problem ${p.label}`;
      const badgeHtml = `<span class="badge problem-badge" style="background-color: ${rgb}; border: 1px solid ${border}"><span style="color: ${color};">${p.label}</span></span>`;
      html += `
<th scope="col" title="problem ${escapeHtml(name)}" data-problem-external-id="${p.label}" data-problem-name="${escapeHtml(name)}" data-problem-badge='${badgeHtml}'>
  <a target="_self">${badgeHtml}</a>
</th>`;
    }

    html += '</tr>';
    return html;
  }

  function buildDesktopRows(rows, teamMap, problems) {
    let html = '';
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const team = teamMap[row.team_id] || { name: row.team_id };
      const name = team.display_name || team.name || row.team_id;
      const affiliation = team.affiliation || '';
      const nationality = team.nationality || '';
      const flagCode = getFlagCode(nationality);
      const cls = i === 0 ? ' class="sortorderswitch"' : '';

      html += `<tr${cls} data-team-external-id="${row.team_id}" data-team-name="${escapeHtml(name)}">`;
      html += `<td class="no-border"></td>`;
      html += `<td class="scorepl rank">${row.rank}</td>`;

      // Flag
      if (flagCode && config.flagsPath) {
        html += `<td class="scoreaf cl_FFFFFF"><a><img class="countryflag" loading="lazy" src="${config.flagsPath}/${flagCode}.svg" alt="${nationality}" title="${getCountryName(nationality)}"></a></td>`;
      } else {
        html += `<td class="scoreaf cl_FFFFFF"></td>`;
      }

      // Heart
      html += `<td class="scoreaf heart cl_FFFFFF"></td>`;

      // Team name
      html += `<td class="scoretn cl_FFFFFF" title="${escapeHtml(name)}">`;
      html += `<a href="#" data-bs-toggle="modal" data-bs-target="#team-modal-${row.team_id}">`;
      html += `<span class="forceWidth">${escapeHtml(name)}</span>`;
      if (affiliation) {
        html += `<span class="univ forceWidth">${escapeHtml(affiliation)}</span>`;
      }
      html += `</a></td>`;

      // Score
      html += `<td class="scorenc">${row.score.num_solved}</td>`;
      html += `<td class="scorett">${row.score.total_time}</td>`;

      // Problems
      for (let j = 0; j < problems.length; j++) {
        const prob = row.problems[j];
        html += `<td class="score_cell">`;
        if (prob && prob.num_judged > 0) {
          html += `<a data-problem-id="${problems[j].label}" data-submissions-url="${config.dataPath}/submissions-data.json" data-team-id="${row.team_id}" href="#">`;
          if (prob.solved) {
            const divCls = prob.first_to_solve ? 'score_correct score_first' : 'score_correct';
            const tries = prob.num_judged === 1 ? '1 try' : `${prob.num_judged} tries`;
            html += `<div class="${divCls}">${prob.time}<span>${tries}</span></div>`;
          } else {
            const tries = prob.num_judged === 1 ? '1 try' : `${prob.num_judged} tries`;
            html += `<div class="score_incorrect">&nbsp;<span>${tries}</span></div>`;
          }
          html += `</a>`;
        }
        html += `</td>`;
      }

      html += `</tr>`;
    }
    return html;
  }

  function buildMobileHeader() {
    return `<tr class="scoreheader" data-static="1" style="font-size: 75%;">
<th scope="col" title="rank">rank</th>
<th colspan="3" scope="col" title="team name">team</th>
<th colspan="1" scope="col" title="# solved / penalty time">score</th>
</tr>`;
  }

  function buildMobileRows(rows, teamMap, problems) {
    let html = '';
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const team = teamMap[row.team_id] || { name: row.team_id };
      const name = team.display_name || team.name || row.team_id;
      const affiliation = team.affiliation || '';
      const nationality = team.nationality || '';
      const flagCode = getFlagCode(nationality);
      const cls = i === 0 ? ' class="sortorderswitch"' : '';

      // Row 1: rank, flag, name, score
      html += `<tr${cls} style="border-bottom-width: 0; height: 28px;">`;
      html += `<td class="scorepl">${row.rank}</td>`;

      if (flagCode && config.flagsPath) {
        html += `<td class="scoreaf cl_FFFFFF"><a><img class="countryflag" loading="lazy" src="${config.flagsPath}/${flagCode}.svg" alt="${nationality}"></a></td>`;
      } else {
        html += `<td class="scoreaf cl_FFFFFF"></td>`;
      }

      html += `<td class="scoreaf heart cl_FFFFFF"></td>`;
      html += `<td class="scoretn cl_FFFFFF" title="${escapeHtml(name)}">`;
      html += `<span class="forceWidth">${escapeHtml(name)}</span>`;
      if (affiliation) {
        html += `<span class="univ forceWidth">${escapeHtml(affiliation)}</span>`;
      }
      html += `</td>`;
      html += `<td class="scorenc">${row.score.num_solved}</td>`;
      html += `</tr>`;

      // Row 2: problem badges
      html += `<tr style="height: 20px;">`;
      html += `<td colspan="2"></td>`;
      html += `<td colspan="3"><span class="mobile-problem-badges">`;
      for (let j = 0; j < problems.length; j++) {
        const prob = row.problems[j];
        const pDef = problems[j];
        const rgb = pDef.rgb || '#000000';
        const border = darkenColor(rgb);
        const color = textColorForBg(rgb);

        let bgStyle = `background-color: ${rgb}; border: 1px solid ${border}`;
        let txtColor = color;
        if (prob && prob.num_judged > 0) {
          if (prob.solved) {
            bgStyle = prob.first_to_solve
              ? 'background-color: #1daa1d; border: 1px solid #0d6b0d'
              : 'background-color: #60e760; border: 1px solid #30b730';
            txtColor = '#000000';
          } else {
            bgStyle = 'background-color: #e87272; border: 1px solid #bf0000';
            txtColor = '#000000';
          }
        }

        html += `<span class="badge problem-badge" style="${bgStyle}; min-width: 20px; font-size: 0.7em;"><span style="color: ${txtColor};">${pDef.label}</span></span> `;
      }
      html += `</span></td>`;
      html += `</tr>`;
    }
    return html;
  }

  function buildModals(rows, teamMap, orgMap) {
    let html = '';
    for (const row of rows) {
      const team = teamMap[row.team_id] || { name: row.team_id };
      const name = team.display_name || team.name || row.team_id;
      const desc = team.public_description || '';
      const nationality = team.nationality || '';
      const flagCode = getFlagCode(nationality);
      const countryName = getCountryName(nationality);
      const location = team.location ? (team.location.description || '') : '';
      const org = team.organization_id ? (orgMap[team.organization_id] || null) : null;
      const affName = org ? (org.formal_name || org.name) : (team.affiliation || '');

      html += `<div class="modal fade" id="team-modal-${row.team_id}" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">${escapeHtml(name)}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="row">
          <div class="col-lg-6">
            <table class="table table-sm table-striped">
              <tr><th>Name</th><td>${escapeHtml(name)}</td></tr>
              <tr><th>Category</th><td>Participantes</td></tr>`;

      if (desc) {
        html += `
              <tr><th>Description</th><td>${escapeHtml(desc).replace(/\\n/g, '<br>').replace(/\n/g, '<br>')}</td></tr>`;
      }

      if (affName) {
        html += `
              <tr><th>Affiliation</th><td>${escapeHtml(affName)}</td></tr>`;
      }

      if (nationality) {
        html += `
              <tr><th>Country</th><td>${flagCode && config.flagsPath ? `<img class="countryflag" src="${config.flagsPath}/${flagCode}.svg" alt=""> ` : ''}${escapeHtml(countryName)}</td></tr>`;
      }

      if (location) {
        html += `
              <tr><th>Location</th><td>${escapeHtml(location)}</td></tr>`;
      }

      html += `
            </table>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>`;
    }
    return html;
  }

  function buildSummaryRow(rows, problems) {
    // Compute per-problem stats
    let totalSolved = 0;
    const probStats = problems.map((p, j) => {
      let accepted = 0;
      let rejected = 0;
      let pending = 0;
      let firstSolveTime = null;

      for (const row of rows) {
        const prob = row.problems[j];
        if (!prob || prob.num_judged === 0) continue;

        if (prob.solved) {
          accepted++;
          rejected += prob.num_judged - 1;
          if (firstSolveTime === null || prob.time < firstSolveTime) {
            firstSolveTime = prob.time;
          }
        } else {
          rejected += prob.num_judged;
        }
        pending += prob.num_pending || 0;
      }

      totalSolved += accepted;
      return { accepted, rejected, pending, firstSolveTime };
    });

    let html = `<tr style="border-top: 2px solid black;">`;
    html += `<td class="scoresummary" title="Summary" colspan="5">Summary</td>`;
    html += `<td title="total solved" class="scorenc">${totalSolved}</td>`;
    html += `<td></td>`;

    for (const stat of probStats) {
      html += `<td style="text-align: left;"><a>`;
      html += `<i class="fas fa-thumbs-up fa-fw"></i> <span class="submcorrect" style="font-size:90%;" title="number of accepted submissions">${stat.accepted}</span><br/>`;
      html += `<i class="fas fa-thumbs-down fa-fw"></i> <span class="submreject" style="font-size:90%;" title="number of rejected submissions">${stat.rejected}</span><br/>`;
      html += `<i class="fas fa-question-circle fa-fw"></i> <span class="submpend" style="font-size:90%;" title="number of pending submissions">${stat.pending}</span><br/>`;
      html += `<i class="fas fa-clock fa-fw"></i> <span style="font-size:90%;" title="first solved">${stat.firstSolveTime !== null ? stat.firstSolveTime + 'min' : '-'}</span>`;
      html += `</a></td>`;
    }

    html += `</tr>`;
    return html;
  }

  return { init };
})();
