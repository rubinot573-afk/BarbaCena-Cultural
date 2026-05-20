const ui = {
  targetButtons: document.querySelectorAll('[data-target]'),
  pageSections: document.querySelectorAll('.page-section'),
  newsList: document.getElementById('news-list'),
  galleryList: document.getElementById('gallery-list'),
  movementList: document.getElementById('movement-list'),
};

const defaultTheme = {
  primary: '#6a0dad',
  secondary: '#f2c9ff',
  background: '#1b1b1b',
  text: '#222222',
  fontFamily: 'Inter, sans-serif',
  fontSize: 16,
};

let state = {
  theme: defaultTheme,
  news: [],
  gallery: [],
  movements: [],
};

// Busca todas as notícias, fotos e movimentos salvos no MongoDB Atlas
async function fetchContent() {
  try {
    const response = await fetch('/api/content');
    if (!response.ok) throw new Error('Erro ao buscar dados do servidor');
    const data = await response.json();
    
    state.news = data.news || [];
    state.gallery = data.gallery || [];
    state.movements = data.movements || [];

    renderNews();
    renderGallery();
    renderMovements();
  } catch (error) {
    console.error('Erro ao conectar com a API:', error);
    ui.newsList.innerHTML = '<p>Erro ao carregar o conteúdo do servidor.</p>';
  }
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
  // Exibe as notícias invertidas (as mais recentes primeiro) usando o ID do MongoDB
  state.news.slice().reverse().forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.setAttribute('data-id', item._id); // Guarda o ID único do MongoDB no HTML
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
    card.setAttribute('data-id', item._id);
    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" />
      <div>
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
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
    card.setAttribute('data-id', item._id);
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
  addEventListeners();
  showSection('home');
  fetchContent(); // Dispara a busca no banco de dados assim que a página carrega
}

init();