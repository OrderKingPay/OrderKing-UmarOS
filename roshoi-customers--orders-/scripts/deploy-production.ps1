# Deploy to Vercel and Database Migration
Write-Host "[1/3] Installing Vercel CLI..."
npm install -g vercel

Write-Host "[2/3] Linking project to Vercel..."
vercel link --yes

Write-Host "[3/3] Deploying to Production Edge..."
vercel deploy --prod

Write-Host "Deployment Complete! The system is now live on the global edge."
