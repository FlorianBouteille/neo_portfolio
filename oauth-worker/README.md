# Decap OAuth Worker (Cloudflare)

Petit Worker OAuth GitHub pour Decap CMS.

## 1) Prérequis

- Un repo GitHub (ce portfolio)
- Une GitHub OAuth App
- Wrangler installé (`npm i -g wrangler`)

## 2) Créer l'app GitHub OAuth

Dans GitHub > Settings > Developer settings > OAuth Apps > New OAuth App:

- Homepage URL: `https://<ton-site-pages>.pages.dev`
- Authorization callback URL: `https://<ton-worker>.workers.dev/callback`

Récupère:
- `Client ID`
- `Client Secret`

## 3) Déployer le Worker

Depuis `oauth-worker/`:

```bash
wrangler login
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler deploy
```

## 4) Brancher Decap CMS

Dans `public/admin/config.yml`, configure:

```yml
backend:
  name: github
  repo: FlorianBouteille/neo_portfolio
  branch: main
  base_url: https://<ton-worker>.workers.dev
  auth_endpoint: auth
```

## 5) Vérification

- Ouvre `/admin`
- Clique login GitHub
- Autorise l'app
- Vérifie que tu peux modifier `public/data/projects.json`

## 6) Sécurité minimale

- Utilise Cloudflare Access pour restreindre `/admin`
- N'autorise que ton compte GitHub dans l'organisation/repo
