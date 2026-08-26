const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Configurações iniciais para ler JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔒 FUNÇÃO DE SEGURANÇA (MIDDLEWARE)
// Ela barra qualquer um que não envie o usuário e a senha corretos do Render
const verificarAutenticacao = (req, res, next) => {
  const usuarioCorreto = process.env.ADMIN_USER;
  const senhaCorreta = process.env.ADMIN_PASS;

  // Se você não configurou no Render ainda, ele avisa no terminal mas deixa passar para testes locais
  if (!usuarioCorreto || !senhaCorreta) {
    console.log("⚠️ Variáveis ADMIN_USER ou ADMIN_PASS não configuradas. Segurança temporariamente desativada.");
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Área Restrita"');
    return res.status(401).send('Acesso negado. Usuário ou senha necessários.');
  }

  // Decodifica o usuário e senha enviados pelo navegador
  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const usuarioEnviado = auth[0];
  const senhaEnviada = auth[1];

  // Compara para ver se o login está correto
  if (usuarioEnviado === usuarioCorreto && senhaEnviada === senhaCorreta) {
    return next(); // Login correto! Pode prosseguir.
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Área Restrita"');
    return res.status(401).send('Usuário ou senha incorretos.');
  }
};

// 🔒 PROTEÇÃO DA ROTA ADMIN: Só abre o painel se passar na segurança
app.get('/admin', verificarAutenticacao, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve os demais arquivos estáticos do frontend (HTML, CSS, JS da parte pública)
app.use(express.static(path.join(__dirname)));

// Variáveis para o modo de testes caso o banco falhe
let usarBancoLocal = false;
let memoriaLocal = { theme: {}, news: [], gallery: [], movements: [] };

// DEFINIÇÃO DA VARIÁVEL DO MONGO
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

// ROTA GERAL PÚBLICA
app.get('/api/content', async (req, res) => {
  try {
    if (usarBancoLocal) {
      return res.json({ theme: {}, news: memoriaLocal.news, gallery: memoriaLocal.gallery, movements: memoriaLocal.movements });
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

// 🔒 PROTEGIDO: Só cria notícia se estiver logado
app.post('/api/news', verificarAutenticacao, async (req, res) => {
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

// 🔒 PROTEGIDO: Só edita se estiver logado
app.put('/api/news/:id', verificarAutenticacao, async (req, res) => {
  if (usarBancoLocal) {
    const idx = memoriaLocal.news.findIndex(n => n._id === req.params.id);
    if (idx !== -1) memoriaLocal.news[idx] = { ...memoriaLocal.news[idx], ...req.body };
    return res.json(memoriaLocal.news[idx]);
  }
  const item = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});

// 🔒 PROTEGIDO: Só deleta se estiver logado
app.delete('/api/news/:id', verificarAutenticacao, async (req, res) => {
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

// 🔒 PROTEGIDO
app.post('/api/gallery', verificarAutenticacao, async (req, res) => {
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

// --- ROTAS DE MOVIMENTOS ---
app.get('/api/movements', async (req, res) => {
  if (usarBancoLocal) return res.json(memoriaLocal.movements);
  const movements = await Movement.find();
  res.json(movements);
});

// 🔒 PROTEGIDO
app.post('/api/movements', verificarAutenticacao, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});