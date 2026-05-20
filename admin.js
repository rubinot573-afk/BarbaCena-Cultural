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
  newsIndex: document.getElementById('news-index'), // Agora armazena o _id
  galleryIndex: document.getElementById('gallery-index'), // Agora armazena o _id
  movementIndex: document.getElementById('movement-index'), // Agora armazena o _id
};

let state = {
  theme: { primary: '#6a0dad', secondary: '#f2c9ff', background: '#fbf5ff', text: '#222222', fontFamily: 'Inter, sans-serif', fontSize: 16 },
  news: [],
  gallery: [],
  movements: [],
};
let isAuthenticated = false;

// Puxa as informações em tempo real do banco de dados MongoDB
async function fetchAdminContent() {
  try {
    const response = await fetch('/api/content');
    const data = await response.json();
    state.news = data.news || [];
    state.gallery = data.gallery || [];
    state.movements = data.movements || [];
    renderAdminLists();
  } catch (error) {
    console.error('Erro ao buscar dados do banco:', error);
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

function renderList(listElement, items, type) {
  listElement.innerHTML = '';
  if (!items.length) {
    listElement.innerHTML = `<p>Sem ${type} por enquanto. Adicione o primeiro!</p>`;
    return;
  }
  items.slice().reverse().forEach((item) => {
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
            <button data-action="edit-news" data-id="${item._id}">Editar</button>
            <button data-action="remove-news" data-id="${item._id}">Excluir</button>
          </div>
        </div>
      `;
    }

    if (type === 'fotos') {
      card.innerHTML = `
        <img src="${item.image}" alt="${item.title}" />
        <div>
          <h3>${item.title}</h3>
          <p>${item.description || ''}</p>
        </div>
        <div class="card-footer">
          <div>
            <button data-action="edit-gallery" data-id="${item._id}">Editar</button>
            <button data-action="remove-gallery" data-id="${item._id}">Excluir</button>
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
            <button data-action="edit-movement" data-id="${item._id}">Editar</button>
            <button data-action="remove-movement" data-id="${item._id}">Excluir</button>
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
  if (visible) formCard.classList.remove('hidden');
  else formCard.classList.add('hidden');
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

// Configura as ações de cliques para Editar e Deletar dinamicamente no MongoDB
function handleListClicks(listElement, type, urlPath) {
  listElement.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    if (!action || !id) return;

    if (action.startsWith('remove-')) {
      if (confirm('Tem certeza que deseja excluir permanentemente?')) {
        const response = await fetch(`${urlPath}/${id}`, { method: 'DELETE' });
        if (response.ok) fetchAdminContent();
      }
    }

    if (action.startsWith('edit-')) {
      if (type === 'news') {
        const item = state.news.find(n => n._id === id);
        document.getElementById('news-title').value = item.title;
        document.getElementById('news-content').value = item.content;
        document.getElementById('news-image').value = item.image || '';
        ui.newsIndex.value = id;
        ui.newsFormTitle.textContent = 'Editar notícia';
        toggleForm(ui.newsFormCard, true);
      }
      if (type === 'gallery') {
        const item = state.gallery.find(g => g._id === id);
        document.getElementById('gallery-title').value = item.title;
        document.getElementById('gallery-image').value = item.image;
        ui.galleryIndex.value = id;
        ui.galleryFormTitle.textContent = 'Editar foto';
        toggleForm(ui.galleryFormCard, true);
      }
      if (type === 'movement') {
        const item = state.movements.find(m => m._id === id);
        document.getElementById('movement-name').value = item.name;
        document.getElementById('movement-description').value = item.description;
        ui.movementIndex.value = id;
        ui.movementFormTitle.textContent = 'Editar movimento';
        toggleForm(ui.movementFormCard, true);
      }
    }
  });
}

function addEventListeners() {
  ui.navButtons.forEach((button) => {
    button.addEventListener('click', () => showAdminSection(button.dataset.target));
  });

  ui.showNewsForm.addEventListener('click', () => { resetForms(); toggleForm(ui.newsFormCard, true); showAdminSection('news'); });
  ui.showGalleryForm.addEventListener('click', () => { resetForms(); toggleForm(ui.galleryFormCard, true); showAdminSection('gallery'); });
  ui.showMovementForm.addEventListener('click', () => { resetForms(); toggleForm(ui.movementFormCard, true); showAdminSection('movements'); });

  ui.cancelNews.addEventListener('click', () => toggleForm(ui.newsFormCard, false));
  ui.cancelGallery.addEventListener('click', () => toggleForm(ui.galleryFormCard, false));
  ui.cancelMovement.addEventListener('click', () => toggleForm(ui.movementFormCard, false));

  // Envio do formulário de Notícias
  ui.newsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('news-title').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const image = document.getElementById('news-image').value.trim();
    const id = ui.newsIndex.value;
    const bodyData = { title, content, image };

    const url = id ? `/api/news/${id}` : '/api/news';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (response.ok) {
      toggleForm(ui.newsFormCard, false);
      resetForms();
      fetchAdminContent();
    }
  });

  // Envio do formulário da Galeria
  ui.galleryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.getElementById('gallery-title').value.trim();
    const image = document.getElementById('gallery-image').value.trim();
    const id = ui.galleryIndex.value;
    const bodyData = { title, image };

    const url = id ? `/api/gallery/${id}` : '/api/gallery';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (response.ok) {
      toggleForm(ui.galleryFormCard, false);
      resetForms();
      fetchAdminContent();
    }
  });

  // Envio do formulário de Movimentos
  ui.movementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('movement-name').value.trim();
    const description = document.getElementById('movement-description').value.trim();
    const id = ui.movementIndex.value;
    const bodyData = { name, description };

    const url = id ? `/api/movements/${id}` : '/api/movements';
    const method = id ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (response.ok) {
      toggleForm(ui.movementFormCard, false);
      resetForms();
      fetchAdminContent();
    }
  });

  // Sistema de Login
  ui.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (ui.loginPassword.value === ADMIN_PASSWORD) {
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('admin-screen').classList.remove('hidden');
      fetchAdminContent();
    } else {
      alert('Senha incorreta!');
    }
  });

  handleListClicks(ui.newsList, 'news', '/api/news');
  handleListClicks(ui.galleryList, 'gallery', '/api/gallery');
  handleListClicks(ui.movementList, 'movement', '/api/movements');
}

function init() {
  applyTheme();
  addEventListeners();
}

init();