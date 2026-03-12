# Cloudflare Pages + Decap CMS Setup

Ce projet est prêt pour un déploiement statique depuis le dossier `public/`.

## 1) Préparer le repo

- Vérifie que les pages statiques existent :
  - `public/index.html`
  - `public/projects.html`
  - `public/project.html`
- Vérifie les données CMS :
  - `public/data/projects.json`
- Vérifie l'admin CMS :
  - `public/admin/index.html`
  - `public/admin/config.yml`

## 2) Configurer Decap CMS

Le fichier `public/admin/config.yml` contient :

- `backend.name: github`
- `backend.repo: FlorianBouteille/neo_portfolio`
- `backend.branch: main`

Adapte `repo` et `branch` si nécessaire.

## 3) Configurer l'auth GitHub OAuth pour Decap

Le projet contient déjà un Worker OAuth prêt à déployer dans `oauth-worker/`.

Étapes:

1. Créer une GitHub OAuth App
  - Homepage URL: `https://<ton-site>.pages.dev`
  - Callback URL: `https://<ton-worker>.workers.dev/callback`
2. Déployer le Worker OAuth
  - `cd oauth-worker`
  - `wrangler login`
  - `wrangler secret put GITHUB_CLIENT_ID`
  - `wrangler secret put GITHUB_CLIENT_SECRET`
  - `wrangler deploy`
3. Mettre à jour `public/admin/config.yml`
  - `base_url: https://<ton-worker>.workers.dev`
  - `auth_endpoint: auth`

Sans OAuth, l'interface `/admin` s'ouvre mais ne peut pas pousser de commits.

## 4) Déployer sur Cloudflare Pages

Dans Cloudflare Pages :

- Connecte ton repo GitHub
- Build command : *(vide)*
- Build output directory : `public`
- Framework preset : `None`

Cloudflare Pages gère déjà les URLs propres pour les fichiers `.html`.

Exemples attendus sans fichier `_redirects` :
- `/projects` sert `projects.html`
- `/project` sert `project.html`
- `/admin` sert `admin/index.html`

Important: ne pas ajouter de règle `_redirects` du type `/projects /projects.html 200`
si la fonctionnalité Pretty URLs est active, sinon ça peut créer une boucle de redirection.

## 5) Vérifier le workflow

- Ouvre `/projects`
- Clique une bulle pour ouvrir `/project?title=...`
- Ouvre `/admin`
- Ajoute / modifie / supprime un projet
- Vérifie qu'un commit est créé et que Pages redéploie

## 6) Images

Configuration actuelle :
- `media_folder: public/uploads`
- `public_folder: /uploads`

Donc les images sont versionnées dans le repo.

Si tu veux les sortir du repo plus tard, on peut migrer vers R2.
