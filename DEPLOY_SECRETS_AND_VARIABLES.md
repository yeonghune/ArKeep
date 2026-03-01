# Deploy Secrets and Variables Checklist

This document maps what to register for the current workflows:
- `.github/workflows/ghcr-images.yml`
- `.github/workflows/deploy-prod.yml`
- `docker-compose.prod.yml`

Do not commit real secret values to git.

## 1) GitHub Repository Secrets

Required by GitHub Actions:

`NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Source: `../ArKeepConfig/secret.txt` -> `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Used in frontend image build arg.

`SSH_HOST`
- Source: `218.50.85.125`

`SSH_USER`
- Source: `hun`

`SSH_PORT`
- Source: your SSH port (usually `22`)
- Recommended value: `22`

`SSH_PRIVATE_KEY`
- Source: private key content from `~/.ssh/id_ed25519`
- Paste full multiline key including `BEGIN/END`.

`SSH_APP_DIR`
- Source: absolute path on server where deployment files will be uploaded.
- Example: `/home/hun/ArKeep`

`GHCR_USERNAME`
- Source: GitHub owner/user for GHCR (example: `yeonghune`).

`GHCR_TOKEN`
- Source: PAT with at least `read:packages` scope.

## 2) GitHub Repository Variables

`NEXT_PUBLIC_API_BASE_URL`
- Recommended value: `/backend`
- Used in frontend build arg.

## 3) Server .env for docker-compose.prod.yml

Create/update `.env` next to `docker-compose.prod.yml` on Ubuntu server:

`SPRING_DATASOURCE_URL`
- Example with external DB service: `jdbc:postgresql://db:5432/ARKEEP_PROD`

`SPRING_DATASOURCE_USERNAME`
- Source: use DB user value.

`SPRING_DATASOURCE_PASSWORD`
- Source: `../ArKeepConfig/secret.txt` -> `POSTGRES_PASSWORD`

`JWT_SECRET`
- Source: `../ArKeepConfig/secret.txt` -> `JWT_SECRET`

`GOOGLE_CLIENT_IDS`
- Source: `../ArKeepConfig/secret.txt` -> `GOOGLE_CLIENT_IDS`

`CORS_ALLOWED_ORIGINS`
- Source: `../ArKeepConfig/secret.txt` -> `CORS_ALLOWED_ORIGINS`

`BACKEND_ORIGIN`
- Recommended: `http://backend:8080`

`NEXT_PUBLIC_API_BASE_URL`
- Recommended: `/backend`

`NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Source: `../ArKeepConfig/secret.txt` -> `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

`NGINX_PORT`
- Recommended: `8080`

`PROD_DOCKER_NETWORK`
- Recommended: `arkeep-prod-net` (must exist on server)

Optional:

`GHCR_OWNER`
- Default in compose is `yeonghune`. Set only if owner differs.

`IMAGE_TAG`
- Default is `latest`. Set when you want fixed tag deployment (example: `sha-xxxxxxx`).

## 4) gh CLI Commands (manual input)

Set variable:

```bash
gh variable set NEXT_PUBLIC_API_BASE_URL --body "/backend"
```

Set secrets:

```bash
gh secret set NEXT_PUBLIC_GOOGLE_CLIENT_ID --body "<value>"
gh secret set SSH_HOST --body "218.50.85.125"
gh secret set SSH_USER --body "hun"
gh secret set SSH_PORT --body "22"
gh secret set SSH_APP_DIR --body "<value>"
gh secret set GHCR_USERNAME --body "yeonghune"
gh secret set GHCR_TOKEN --body "<value>"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/id_ed25519
```

## 5) What you already have in ../ArKeepConfig/secret.txt

Present keys:
- `GOOGLE_CLIENT_IDS`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `CORS_ALLOWED_ORIGINS`
- `JWT_SECRET`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Use them as source values for:
- GitHub Secret: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Server `.env`: `GOOGLE_CLIENT_IDS`, `CORS_ALLOWED_ORIGINS`, `JWT_SECRET`, DB credentials.
