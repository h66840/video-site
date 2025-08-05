# 碳排放跟踪应用数据库迁移

## 概述

本目录包含碳排放跟踪应用的数据库迁移脚本，用于在Supabase项目中创建完整的碳排放监测和管理系统。

## 迁移文件

### 001_carbon_tracking_schema.sql

主要的数据库架构迁移文件，包含以下组件：

#### 核心数据表

1. **facilities** - 设施管理表
   - 存储所有监测设施的基本信息
   - 支持多地点、多类型设施管理

2. **devices** - 设备管理表
   - 管理所有碳排放监测设备
   - 包含设备状态、校准信息等

3. **emission_factors** - 排放因子表
   - 存储不同活动类型的碳排放系数
   - 支持多地区、多年份的排放因子

4. **emission_reports** - 排放报告表
   - 生成定期的碳排放汇总报告
   - 支持日报、周报、月报、年报等

5. **alert_rules** - 告警规则表
   - 定义碳排放异常检测规则
   - 支持多种阈值类型和通知方式

6. **alerts** - 告警记录表
   - 记录所有触发的告警事件
   - 支持告警确认和处理流程

#### 现有表增强

- **carbon_emissions** (已存在)
  - 添加了性能优化索引
  - 与新表建立关联关系

#### 视图和函数

- **daily_emission_summary** - 日排放汇总视图
- **facility_overview** - 设施概览视图
- **update_updated_at_column()** - 自动更新时间戳函数

## 使用方法

### 1. 在Supabase中执行迁移

```sql
-- 在Supabase SQL编辑器中执行
\i migrations/001_carbon_tracking_schema.sql
```

### 2. 或者使用Supabase CLI

```bash
# 如果使用Supabase CLI
supabase db reset
supabase db push
```

### 3. 验证迁移

执行以下查询验证迁移是否成功：

```sql
-- 检查所有表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('facilities', 'devices', 'emission_factors', 'emission_reports', 'alert_rules', 'alerts');

-- 检查示例数据
SELECT * FROM facilities;
SELECT * FROM devices;
SELECT * FROM emission_factors;
```

## 数据模型关系

```
facilities (1) ←→ (N) devices
facilities (1) ←→ (N) emission_reports
facilities (1) ←→ (N) alert_rules
devices (1) ←→ (N) alert_rules
alert_rules (1) ←→ (N) alerts
```

## 示例数据

迁移脚本包含以下示例数据：

- 3个示例设施（北京制造工厂、上海数据中心、深圳办公大楼）
- 4个示例设备（CO2传感器、CH4分析仪、电力计量器、CO2监控器）
- 4个排放因子（电力、天然气、柴油、甲烷）
- 3个告警规则

## 性能优化

迁移脚本包含以下性能优化：

1. **索引优化**
   - 基于查询模式创建复合索引
   - 时间序列数据优化索引

2. **约束检查**
   - 数据完整性约束
   - 枚举值验证

3. **触发器**
   - 自动更新时间戳
   - 数据一致性维护

## API集成建议

### 数据插入示例

```sql
-- 插入新的排放数据
INSERT INTO carbon_emissions (
    device_id, facility_name, emission_type, 
    emission_value, unit, measurement_timestamp
) VALUES (
    'DEV001', '北京制造工厂', 'CO2', 
    125.5, 'kg', NOW()
);
```

### 查询示例

```sql
-- 获取设施的最新排放数据
SELECT * FROM daily_emission_summary 
WHERE facility_name = '北京制造工厂' 
AND emission_date = CURRENT_DATE;

-- 获取活跃告警
SELECT a.*, ar.rule_name, f.facility_name
FROM alerts a
JOIN alert_rules ar ON a.alert_rule_id = ar.id
JOIN facilities f ON a.facility_id = f.facility_id
WHERE a.alert_status = 'active'
ORDER BY a.triggered_at DESC;
```

## 后续迁移

如需添加新功能或修改现有架构，请：

1. 创建新的迁移文件（如 `002_add_new_feature.sql`）
2. 在文件名中包含版本号和描述
3. 更新此README文档

## 故障排除

### 常见问题

1. **外键约束错误**
   - 确保按正确顺序执行迁移
   - 检查引用表是否存在

2. **权限问题**
   - 确保数据库用户有CREATE TABLE权限
   - 检查RLS策略设置

3. **数据类型冲突**
   - 检查现有数据是否符合新约束
   - 必要时进行数据清理

### 回滚方案

如需回滚迁移：

```sql
-- 删除新创建的表（注意顺序）
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
DROP TABLE IF EXISTS emission_reports CASCADE;
DROP TABLE IF EXISTS emission_factors CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;

-- 删除视图
DROP VIEW IF EXISTS daily_emission_summary;
DROP VIEW IF EXISTS facility_overview;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## 联系信息

如有问题或建议，请联系开发团队或在GitHub仓库中创建Issue。