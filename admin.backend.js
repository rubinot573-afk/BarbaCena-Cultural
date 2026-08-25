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
  news: [],
  gallery: [],
  movements: [],
};

let state = { ...defaultState };
// CORREÇÃO DE OURO: Já inicia como true para dar acesso livre localmente e não travar a tela
let isAuthenticated = true; 

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
  if (!listElement) return;
  listElement.innerHTML = '';
  if (!items || !items.length) {
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
          <small>${item.date || ''}</small>
          <div>
            <button data-action="edit-news" data-index="${originalIndex}">Editar</button>
            <button data-action="remove-news" data-index="${originalIndex}">Excluir</button>
          </div>
        </div>
      `;
    }

    if (type === 'fotos') {
      card.innerHTML = `
        ${item.image ? `<img src="${item.image}" alt="${item.title}" />` : ''}
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
        ${item.image ? `<img src="${item.image}" alt="${item.name}" />` : ''}
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
    if (section.id === sectionId) {
      section.classList.add('active');
      section.classList.remove('hidden');
    } else {
      section.classList.remove('active');
      section.classList.add('hidden');
    }
  });
  ui.navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === sectionId);
  });
}

function toggleForm(formCard, visible) {
  if (!formCard) return;
  if (visible) {
    formCard.classList.remove('hidden');
  } else {
    formCard.classList.add('hidden');
  }
}

function resetForms() {
  if(ui.newsForm) ui.newsForm.reset();
  if(ui.galleryForm) ui.galleryForm.reset();
  if(ui.movementForm) ui.movementForm.reset();
  if(ui.newsIndex) ui.newsIndex.value = '';
  if(ui.galleryIndex) ui.galleryIndex.value = '';
  if(ui.movementIndex) ui.movementIndex.value = '';
  if(ui.newsFormTitle) ui.newsFormTitle.textContent = 'Nova notícia';
  if(ui.galleryFormTitle) ui.galleryFormTitle.textContent = 'Nova foto';
  if(ui.movementFormTitle) ui.movementFormTitle.textContent = 'Novo movimento';
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
    console.error("Rodando localmente em modo offline:", error);
  }
}

async function postData(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao salvar.');
  }
  return response.status === 204 ? {} : response.json();
}

async function putData(url, data) {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao atualizar.');
  }
  return response.status === 204 ? {} : response.json();
}

async function deleteData(url) {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao excluir.');
  }
}

function addEventListeners() {
  ui.navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      showAdminSection(button.dataset.target);
    });
  });

  if (ui.showNewsForm) {
    ui.showNewsForm.addEventListener('click', () => {
      resetForms();
      toggleForm(ui.newsFormCard, true);
      showAdminSection('news');
    });
  }

  if (ui.showGalleryForm) {
    ui.showGalleryForm.addEventListener('click', () => {
      resetForms();
      toggleForm(ui.galleryFormCard, true);
      showAdminSection('gallery');
    });
  }

  if (ui.showMovementForm) {
    ui.showMovementForm.addEventListener('click', () => {
      resetForms();
      toggleForm(ui.movementFormCard, true);
      showAdminSection('movements');
    });
  }

  if (ui.cancelNews) ui.cancelNews.addEventListener('click', () => toggleForm(ui.newsFormCard, false));
  if (ui.cancelGallery) ui.cancelGallery.addEventListener('click', () => toggleForm(ui.galleryFormCard, false));
  if (ui.cancelMovement) ui.cancelMovement.addEventListener('click', () => toggleForm(ui.movementFormCard, false));

  if (ui.newsForm) {
    ui.newsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('news-title').value.trim();
      const content = document.getElementById('news-content').value.trim();
      const image = document.getElementById('news-image').value.trim();
      const index = ui.newsIndex.value;

      try {
        if (index === '') {
          await postData('/api/news', { title, content, image, date: new Date().toLocaleDateString('pt-BR') });
        } else {
          await putData(`/api/news/${index}`, { title, content, image });
        }
        await fetchContent();
        renderAdminLists();
        toggleForm(ui.newsFormCard, false);
        resetForms();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (ui.galleryForm) {
    ui.galleryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const title = document.getElementById('gallery-title').value.trim();
      const image = document.getElementById('gallery-image').value.trim();
      const description = document.getElementById('gallery-description').value.trim();
      const index = ui.galleryIndex.value;

      try {
        if (index === '') {
          await postData('/api/gallery', { title, image, description });
        } else {
          await putData(`/api/gallery/${index}`, { title, image, description });
        }
        await fetchContent();
        renderAdminLists();
        toggleForm(ui.galleryFormCard, false);
        resetForms();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (ui.movementForm) {
    ui.movementForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('movement-name').value.trim();
      const category = document.getElementById('movement-category').value.trim();
      const image = document.getElementById('movement-image').value.trim();
      const description = document.getElementById('movement-description').value.trim();
      const index = ui.movementIndex.value;

      try {
        if (index === '') {
          await postData('/api/movements', { name, category, image, description });
        } else {
          await putData(`/api/movements/${index}`, { name, category, image, description });
        }
        await fetchContent();
        renderAdminLists();
        toggleForm(ui.movementFormCard, false);
        resetForms();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  document.addEventListener('click', async (event) => {
    const action = event.target.dataset.action;
    const index = event.target.dataset.index;
    if (!action || index === undefined) return;
    try {
      if (action === 'remove-news' && confirm('Excluir esta notícia?')) {
        await deleteData(`/api/news/${index}`);
        await fetchContent();
        renderAdminLists();
      }
      if (action === 'remove-gallery' && confirm('Excluir esta foto?')) {
        await deleteData(`/api/gallery/${index}`);
        await fetchContent();
        renderAdminLists();
      }
      if (action === 'remove-movement' && confirm('Excluir este movimento?')) {
        await deleteData(`/api/movements/${index}`);
        await fetchContent();
        renderAdminLists();
      }
      if (action === 'edit-news') {
        const item = state.news[index];
        document.getElementById('news-title').value = item.title;
        document.getElementById('news-content').value = item.content;
        document.getElementById('news-image').value = item.image || '';
        ui.newsIndex.value = index;
        ui.newsFormTitle.textContent = 'Editar notícia';
        toggleForm(ui.newsFormCard, true);
      }
      if (action === 'edit-gallery') {
        const item = state.gallery[index];
        document.getElementById('gallery-title').value = item.title;
        document.getElementById('gallery-image').value = item.image;
        document.getElementById('gallery-description').value = item.description || '';
        ui.galleryIndex.value = index;
        ui.galleryFormTitle.textContent = 'Editar foto';
        toggleForm(ui.galleryFormCard, true);
      }
      if (action === 'edit-movement') {
        const item = state.movements[index];
        document.getElementById('movement-name').value = item.name;
        document.getElementById('movement-category').value = item.category || '';
        document.getElementById('movement-image').value = item.image || '';
        document.getElementById('movement-description').value = item.description;
        ui.movementIndex.value = index;
        ui.movementFormTitle.textContent = 'Editar movimento';
        toggleForm(ui.movementFormCard, true);
      }
    } catch (err) {
      alert(err.message);
    }
  });

  if (ui.loginForm) {
    ui.loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (ui.loginPassword.value === ADMIN_PASSWORD) {
        showAdminSection('dashboard');
        renderAdminLists();
      } else {
        alert('Senha incorreta!');
      }
    });
  }
}

async function init() {
  addEventListeners();
  applyTheme();
  await fetchContent();
  renderAdminLists();
  showAdminSection('dashboard');
}
        init();