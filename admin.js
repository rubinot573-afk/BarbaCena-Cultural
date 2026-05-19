const STORAGE_KEY = 'portalDaArteData';
const ADMIN_PASSWORD = 'arte123';

const ui = {
  navButtons: document.querySelectorAll('.nav-button'),
  pageSections: document.querySelectorAll('.page-section'),
  newsList: document.getElementById('news-list'),
  galleryList: document.getElementById('gallery-list'),
  movementList: document.getElementById('movement-list'),
  newsFormCard: document.getElementById('news-form-card'),
  galleryFormCard: document.getElementById('gallery-form-card'),
  movementFormCard: document.getElementById('movement-form-card'),
  showNewsForm: document.getElementById('show-news-form'),
  showGalleryForm: document.getElementById('show-gallery-form'),
  showMovementForm: document.getElementById('show-movement-form'),
  cancelNews: document.getElementById('cancel-news'),
  cancelGallery: document.getElementById('cancel-gallery'),
  cancelMovement: document.getElementById('cancel-movement'),
  newsForm: document.getElementById('news-form'),
  galleryForm: document.getElementById('gallery-form'),
  movementForm: document.getElementById('movement-form'),
  loginForm: document.getElementById('login-form'),
  loginPassword: document.getElementById('login-password'),
  newsFormTitle: document.getElementById('news-form-title'),
  galleryFormTitle: document.getElementById('gallery-form-title'),
  movementFormTitle: document.getElementById('movement-form-title'),
  newsIndex: document.getElementById('news-index'),
  galleryIndex: document.getElementById('gallery-index'),
  movementIndex: document.getElementById('movement-index'),
};

const defaultState = {
  theme: {
    primary: '#6a0dad',
    secondary: '#f2c9ff',
    background: '#fbf5ff',
    text: '#222222',
    fontFamily: 'Inter, sans-serif',
    fontSize: 16,
  },
  news: [
    {
      title: 'Inauguração do novo centro cultural',
      content: 'Venha conhecer o espaço dedicado a exposições, música e residências artísticas na cidade.',
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
let isAuthenticated = false;

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

function renderList(listElement, items, type) {
  listElement.innerHTML = '';
  if (!items.length) {
    listElement.innerHTML = `<p>Sem ${type} por enquanto. Adicione o primeiro!</p>`;
    return;
  }
  items.slice().reverse().forEach((item, index) => {
    const originalIndex = items.length - 1 - index;
    const card = document.createElement('article');
    card.className = 'card';

    if (type === 'notícias') {
      card.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="${item.title}" />` : ''}
        <div>
          <h3>${item.title}</h3>
          <p>${item.content}</p>
        </div>
        <div class="card-footer">
          <small>${item.date}</small>
          <div>
            <button data-action="edit-news" data-index="${originalIndex}">Editar</button>
            <button data-action="remove-news" data-index="${originalIndex}">Excluir</button>
          </div>
        </div>
      `;
    }

    if (type === 'fotos') {
      card.innerHTML = `
        <img src="${item.image}" alt="${item.title}" />
        <div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </div>
        <div class="card-footer">
          <div>
            <button data-action="edit-gallery" data-index="${originalIndex}">Editar</button>
            <button data-action="remove-gallery" data-index="${originalIndex}">Excluir</button>
          </div>
        </div>
      `;
    }

    if (type === 'movimentos') {
      card.innerHTML = `
        <div>
          <h3>${item.name}</h3>
          <small>${item.category || 'Sem categoria'}</small>
          <p>${item.description}</p>
        </div>
        <div class="card-footer">
          <div>
            <button data-action="edit-movement" data-index="${originalIndex}">Editar</button>
            <button data-action="remove-movement" data-index="${originalIndex}">Excluir</button>
          </div>
        </div>
      `;
    }

    listElement.appendChild(card);
  });
}

function renderAdminLists() {
  renderList(ui.newsList, state.news, 'notícias');
  renderList(ui.galleryList, state.gallery, 'fotos');
  renderList(ui.movementList, state.movements, 'movimentos');
}

function showAdminSection(sectionId) {
  ui.pageSections.forEach((section) => {
    section.classList.toggle('active', section.id === sectionId);
    section.classList.toggle('hidden', section.id !== sectionId);
  });
  ui.navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === sectionId);
  });
}

function toggleForm(formCard, visible) {
  if (visible) {
    formCard.classList.remove('hidden');
  } else {
    formCard.classList.add('hidden');
  }
}

function resetForms() {
  ui.newsForm.reset();
  ui.galleryForm.reset();
  ui.movementForm.reset();
  ui.newsIndex.value = '';
  ui.galleryIndex.value = '';
  ui.movementIndex.value = '';
  ui.newsFormTitle.textContent = 'Nova notícia';
  ui.galleryFormTitle.textContent = 'Nova foto';
  ui.movementFormTitle.textContent = 'Novo movimento';
}

function addEventListeners() {
  ui.navButtons.forEach((button) => {
    button.addEventListener('click', () => showAdminSection(button.dataset.target));
  });

  ui.showNewsForm.addEventListener('click', () => {
    resetForms();
    toggleForm(ui.newsFormCard, true);
    showAdminSection('news');
  });

  ui.showGalleryForm.addEventListener('click', () => {
    resetForms();
    toggleForm(ui.galleryFormCard, true);
    showAdminSection('gallery');
  });

  ui.showMovementForm.addEventListener('click', () => {
    resetForms();
    toggleForm(ui.movementFormCard, true);
    showAdminSection('movements');
  });

  ui.cancelNews.addEventListener('click', () => toggleForm(ui.newsFormCard, false));
  ui.cancelGallery.addEventListener('click', () => toggleForm(ui.galleryFormCard, false));
  ui.cancelMovement.addEventListener('click', () => toggleForm(ui.movementFormCard, false));

  ui.newsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('news-title').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const image = document.getElementById('news-image').value.trim();
    const index = ui.newsIndex.value;
    const item = { title, content, image, date: new Date().toLocaleDateString('pt-BR') };

    if (index) {
      state.news.splice(Number(index), 1, { ...state.news[Number(index)], ...item });
    } else {
      state.news.push(item);
    }

    saveState();
    renderAdminLists();
    resetForms();
    toggleForm(ui.newsFormCard, false);
  });

  ui.galleryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('gallery-title').value.trim();
    const image = document.getElementById('gallery-image').value.trim();
    const description = document.getElementById('gallery-description').value.trim();
    const index = ui.galleryIndex.value;
    const item = { title, image, description };

    if (index) {
      state.gallery.splice(Number(index), 1, item);
    } else {
      state.gallery.push(item);
    }

    saveState();
    renderAdminLists();
    resetForms();
    toggleForm(ui.galleryFormCard, false);
  });

  ui.movementForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('movement-name').value.trim();
    const category = document.getElementById('movement-category').value.trim();
    const description = document.getElementById('movement-description').value.trim();
    const index = ui.movementIndex.value;
    const item = { name, category, description };

    if (index) {
      state.movements.splice(Number(index), 1, item);
    } else {
      state.movements.push(item);
    }

    saveState();
    renderAdminLists();
    resetForms();
    toggleForm(ui.movementFormCard, false);
  });

  document.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    if (!action) return;
    const index = Number(event.target.dataset.index);

    if (action === 'remove-news') {
      state.news.splice(index, 1);
      saveState();
      renderAdminLists();
    }
    if (action === 'remove-gallery') {
      state.gallery.splice(index, 1);
      saveState();
      renderAdminLists();
    }
    if (action === 'remove-movement') {
      state.movements.splice(index, 1);
      saveState();
      renderAdminLists();
    }
    if (action === 'edit-news') {
      const item = state.news[index];
      ui.newsFormTitle.textContent = 'Editar notícia';
      ui.newsIndex.value = index;
      document.getElementById('news-title').value = item.title;
      document.getElementById('news-content').value = item.content;
      document.getElementById('news-image').value = item.image;
      toggleForm(ui.newsFormCard, true);
    }
    if (action === 'edit-gallery') {
      const item = state.gallery[index];
      ui.galleryFormTitle.textContent = 'Editar foto';
      ui.galleryIndex.value = index;
      document.getElementById('gallery-title').value = item.title;
      document.getElementById('gallery-image').value = item.image;
      document.getElementById('gallery-description').value = item.description;
      toggleForm(ui.galleryFormCard, true);
    }
    if (action === 'edit-movement') {
      const item = state.movements[index];
      ui.movementFormTitle.textContent = 'Editar movimento';
      ui.movementIndex.value = index;
      document.getElementById('movement-name').value = item.name;
      document.getElementById('movement-category').value = item.category;
      document.getElementById('movement-description').value = item.description;
      toggleForm(ui.movementFormCard, true);
    }
  });

  ui.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = ui.loginPassword.value.trim();
    if (password !== ADMIN_PASSWORD) {
      alert('Senha incorreta.');
      return;
    }
    isAuthenticated = true;
    ui.loginPassword.value = '';
    showAdminSection('dashboard');
    renderAdminLists();
    toggleForm(ui.loginForm.parentElement, false);
    document.getElementById('admin-login').classList.add('hidden');
    document.querySelectorAll('.admin-section').forEach((section) => section.classList.remove('hidden'));
  });
}

function init() {
  applyTheme();
  addEventListeners();
  document.getElementById('admin-login').classList.remove('hidden');
  document.querySelectorAll('.admin-section').forEach((section) => section.classList.add('hidden'));
}

init();
