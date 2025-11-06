#!/bin/bash
# Vercel Deployment Script

echo "🚀 Preparing for Vercel Deployment"

cd /root/repos/scratchpad/projects/github-portfolio/portfolio/frontend

echo "📦 Building project..."
npm run build

if [ ! -d ".next" ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build complete!"
echo ""
echo "📤 Deployment Options:"
echo ""
echo "Option 1: Vercel Dashboard (Recommended)"
echo "1. Go to: https://vercel.com/new"
echo "2. Click: 'Import Git Repository' OR 'Browse' to upload"
echo "3. If GitHub: Connect repo → Select github-portfolio"
echo "4. Set Root Directory: portfolio/frontend"
echo "5. Click: Deploy"
echo ""
echo "Option 2: Try CLI again"
echo "vercel login"
echo "vercel --prod"
echo ""
echo "Project ready in: $(pwd)"

