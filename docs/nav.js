function renderNav() {
  const header = document.querySelector('.org-header-inner');
  if (!header) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const pagesHtml = siteConfig.pages.map(p => {
    if (p.dropdown) {
      const items = p.dropdown.map(d => 
        `<a href="${d.url}" target="_blank" rel="noopener noreferrer" class="dropdown-item">${d.name}</a>`
      ).join('');
      return `<div class="nav-dropdown">
        <button class="nav-link dropdown-toggle">${p.name}</button>
        <div class="dropdown-menu">${items}</div>
      </div>`;
    }
    return `<a href="${p.url}" class="nav-link${currentPage === p.url.replace('./', '') ? ' active' : ''}">${p.name}</a>`;
  }).join('');

  header.innerHTML = `
    <a href="${siteConfig.org.url}" class="org-brand">
      <img src="${siteConfig.org.logo}" alt="${siteConfig.org.name}" class="org-logo">
      <span>${siteConfig.org.name}</span>
    </a>
    <button class="nav-toggle" aria-label="Abrir menú" aria-expanded="false">☰</button>
    <div class="nav-content">
      <nav class="nav">${pagesHtml}</nav>
      <div class="social-links">
        ${siteConfig.social.map(s => 
          `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="social-icon" title="${s.name}">${s.icon}</a>`
        ).join('')}
      </div>
    </div>
  `;

  const toggle = header.querySelector('.nav-toggle');
  const content = header.querySelector('.nav-content');

  function closeMenu() {
    content.classList.remove('open');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  }

  toggle.addEventListener('click', () => {
    const isOpen = content.classList.toggle('open');
    toggle.textContent = isOpen ? '✕' : '☰';
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });

  content.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    if (content.classList.contains('open') && !content.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  header.querySelectorAll('.dropdown-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.nav-dropdown').classList.toggle('open');
    });
  });
}

renderNav();
