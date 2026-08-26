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
          <p>${item.description || ''}</p>
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
  if (visible) formCard.classList.remove('hidden');
  else formCard.classList.add('hidden');
}

function resetForms() {
  if (ui.newsForm) ui.newsForm.reset();
  if (ui.galleryForm) ui.galleryForm.reset();
  if (ui.movementForm) ui.movementForm.reset();
  if (ui.newsIndex) ui.newsIndex.value = '';
  if (ui.galleryIndex) ui.galleryIndex.value = '';
  if (ui.movementIndex) ui.movementIndex.value = '';
  if (ui.newsFormTitle) ui.newsFormTitle.textContent = 'Nova notícia';
  if (ui.galleryFormTitle) ui.galleryFormTitle.textContent = 'Nova foto';
  if (ui.movementFormTitle) ui.movementFormTitle.textContent = 'Novo movimento';
}

// ✅ CORRIGIDO: Agora busca o conteúdo geral enviando a senha do link para evitar erro 401
async function fetchContent() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const senha = urlParams.get('senha') || '';

    const response = await fetch(`/api/content?senha=${senha}`);
    if (!response.ok) throw new Error('Resposta inválida do servidor');
    const parsed = await response.json();
    state = {
      theme: { ...defaultState.theme, ...(parsed.theme || {}) },
      news: Array.isArray(parsed.news) ? parsed.news : defaultState.news,
      gallery: Array.isArray(parsed.gallery) ? parsed.gallery : defaultState.gallery,
      movements: Array.isArray(parsed.movements) ? parsed.movements : defaultState.movements,
    };
    renderAdminLists();
  } catch (error) {
    console.error("Erro ao buscar dados do servidor:", error);
  }
}

// 🖼️ FUNÇÃO DE ENVIO EXCLUSIVA PARA NOTÍCIAS (SUPORTA IMAGENS NO CLOUDINARY)
async function enviarNoticiaComArquivo(formData, isEdit, id = '') {
  const urlParams = new URLSearchParams(window.location.search);
  const senha = urlParams.get('senha') || '';

  const url = isEdit ? `/api/news/${id}?senha=${senha}` : `/api/news?senha=${senha}`;
  const method = isEdit ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method: method,
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao salvar a notícia.');
  }
  return response.json();
}

async function postData(url, data) {
  const urlParams = new URLSearchParams(window.location.search);
  const senha = urlParams.get('senha') || '';
  
  const response = await fetch(`${url}?senha=${senha}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao salvar.');
  }
  return response.json();
}

async function deleteData(url) {
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao excluir.');
  }
}

function setupFormSubmissions() {
  if (ui.newsForm) {
    ui.newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('news-title').value;
      const content = document.getElementById('news-content').value;
      const fileInput = document.getElementById('news-image-file');
      const indexValue = ui.newsIndex.value;
      const isEdit = indexValue !== '';

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      // ✅ CORREÇÃO DEFINITIVA: Pega o arquivo de imagem real do dispositivo
if (fileInput && fileInput.files && fileInput.files[0]) {
  formData.append('imageFile', fileInput.files[0]);
}
      try {
        let id = '';
        if (isEdit && state.news[indexValue]) id = state.news[indexValue]._id;

        await enviarNoticiaComArquivo(formData, isEdit, id);
        alert('Notícia salva com sucesso!');
        toggleForm(ui.newsFormCard, false);
        resetForms();
        await fetchContent();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  if (ui.galleryForm) {
    ui.galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('gallery-title').value;
      const image = document.getElementById('gallery-image').value;
      const description = document.getElementById('gallery-description').value;
      
      try {
        await postData('/api/gallery', { title, image, description });
        alert('Foto salva com sucesso!');
        toggleForm(ui.galleryFormCard, false);
        resetForms();
        await fetchContent();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  if (ui.movementForm) {
    ui.movementForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('movement-name').value;
      const category = document.getElementById('movement-category').value;
      const image = document.getElementById('movement-image').value;
      const description = document.getElementById('movement-description').value;

      try {
        await postData('/api/movements', { name, category, image, description });
        alert('Movimento salvo com sucesso!');
        toggleForm(ui.movementFormCard, false);
        resetForms();
        await fetchContent();
      } catch (error) {
        alert(error.message);
      }
    });
  }
}

function setupListActions() {
  if (ui.newsList) {
    ui.newsList.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      const index = e.target.dataset.index;if (!action || !index || !state.news[index]) return;if (action === 'remove-news') {if (confirm('Tem certeza de que deseja excluir esta notícia permanentemente?')) {try {const urlParams = new URLSearchParams(window.location.search);const senha = urlParams.get('senha') || '';await deleteData(/api/news/${state.news[index]._id}?senha=${senha});alert('Notícia excluída com sucesso!');await fetchContent();} catch (error) {alert(error.message);}}}});}}function addEventListeners() {ui.navButtons.forEach((button) => {button.addEventListener('click', () => showAdminSection(button.dataset.target));});if (ui.showNewsForm) {ui.showNewsForm.addEventListener('click', () => {resetForms();toggleForm(ui.newsFormCard, true);});}if (ui.cancelNews) ui.cancelNews.addEventListener('click', () => toggleForm(ui.newsFormCard, false));if (ui.showGalleryForm) {ui.showGalleryForm.addEventListener('click', () => {resetForms();toggleForm(ui.galleryFormCard, true);});}if (ui.cancelGallery) ui.cancelGallery.addEventListener('click', () => toggleForm(ui.galleryFormCard, false));if (ui.showMovementForm) {ui.showMovementForm.addEventListener('click', () => {resetForms();toggleForm(ui.movementFormCard, true);});}if (ui.cancelMovement) ui.cancelMovement.addEventListener('click', () => toggleForm(ui.movementFormCard, false));}function init() {addEventListeners();setupFormSubmissions();setupListActions();showAdminSection('dashboard');fetchContent();}init();