# DM122 • Progressive Web App

PWA simples com Service Worker (Cache Storage) e IndexedDB (CRUD) — instalável e funcional totalmente offline após a instalação.

## Requisitos atendidos
- Cache Storage: `sw.js` faz pre-cache dos arquivos estáticos e cache-first para GET de mesma origem.
- IndexedDB CRUD: `db.js` implementa `addItem`, `getItems`, `updateItem`, `deleteItem`.
- Instalação (PWA): `manifest.webmanifest`, registro do Service Worker e botão de instalação via `beforeinstallprompt`.
- Controle de versão e implantação: pronto para GitHub + GitHub Pages (workflow opcional incluído).

## Como executar localmente (macOS / zsh)
Service Workers exigem HTTP/HTTPS (não funciona em `file://`). Use um servidor simples:

```sh
cd /Users/kenzo_umezawa/Documents/Code/Personal/DM121
python3 -m http.server 5173
```

Abra em: http://localhost:5173

## Estrutura
- `index.html`: UI com formulário e lista de itens.
- `styles.css`: estilos.
- `app.js`: lógica da UI, registro do SW e instalação.
- `db.js`: CRUD no IndexedDB.
- `sw.js`: pré-cache e estratégia offline.
- `manifest.webmanifest`: metadados do app e ícones (placeholders remotos).

## Deploy (GitHub Pages)
1. Faça commit e push para o GitHub em `master` (ou `main`).
2. Ative GitHub Pages no repositório (Settings → Pages → Source: GitHub Actions).
3. Use o workflow em `.github/workflows/deploy.yml` (já incluso). Na primeira execução, o Pages será publicado automaticamente.

Após publicado, o app poderá ser instalado e usado offline. Como os ícones usam URLs externas (placeholder), eles também serão baixados e colocados no cache ao serem requisitados.

## Alternativas de implantação
- Vercel/Netlify: importe o repositório e publique como site estático. Não há build step.

## Observações
- Para repositórios hospedados em subcaminho (GitHub Pages), o `manifest` e o `Service Worker` usam caminhos relativos para evitar problemas de escopo.
- Ícones: substitua os placeholders por PNGs próprios em `icons/` e ajuste `manifest.webmanifest` se desejar.