# Video Site - 大模型应用项目视频展示

这是一个展示大模型应用项目的视频网站，包含多个视频处理和展示功能。

## 项目概述

本项目是刘昊雨的大模型应用项目视频展示平台，提供了丰富的视频处理和展示功能。

## 主要功能

### 1. 视频处理
- 批量视频处理 (`main_batch.py`)
- 简单视频处理库 (`main_simple_lib.py`)
- 图像补丁处理 (`image_patch.py`)

### 2. 响应式视频处理
- 响应式视频处理器 (`reactive_video_processor.py`)
- 前端TypeScript支持 (`reactive_video_frontend.ts`)
- 响应式演示页面 (`reactive_demo.html`)

### 3. 实时视频流API端点 🆕

我们新增了一个强大的实时视频流API端点，支持多种视频流操作：

#### API端点列表

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/v1/stream/start` | 启动新的视频流 |
| GET | `/api/v1/stream/{stream_id}` | 获取实时视频流数据 |
| POST | `/api/v1/stream/{stream_id}/stop` | 停止指定的视频流 |
| GET | `/api/v1/streams` | 列出所有活跃的视频流 |
| GET | `/api/v1/stream/{stream_id}/info` | 获取特定流的详细信息 |

#### 使用示例

**启动视频流：**
```bash
curl -X POST http://localhost:5000/api/v1/stream/start \
  -H "Content-Type: application/json" \
  -d '{"stream_id": "my_stream_001", "source": "camera_1"}'
```

**获取视频流：**
```bash
curl http://localhost:5000/api/v1/stream/my_stream_001
```

**停止视频流：**
```bash
curl -X POST http://localhost:5000/api/v1/stream/my_stream_001/stop
```

#### 技术特性

- **实时传输**: 使用Server-Sent Events (SSE)协议
- **多流支持**: 同时支持多个并发视频流
- **线程安全**: 完全的线程安全流管理
- **RESTful设计**: 标准的REST API设计模式
- **状态监控**: 实时流状态和性能监控

#### 响应格式

所有API响应均为JSON格式：

```json
{
  "message": "Stream started successfully",
  "stream_id": "my_stream_001",
  "stream_url": "/api/v1/stream/my_stream_001"
}
```

## 文件结构

```
video-site/
├── main_batch.py              # 批量视频处理
├── main_simple_lib.py         # 简单视频处理库
├── image_patch.py             # 图像补丁处理
├── reactive_video_processor.py # 响应式视频处理器
├── reactive_video_frontend.ts  # 前端TypeScript支持
├── reactive_demo.html         # 响应式演示页面
├── streaming_api.py           # 实时视频流API端点 🆕
├── requirements.txt           # Python依赖
├── setup.sh                   # 安装脚本
└── README.md                  # 项目文档
```

## 安装和运行

### 环境设置
```bash
chmod +x setup.sh
./setup.sh
```

### 安装依赖
```bash
pip install -r requirements.txt
```

### 启动实时视频流服务
```bash
python streaming_api.py
```

服务将在 `http://localhost:5000` 启动。

## 演示页面

- **响应式演示**: `reactive_demo.html`
- **夏季促销页面**: `summer-promotion-final.html`
- **Vision Pro发布页面**: `visionpro-launch.html`

## 开发者信息

**作者**: 刘昊雨  
**项目**: 大模型应用项目视频展示  
**网站**: https://h66840.github.io/video-site/

## 许可证

本项目遵循开源许可证。

---

*最后更新: 2025年8月*