# 🚀 保卫家园游戏 - 发布指南

## 快速开始

### 🎯 最简单的方式：一键部署到GitHub Pages

```bash
npm run deploy:gh-pages
```

然后访问: https://qq3029966535.github.io/lajifl/

---

## 📋 详细发布方式

### 方式1️⃣: GitHub Pages（免费，推荐）

**优点**: 免费、稳定、自动HTTPS
**缺点**: 需要几分钟生效

```bash
# 一键部署
npm run deploy:gh-pages

# 或手动部署
npm run build
cd dist
git init
git add -A
git commit -m "deploy"
git push -f https://github.com/qq3029966535/lajifl.git main:gh-pages
cd ..
```

**配置GitHub Pages**:
1. 访问: https://github.com/qq3029966535/lajifl/settings/pages
2. Source选择: `gh-pages` 分支
3. 点击Save
4. 等待3-5分钟后访问: https://qq3029966535.github.io/lajifl/

---

### 方式2️⃣: Vercel（最快，推荐）

**优点**: 部署快、性能好、自动HTTPS、CDN加速
**缺点**: 需要注册账号

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录（首次使用）
vercel login

# 部署
vercel --prod
```

部署后会得到一个类似 `https://your-game.vercel.app` 的URL

---

### 方式3️⃣: Netlify（简单易用）

**优点**: 界面友好、功能强大、自动HTTPS
**缺点**: 需要注册账号

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 登录（首次使用）
netlify login

# 部署
netlify deploy --prod --dir=dist
```

---

### 方式4️⃣: 本地服务器（测试用）

```bash
# 开发模式
npm run dev

# 预览生产构建
npm run build
npm run preview
```

---

## 🔄 更新游戏

修改代码后，重新运行部署命令即可：

```bash
# GitHub Pages
npm run deploy:gh-pages

# Vercel
vercel --prod

# Netlify
npm run build && netlify deploy --prod --dir=dist
```

---

## 🌐 访问地址

部署成功后，你的游戏可以通过以下地址访问：

- **GitHub Pages**: https://qq3029966535.github.io/lajifl/
- **Vercel**: 部署后提供的URL
- **Netlify**: 部署后提供的URL
- **本地**: http://localhost:3000 (开发模式)

---

## 🛠️ 故障排除

### GitHub Pages显示404
1. 检查仓库设置中Pages是否启用
2. 确认选择了正确的分支（gh-pages）
3. 等待3-5分钟让GitHub处理

### 构建失败
```bash
# 清理缓存重新构建
npm run clean
npm install
npm run build
```

### 推送失败
```bash
# 检查GitHub权限
git remote -v

# 重新设置远程仓库
git remote set-url origin https://github.com/qq3029966535/lajifl.git
```

---

## 📱 分享你的游戏

部署成功后，你可以：
1. 分享URL给朋友
2. 在社交媒体上发布
3. 添加到你的简历或作品集
4. 嵌入到其他网站

---

## 💡 提示

- 首次部署可能需要几分钟
- 建议使用Vercel或Netlify获得最佳性能
- GitHub Pages适合长期稳定托管
- 记得在每次更新后重新部署

---

## 🎮 开始游戏开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm run test

# 部署
npm run deploy:gh-pages
```

祝你游戏发布顺利！🎉
