const platformIcons = {
  "Codeforces": "./img/codeforces.png",
  "OmegaUp": "./img/omegaup.png",
  "DOMjudge": "./img/domjudge.svg",
};

const grid = document.getElementById('contest-list');

const contests = [...siteConfig.contests].reverse();

contests.forEach((contest, i) => {
  const div = document.createElement('div');
  div.className = 'contest-card';
  if (i === 0) div.classList.add('latest');

  if (contest.scoreboardUrl) {
    div.style.cursor = 'pointer';
    div.setAttribute('role', 'link');
    div.setAttribute('aria-label', `Ver scoreboard de ${contest.name}`);
    div.addEventListener('click', (e) => {
      if (e.target.closest('.card-link')) return;
      const isExternal = contest.scoreboardUrl.startsWith('http');
      if (isExternal) {
        window.open(contest.scoreboardUrl, '_blank');
      } else {
        window.location.href = contest.scoreboardUrl;
      }
    });
  }

  const icon = platformIcons[contest.platform] || '';
  const roman = contest.name.replace('Cuscontest ', '');

  let links = '';
  if (contest.contestUrl) {
    links += `<a href="${contest.contestUrl}" target="_blank" rel="noopener noreferrer" class="card-link">Contest</a>`;
  }
  if (contest.scoreboardUrl) {
    const isExternal = contest.scoreboardUrl.startsWith('http');
    links += `<a href="${contest.scoreboardUrl}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''} class="card-link">Scoreboard</a>`;
  }

  div.innerHTML = `
    ${i === 0 ? '<span class="latest-badge">Nuevo</span>' : ''}
    <div class="card-top">
      <div class="edition-block">
        <span class="edition-roman">${roman}</span>
        <span class="edition-year">${contest.year}</span>
      </div>
      ${icon ? `<img src="${icon}" alt="${contest.platform}" class="platform-icon-lg">` : ''}
      <span class="card-platform-name">${contest.platform}</span>
    </div>
    <div class="card-links">${links}</div>
  `;

  grid.appendChild(div);
});

const bg = document.getElementById('bg-slideshow');
let currentIndex = 0;

siteConfig.images.forEach(src => { new Image().src = src; });
bg.style.backgroundImage = `url('${siteConfig.images[0]}')`;

setInterval(() => {
  currentIndex = (currentIndex + 1) % siteConfig.images.length;
  bg.style.backgroundImage = `url('${siteConfig.images[currentIndex]}')`;
}, siteConfig.scoreboardGrid.slideshowInterval);
