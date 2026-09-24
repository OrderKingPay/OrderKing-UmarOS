# Supabase Cloud Database Integration
Write-Host "[1/3] Installing Supabase dependencies..."
npm install @supabase/supabase-js

Write-Host "[2/3] Writing environment variables placeholder..."
Add-Content .env.local "VITE_SUPABASE_URL=YOUR_SUPABASE_URL`nVITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY"

Write-Host "[3/3] Generating Database Client..."
New-Item -Force src/lib/db-cloud.ts -Value "import { createClient } from `"@supabase/supabase-js`";`nexport const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);"

Write-Host "Supabase Client configured. Database is ready for cloud migration."
