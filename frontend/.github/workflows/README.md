# Frontend CI/CD Pipeline

## Setup Instructions

This pipeline automatically deploys the frontend to Vercel whenever code is pushed to `main` branch.

### Required GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secret:

| Secret Name    | Value               | Where to Get                                                                      |
| -------------- | ------------------- | --------------------------------------------------------------------------------- |
| `VERCEL_TOKEN` | `your_vercel_token` | [Vercel Dashboard → Account Settings → Tokens](https://vercel.com/account/tokens) |

### How to Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `GitHub Actions CI/CD`
4. Scope: Full Access (or limit to specific projects)
5. Expiration: No Expiration (or set custom)
6. Copy the token and add to GitHub secrets

### Required Vercel Configuration

Make sure your Vercel project is linked:

```bash
# Run this locally once to link the project
cd frontend
vercel link
```

This creates `.vercel` directory with project configuration. Commit it:

```bash
git add .vercel
git commit -m "Add Vercel project configuration"
git push
```

### Environment Variables

Update Vercel environment variables via dashboard:

1. Go to https://vercel.com/dashboard
2. Select project: `funnychistoso-panel`
3. Settings → Environment Variables
4. Add/Update:

   ```
   NEXT_PUBLIC_API_URL = http://4.246.65.152:8080
   NEXT_PUBLIC_WS_URL = ws://4.246.65.152:8080/ws
   ```

   Or if using Cloudflare Tunnel:

   ```
   NEXT_PUBLIC_API_URL = https://your-cloudflare-url
   NEXT_PUBLIC_WS_URL = wss://your-cloudflare-url/ws
   ```

5. Click "Save"
6. **Important**: Redeploy from Vercel dashboard or push to trigger new deployment

### How It Works

1. **Trigger**: Runs on push to `main` or manual dispatch
2. **Install**: Installs Vercel CLI
3. **Pull**: Downloads Vercel project configuration
4. **Build**: Builds Next.js production bundle
5. **Deploy**: Deploys to Vercel production environment

### Manual Deployment

To trigger manually:

1. Go to Actions tab
2. Select "Deploy Frontend to Vercel" workflow
3. Click "Run workflow" → select branch → "Run workflow"

### Local Deployment

Deploy from your machine:

```bash
cd frontend
vercel --prod
```

Or use Vercel CLI for staging:

```bash
vercel  # Deploy to preview URL
```

### Troubleshooting

If deployment fails:

1. **"Project not found"**: Run `vercel link` locally and commit `.vercel` directory
2. **"Invalid token"**: Regenerate token at https://vercel.com/account/tokens
3. **"Build failed"**: Check Next.js build errors in GitHub Actions logs
4. **"Environment variables missing"**: Set them in Vercel dashboard

### Testing Deployment

After successful deployment:

```bash
# Test production site
curl https://funnychistoso-panel.vercel.app

# Test API connection (should work after env vars updated)
# Visit: https://funnychistoso-panel.vercel.app
# Try logging in with: admin / uHYhP$pfIq1XQGnR
```

### Deployment URL

Production: https://funnychistoso-panel.vercel.app

Each deployment also gets a unique preview URL for testing before going live.
