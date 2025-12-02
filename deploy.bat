@echo off
echo ========================================
echo 保卫家园游戏 - GitHub Pages 部署脚本
echo ========================================

echo.
echo [1/4] 构建项目...
call npm run build
if errorlevel 1 (
    echo 构建失败！
    pause
    exit /b 1
)

echo.
echo [2/4] 进入dist目录...
cd dist

echo.
echo [3/4] 初始化Git并提交...
git init
git add -A
git commit -m "Deploy to GitHub Pages"

echo.
echo [4/4] 推送到GitHub...
git branch -M main
git push -f https://github.com/qq3029966535/lajifl.git main:gh-pages

cd ..

echo.
echo ========================================
echo 部署成功！
echo 访问: https://qq3029966535.github.io/lajifl/
echo 注意: 可能需要几分钟才能生效
echo ========================================
pause
