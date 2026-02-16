# CSESA Committee — Deploying to GitHub Pages

This repository contains a static website (HTML/CSS/JS). Below are quick steps to publish it using GitHub Pages.

1) Initialize the local repo and push to GitHub (recommended: use `gh` CLI)

PowerShell example using `gh` (recommended):

```powershell
git init
git add .
git commit -m "Initial site commit"
# create a public repo and push current folder as the source
gh repo create <USERNAME>/<REPO-NAME> --public --source=. --remote=origin --push
```

If you don't have `gh`, create a repo on github.com then run:

```powershell
git remote add origin https://github.com/<USERNAME>/<REPO-NAME>.git
git branch -M main
git push -u origin main
```

2) Automatic deployment

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that runs on pushes to `main` and publishes the repository root to the `gh-pages` branch. GitHub Pages can serve that branch as the site source.

3) Enable Pages (one-time)

- Go to your repository on GitHub → Settings → Pages.
- Under "Build and deployment", ensure the branch is set to `gh-pages` (the workflow creates/updates it).
- Save — your site will be available at `https://<USERNAME>.github.io/<REPO-NAME>/` within a minute.

Notes
- The workflow uses the `GITHUB_TOKEN` to push the `gh-pages` branch automatically.
- If you prefer the simpler route, you can set GitHub Pages to serve from the `main` branch `/ (root)` instead of using the workflow — but the workflow is useful when you want to build or exclude files before publishing.

Need me to create the remote repository for you using the GitHub CLI? I can provide the exact command to run locally or create additional CI tweaks (CNAME, index redirects, etc.).
