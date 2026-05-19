const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erro ao ler data.json:', error);
    return {
      theme: {},
      news: [],
      gallery: [],
      movements: [],
    };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getData() {
  return loadData();
}

app.get('/api/content', (req, res) => {
  res.json(getData());
});

app.get('/api/news', (req, res) => {
  res.json(getData().news || []);
});

app.post('/api/news', (req, res) => {
  const data = getData();
  const item = req.body;
  if (!item.title || !item.content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
  }
  item.date = new Date().toLocaleDateString('pt-BR');
  data.news = data.news || [];
  data.news.push(item);
  saveData(data);
  res.status(201).json(item);
});

app.put('/api/news/:index', (req, res) => {
  const data = getData();
  const index = Number(req.params.index);
  if (!Array.isArray(data.news) || index < 0 || index >= data.news.length) {
    return res.status(404).json({ error: 'Notícia não encontrada.' });
  }
  const item = { ...data.news[index], ...req.body };
  data.news[index] = item;
  saveData(data);
  res.json(item);
});

app.delete('/api/news/:index', (req, res) => {
  const data = getData();
  const index = Number(req.params.index);
  if (!Array.isArray(data.news) || index < 0 || index >= data.news.length) {
    return res.status(404).json({ error: 'Notícia não encontrada.' });
  }
  data.news.splice(index, 1);
  saveData(data);
  res.status(204).send();
});

app.get('/api/gallery', (req, res) => {
  res.json(getData().gallery || []);
});

app.post('/api/gallery', (req, res) => {
  const data = getData();
  const item = req.body;
  if (!item.title || !item.image) {
    return res.status(400).json({ error: 'Título e URL da imagem são obrigatórios.' });
  }
  data.gallery = data.gallery || [];
  data.gallery.push(item);
  saveData(data);
  res.status(201).json(item);
});

app.put('/api/gallery/:index', (req, res) => {
  const data = getData();
  const index = Number(req.params.index);
  if (!Array.isArray(data.gallery) || index < 0 || index >= data.gallery.length) {
    return res.status(404).json({ error: 'Foto não encontrada.' });
  }
  const item = { ...data.gallery[index], ...req.body };
  data.gallery[index] = item;
  saveData(data);
  res.json(item);
});

app.delete('/api/gallery/:index', (req, res) => {
  const data = getData();
  const index = Number(req.params.index);
  if (!Array.isArray(data.gallery) || index < 0 || index >= data.gallery.length) {
    return res.status(404).json({ error: 'Foto não encontrada.' });
  }
  data.gallery.splice(index, 1);
  saveData(data);
  res.status(204).send();
});

app.get('/api/movements', (req, res) => {
  res.json(getData().movements || []);
});

app.post('/api/movements', (req, res) => {
  const data = getData();
  const item = req.body;
  if (!item.name || !item.description) {
    return res.status(400).json({ error: 'Nome e descrição são obrigatórios.' });
  }
  data.movements = data.movements || [];
  data.movements.push(item);
  saveData(data);
  res.status(201).json(item);
});

app.put('/api/movements/:index', (req, res) => {
  const data = getData();
  const index = Number(req.params.index);
  if (!Array.isArray(data.movements) || index < 0 || index >= data.movements.length) {
    return res.status(404).json({ error: 'Movimento não encontrado.' });
  }
  const item = { ...data.movements[index], ...req.body };
  data.movements[index] = item;
  saveData(data);
  res.json(item);
});

app.delete('/api/movements/:index', (req, res) => {
  const data = getData();
  const index = Number(req.params.index);
  if (!Array.isArray(data.movements) || index < 0 || index >= data.movements.length) {
    return res.status(404).json({ error: 'Movimento não encontrado.' });
  }
  data.movements.splice(index, 1);
  saveData(data);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
