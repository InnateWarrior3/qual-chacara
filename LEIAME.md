# Qual chácara? · como colocar no ar

São duas partes: a **planilha** que guarda os votos e o **GitHub Pages** que hospeda o site. Leva uns 10 minutos.

## 1. Planilha de votos (Google)

1. Acesse sheets.new e crie uma planilha em branco. Pode chamar de "Votos chácara".
2. Menu **Extensões → Apps Script**.
3. Apague o que estiver lá, cole todo o conteúdo de `apps-script.gs` e salve (ícone de disquete).
4. Clique em **Implantar → Nova implantação**.
   - Engrenagem ao lado de "Selecione o tipo": **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Clique em **Implantar**, autorize com a sua conta Google (vai aparecer "app não verificado": Avançado → Acessar).
6. Copie a **URL do app da Web** (termina em `/exec`).
7. Abra `config.js` e cole a URL entre as aspas de `window.VOTOS_URL = "";`.

Cada voto vira uma linha na planilha. Se a pessoa votar de novo, vale o último envio.

## 2. Site no GitHub Pages

1. Em github.com, crie um repositório **público** chamado `qual-chacara` (sem README).
2. Envie os arquivos desta pasta (comandos abaixo, ou arraste os arquivos em "uploading an existing file").
3. No repositório: **Settings → Pages → Branch: main / (root) → Save**.
4. Em 1–2 minutos o site fica em `https://SEU-USUARIO.github.io/qual-chacara/`.

```bash
git push -u origin main
```

## Como usar

- Cada amigo abre o link, digita o nome, vê as chácaras e manda o ranking no fim da página.
- Entrando com o nome **Henrique Bonitão** aparece o **Painel do Henrique** com o placar geral (1º = 5 pts … 5º = 1 pt), posição média e o voto de cada um.

## Avisos

- Qualquer um que digitar "Henrique Bonitão" vê o painel. Para 10 amigos tudo bem; é só não espalhar o nome secreto 😉.
- A URL da planilha fica pública no `config.js`. Ela só aceita votos no formato certo e não dá acesso à sua conta, mas quem tiver o link consegue ler os votos.
- O repositório é público: fotos dos anúncios e preços ficam visíveis para quem achar o link.
- Testar no computador: `node servidor.mjs` e abrir http://localhost:8080. Sem a URL da planilha o site funciona em modo de teste (votos só no próprio navegador).
