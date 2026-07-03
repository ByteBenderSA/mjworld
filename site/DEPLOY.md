# Hosting this site

This is a plain static site (`site/`). It is deployed to **GitHub Pages**
automatically by `.github/workflows/deploy-pages.yml`.

## One-time setup (repo owner)
1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.

That's it. After the workflow runs on `main`, the site is live at:
`https://<owner>.github.io/<repo>/`

## Triggering a deploy
- Push any change under `site/` to `main`, or
- Run the **"Deploy site to GitHub Pages"** workflow manually
  (Actions tab → Run workflow).

## Local preview
```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000
```
