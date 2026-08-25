const ui = {
  targetButtons: document.querySelectorAll('[data-target]'),
  pageSections: document.querySelectorAll('.page-section'),
  newsList: document.getElementById('news-list'),
  galleryList: document.getElementById('gallery-list'),
  movementList: document.getElementById('movement-list'), // Alinhado com o index.html
};

const defaultState = {
  theme: {
    primary: '#6a0dad',
    secondary: '#f2c9ff',
    background: '#1b1b1b',
    text: '#222222',
    fontFamily: 'Inter, sans-serif',
    fontSize: 16,
  },
  news: [],
  gallery: [],
  movements: [],
};

let state = { ...defaultState };

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty('--primary', state.theme.primary);
  root.style.setProperty('--secondary', state.theme.secondary);
  root.style.setProperty('--background', state.theme.background);
  root.style.setProperty('--text', state.theme.text);
  document.body.style.fontFamily = state.theme.fontFamily;
  document.body.style.fontSize = `${state.theme.fontSize}px`;
}

function renderNews() {
  if (!ui.newsList) return;
  ui.newsList.innerHTML = '';
  if (!state.news || !state.news.length) {
    ui.newsList.innerHTML = '<p>Sem notícias por enquanto.</p>';
    return;
  }
  state.news.slice().reverse().forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      ${item.image ? `<img src="${item.image}" alt="${item.title}" />` : ''}
      <div>
        <h3>${item.title}</h3>
        <p>${item.content}</p>
      </div>
      <div class="card-footer">
        <small>${item.date || ''}</small>
      </div>
    `;
    ui.newsList.appendChild(card);
  });
}

function renderGallery() {
  if (!ui.galleryList) return;
  ui.galleryList.innerHTML = '';
  if (!state.gallery || !state.gallery.length) {
    ui.galleryList.innerHTML = '<p>Sem fotos por enquanto.</p>';
    return;
  }
  state.gallery.slice().reverse().forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      ${item.image ? `<img src="${item.image}" alt="${item.title}" />` : ''}
      <div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `;
    ui.galleryList.appendChild(card);
  });
}

// CORREÇÃO MÁXIMA: Garante a renderização da imagem e do texto cadastrados no banco
function renderMovements() {
  if (!ui.movementList) return;
  ui.movementList.innerHTML = '';
  if (!state.movements || !state.movements.length) {
    ui.movementList.innerHTML = '<p>Sem movimentos cadastrados.</p>';
    return;
  }
  state.movements.slice().reverse().forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      ${item.image ? `<img src="${item.image}" alt="${item.name}" />` : ''}
      <div>
        <h3>${item.name}</h3>
        <small>${item.category || 'Sem categoria'}</small>
        <p>${item.description}</p>
      </div>
    `;
    ui.movementList.appendChild(card);
  });
}

function showSection(targetId) {
  ui.pageSections.forEach((section) => {
    section.classList.toggle('active', section.id === targetId);
  });
  ui.targetButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === targetId);
  });
}

function addEventListeners() {
  ui.targetButtons.forEach((button) => {
    button.addEventListener('click', () => showSection(button.dataset.target));
  });
}

async function fetchContent() {
  try {
    const response = await fetch('/api/content');
    if (!response.ok) throw new Error('Resposta inválida do servidor');
    const parsed = await response.json();
    state = {
      theme: { ...defaultState.theme, ...(parsed.theme || {}) },
      news: Array.isArray(parsed.news) ? parsed.news : defaultState.news,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : defaultState.gallery,
      movements: Array.isArray(parsed.movements) ? parsed.movements : defaultState.movements,
    };
  } catch (error) {
    console.error("Conexão falhou, carregando fallback local.", error);
    state = defaultState;
  }
}

async function init() {
  await fetchContent();
  applyTheme();
  renderNews();
  renderGallery();
  renderMovements();
  addEventListeners();
  showSection('home');
}

init();
