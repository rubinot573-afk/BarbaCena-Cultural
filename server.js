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

// Configuração do Multer (Armazenamento temporário em memória)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔒 MIDDLEWARE DE SEGURANÇA (SISTEMA DE LINK SEGURO)
const verificarAutenticacao = (req, res, next) => {
  const senhaCorreta = process.env.ADMIN_PASS || 'arte123';
  const senhaEnviada = req.query.senha || req.body.senha || req.headers['x-admin-key'];

  if (senhaEnviada === senhaCorreta) {
    return next();
  } else {
    return res.status(401).send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 100px; padding: 20px;">
        <h2 style="color: #6a0dad;">⚠️ Acesso Negado</h2>
        <p>Para entrar no painel, você precisa adicionar a sua senha no final do link.</p>
        <p>Exemplo: <strong>://onrender.com</strong></p>
      </div>
    `);
  }
};

// Rota protegida do painel admin
app.get('/admin', verificarAutenticacao, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve os demais arquivos estáticos do frontend públicos
app.use(express.static(path.join(__dirname)));

let usarBancoLocal = false;
let memoriaLocal = { theme: {}, news: [], gallery: [], movements: [] };

const mongoURI = process.env.mongoURI || "mongodb://127.0.0.1:27017/portal-da-arte";

mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log("🎉 Conectado ao MongoDB com sucesso! Suas notícias estão seguras.");
    usarBancoLocal = false;
  })
  .catch((erro) => {
    console.log("⚠️ Falha ao conectar ao MongoDB. Ativando modo local em memória.");
    usarBancoLocal = true;
  });

// Moldes (Schemas) do Banco de Dados
const NewsSchema = new mongoose.Schema({ title: String, content: String, date: String, image: String });
const News = mongoose.model('News', NewsSchema);

const GallerySchema = new mongoose.Schema({ title: String, image: String, description: String });
const Gallery = mongoose.model('Gallery', GallerySchema);

const MovementSchema = new mongoose.Schema({ name: String, category: String, image: String, description: String });
const Movement = mongoose.model('Movement', MovementSchema);

// ROTA GERAL PÚBLICA
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

// --- ROTAS DE NOTÍCIAS ---
app.get('/api/news', async (req, res) => {
  if (usarBancoLocal) return res.json(memoriaLocal.news);
  const news = await News.find();
  res.json(news);
});

app.post('/api/news', verificarAutenticacao, upload.single('imageFile'), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Campos obrigatórios.' });

    let imageUrl = req.body.image || ''; 

    if (req.file) {
      const uploadParaCloudinary = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'portal_da_arte_noticias' },
            (error, result) => {
              if (result) resolve(result.secure_url);
              else reject(error);
            }
          );
          stream.end(req.file.buffer);
        });
      };
      imageUrl = await uploadParaCloudinary();
    }

    const item = { title, content, image: imageUrl, date: new Date().toLocaleDateString('pt-BR') };

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
    res.status(500).json({ error: 'Erro interno ao salvar a notícia.' });
  }
});

app.delete('/api/news/:id', verificarAutenticacao, async (req, res) => {
  try {
    if (usarBancoLocal) {
      memoriaLocal.news = memoriaLocal.news.filter(n => n._id !== req.params.id);
      return res.status(204).send();
    }
    await News.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir notícia.' });
  }
});

// --- ROTAS DA GALERIA (CORRIGIDAS) ---
app.get('/api/gallery', async (req, res) => {
  if (usarBancoLocal) return res.json(memoriaLocal.gallery);
  const gallery = await Gallery.find();
  res.json(gallery);
});

app.post('/api/gallery', verificarAutenticacao, async (req, res) => {
  try {
    const item = req.body;
    if (usarBancoLocal) {
      item._id = 'local_' + Date.now();
      memoriaLocal.gallery.push(item);
      return res.status(201).json(item);
    }
    const novaFoto = new Gallery(item);
    await novaFoto.save();
    res.status(201).json(novaFoto);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar foto.' });
  }
});

// --- ROTAS DE MOVIMENTOS (RECUPERADAS PARA ELIMINAR O ERRO 404) ---
app.get('/api/movements', async (req, res) => {
  if (usarBancoLocal) return res.json(memoriaLocal.movements);
  const movements = await Movement.find();
  res.json(movements);
});

app.post('/api/movements', verificarAutenticacao, async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar movimento.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});