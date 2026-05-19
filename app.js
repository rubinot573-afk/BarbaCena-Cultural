const STORAGE_KEY = 'BarbaCena Cultural';

const ui = {
  targetButtons: document.querySelectorAll('[data-target]'),
  pageSections: document.querySelectorAll('.page-section'),
  newsList: document.getElementById('news-list'),
  galleryList: document.getElementById('gallery-list'),
  movementList: document.getElementById('movement-list'),
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
  news: [
    {
      title: 'Inauguração do novo centro cultural',
      content: 'Um portal dedicado à cultura de Barbacena e região, reunindo notícias, eventos, artistas, movimentos e expressões culturais que dão voz e identidade à cena local..',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      date: new Date().toLocaleDateString('pt-BR'),
    },
  ],
  gallery: [
    {
      title: 'Arte de rua recente',
      image: 'https://images.unsplash.com/photo-1529429617124-7b4e6e85724b?auto=format&fit=crop&w=900&q=80',
      description: 'Um painel colorido que celebra a cultura local e a arte urbana.',
    },
  ],
  movements: [
    {
      name: 'Coletivo Aurora',
      category: 'Arte urbana',
      description: 'Grupo de artistas que promove intervenções visuais e oficinas na cidade.',
    },
  ],
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    const parsed = JSON.parse(saved);
    return {
      theme: { ...defaultState.theme, ...parsed.theme },
      news: Array.isArray(parsed.news) ? parsed.news : defaultState.news,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : defaultState.gallery,
      movements: Array.isArray(parsed.movements) ? parsed.movements : defaultState.movements,
    };
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

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
  ui.newsList.innerHTML = '';
  if (!state.news.length) {
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
        <small>${item.date}</small>
      </div>
    `;
    ui.newsList.appendChild(card);
  });
}

function renderGallery() {
  ui.galleryList.innerHTML = '';
  if (!state.gallery.length) {
    ui.galleryList.innerHTML = '<p>Sem fotos por enquanto.</p>';
    return;
  }
  state.gallery.slice().reverse().forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" />
      <div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    `;
    ui.galleryList.appendChild(card);
  });
}

function renderMovements() {
  ui.movementList.innerHTML = '';
  if (!state.movements.length) {
    ui.movementList.innerHTML = '<p>Sem movimentos cadastrados.</p>';
    return;
  }
  state.movements.slice().reverse().forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
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

function init() {
  applyTheme();
  renderNews();
  renderGallery();
  renderMovements();
  addEventListeners();
  showSection('home');
}

init();
