# 保卫家园游戏 - GitHub Pages 自动部署脚本

Write-Host "开始部署保卫家园游戏到GitHub Pages..." -ForegroundColor Green

# 1. 构建项目
Write-Host "步骤1: 构建项目..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败！" -ForegroundColor Red
    exit 1
}

Write-Host "构建成功！" -ForegroundColor Green

# 2. 进入dist目录
Write-Host "步骤2: 进入dist目录..." -ForegroundColor Cyan
Set-Location dist

# 3. 初始化git仓库
Write-Host "步骤3: 初始化git仓库..." -ForegroundColor Cyan
git init
git add -A
$commitMsg = "部署到GitHub Pages - " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
git commit -m $commitMsg

# 4. 推送到gh-pages分支
Write-Host "步骤4: 推送到GitHub..." -ForegroundColor Cyan
git push -f https://github.com/qq3029966535/lajifl.git main:gh-pages

if ($LASTEXITCODE -ne 0) {
    Write-Host "推送失败！请检查GitHub仓库权限。" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 5. 返回项目根目录
Set-Location ..

Write-Host "部署成功！" -ForegroundColor Green
Write-Host "访问你的游戏: https://qq3029966535.github.io/lajifl/" -ForegroundColor Yellow
Write-Host "注意: GitHub Pages可能需要几分钟才能生效。" -ForegroundColor Yellow
