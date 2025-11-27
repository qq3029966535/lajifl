# 生态防御游戏 - 部署文档

## 概述

本文档描述了生态防御游戏的部署流程和配置。游戏支持多种部署方式，包括传统服务器部署、Docker容器化部署和云平台部署。

## 系统要求

### 最低要求
- **CPU**: 1核心
- **内存**: 512MB RAM
- **存储**: 100MB 可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **CPU**: 2核心或更多
- **内存**: 1GB RAM 或更多
- **存储**: 1GB 可用空间
- **网络**: 高速互联网连接

### 软件依赖
- Node.js 16+ 
- npm 8+
- Nginx 1.18+
- Git 2.0+

## 部署方式

### 1. 传统服务器部署

#### 准备工作
```bash
# 克隆项目
git clone https://github.com/your-org/eco-defense-game.git
cd eco-defense-game

# 安装依赖
npm install
```

#### 构建项目
```bash
# 运行测试
npm test

# 构建生产版本
npm run build
```

#### 部署到服务器
```bash
# 使用部署脚本
chmod +x deploy/scripts/deploy.sh
sudo ./deploy/scripts/deploy.sh
```

#### 手动部署步骤
```bash
# 1. 复制构建文件
sudo cp -r dist/* /var/www/eco-defense-game/

# 2. 配置Nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/eco-defense-game
sudo ln -s /etc/nginx/sites-available/eco-defense-game /etc/nginx/sites-enabled/

# 3. 重启Nginx
sudo systemctl restart nginx
```

### 2. Docker容器化部署

#### 构建Docker镜像
```bash
# 构建镜像
docker build -f deploy/docker/Dockerfile -t eco-defense-game:latest .

# 运行容器
docker run -d -p 80:8080 --name eco-defense-game eco-defense-game:latest
```

#### 使用Docker Compose
```bash
# 启动所有服务
cd deploy/docker
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f eco-defense-game
```

### 3. 云平台部署

#### Vercel部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署到Vercel
vercel --prod
```

#### Netlify部署
```bash
# 安装Netlify CLI
npm i -g netlify-cli

# 部署到Netlify
netlify deploy --prod --dir=dist
```

#### AWS S3 + CloudFront部署
```bash
# 安装AWS CLI
pip install awscli

# 同步到S3
aws s3 sync dist/ s3://your-bucket-name --delete

# 清除CloudFront缓存
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 配置说明

### Nginx配置

主要配置项：
- **Gzip压缩**: 启用文本文件压缩
- **静态资源缓存**: 设置长期缓存策略
- **安全头部**: 添加安全相关的HTTP头部
- **SSL/TLS**: 配置HTTPS支持

### 环境变量

支持的环境变量：
```bash
NODE_ENV=production          # 运行环境
PORT=3000                   # 服务端口
SSL_CERT_PATH=/path/to/cert # SSL证书路径
SSL_KEY_PATH=/path/to/key   # SSL私钥路径
```

### 性能优化

#### 代码分割
- 核心引擎单独打包
- 按功能模块分割代码
- 懒加载非关键资源

#### 资源优化
- 图片压缩和格式优化
- 字体文件子集化
- CSS和JS文件压缩

#### 缓存策略
- 静态资源长期缓存
- HTML文件短期缓存
- API响应适当缓存

## 监控和维护

### 健康检查

游戏提供健康检查端点：
```bash
# 检查服务状态
curl http://localhost/health
```

### 日志管理

日志文件位置：
- Nginx访问日志: `/var/log/nginx/eco-defense-game.access.log`
- Nginx错误日志: `/var/log/nginx/eco-defense-game.error.log`
- 应用日志: 浏览器控制台

### 性能监控

推荐监控指标：
- 页面加载时间
- 资源加载失败率
- 用户会话时长
- 错误发生率

### 备份策略

自动备份：
```bash
# 创建备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/eco-defense-game_$DATE.tar.gz /var/www/eco-defense-game
```

## 故障排除

### 常见问题

#### 1. 页面无法加载
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查配置文件
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 2. 静态资源404错误
- 检查文件路径配置
- 验证文件权限设置
- 确认构建输出正确

#### 3. HTTPS证书问题
```bash
# 检查证书有效期
openssl x509 -in /path/to/cert.pem -text -noout

# 测试SSL配置
openssl s_client -connect yourdomain.com:443
```

### 回滚部署

如果部署出现问题，可以快速回滚：
```bash
# 使用部署脚本回滚
./deploy/scripts/deploy.sh --rollback

# 手动回滚
sudo cp -r /backups/latest/* /var/www/eco-defense-game/
sudo systemctl reload nginx
```

## 安全考虑

### 服务器安全
- 定期更新系统和软件包
- 配置防火墙规则
- 使用非root用户运行服务
- 启用访问日志监控

### 应用安全
- 设置适当的CSP头部
- 启用HTTPS强制跳转
- 配置安全相关的HTTP头部
- 定期检查依赖包漏洞

### 数据保护
- 用户数据本地存储
- 不收集敏感信息
- 遵循隐私保护法规

## 扩展和优化

### 水平扩展
- 使用负载均衡器
- 部署多个实例
- 配置CDN加速

### 垂直扩展
- 增加服务器资源
- 优化数据库查询
- 使用缓存服务

### 国际化部署
- 多地区CDN节点
- 本地化内容适配
- 网络延迟优化

## 联系支持

如果在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的GitHub Issues
3. 联系技术支持团队

---

**注意**: 请根据实际的服务器环境和需求调整配置参数。建议在生产环境部署前先在测试环境验证所有配置。