# 保卫家园游戏 - GitHub Pages 发布指南

## 📦 方式1：手动发布到GitHub Pages

### 步骤1：构建项目
```bash
npm run build
```

### 步骤2：进入dist目录
```bash
cd dist
```

### 步骤3：初始化git仓库
```bash
git init
git add -A
git commit -m "部署到GitHub Pages"
```

### 步骤4：推送到gh-pages分支
```bash
git push -f https://github.com/qq3029966535/lajifl.git main:gh-pages
```

### 步骤5：在GitHub上启用Pages
1. 访问 https://github.com/qq3029966535/lajifl/settings/pages
2. 在 "Source" 下选择 "gh-pages" 分支
3. 点击 "Save"
4. 等待几分钟后，访问 https://qq3029966535.github.io/lajifl/

---

## 🚀 方式2：使用自动化脚本（推荐）

我已经为你创建了自动化部署脚本，只需运行：

```bash
# Windows PowerShell
.\deploy-to-github-pages.ps1

# 或者使用npm脚本
npm run deploy:gh-pages
```

---

## 🌐 方式3：使用Vercel（最简单）

### 步骤1：安装Vercel CLI
```bash
npm install -g vercel
```

### 步骤2：登录Vercel
```bash
vercel login
```

### 步骤3：部署
```bash
vercel --prod
```

访问Vercel提供的URL即可！

---

## 📱 方式4：使用Netlify

### 步骤1：安装Netlify CLI
```bash
npm install -g netlify-cli
```

### 步骤2：登录Netlify
```bash
netlify login
```

### 步骤3：部署
```bash
netlify deploy --prod --dir=dist
```

---

## 🎯 访问你的游戏

部署成功后，你可以通过以下方式访问：

- **GitHub Pages**: https://qq3029966535.github.io/lajifl/
- **Vercel**: 部署后会提供一个URL
- **Netlify**: 部署后会提供一个URL

---

## 🔄 更新游戏

每次修改代码后，重新运行部署命令即可更新：

```bash
npm run build
# 然后运行对应的部署命令
```

---

## 💡 提示

1. 确保 `vite.config.js` 中的 `base` 设置正确
2. GitHub Pages 可能需要几分钟才能生效
3. 如果遇到404错误，检查仓库设置中的Pages配置
4. Vercel和Netlify提供更快的部署和更好的性能
