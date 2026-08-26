const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 10000;

// Configurações do Cloudinary (Puxando as chaves do Render)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuração do Multer (Armazenamento temporário em memória para envio rápido)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔒 MIDDLEWARE DE SEGURANÇA
const verificarAutenticacao = (req, res, next) => {
  const usuarioCorreto = process.env.ADMIN_USER;
  const senhaCorreta = process.env.ADMIN_PASS;

  if (!usuarioCorreto || !senhaCorreta) {
    console.log("⚠️ Variáveis de login não configuradas. Segurança desativada para testes.");
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Área Restrita"');
    return res.status(401).send('Acesso negado.');
  }

  const auth = Buffer.from(authHeader.split(' '), 'base64').toString().split(':');
  if (auth[0] === usuarioCorreto && auth[1] === senhaCorreta) {
    return next();
  } else {
    res.setHeader('WWW-Authenticate', 'Basic realm="Área Restrita"');
    return res.status(401).send('Usuário ou senha incorretos.');
  }
};

app.get('/admin', verificarAutenticacao, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.use(express.static(path.join(__dirname)));

let usarBancoLocal = false;
let memoriaLocal = { theme: {}, news: [], gallery: [], movements: [] };

const mongoURI = process.env.mongoURI || "mongodb://127.0.0.1:27017/portal-da-arte";

mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log("🎉 Conectado ao MongoDB com sucesso!");
    usarBancoLocal = false;
  })
  .catch((erro) => {
    console.log("⚠️ Falha ao conectar ao MongoDB. Ativando modo local em memória.");
    usarBancoLocal = true;
  });

const NewsSchema = new mongoose.Schema({ title: String, content: String, date: String, image: String });
const News = mongoose.model('News', NewsSchema);

const GallerySchema = new mongoose.Schema({ title: String, image: String });
const Gallery = mongoose.model('Gallery', GallerySchema);

const MovementSchema = new mongoose.Schema({ name: String, category: String, image: String, description: String });
const Movement = mongoose.model('Movement', MovementSchema);

app.get('/api/content', async (req, res) => {
  try {
    if (usarBancoLocal) return res.json({ theme: {}, news: memoriaLocal.news, gallery: memoriaLocal.gallery, movements: memoriaLocal.movements });
    const news = await News.find();
    const gallery = await Gallery.find();
    const movements = await Movement.find();
    res.json({ theme: {}, news, gallery, movements });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conteúdo geral.' });
  }
});

app.get('/api/news', async (req, res) => {
  if (usarBancoLocal) return res.json(memoriaLocal.news);
  const news = await News.find();
  res.json(news);
});

// 🔒 🖼️ ROTA DE CRIAÇÃO ATUALIZADA: Suporta envio de arquivos de imagem
app.post('/api/news', verificarAutenticacao, upload.single('imageFile'), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Campos obrigatórios.' });

    let imageUrl = req.body.image || ''; // Fallback caso enviem um link de texto direto

    // Se o usuário fez upload de um arquivo físico do computador/celular
    if (req.file) {
      // Converte o arquivo em formato aceito pelo Cloudinary e faz o upload
      const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
        folder: 'portal_da_arte_noticias', // Cria uma pasta organizada dentro do seu Cloudinary
      });
      imageUrl = uploadResponse.secure_url; // Substitui pelo link permanente gerado na nuvem!
    }

    const item = {
      title,
      content,
      image: imageUrl,
      date: new Date().toLocaleDateString('pt-BR')
    };

    if (usarBancoLocal) {
      item._id = 'local_' + Date.now();
      memoriaLocal.news.push(item);
      return res.status(201).json(item);
    }

    const novaNoticia = new News(item);
    await novaNoticia.save();
    res.status(201).json(novaNoticia);
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: 'Erro interno ao salvar a notícia com imagem.' });
  }
});

// Mantive as demais rotas padrão de edição e deleção
app.put('/api/news/:id', verificarAutenticacao, async (req, res) => {
  if (usarBancoLocal) {
    const idx = memoriaLocal.news.findIndex(n => n._id === req.params.id);
    if (idx !== -1) memoriaLocal.news[idx] = { ...memoriaLocal.news[idx], ...req.body };
    return res.json(memoriaLocal.news[idx]);
  }
  const item = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});

app.delete('/api/news/:id', verificarAutenticacao, async (req, res) => {
  if (usarBancoLocal) {
    memoriaLocal.news = memoriaLocal.news.filter(n => n._id !== req.params.id);
    return res.status(204).send();
  }
  await News.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});