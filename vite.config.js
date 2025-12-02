import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  
  // 构建配置
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    
    // 生产环境优化
    minify: 'esbuild',
    
    // 代码分割
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      },
      output: {
        // 文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // 资源处理
    assetsInlineLimit: 4096, // 小于4KB的资源内联
    
    // 源码映射（生产环境关闭）
    sourcemap: false,
    
    // 报告文件大小
    reportCompressedSize: true,
    
    // 警告阈值
    chunkSizeWarningLimit: 1000
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    host: true, // 允许外部访问
    
    // 代理配置（如果需要）
    proxy: {
      // '/api': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
    }
  },
  
  // 预览服务器配置
  preview: {
    port: 4173,
    host: true
  },
  
  // 依赖优化
  optimizeDeps: {
    include: [
      // 预构建的依赖
    ],
    exclude: [
      // 排除的依赖
    ]
  },
  
  // 环境变量
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __PROD__: JSON.stringify(process.env.NODE_ENV === 'production'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  
  // CSS配置
  css: {
    // CSS预处理器选项
    preprocessorOptions: {
      // scss: {
      //   additionalData: `@import "@/styles/variables.scss";`
      // }
    },
    
    // PostCSS配置
    postcss: {
      plugins: [
        // 可以添加autoprefixer等插件
      ]
    }
  },
  
  // 插件配置
  plugins: [
    // 可以添加需要的插件
  ],
  
  // 基础路径
  base: './',
  
  // 资源处理
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr']
})