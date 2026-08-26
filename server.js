const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Configurações iniciais para ler JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos estáticos do frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Rota amigável para abrir a tela de admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Variáveis para o modo de testes caso o banco falhe
let usarBancoLocal = false;
let memoriaLocal = {
  theme: {},
  news: [],
  gallery: [],
  movements: []
};

// 🌟 DEFINIÇÃO DA VARIÁVEL: Puxa o link configurado no Render ou usa o local se estiver rodando no seu PC
const mongoURI = process.env.mongoURI || "mongodb://127.0.0.1:27017/portal-da-arte";

// Conexão com o MongoDB Atlas ou Local
mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log("🎉 Conectado ao MongoDB com sucesso! Suas notícias estão seguras agora.");
    usarBancoLocal = false;
  })
  .catch((erro) => {
    console.log("⚠️ Falha ao conectar ao MongoDB. Ativando modo local em memória para testes.");
    console.error("Detalhe do erro:", erro.message);
    usarBancoLocal = true;
  });

// Moldes (Schemas) do Banco de Dados
const NewsSchema = new mongoose.Schema({ title: String, content: String, date: String, image: String });
const News = mongoose.model('News', NewsSchema);

const GallerySchema = new mongoose.Schema({ title: String, image: String });
const Gallery = mongoose.model('Gallery', GallerySchema);

const MovementSchema = new mongoose.Schema({ name: String, category: String, image: String, description: String });
const Movement = mongoose.model('Movement', MovementSchema);

// ROTA GERAL: Carrega os dados locais ou do banco
app.get('/api/content', async (req, res) => {
  try {
    if (usarBancoLocal) {
      return res.json({ 
        theme: {}, 
        news: memoriaLocal.news, 
        gallery: memoriaLocal.gallery, 
        movements: memoriaLocal.movements 
      });
    }
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
  if (usarBancoLocal) return res.json(memoriaLocal.news);
  const news = await News.find();
  res.json(news);
});

app.post('/api/news', async (req, res) => {
  const item = req.body;
  if (!item.title || !item.content) return res.status(400).json({ error: 'Campos obrigatórios.' });
  item.date = new Date().toLocaleDateString('pt-BR');
  
  if (usarBancoLocal) {
    item._id = 'local_' + Date.now();
    memoriaLocal.news.push(item);
    return res.status(201).json(item);
  }
  const novaNoticia = new News(item);
  await novaNoticia.save();
  res.status(201).json(novaNoticia);
});

app.put('/api/news/:id', async (req, res) => {
  if (usarBancoLocal) {
    const idx = memoriaLocal.news.findIndex(n => n._id === req.params.id);
    if (idx !== -1) memoriaLocal.news[idx] = { ...memoriaLocal.news[idx], ...req.body };
    return res.json(memoriaLocal.news[idx]);
  }
  const item = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});

app.delete('/api/news/:id', async (req, res) => {
  if (usarBancoLocal) {
    memoriaLocal.news = memoriaLocal.news.filter(n => n._id !== req.params.id);
    return res.status(204).send();
  }
  await News.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// --- ROTAS DA GALERIA ---
app.get('/api/gallery', async (req, res) => {
  if (usarBancoLocal) return res.json(memoriaLocal.gallery);
  const gallery = await Gallery.find();
  res.json(gallery);
});

app.post('/api/gallery', async (req, res) => {
  const item = req.body;
  if (usarBancoLocal) {
    item._id = 'local_' + Date.now();
    memoriaLocal.gallery.push(item);
    return res.status(201).json(item);
  }
  const novaFoto = new Gallery(item);
  await novaFoto.save();
  res.status(201).json(novaFoto);
});

app.put('/api/gallery/:id', async (req, res) => {
  if (usarBancoLocal) {
    const idx = memoriaLocal.gallery.findIndex(g => g._id === req.params.id);
    if (idx !== -1) memoriaLocal.gallery[idx] = { ...memoriaLocal.gallery[idx], ...req.body };
    return res.json(memoriaLocal.gallery[idx]);
  }
  const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});

// --- ROTAS DE MOVIMENTOS ---
app.get('/api/movements', async (req, res) => {
  if (usarBancoLocal) return res.json(memoriaLocal.movements);
  const movements = await Movement.find();
  res.json(movements);
});

app.post('/api/movements', async (req, res) => {
  const item = req.body;
  if (!item.name || !item.description) return res.status(400).json({ error: 'Campos obrigatórios.' });
  
  if (usarBancoLocal) {
    item._id = 'local_' + Date.now();
    memoriaLocal.movements.push(item);
    return res.status(201).json(item);
  }
  const novoMovimento = new Movement(item);
  await novoMovimento.save();
  res.status(201).json(novoMovimento);
});

app.put('/api/movements/:id', async (req, res) => {
  if (usarBancoLocal) {
    const idx = memoriaLocal.movements.findIndex(m => m._id === req.params.id);
    if (idx !== -1) memoriaLocal.movements[idx] = { ...memoriaLocal.movements[idx], ...req.body };
    return res.json(memoriaLocal.movements[idx]);
  }
  const item = await Movement.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});

app.delete('/api/movements/:id', async (req, res) => {
  if (usarBancoLocal) {
    memoriaLocal.movements = memoriaLocal.movements.filter(m => m._id !== req.params.id);
    return res.status(204).send();
  }
  await Movement.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Inicialização do servidor na porta correta do Render
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
