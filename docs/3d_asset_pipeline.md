# 3D资源处理流程文档

## 概述

本文档详细说明了video-site项目中3D资源的完整处理流程，包括资源导入、优化、转换、部署和维护等各个环节。

## 目录

1. [资源类型与格式](#资源类型与格式)
2. [导入流程](#导入流程)
3. [优化处理](#优化处理)
4. [格式转换](#格式转换)
5. [质量控制](#质量控制)
6. [部署流程](#部署流程)
7. [性能监控](#性能监控)
8. [故障排除](#故障排除)

## 资源类型与格式

### 支持的3D资源类型

#### 模型文件
- **FBX** (.fbx) - 主要用于复杂动画模型
- **OBJ** (.obj) - 静态几何模型
- **GLTF/GLB** (.gltf/.glb) - Web优化格式
- **3DS** (.3ds) - 传统3D格式
- **DAE** (.dae) - Collada交换格式

#### 纹理文件
- **PNG** - 支持透明度的高质量纹理
- **JPEG** - 压缩比高的颜色纹理
- **WebP** - Web优化格式
- **DDS** - DirectX纹理格式
- **HDR** - 高动态范围环境贴图

#### 动画文件
- **BVH** - 骨骼动画数据
- **FBX动画** - 完整动画序列
- **JSON** - 自定义动画数据

### 文件大小限制

| 资源类型 | 最大文件大小 | 推荐大小 |
|---------|-------------|----------|
| 3D模型 | 50MB | < 10MB |
| 纹理贴图 | 8MB | < 2MB |
| 动画文件 | 20MB | < 5MB |

## 导入流程

### 1. 资源验证

```bash
# 检查文件格式和完整性
python scripts/validate_3d_assets.py --input /path/to/assets --format fbx,obj,gltf

# 验证纹理文件
python scripts/validate_textures.py --input /path/to/textures --max-size 2048
```

### 2. 元数据提取

```python
# 示例：提取3D模型信息
import asset_processor

def extract_model_metadata(file_path):
    metadata = {
        'vertices': get_vertex_count(file_path),
        'faces': get_face_count(file_path),
        'materials': get_material_list(file_path),
        'animations': get_animation_info(file_path),
        'file_size': get_file_size(file_path)
    }
    return metadata
```

### 3. 目录结构

```
assets/
├── models/
│   ├── characters/
│   ├── environments/
│   ├── props/
│   └── vehicles/
├── textures/
│   ├── diffuse/
│   ├── normal/
│   ├── specular/
│   └── environment/
├── animations/
│   ├── character/
│   └── object/
└── processed/
    ├── web/
    ├── mobile/
    └── desktop/
```

## 优化处理

### 1. 几何优化

#### 多边形简化
```python
# 使用Blender Python API进行模型简化
import bpy

def simplify_mesh(target_ratio=0.5):
    """
    简化网格模型
    target_ratio: 目标面数比例 (0.1-1.0)
    """
    bpy.ops.object.modifier_add(type='DECIMATE')
    bpy.context.object.modifiers["Decimate"].ratio = target_ratio
    bpy.ops.object.modifier_apply(modifier="Decimate")
```

#### LOD生成
```python
def generate_lod_levels(model_path, levels=[1.0, 0.5, 0.25, 0.1]):
    """
    生成多级细节模型
    levels: LOD级别列表，表示面数保留比例
    """
    lod_models = []
    for i, ratio in enumerate(levels):
        lod_path = f"{model_path}_lod{i}.fbx"
        simplify_and_export(model_path, lod_path, ratio)
        lod_models.append(lod_path)
    return lod_models
```

### 2. 纹理优化

#### 尺寸调整
```python
from PIL import Image

def optimize_texture(input_path, output_path, max_size=1024, quality=85):
    """
    优化纹理文件
    max_size: 最大尺寸
    quality: JPEG质量 (1-100)
    """
    with Image.open(input_path) as img:
        # 调整尺寸
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.LANCZOS)
        
        # 保存优化后的图片
        if output_path.endswith('.jpg') or output_path.endswith('.jpeg'):
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
        else:
            img.save(output_path, optimize=True)
```

#### 格式转换
```bash
# 批量转换纹理格式
for file in textures/*.png; do
    # 转换为WebP格式以减小文件大小
    cwebp -q 80 "$file" -o "${file%.png}.webp"
    
    # 生成不同分辨率版本
    convert "$file" -resize 512x512 "${file%.png}_512.png"
    convert "$file" -resize 256x256 "${file%.png}_256.png"
done
```

## 格式转换

### 1. Web格式转换

#### 转换为GLTF
```python
import bpy

def export_to_gltf(input_file, output_file):
    """
    将3D模型转换为GLTF格式
    """
    # 清除场景
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 导入原始文件
    if input_file.endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath=input_file)
    elif input_file.endswith('.obj'):
        bpy.ops.import_scene.obj(filepath=input_file)
    
    # 导出为GLTF
    bpy.ops.export_scene.gltf(
        filepath=output_file,
        export_format='GLB',  # 二进制格式
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT'
    )
```

### 2. 压缩处理

#### Draco几何压缩
```python
def apply_draco_compression(gltf_path, output_path):
    """
    应用Draco几何压缩
    """
    import subprocess
    
    cmd = [
        'gltf-pipeline',
        '-i', gltf_path,
        '-o', output_path,
        '--draco.compressionLevel', '7',
        '--draco.quantizePositionBits', '11',
        '--draco.quantizeNormalBits', '8',
        '--draco.quantizeTexcoordBits', '10'
    ]
    
    subprocess.run(cmd, check=True)
```

## 质量控制

### 1. 自动化测试

```python
class AssetQualityChecker:
    def __init__(self):
        self.max_vertices = 50000
        self.max_texture_size = 2048
        self.required_uvs = True
    
    def check_model_quality(self, model_path):
        """检查3D模型质量"""
        issues = []
        
        # 检查顶点数
        vertex_count = self.get_vertex_count(model_path)
        if vertex_count > self.max_vertices:
            issues.append(f"顶点数过多: {vertex_count} > {self.max_vertices}")
        
        # 检查UV坐标
        if self.required_uvs and not self.has_uv_coordinates(model_path):
            issues.append("缺少UV坐标")
        
        # 检查材质
        materials = self.get_materials(model_path)
        for material in materials:
            if not self.validate_material(material):
                issues.append(f"材质问题: {material}")
        
        return issues
    
    def check_texture_quality(self, texture_path):
        """检查纹理质量"""
        issues = []
        
        with Image.open(texture_path) as img:
            # 检查尺寸
            if max(img.size) > self.max_texture_size:
                issues.append(f"纹理尺寸过大: {img.size}")
            
            # 检查是否为2的幂次
            if not self.is_power_of_two(img.size):
                issues.append(f"纹理尺寸不是2的幂次: {img.size}")
        
        return issues
```

### 2. 性能基准测试

```python
def benchmark_asset_loading(asset_path):
    """测试资源加载性能"""
    import time
    
    start_time = time.time()
    
    # 模拟加载过程
    load_asset(asset_path)
    
    load_time = time.time() - start_time
    
    # 记录性能数据
    performance_data = {
        'asset_path': asset_path,
        'load_time': load_time,
        'file_size': os.path.getsize(asset_path),
        'timestamp': time.time()
    }
    
    return performance_data
```

## 部署流程

### 1. 构建脚本

```bash
#!/bin/bash
# build_3d_assets.sh

echo "开始构建3D资源..."

# 创建输出目录
mkdir -p dist/assets/{models,textures,animations}

# 处理模型文件
echo "处理3D模型..."
python scripts/process_models.py \
    --input assets/models \
    --output dist/assets/models \
    --format gltf \
    --compress

# 处理纹理文件
echo "处理纹理文件..."
python scripts/process_textures.py \
    --input assets/textures \
    --output dist/assets/textures \
    --format webp \
    --quality 80

# 生成资源清单
echo "生成资源清单..."
python scripts/generate_manifest.py \
    --input dist/assets \
    --output dist/assets/manifest.json

echo "构建完成！"
```

### 2. CDN部署

```python
def deploy_to_cdn(local_path, cdn_path):
    """部署资源到CDN"""
    import boto3
    
    s3 = boto3.client('s3')
    
    # 上传文件
    s3.upload_file(
        local_path,
        'your-cdn-bucket',
        cdn_path,
        ExtraArgs={
            'ContentType': get_content_type(local_path),
            'CacheControl': 'max-age=31536000'  # 1年缓存
        }
    )
    
    # 生成CDN URL
    cdn_url = f"https://cdn.example.com/{cdn_path}"
    return cdn_url
```

## 性能监控

### 1. 加载时间监控

```javascript
// 前端性能监控
class AssetPerformanceMonitor {
    constructor() {
        this.loadTimes = new Map();
    }
    
    startLoading(assetId) {
        this.loadTimes.set(assetId, performance.now());
    }
    
    endLoading(assetId) {
        const startTime = this.loadTimes.get(assetId);
        if (startTime) {
            const loadTime = performance.now() - startTime;
            this.reportLoadTime(assetId, loadTime);
            this.loadTimes.delete(assetId);
        }
    }
    
    reportLoadTime(assetId, loadTime) {
        // 发送性能数据到分析服务
        fetch('/api/performance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assetId,
                loadTime,
                timestamp: Date.now()
            })
        });
    }
}
```

### 2. 内存使用监控

```python
def monitor_memory_usage():
    """监控内存使用情况"""
    import psutil
    import gc
    
    # 获取当前内存使用
    process = psutil.Process()
    memory_info = process.memory_info()
    
    # 强制垃圾回收
    gc.collect()
    
    return {
        'rss': memory_info.rss,  # 物理内存
        'vms': memory_info.vms,  # 虚拟内存
        'percent': process.memory_percent()
    }
```

## 故障排除

### 常见问题及解决方案

#### 1. 模型加载失败

**问题**: 3D模型无法正常加载
**可能原因**:
- 文件格式不支持
- 文件损坏
- 路径错误
- 权限问题

**解决步骤**:
```bash
# 1. 检查文件完整性
file model.fbx

# 2. 验证文件格式
python -c "import fbx; print('FBX支持正常')"

# 3. 检查文件权限
ls -la model.fbx

# 4. 尝试重新导出
blender --background --python export_script.py
```

#### 2. 纹理显示异常

**问题**: 纹理无法正确显示
**可能原因**:
- UV坐标缺失
- 纹理路径错误
- 格式不兼容
- 尺寸问题

**解决步骤**:
```python
# 检查UV坐标
def check_uv_coordinates(model_path):
    # 使用相应的3D库检查UV坐标
    pass

# 验证纹理文件
def validate_texture(texture_path):
    try:
        with Image.open(texture_path) as img:
            print(f"纹理尺寸: {img.size}")
            print(f"颜色模式: {img.mode}")
            return True
    except Exception as e:
        print(f"纹理验证失败: {e}")
        return False
```

#### 3. 性能问题

**问题**: 3D资源加载缓慢
**优化建议**:

1. **减少多边形数量**
```python
# 使用简化算法
def simplify_mesh(input_path, output_path, reduction_ratio=0.5):
    # 实现网格简化
    pass
```

2. **优化纹理大小**
```bash
# 批量调整纹理尺寸
for img in *.png; do
    convert "$img" -resize 512x512 "optimized_$img"
done
```

3. **启用压缩**
```python
# 启用Draco压缩
def enable_draco_compression(gltf_path):
    # 应用几何压缩
    pass
```

### 日志分析

```python
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('3d_assets.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('3d_asset_pipeline')

def log_asset_processing(asset_path, operation, status):
    """记录资源处理日志"""
    logger.info(f"资源: {asset_path}, 操作: {operation}, 状态: {status}")
```

## 最佳实践

### 1. 命名规范

```
# 模型文件命名
character_warrior_lod0.fbx
character_warrior_lod1.fbx
environment_forest_tree01.fbx

# 纹理文件命名
character_warrior_diffuse_1024.png
character_warrior_normal_1024.png
character_warrior_specular_512.png
```

### 2. 版本控制

```bash
# 使用Git LFS管理大文件
git lfs track "*.fbx"
git lfs track "*.png"
git lfs track "*.jpg"

# 提交资源文件
git add assets/
git commit -m "Add 3D character models and textures"
git push origin dev
```

### 3. 自动化工作流

```yaml
# .github/workflows/3d-assets.yml
name: 3D Assets Processing

on:
  push:
    paths:
      - 'assets/**'

jobs:
  process-assets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          lfs: true
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          sudo apt-get install blender
      
      - name: Process 3D assets
        run: |
          python scripts/process_all_assets.py
      
      - name: Deploy to CDN
        run: |
          python scripts/deploy_to_cdn.py
```

## 总结

本文档提供了完整的3D资源处理流程指南，涵盖了从资源导入到部署维护的各个环节。遵循这些流程和最佳实践，可以确保3D资源的质量、性能和可维护性。

定期更新此文档以反映新的工具、技术和最佳实践。如有问题或建议，请联系开发团队。

---

**文档版本**: 1.0  
**最后更新**: 2025-01-08  
**维护者**: h66840  
**审核者**: 开发团队