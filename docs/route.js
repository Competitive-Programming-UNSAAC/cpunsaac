const platformIcons = {
  "Codeforces": "./img/codeforces.png",
  "OmegaUp": "./img/omegaup.png",
  "DOMjudge": "./img/domjudge.svg",
};

const grid = document.getElementById('contest-list');

siteConfig.contests.forEach((contest, i) => {
  const a = document.createElement('a');
  a.href = contest.url;
  a.className = 'contest-card';

  if (i === siteConfig.contests.length - 1) a.classList.add('latest');

  if (contest.url.startsWith('http')) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.classList.add('external');
  }

  const icon = platformIcons[contest.platform] || '';

  a.innerHTML = `
    <span class="edition-top">
      <span class="edition-number">${contest.year}</span>
      <span class="edition-platform">
        ${icon ? `<img src="${icon}" alt="${contest.platform}" class="platform-icon">` : ''}
        ${contest.platform}
      </span>
    </span>
    <span class="edition-name">${contest.name}</span>
  `;

  grid.appendChild(a);
});

const bg = document.getElementById('bg-slideshow');
let currentIndex = 0;

siteConfig.images.forEach(src => { new Image().src = src; });
bg.style.backgroundImage = `url('${siteConfig.images[0]}')`;

setInterval(() => {
  currentIndex = (currentIndex + 1) % siteConfig.images.length;
  bg.style.backgroundImage = `url('${siteConfig.images[currentIndex]}')`;
}, siteConfig.scoreboardGrid.slideshowInterval);
