const ScoreboardRenderer = (() => {

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

  let config = {};

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
      document.getElementById('scoreboard-container').innerHTML =
        '<p class="text-danger">Error al cargar datos.</p>';
      return;
    }

    const teamMap = {};
    teams.forEach(t => { teamMap[t.id] = t; });

    const orgMap = {};
    if (organizations) organizations.forEach(o => { orgMap[o.id] = o; });

    const contest = contests ? contests[0] : {};
    const contestName = contest.formal_name || contest.name || '';

    if (contest.start_time) {
      const match = contest.start_time.match(/T(\d{2}):(\d{2})/);
      if (match) config.contestStart = parseInt(match[1]) * 60 + parseInt(match[2]);
    }

    document.getElementById('scoreboard-container').innerHTML =
      buildHTML(scoreboard, teamMap, orgMap, problems, contestName);

    initSubmissionClicks();

    // Load and render stats if submissions + judgements available
    const [submissions, judgements] = await Promise.all([
      loadJSON(`${config.dataPath}/submissions.json`),
      loadJSON(`${config.dataPath}/judgements.json`),
    ]);

    if (submissions && judgements) {
      const statsHtml = buildStatsModal(submissions, judgements, problems, teams);
      document.getElementById('scoreboard-container').insertAdjacentHTML('beforeend', statsHtml);
      document.getElementById('stats-btn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('stats-modal'));
        modal.show();
      });
    } else {
      const btn = document.getElementById('stats-btn');
      if (btn) btn.style.display = 'none';
    }
  }

  function initSubmissionClicks() {
    document.querySelectorAll('[data-submissions-url]').forEach(linkEl => {
      linkEl.addEventListener('click', e => {
        e.preventDefault();
        const templateModal = document.querySelector('[data-submissions-modal] .modal');
        if (!templateModal) return;

        const modalEl = templateModal.cloneNode(true);
        document.body.appendChild(modalEl);

        const { teamId, problemId } = linkEl.dataset;
        const teamRow = document.querySelector(`[data-team-external-id="${teamId}"]`);
        const problemTh = document.querySelector(`[data-problem-external-id="${problemId}"]`);

        modalEl.querySelector('[data-team]').textContent =
          teamRow ? teamRow.dataset.teamName : teamId;
        if (problemTh) modalEl.querySelector('[data-problem-badge]').innerHTML =
          problemTh.dataset.problemBadge;
        modalEl.querySelector('[data-problem-name]').textContent =
          problemTh ? problemTh.dataset.problemName : '';

        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();

        modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
        modalEl.addEventListener('shown.bs.modal', () => {
          loadSubmissionData(linkEl, modalEl.querySelector('.modal-body'));
        });
      });
    });
  }

  function loadSubmissionData(linkEl, modalBody) {
    const { submissionsUrl: url, teamId, problemId } = linkEl.dataset;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const subs = data.submissions?.[`team-${teamId}`]?.[`problem-${problemId}`];
        if (!subs || subs.length === 0) {
          modalBody.innerHTML = '<div class="sub-empty">Sin envíos</div>';
          return;
        }

        let html = '<div class="sub-list">';
        for (const sub of subs) {
          const isCorrect = sub.verdict.includes('correct') && !sub.verdict.includes('incorrect');
          const isRejected = sub.verdict.includes('incorrect') || sub.verdict.includes('rejected');
          const icon = isCorrect ? 'fa-check-circle' : isRejected ? 'fa-times-circle' : 'fa-clock';
          const cls = isCorrect ? 'sub-correct' : isRejected ? 'sub-rejected' : 'sub-pending';
          const relTime = toContestTime(sub.time);

          html += `<div class="sub-item ${cls}">
            <i class="fas ${icon}"></i>
            <span class="sub-time">${relTime}</span>
            <span class="sub-lang">${sub.language}</span>
            <span class="sub-verdict">${isCorrect ? 'Accepted' : isRejected ? 'Rejected' : 'Pending'}</span>
          </div>`;
        }
        html += '</div>';
        modalBody.innerHTML = html;
      })
      .catch(() => {
        modalBody.innerHTML = '<div class="sub-empty">Sin envíos</div>';
      });
  }

  function toContestTime(timeStr) {
    if (!config.contestStart) return timeStr;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const subMinutes = h * 60 + m;
    const startMinutes = config.contestStart;
    let diff = subMinutes - startMinutes;
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }

  function buildHTML(scoreboard, teamMap, orgMap, problems, contestName) {
    let html = '';

    html += `<div class="card">
  <div class="card-header">
    <div class="row">
      <div class="col-12">
        <span style="font-weight: bold;">${escapeHtml(contestName)}</span>
        <button class="stats-btn" id="stats-btn" title="Estadísticas"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="10" width="3" height="5" rx="0.5"/><rect x="5.5" y="6" width="3" height="9" rx="0.5"/><rect x="10" y="2" width="3" height="13" rx="0.5"/></svg></button>
        <div class="legend-inline">
          <span class="legend-item"><span class="legend-dot first"></span>Resuelto primero</span>
          <span class="legend-item"><span class="legend-dot solved"></span>Resuelto</span>
          <span class="legend-item"><span class="legend-dot incorrect"></span>Incorrecto</span>
          <span class="legend-item"><span class="legend-dot pending"></span>Pendiente</span>
        </div>
      </div>
    </div>
  </div>
</div>
<br>`;

    html += `<table class="d-none d-md-table scoreboard desktop-scoreboard center">
<colgroup>
  <col id="scoremedal"/><col id="scorerank"/><col id="scoreflags"/>
  <col id="scorehearts"/><col id="scoreteamname"/>
</colgroup>
<colgroup>
  <col id="scoresolv"/><col id="scoretotal"/>
</colgroup>
<colgroup>${problems.map(() => '<col class="scoreprob"/>').join('')}</colgroup>
<thead>${buildDesktopHeader(problems)}</thead>
<tbody>${buildDesktopRows(scoreboard.rows, teamMap, problems)}${buildSummaryRow(scoreboard.rows, problems)}</tbody>
</table>`;

    html += `<table class="d-md-none scoreboard mobile-scoreboard center">
<colgroup>
  <col id="scorerankmobile"/><col id="scoreflagsmobile"/>
  <col id="scoreheartmobile"/><col id="scoreteamnamemobile"/>
</colgroup>
<colgroup><col id="scoresolvmobile"/></colgroup>
<thead>${buildMobileHeader()}</thead>
<tbody>${buildMobileRows(scoreboard.rows, teamMap, problems)}</tbody>
</table>`;

    html += buildModals(scoreboard.rows, teamMap, orgMap);

    html += `<div data-submissions-modal>
  <div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><span data-problem-badge></span> <span data-problem-name></span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-header-sub"><span data-team></span></div>
        <div class="modal-body">
          <div class="sub-loading"><div class="sub-loading-dot"></div><div class="sub-loading-dot"></div><div class="sub-loading-dot"></div></div>
        </div>
      </div>
    </div>
  </div>
</div>`;

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
      const badge = `<span class="badge problem-badge" style="background-color:${rgb};border:1px solid ${border}"><span style="color:${color}">${p.label}</span></span>`;
      html += `<th scope="col" title="problem ${escapeHtml(name)}" data-problem-external-id="${p.label}" data-problem-name="${escapeHtml(name)}" data-problem-badge='${badge}'><a target="_self">${badge}</a></th>`;
    }

    return html + '</tr>';
  }

  function buildDesktopRows(rows, teamMap, problems) {
    let html = '';
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const team = teamMap[row.team_id] || { name: row.team_id };
      const name = team.display_name || team.name || row.team_id;
      const affiliation = team.affiliation || '';
      const flagCode = getFlagCode(team.nationality);
      const cls = i === 0 ? ' class="sortorderswitch"' : '';

      html += `<tr${cls} data-team-external-id="${row.team_id}" data-team-name="${escapeHtml(name)}">`;
      html += `<td class="no-border"></td>`;
      html += `<td class="scorepl rank">${row.rank}</td>`;
      html += flagCode && config.flagsPath
        ? `<td class="scoreaf"><a><img class="countryflag" loading="lazy" src="${config.flagsPath}/${flagCode}.svg" alt="${team.nationality}" title="${getCountryName(team.nationality)}"></a></td>`
        : `<td class="scoreaf"></td>`;
      html += `<td class="scoreaf heart"></td>`;
      html += `<td class="scoretn" title="${escapeHtml(name)}">`;
      const hasModal = team.public_description || team.affiliation || (team.location && team.location.description);
      if (hasModal) {
        html += `<a href="#" data-bs-toggle="modal" data-bs-target="#team-modal-${row.team_id}"><span class="forceWidth">${escapeHtml(name)}</span>${affiliation ? `<span class="univ forceWidth">${escapeHtml(affiliation)}</span>` : ''}</a>`;
      } else {
        html += `<span class="forceWidth">${escapeHtml(name)}</span>${affiliation ? `<span class="univ forceWidth">${escapeHtml(affiliation)}</span>` : ''}`;
      }
      html += `</td>`;
      html += `<td class="scorenc">${row.score.num_solved}</td>`;
      html += `<td class="scorett">${row.score.total_time}</td>`;

      for (let j = 0; j < problems.length; j++) {
        const prob = row.problems[j];
        html += `<td class="score_cell">`;
        if (prob && prob.num_judged > 0) {
          html += `<a data-problem-id="${problems[j].label}" data-submissions-url="${config.dataPath}/submissions-data.json" data-team-id="${row.team_id}" href="#">`;
          if (prob.solved) {
            const divCls = prob.first_to_solve ? 'score_correct score_first' : 'score_correct';
            html += `<div class="${divCls}">${prob.time}<span>${prob.num_judged === 1 ? '1 try' : prob.num_judged + ' tries'}</span></div>`;
          } else {
            html += `<div class="score_incorrect">&nbsp;<span>${prob.num_judged === 1 ? '1 try' : prob.num_judged + ' tries'}</span></div>`;
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
    return `<tr class="scoreheader" data-static="1" style="font-size:75%">
<th scope="col" title="rank">rank</th>
<th colspan="3" scope="col" title="team name">team</th>
<th scope="col" title="# solved / penalty time">score</th>
</tr>`;
  }

  function buildMobileRows(rows, teamMap, problems) {
    let html = '';
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const team = teamMap[row.team_id] || { name: row.team_id };
      const name = team.display_name || team.name || row.team_id;
      const affiliation = team.affiliation || '';
      const flagCode = getFlagCode(team.nationality);
      const cls = i === 0 ? ' class="sortorderswitch"' : '';

      html += `<tr${cls} style="border-bottom-width:0;height:28px">`;
      html += `<td class="scorepl">${row.rank}</td>`;
      html += flagCode && config.flagsPath
        ? `<td class="scoreaf"><a><img class="countryflag" loading="lazy" src="${config.flagsPath}/${flagCode}.svg" alt="${team.nationality}"></a></td>`
        : `<td class="scoreaf"></td>`;
      html += `<td class="scoreaf heart"></td>`;
      html += `<td class="scoretn" title="${escapeHtml(name)}"><span class="forceWidth">${escapeHtml(name)}</span>${affiliation ? `<span class="univ forceWidth">${escapeHtml(affiliation)}</span>` : ''}</td>`;
      html += `<td class="scorenc">${row.score.num_solved}</td>`;
      html += `</tr>`;

      html += `<tr style="height:20px"><td colspan="2"></td><td colspan="3"><span class="mobile-problem-badges">`;
      for (let j = 0; j < problems.length; j++) {
        const prob = row.problems[j];
        const pDef = problems[j];
        const rgb = pDef.rgb || '#000000';
        const border = darkenColor(rgb);
        const color = textColorForBg(rgb);
        let style, txtColor;

        if (prob && prob.num_judged > 0) {
          if (prob.solved) {
            style = prob.first_to_solve ? 'background-color:#1daa1d;border:1px solid #0d6b0d' : 'background-color:#60e760;border:1px solid #30b730';
            txtColor = '#000';
          } else {
            style = 'background-color:#e87272;border:1px solid #bf0000';
            txtColor = '#000';
          }
        } else {
          style = `background-color:${rgb};border:1px solid ${border}`;
          txtColor = color;
        }
        html += `<span class="badge problem-badge" style="${style};min-width:20px;font-size:0.7em"><span style="color:${txtColor}">${pDef.label}</span></span> `;
      }
      html += `</span></td></tr>`;
    }
    return html;
  }

  function buildModals(rows, teamMap, orgMap) {
    let html = '';
    for (const row of rows) {
      const team = teamMap[row.team_id] || { name: row.team_id };
      const name = team.display_name || team.name || row.team_id;
      const desc = team.public_description || '';
      const flagCode = getFlagCode(team.nationality);
      const countryName = getCountryName(team.nationality);
      const location = team.location ? (team.location.description || '') : '';
      const org = team.organization_id ? (orgMap[team.organization_id] || null) : null;
      const affName = org ? (org.formal_name || org.name) : (team.affiliation || '');

      let members = [];
      let university = '';
      if (desc) {
        const lines = desc.replace(/\\n/g, '\n').split('\n').filter(l => l.trim());
        for (const l of lines) {
          if (l.toLowerCase().includes('universidad:')) {
            university = l.replace(/^.*universidad:\s*/i, '').trim();
          } else {
            members.push(l.replace(/^-\s*/, '').trim());
          }
        }
      }

      const membersHtml = members.length
        ? members.map(m => `<div class="tm-member"><i class="fas fa-user"></i> ${escapeHtml(m)}</div>`).join('')
        : '';

      const metaItems = [];
      if (affName) metaItems.push(`<span class="tm-tag">${escapeHtml(affName)}</span>`);
      if (team.nationality && flagCode && config.flagsPath) metaItems.push(`<span class="tm-meta-item"><img class="countryflag" src="${config.flagsPath}/${flagCode}.svg" alt=""> ${escapeHtml(countryName)}</span>`);
      if (university) metaItems.push(`<span class="tm-meta-item"><i class="fas fa-university"></i> ${escapeHtml(university)}</span>`);
      if (location) metaItems.push(`<span class="tm-meta-item"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(location)}</span>`);

      html += `<div class="modal fade" id="team-modal-${row.team_id}" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content tm-modal">
      <div class="modal-body">
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        <div class="tm-header">
          <div class="tm-name">${escapeHtml(name)}</div>
          ${metaItems.length ? `<div class="tm-meta">${metaItems.join('')}</div>` : ''}
        </div>
        ${membersHtml ? `<div class="tm-section"><div class="tm-section-title">Miembros</div><div class="tm-members">${membersHtml}</div></div>` : ''}
      </div>
    </div>
  </div>
</div>`;
    }
    return html;
  }

  function buildSummaryRow(rows, problems) {
    let totalSolved = 0;
    const stats = problems.map((p, j) => {
      let accepted = 0, rejected = 0, pending = 0, firstTime = null;
      for (const row of rows) {
        const prob = row.problems[j];
        if (!prob || prob.num_judged === 0) continue;
        if (prob.solved) {
          accepted++;
          rejected += prob.num_judged - 1;
          if (firstTime === null || prob.time < firstTime) firstTime = prob.time;
        } else {
          rejected += prob.num_judged;
        }
        pending += prob.num_pending || 0;
      }
      totalSolved += accepted;
      return { accepted, rejected, pending, firstTime };
    });

    let html = `<tr style="border-top:2px solid black">`;
    html += `<td class="scoresummary" title="Summary" colspan="5">Summary</td>`;
    html += `<td title="total solved" class="scorenc">${totalSolved}</td><td></td>`;

    for (const s of stats) {
      html += `<td style="text-align:left"><a>`;
      html += `<i class="fas fa-thumbs-up fa-fw"></i> <span class="submcorrect" style="font-size:90%" title="accepted">${s.accepted}</span><br>`;
      html += `<i class="fas fa-thumbs-down fa-fw"></i> <span class="submreject" style="font-size:90%" title="rejected">${s.rejected}</span><br>`;
      html += `<i class="fas fa-question-circle fa-fw"></i> <span class="submpend" style="font-size:90%" title="pending">${s.pending}</span><br>`;
      html += `<i class="fas fa-clock fa-fw"></i> <span style="font-size:90%" title="first solved">${s.firstTime !== null ? s.firstTime + 'min' : '-'}</span>`;
      html += `</a></td>`;
    }

    return html + `</tr>`;
  }

  function buildStatsModal(submissions, judgements, problems, teams) {
    const judgementMap = {};
    for (const j of judgements) {
      if (j.valid !== false) judgementMap[j.submission_id] = j.judgement_type_id || '';
    }

    const visibleTeams = new Set(teams.filter(t => !t.hidden).map(t => t.id));
    const idToLabel = {};
    for (const p of problems) idToLabel[p.id] = p.label;

    const byVerdict = {};
    const byLanguage = {};
    const byProblemTotal = {};
    const byProblemAccepted = {};
    const byInterval = {};
    const teamsWithAc = new Set();
    let total = 0;

    for (const sub of submissions) {
      const verdict = judgementMap[sub.id];
      if (!verdict || !visibleTeams.has(sub.team_id)) continue;
      const label = idToLabel[sub.problem_id];
      if (!label) continue;

      total++;
      byVerdict[verdict] = (byVerdict[verdict] || 0) + 1;
      byLanguage[sub.language_id] = (byLanguage[sub.language_id] || 0) + 1;
      byProblemTotal[label] = (byProblemTotal[label] || 0) + 1;

      if (verdict === 'AC') {
        byProblemAccepted[label] = (byProblemAccepted[label] || 0) + 1;
        teamsWithAc.add(sub.team_id);
      }

      try {
        const parts = (sub.contest_time || '0:00:00').split(':');
        const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        const interval = Math.floor(minutes / 10) * 10;
        byInterval[interval] = (byInterval[interval] || 0) + 1;
      } catch (e) {}
    }

    const problemLabels = problems.map(p => p.label);
    const totalTeams = visibleTeams.size;
    const accepted = byVerdict['AC'] || 0;

    // Find easiest (most teams solved) / hardest (most attempts without solving, or lowest solves with most attempts)
    let easiest = null, hardest = null;
    let maxAc = -1;
    for (const l of problemLabels) {
      const a = byProblemAccepted[l] || 0;
      if (a > maxAc) { maxAc = a; easiest = l; }
    }
    // Hardest: among attempted problems, sort by fewest accepts then most attempts
    let hardestScore = null;
    for (const l of problemLabels) {
      const t = byProblemTotal[l] || 0;
      const a = byProblemAccepted[l] || 0;
      if (t === 0) continue;
      const score = a * 10000 - t; // lower accepts wins, then more attempts wins
      if (hardestScore === null || score < hardestScore) { hardestScore = score; hardest = l; }
    }

    // First solvers per problem
    const firstSolvers = {};
    for (const sub of submissions) {
      const verdict = judgementMap[sub.id];
      if (verdict !== 'AC' || !visibleTeams.has(sub.team_id)) continue;
      const label = idToLabel[sub.problem_id];
      if (!label) continue;
      const parts = (sub.contest_time || '0:00:00').split(':');
      const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      if (!firstSolvers[label] || minutes < firstSolvers[label].time) {
        const team = teams.find(t => t.id === sub.team_id) || {};
        firstSolvers[label] = { time: minutes, team: team.display_name || team.name || sub.team_id };
      }
    }

    // Build timeline chart (CSS bars)
    const intervals = Object.keys(byInterval).map(Number).sort((a, b) => a - b);
    const maxInterval = Math.max(...Object.values(byInterval), 1);

    let timelineHtml = '<div class="stats-chart"><div class="stats-chart-title">Envíos durante el concurso</div><div class="stats-timeline">';
    for (const t of intervals) {
      const pct = (byInterval[t] / maxInterval) * 100;
      const label = `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
      timelineHtml += `<div class="tl-bar" style="height:${pct}%" title="${label} — ${byInterval[t]} submissions"></div>`;
    }
    timelineHtml += '</div><div class="stats-timeline-labels">';
    for (const t of intervals) {
      if (t % 60 === 0) timelineHtml += `<span>${Math.floor(t / 60)}h</span>`;
    }
    timelineHtml += '</div></div>';

    // Veredictos chart
    const verdictLabels = { AC: 'Accepted', WA: 'Wrong Answer', TLE: 'Time Limit', RE: 'Runtime Error', CE: 'Compile Error', MLE: 'Memory Limit' };
    const verdictColors = { AC: '#4ade80', WA: '#f87171', TLE: '#fbbf24', RE: '#a78bfa', CE: '#fb923c', MLE: '#38bdf8' };
    const sortedVeredictos = Object.entries(byVerdict).sort((a, b) => b[1] - a[1]);

    let verdictsHtml = '<div class="stats-chart"><div class="stats-chart-title">Veredictos</div><div class="stats-bars">';
    for (const [v, count] of sortedVeredictos) {
      const pct = (count / total) * 100;
      const color = verdictColors[v] || '#94a3b8';
      const name = verdictLabels[v] || v;
      verdictsHtml += `<div class="stats-bar-row"><span class="stats-bar-label">${name}</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="stats-bar-value">${count}</span></div>`;
    }
    verdictsHtml += '</div></div>';

    // Lenguajes chart
    const sortedLangs = Object.entries(byLanguage).sort((a, b) => b[1] - a[1]);
    const langColors = { cpp: '#60a5fa', python3: '#fbbf24', java: '#f87171', c: '#34d399', kotlin: '#a78bfa' };

    let langsHtml = '<div class="stats-chart"><div class="stats-chart-title">Lenguajes</div><div class="stats-bars">';
    for (const [lang, count] of sortedLangs) {
      const pct = (count / total) * 100;
      const color = langColors[lang] || '#94a3b8';
      langsHtml += `<div class="stats-bar-row"><span class="stats-bar-label">${lang}</span><div class="stats-bar-track"><div class="stats-bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="stats-bar-value">${count}</span></div>`;
    }
    langsHtml += '</div></div>';

    // Problemas chart
    let problemsHtml = '<div class="stats-chart"><div class="stats-chart-title">Problemas</div><div class="stats-problems">';
    for (const l of problemLabels) {
      const t = byProblemTotal[l] || 0;
      const a = byProblemAccepted[l] || 0;
      const pctA = t > 0 ? (a / t) * 100 : 0;
      const pctR = t > 0 ? ((t - a) / t) * 100 : 0;
      const rateText = t > 0 ? `${Math.round(pctA)}%` : '-';
      problemsHtml += `<div class="stats-prob-col"><div class="stats-prob-bar"><div class="stats-prob-accepted" style="height:${pctA}%" title="${a} accepted"></div><div class="stats-prob-rejected" style="height:${pctR}%" title="${t - a} rejected"></div></div><div class="stats-prob-label">${l}</div><div class="stats-prob-rate">${rateText}</div></div>`;
    }
    problemsHtml += '</div>';
    const unsolved = problemLabels.filter(l => (byProblemAccepted[l] || 0) === 0 && (byProblemTotal[l] || 0) > 0);
    const untried = problemLabels.filter(l => (byProblemTotal[l] || 0) === 0);
    if (unsolved.length || untried.length) {
      problemsHtml += '<div class="stats-unsolved">';
      if (unsolved.length) problemsHtml += `<span class="stats-unsolved-item stats-hard">Sin resolver: ${unsolved.join(', ')}</span>`;
      if (untried.length) problemsHtml += `<span class="stats-unsolved-item">Sin intentar: ${untried.join(', ')}</span>`;
      problemsHtml += '</div>';
    }
    problemsHtml += '</div>';

    // Dashboard numbers
    let dashHtml = `<div class="stats-dashboard">
      <div class="stats-num"><div class="stats-num-value">${totalTeams}</div><div class="stats-num-label">Equipos</div></div>
      <div class="stats-num"><div class="stats-num-value">${total}</div><div class="stats-num-label">Envíos</div></div>
      <div class="stats-num"><div class="stats-num-value">${accepted}</div><div class="stats-num-label">Aceptados</div></div>
      <div class="stats-num"><div class="stats-num-value">${teamsWithAc.size}</div><div class="stats-num-label">Equipos con AC</div></div>
      ${easiest ? `<div class="stats-num"><div class="stats-num-value stats-easy">${easiest}</div><div class="stats-num-label">Más fácil</div></div>` : ''}
      ${hardest ? `<div class="stats-num"><div class="stats-num-value stats-hard">${hardest}</div><div class="stats-num-label">Más difícil</div></div>` : ''}
    </div>`;

    // First solvers table
    let firstSolversHtml = '';
    const solvedProblemas = problemLabels.filter(l => firstSolvers[l]).sort((a, b) => firstSolvers[a].time - firstSolvers[b].time);
    if (solvedProblemas.length > 0) {
      firstSolversHtml = '<div class="stats-chart"><div class="stats-chart-title">Primero en resolver</div><div class="stats-first-solvers">';
      for (const l of solvedProblemas) {
        const fs = firstSolvers[l];
        const h = Math.floor(fs.time / 60);
        const m = fs.time % 60;
        const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
        firstSolversHtml += `<div class="fs-row"><span class="fs-problem">${l}</span><span class="fs-team">${escapeHtml(fs.team)}</span><span class="fs-time">${timeStr}</span></div>`;
      }
      firstSolversHtml += '</div></div>';
    }

    return `<div class="modal fade" id="stats-modal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"><i class="fas fa-chart-bar"></i> Estadísticas del concurso</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body stats-body">
        ${dashHtml}
        ${timelineHtml}
        ${firstSolversHtml}
        ${problemsHtml}
        ${verdictsHtml}
        ${langsHtml}
      </div>
    </div>
  </div>
</div>`;
  }

  return { init };
})();
