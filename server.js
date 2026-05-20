const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rota amigável para abrir a tela de admin sem precisar digitar .html no navegador
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Conexão com o MongoDB Atlas usando a variável de ambiente do Render
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB com sucesso!"))
  .catch((erro) => console.error("Erro ao conectar ao MongoDB:", erro));

// Moldes (Schemas) do Banco de Dados
const NewsSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: String,
  image: String // <-- Campo adicionado com sucesso para salvar as imagens das notícias
});
const News = mongoose.model('News', NewsSchema);

const GallerySchema = new mongoose.Schema({
  title: String,
  image: String
});
const Gallery = mongoose.model('Gallery', GallerySchema);

const MovementSchema = new mongoose.Schema({
  name: String,
  description: String
});
const Movement = mongoose.model('Movement', MovementSchema);

// Rota Geral de Conteúdo (Agrupa tudo para o seu frontend carregar a página inicial)
app.get('/api/content', async (req, res) => {
  try {
    const news = await News.find();
    const gallery = await Gallery.find();
    const movements = await Movement.find();
    res.json({ theme: {}, news, gallery, movements });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conteúdo geral.' });
  }
});

// --- ROTAS DE NOTÍCIAS ---
app.get('/api/news', async (req, res) => {
  const news = await News.find();
  res.json(news);
});

app.post('/api/news', async (req, res) => {
  const item = req.body;
  if (!item.title || !item.content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
  }
  item.date = new Date().toLocaleDateString('pt-BR');
  const novaNoticia = new News(item);
  await novaNoticia.save();
  res.status(201).json(novaNoticia);
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const item = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Notícia não encontrada.' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: 'ID inválido ou erro ao atualizar.' });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const item = await News.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Notícia não encontrada.' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'ID inválido ou erro ao deletar.' });
  }
});

// --- ROTAS DA GALERIA ---
app.get('/api/gallery', async (req, res) => {
  const gallery = await Gallery.find();
  res.json(gallery);
});

app.post('/api/gallery', async (req, res) => {
  const item = req.body;
  if (!item.title || !item.image) {
    return res.status(400).json({ error: 'Título e URL da imagem são obrigatórios.' });
  }
  const novaFoto = new Gallery(item);
  await novaFoto.save();
  res.status(201).json(novaFoto);
});

app.put('/api/gallery/:id', async (req, res) => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Foto não encontrada.' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: 'ID inválido.' });
  }
});

// --- ROTAS DE MOVIMENTOS ---
app.get('/api/movements', async (req, res) => {
  const movements = await Movement.find();
  res.json(movements);
});

app.post('/api/movements', async (req, res) => {
  const item = req.body;
  if (!item.name || !item.description) {
    return res.status(400).json({ error: 'Nome e descrição são obrigatórios.' });
  }
  const novoMovimento = new Movement(item);
  await novoMovimento.save();
  res.status(201).json(novoMovimento);
});

app.put('/api/movements/:id', async (req, res) => {
  try {
    const item = await Movement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Movimento não encontrado.' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: 'ID inválido.' });
  }
});

app.delete('/api/movements/:id', async (req, res) => {
  try {
    const item = await Movement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Movimento não encontrado.' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'ID inválido.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});