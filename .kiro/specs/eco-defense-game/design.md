# 设计文档

## 概述

生态防御游戏是一款基于Web技术的2D/3D混合风格塔防类游戏，采用模块化架构设计。游戏使用HTML5 Canvas和WebGL技术实现，支持现代浏览器运行。整体架构遵循MVC模式，确保代码的可维护性和扩展性。

## 架构

### 技术栈选择
- **前端框架**: Vanilla JavaScript (ES6+) + HTML5 Canvas
- **3D渲染**: Three.js (用于Low Poly 3D垃圾僵尸)
- **2D渲染**: Canvas 2D API (用于Q版垃圾桶和UI)
- **音频**: Web Audio API
- **构建工具**: Vite
- **样式**: CSS3 + CSS动画

### 核心架构模式

```
Game Engine (游戏引擎)
├── Scene Manager (场景管理器)
├── Entity Component System (实体组件系统)
├── Resource Manager (资源管理器)
├── Audio Manager (音频管理器)
└── Input Manager (输入管理器)
```

### 系统分层

1. **表现层 (Presentation Layer)**
   - UI组件 (菜单、HUD、弹窗)
   - 渲染系统 (2D Canvas + 3D WebGL)
   - 动画系统

2. **逻辑层 (Logic Layer)**
   - 游戏状态管理
   - 关卡系统
   - 分数系统
   - 碰撞检测

3. **数据层 (Data Layer)**
   - 游戏配置
   - 关卡数据
   - 玩家进度存储

## 组件和接口

### 核心组件架构

#### 1. 游戏引擎核心 (GameEngine)
```javascript
class GameEngine {
  constructor()
  init()
  update(deltaTime)
  render()
  destroy()
}
```

#### 2. 场景管理器 (SceneManager)
```javascript
class SceneManager {
  loadScene(sceneName)
  getCurrentScene()
  transitionTo(newScene)
}

// 场景类型
- MenuScene (主菜单场景)
- GameScene (游戏场景)
- PauseScene (暂停场景)
- ResultScene (结果场景)
```

#### 3. 实体组件系统 (ECS)

**实体类型:**
- TrashBin (垃圾桶实体)
- TrashZombie (垃圾僵尸实体)
- Track (轨道实体)
- Projectile (投射物实体)

**组件类型:**
```javascript
// 位置组件
class Transform {
  constructor(x, y, rotation, scale)
}

// 渲染组件
class Renderer {
  constructor(sprite, animations)
}

// 移动组件
class Movement {
  constructor(speed, direction)
}

// 碰撞组件
class Collider {
  constructor(bounds, type)
}

// 垃圾分类组件
class TrashType {
  constructor(category, points)
}
```

#### 4. 轨道系统 (TrackSystem)
```javascript
class TrackSystem {
  tracks: Track[]
  
  initializeTracks(count)
  getTrackByIndex(index)
  isValidPlacement(x, y)
  getTrackAtPosition(x, y)
}

class Track {
  id: number
  startPoint: Vector2
  endPoint: Vector2
  width: number
  
  isPointOnTrack(x, y)
  getProgressAlongTrack(position)
}
```

#### 5. 垃圾桶系统 (TrashBinSystem)
```javascript
class TrashBinSystem {
  selectedBinType: TrashBinType
  placedBins: TrashBin[]
  
  selectBin(type)
  placeBin(x, y)
  canPlaceAt(x, y)
  getBinAt(x, y)
}

class TrashBin {
  type: TrashBinType
  position: Vector2
  collectRadius: number
  
  canCollect(trashType)
  collect(trash)
  playAnimation(animationType)
}

enum TrashBinType {
  KITCHEN_WASTE = 1,
  RECYCLABLE = 2,
  HAZARDOUS = 3,
  OTHER = 4
}
```

#### 6. 垃圾僵尸系统 (TrashZombieSystem)
```javascript
class TrashZombieSystem {
  activeZombies: TrashZombie[]
  spawnQueue: SpawnData[]
  
  spawnZombie(type, track)
  updateZombies(deltaTime)
  removeZombie(zombie)
}

class TrashZombie {
  type: TrashType
  position: Vector2
  speed: number
  trackId: number
  progress: number
  
  move(deltaTime)
  getWorldPosition()
  isAtEnd()
}

enum TrashType {
  KITCHEN_WASTE,
  RECYCLABLE,
  HAZARDOUS,
  OTHER
}
```

## 数据模型

### 游戏配置数据
```javascript
const GameConfig = {
  canvas: {
    width: 1200,
    height: 800
  },
  
  tracks: {
    maxCount: 5,
    width: 80,
    spacing: 120
  },
  
  trashBins: {
    [TrashBinType.KITCHEN_WASTE]: {
      name: "厨余垃圾桶",
      color: "#4CAF50",
      dialogue: "果皮菜叶，统统到我嘴里来！",
      collectTypes: [TrashType.KITCHEN_WASTE]
    },
    // ... 其他垃圾桶配置
  },
  
  levels: [
    {
      id: 1,
      trackCount: 1,
      trashTypes: [TrashType.KITCHEN_WASTE, TrashType.RECYCLABLE, TrashType.HAZARDOUS],
      timeLimit: 120, // 2分钟限时
      spawnPattern: "basic"
    },
    // ... 其他关卡配置（每关都是120秒限时）
  ]
}
```

### 关卡数据结构
```javascript
class LevelData {
  id: number
  trackCount: number
  availableTrashTypes: TrashType[]
  timeLimit: number // 固定为120秒
  spawnWaves: WaveData[]
  successCondition: SuccessCondition
  
  getNextWave()
  isComplete()
  isTimeUp()
  hasTrashEscaped()
}

class WaveData {
  startTime: number
  zombies: ZombieSpawnData[]
}

class ZombieSpawnData {
  type: TrashType
  trackId: number
  delay: number
  speed: number
}
```

### 玩家数据模型
```javascript
class PlayerData {
  currentLevel: number
  highScore: number
  accuracyHistory: number[]
  unlockedLevels: number[]
  achievements: Achievement[]
  
  saveProgress()
  loadProgress()
  updateStats(levelResult)
}

class LevelResult {
  score: number
  accuracy: number
  correctClassifications: number
  totalClassifications: number
  timeRemaining: number
}
```

## 错误处理

### 游戏状态错误处理
```javascript
class GameErrorHandler {
  handleCollisionError(error)
  handleRenderError(error)
  handleAudioError(error)
  handleSaveError(error)
  
  showErrorDialog(message)
  recoverFromError(errorType)
}
```

### 错误类型定义
- **CollisionError**: 碰撞检测异常
- **RenderError**: 渲染系统异常  
- **AudioError**: 音频播放异常
- **SaveError**: 数据保存异常
- **NetworkError**: 网络连接异常

### 容错机制
1. **自动重试**: 对于临时性错误实施自动重试机制
2. **优雅降级**: 音频失败时静音运行，3D渲染失败时回退到2D
3. **状态恢复**: 游戏崩溃后能够恢复到最近的检查点
4. **错误上报**: 收集错误信息用于后续优化

## 测试策略

### 单元测试
- **组件测试**: 测试各个游戏组件的独立功能
- **系统测试**: 测试垃圾桶系统、僵尸系统等子系统
- **工具函数测试**: 测试碰撞检测、数学计算等工具函数

### 集成测试
- **场景切换测试**: 验证不同场景间的正确切换
- **游戏流程测试**: 测试完整的游戏循环
- **数据持久化测试**: 验证游戏进度的保存和加载

### 性能测试
- **帧率测试**: 确保游戏在目标设备上稳定运行在60FPS
- **内存测试**: 监控内存使用，防止内存泄漏
- **加载时间测试**: 优化资源加载时间

### 用户体验测试
- **可用性测试**: 验证游戏操作的直观性
- **教育效果测试**: 评估垃圾分类知识的传达效果
- **无障碍测试**: 确保游戏对不同能力用户的可访问性

### 测试工具和框架
- **单元测试**: Jest
- **端到端测试**: Playwright
- **性能监控**: Web Performance API
- **错误追踪**: 自定义错误收集系统

### 测试数据管理
```javascript
class TestDataManager {
  generateMockLevelData()
  createTestPlayerProfile()
  simulateUserInput(actions)
  validateGameState(expectedState)
}
```

### 自动化测试流程
1. **构建时测试**: 每次代码提交触发单元测试
2. **集成测试**: 定期运行完整的游戏流程测试
3. **性能回归测试**: 监控性能指标变化
4. **兼容性测试**: 在多种浏览器和设备上验证功能