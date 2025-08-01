# Video Site

一个视频网站项目，提供视频内容的展示和管理功能。

## 项目简介

本项目是一个现代化的视频网站，支持视频上传、播放、搜索和用户管理等功能。

## 数据源说明

### 新增数据源 (2025-08-01)

本项目现已集成以下数据源：

1. **本地视频存储**
   - 支持多种视频格式 (MP4, AVI, MOV, WMV)
   - 自动视频转码和优化
   - 缩略图自动生成

2. **第三方API集成**
   - YouTube API v3 集成
   - Vimeo API 支持
   - 支持外部视频链接嵌入

3. **数据库存储**
   - 视频元数据存储
   - 用户信息管理
   - 播放历史记录
   - 评论和评分系统

4. **CDN内容分发**
   - 全球CDN加速
   - 智能缓存策略
   - 带宽优化

## 技术栈

- 前端：React.js, HTML5 Video API
- 后端：Node.js, Express
- 数据库：MongoDB
- 存储：AWS S3 / 本地存储
- CDN：CloudFlare

## 安装和使用

```bash
# 克隆项目
git clone https://github.com/h66840/video-site.git

# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 贡献

欢迎提交 Pull Request 和 Issue。

## 许可证

MIT License