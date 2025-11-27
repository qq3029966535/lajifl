#!/bin/bash

# 生态防御游戏部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="eco-defense-game"
BUILD_DIR="dist"
BACKUP_DIR="backups"
DEPLOY_DIR="/var/www/${PROJECT_NAME}"
NGINX_CONFIG="/etc/nginx/sites-available/${PROJECT_NAME}"
SERVICE_NAME="nginx"

# 函数定义
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查部署依赖..."
    
    local deps=("node" "npm" "nginx" "git")
    for dep in "${deps[@]}"; do
        if ! command -v $dep &> /dev/null; then
            log_error "$dep 未安装"
            exit 1
        fi
    done
    
    log_success "依赖检查完成"
}

# 创建备份
create_backup() {
    if [ -d "$DEPLOY_DIR" ]; then
        log_info "创建当前部署的备份..."
        
        local backup_name="${PROJECT_NAME}_$(date +%Y%m%d_%H%M%S)"
        local backup_path="${BACKUP_DIR}/${backup_name}"
        
        mkdir -p "$BACKUP_DIR"
        cp -r "$DEPLOY_DIR" "$backup_path"
        
        log_success "备份创建完成: $backup_path"
        
        # 保留最近5个备份
        ls -t "$BACKUP_DIR" | tail -n +6 | xargs -r rm -rf
    fi
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 安装依赖
    npm ci --production=false
    
    # 运行测试
    log_info "运行测试..."
    npm test
    
    # 构建生产版本
    log_info "构建生产版本..."
    npm run build
    
    # 验证构建结果
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "构建失败: $BUILD_DIR 目录不存在"
        exit 1
    fi
    
    log_success "项目构建完成"
}

# 部署文件
deploy_files() {
    log_info "部署文件到服务器..."
    
    # 创建部署目录
    sudo mkdir -p "$DEPLOY_DIR"
    
    # 复制构建文件
    sudo cp -r "$BUILD_DIR"/* "$DEPLOY_DIR/"
    
    # 设置正确的权限
    sudo chown -R www-data:www-data "$DEPLOY_DIR"
    sudo chmod -R 755 "$DEPLOY_DIR"
    
    log_success "文件部署完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 复制Nginx配置
    if [ -f "deploy/nginx.conf" ]; then
        sudo cp deploy/nginx.conf "$NGINX_CONFIG"
        
        # 启用站点
        sudo ln -sf "$NGINX_CONFIG" "/etc/nginx/sites-enabled/${PROJECT_NAME}"
        
        # 测试Nginx配置
        if sudo nginx -t; then
            log_success "Nginx配置验证成功"
        else
            log_error "Nginx配置验证失败"
            exit 1
        fi
    else
        log_warning "未找到Nginx配置文件，跳过配置"
    fi
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    
    # 重启Nginx
    sudo systemctl reload nginx
    
    # 检查服务状态
    if sudo systemctl is-active --quiet nginx; then
        log_success "Nginx服务运行正常"
    else
        log_error "Nginx服务启动失败"
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local url="http://localhost"
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null; then
            log_success "健康检查通过"
            return 0
        fi
        
        log_warning "健康检查失败 (尝试 $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    log_error "健康检查失败"
    return 1
}

# 回滚部署
rollback() {
    log_warning "开始回滚部署..."
    
    local latest_backup=$(ls -t "$BACKUP_DIR" | head -n 1)
    
    if [ -n "$latest_backup" ]; then
        sudo cp -r "${BACKUP_DIR}/${latest_backup}"/* "$DEPLOY_DIR/"
        sudo systemctl reload nginx
        log_success "回滚完成"
    else
        log_error "没有可用的备份进行回滚"
        exit 1
    fi
}

# 清理旧文件
cleanup() {
    log_info "清理临时文件..."
    
    # 清理构建缓存
    rm -rf node_modules/.cache
    
    # 清理旧的日志文件
    sudo find /var/log/nginx -name "*.log.*" -mtime +7 -delete
    
    log_success "清理完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "部署信息:"
    echo "  项目名称: $PROJECT_NAME"
    echo "  部署目录: $DEPLOY_DIR"
    echo "  访问地址: http://localhost"
    echo "  部署时间: $(date)"
    echo ""
    echo "有用的命令:"
    echo "  查看Nginx状态: sudo systemctl status nginx"
    echo "  查看Nginx日志: sudo tail -f /var/log/nginx/access.log"
    echo "  重启Nginx: sudo systemctl restart nginx"
}

# 主函数
main() {
    log_info "开始部署 $PROJECT_NAME..."
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --rollback)
                rollback
                exit 0
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --rollback     回滚到上一个版本"
                echo "  --skip-tests   跳过测试"
                echo "  --help         显示帮助信息"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 执行部署步骤
    check_dependencies
    create_backup
    
    if [ "$SKIP_TESTS" != "true" ]; then
        build_project
    else
        log_warning "跳过测试和构建步骤"
    fi
    
    deploy_files
    configure_nginx
    restart_services
    
    # 健康检查
    if ! health_check; then
        log_error "部署验证失败，开始回滚..."
        rollback
        exit 1
    fi
    
    cleanup
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，退出码: $?"' ERR

# 执行主函数
main "$@"