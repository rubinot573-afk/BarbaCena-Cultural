# Portal da Arte

Projeto com backend simples para publicar notícias, fotos e movimentos artísticos em qualquer navegador.

## Como iniciar localmente

1. Abra o terminal na pasta do projeto:
   `c:\Users\Rafael\Desktop\Arte-Portal\portal-da-arte`
2. Instale as dependências:
   `npm install`
3. Execute o servidor:
   `npm start`
4. Abra no navegador:
   `http://localhost:3000`

## Como acessar o painel de administração

1. Acesse `http://localhost:3000/admin.html`
2. Digite a senha: `arte123`
3. Use as abas de Notícias, Fotos e Movimentos para criar e editar conteúdo.

## O que mudou

- `index.html` passa a carregar conteúdo do servidor em vez do navegador local.
- `admin.html` salva notícias, fotos e movimentos na API do servidor.
- Os dados ficam armazenados em `data.json` no servidor.

## Como publicar no GitHub e Render

1. Crie um repositório no GitHub e anote o link.
2. No terminal da pasta do projeto:
   - `git init`
   - `git add .`
   - `git commit -m "Primeiro commit do portal da arte"`
   - `git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git`
   - `git push -u origin main`
3. No Render (`https://render.com`):
   - Crie um novo Web Service.
   - Conecte ao repositório GitHub.
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Copie o link público do Render para usar no Instagram.
