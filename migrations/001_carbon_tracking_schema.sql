-- Carbon Emissions Tracking Application Database Migration
-- Version: 1.0
-- Date: 2025-01-08
-- Description: Comprehensive schema for carbon emissions tracking and reporting

-- =====================================================
-- 1. DEVICES TABLE - 设备管理表
-- =====================================================
CREATE TABLE IF NOT EXISTS devices (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(200) NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('sensor', 'meter', 'analyzer', 'monitor')),
    facility_id VARCHAR(100) NOT NULL,
    location_description TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    installation_date DATE,
    calibration_date DATE,
    next_calibration_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE devices IS '设备管理表，存储所有碳排放监测设备的基本信息';
COMMENT ON COLUMN devices.device_id IS '设备唯一标识符';
COMMENT ON COLUMN devices.device_type IS '设备类型：sensor-传感器, meter-计量器, analyzer-分析仪, monitor-监控器';
COMMENT ON COLUMN devices.facility_id IS '设施ID，关联到具体的工厂或设施';
COMMENT ON COLUMN devices.status IS '设备状态：active-运行中, inactive-停用, maintenance-维护中, retired-已退役';

-- =====================================================
-- 2. EMISSION FACTORS TABLE - 排放因子表
-- =====================================================
CREATE TABLE IF NOT EXISTS emission_factors (
    id BIGSERIAL PRIMARY KEY,
    factor_name VARCHAR(200) NOT NULL,
    emission_type VARCHAR(20) NOT NULL CHECK (emission_type IN ('CO2', 'CH4', 'N2O', 'CO2e')),
    source_category VARCHAR(100) NOT NULL,
    factor_value NUMERIC(15,6) NOT NULL CHECK (factor_value >= 0),
    unit VARCHAR(50) NOT NULL,
    region VARCHAR(100),
    year INTEGER,
    source_reference TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE emission_factors IS '排放因子表，存储不同类型活动的碳排放系数';
COMMENT ON COLUMN emission_factors.factor_value IS '排放因子数值';
COMMENT ON COLUMN emission_factors.source_category IS '排放源类别，如燃料燃烧、工业过程等';
COMMENT ON COLUMN emission_factors.unit IS '排放因子单位，如 kg CO2/kWh, kg CO2/L等';

-- =====================================================
-- 3. FACILITIES TABLE - 设施管理表
-- =====================================================
CREATE TABLE IF NOT EXISTS facilities (
    id BIGSERIAL PRIMARY KEY,
    facility_id VARCHAR(100) UNIQUE NOT NULL,
    facility_name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    contact_person VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    operational_since DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'planned', 'decommissioned')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE facilities IS '设施管理表，存储所有监测设施的基本信息';
COMMENT ON COLUMN facilities.facility_type IS '设施类型，如工厂、办公楼、数据中心等';

-- =====================================================
-- 4. EMISSION REPORTS TABLE - 排放报告表
-- =====================================================
CREATE TABLE IF NOT EXISTS emission_reports (
    id BIGSERIAL PRIMARY KEY,
    report_id VARCHAR(100) UNIQUE NOT NULL,
    facility_id VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    total_co2_emissions NUMERIC(15,3) DEFAULT 0,
    total_ch4_emissions NUMERIC(15,3) DEFAULT 0,
    total_n2o_emissions NUMERIC(15,3) DEFAULT 0,
    total_co2e_emissions NUMERIC(15,3) DEFAULT 0,
    emission_breakdown JSONB DEFAULT '{}',
    report_status VARCHAR(20) DEFAULT 'draft' CHECK (report_status IN ('draft', 'submitted', 'approved', 'rejected')),
    generated_by VARCHAR(100),
    approved_by VARCHAR(100),
    approval_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE emission_reports IS '排放报告表，存储定期生成的碳排放汇总报告';
COMMENT ON COLUMN emission_reports.emission_breakdown IS 'JSON格式存储详细的排放分类数据';

-- =====================================================
-- 5. ALERT RULES TABLE - 告警规则表
-- =====================================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    facility_id VARCHAR(100),
    device_id VARCHAR(100),
    emission_type VARCHAR(20) NOT NULL CHECK (emission_type IN ('CO2', 'CH4', 'N2O', 'total')),
    threshold_value NUMERIC(15,3) NOT NULL,
    threshold_type VARCHAR(20) NOT NULL CHECK (threshold_type IN ('above', 'below', 'change_rate')),
    time_window_minutes INTEGER DEFAULT 60,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    notification_channels JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE alert_rules IS '告警规则表，定义碳排放异常检测和通知规则';
COMMENT ON COLUMN alert_rules.threshold_type IS '阈值类型：above-超过, below-低于, change_rate-变化率';
COMMENT ON COLUMN alert_rules.notification_channels IS 'JSON数组存储通知渠道配置';

-- =====================================================
-- 6. ALERTS TABLE - 告警记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_rule_id BIGINT NOT NULL,
    device_id VARCHAR(100),
    facility_id VARCHAR(100) NOT NULL,
    emission_type VARCHAR(20) NOT NULL,
    trigger_value NUMERIC(15,3) NOT NULL,
    threshold_value NUMERIC(15,3) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    alert_message TEXT NOT NULL,
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
    triggered_at TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(100),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE alerts IS '告警记录表，存储所有触发的碳排放告警事件';

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Carbon emissions table indexes (existing table)
CREATE INDEX IF NOT EXISTS idx_carbon_emissions_device_timestamp 
ON carbon_emissions(device_id, measurement_timestamp);

CREATE INDEX IF NOT EXISTS idx_carbon_emissions_facility_timestamp 
ON carbon_emissions(facility_name, measurement_timestamp);

CREATE INDEX IF NOT EXISTS idx_carbon_emissions_type_timestamp 
ON carbon_emissions(emission_type, measurement_timestamp);

-- New tables indexes
CREATE INDEX IF NOT EXISTS idx_devices_facility_status 
ON devices(facility_id, status);

CREATE INDEX IF NOT EXISTS idx_devices_type_status 
ON devices(device_type, status);

CREATE INDEX IF NOT EXISTS idx_emission_factors_category_active 
ON emission_factors(source_category, is_active);

CREATE INDEX IF NOT EXISTS idx_facilities_status 
ON facilities(status);

CREATE INDEX IF NOT EXISTS idx_emission_reports_facility_period 
ON emission_reports(facility_id, report_period_start, report_period_end);

CREATE INDEX IF NOT EXISTS idx_alert_rules_facility_active 
ON alert_rules(facility_id, is_active);

CREATE INDEX IF NOT EXISTS idx_alerts_facility_status_triggered 
ON alerts(facility_id, alert_status, triggered_at);

-- =====================================================
-- 8. FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints
ALTER TABLE devices 
ADD CONSTRAINT fk_devices_facility 
FOREIGN KEY (facility_id) REFERENCES facilities(facility_id);

ALTER TABLE emission_reports 
ADD CONSTRAINT fk_emission_reports_facility 
FOREIGN KEY (facility_id) REFERENCES facilities(facility_id);

ALTER TABLE alert_rules 
ADD CONSTRAINT fk_alert_rules_facility 
FOREIGN KEY (facility_id) REFERENCES facilities(facility_id);

ALTER TABLE alert_rules 
ADD CONSTRAINT fk_alert_rules_device 
FOREIGN KEY (device_id) REFERENCES devices(device_id);

ALTER TABLE alerts 
ADD CONSTRAINT fk_alerts_rule 
FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id);

ALTER TABLE alerts 
ADD CONSTRAINT fk_alerts_facility 
FOREIGN KEY (facility_id) REFERENCES facilities(facility_id);

-- =====================================================
-- 9. SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample facilities
INSERT INTO facilities (facility_id, facility_name, facility_type, address, city, country, contact_person, contact_email) VALUES
('FAC001', '北京制造工厂', 'manufacturing', '北京市朝阳区工业园区1号', '北京', '中国', '张经理', 'zhang@company.com'),
('FAC002', '上海数据中心', 'datacenter', '上海市浦东新区科技园区2号', '上海', '中国', '李经理', 'li@company.com'),
('FAC003', '深圳办公大楼', 'office', '深圳市南山区科技园3号', '深圳', '中国', '王经理', 'wang@company.com')
ON CONFLICT (facility_id) DO NOTHING;

-- Insert sample devices
INSERT INTO devices (device_id, device_name, device_type, facility_id, location_description, manufacturer, model) VALUES
('DEV001', 'CO2传感器-1号车间', 'sensor', 'FAC001', '1号生产车间东侧', 'SensorTech', 'ST-CO2-100'),
('DEV002', 'CH4分析仪-锅炉房', 'analyzer', 'FAC001', '锅炉房监测点', 'GasAnalyzer', 'GA-CH4-200'),
('DEV003', '电力计量器-主配电室', 'meter', 'FAC002', '主配电室', 'PowerMeter', 'PM-E-300'),
('DEV004', 'CO2监控器-办公区', 'monitor', 'FAC003', '办公区域中央空调出风口', 'AirMonitor', 'AM-CO2-400')
ON CONFLICT (device_id) DO NOTHING;

-- Insert sample emission factors
INSERT INTO emission_factors (factor_name, emission_type, source_category, factor_value, unit, region, year, source_reference) VALUES
('电力消耗排放因子', 'CO2', '电力消耗', 0.5703, 'kg CO2/kWh', '中国', 2023, '国家发改委2023年电网排放因子'),
('天然气燃烧排放因子', 'CO2', '燃料燃烧', 2.1622, 'kg CO2/m³', '中国', 2023, 'IPCC 2006指南'),
('柴油燃烧排放因子', 'CO2', '燃料燃烧', 2.6760, 'kg CO2/L', '中国', 2023, 'IPCC 2006指南'),
('甲烷泄漏排放因子', 'CH4', '工业过程', 25.0000, 'kg CO2e/kg CH4', '全球', 2023, 'IPCC AR5 GWP值')
ON CONFLICT DO NOTHING;

-- Insert sample alert rules
INSERT INTO alert_rules (rule_name, facility_id, emission_type, threshold_value, threshold_type, severity, notification_channels) VALUES
('CO2排放超标告警', 'FAC001', 'CO2', 1000.0, 'above', 'high', '["email", "sms"]'),
('甲烷泄漏告警', 'FAC001', 'CH4', 50.0, 'above', 'critical', '["email", "sms", "webhook"]'),
('数据中心能耗告警', 'FAC002', 'total', 500.0, 'above', 'medium', '["email"]')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. VIEWS FOR REPORTING
-- =====================================================

-- Create view for daily emission summary
CREATE OR REPLACE VIEW daily_emission_summary AS
SELECT 
    facility_name,
    DATE(measurement_timestamp) as emission_date,
    emission_type,
    SUM(emission_value) as total_emissions,
    AVG(emission_value) as avg_emissions,
    COUNT(*) as measurement_count,
    MIN(measurement_timestamp) as first_measurement,
    MAX(measurement_timestamp) as last_measurement
FROM carbon_emissions 
WHERE measurement_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY facility_name, DATE(measurement_timestamp), emission_type
ORDER BY facility_name, emission_date DESC, emission_type;

-- Create view for facility overview
CREATE OR REPLACE VIEW facility_overview AS
SELECT 
    f.facility_id,
    f.facility_name,
    f.facility_type,
    f.city,
    f.status,
    COUNT(d.id) as device_count,
    COUNT(CASE WHEN d.status = 'active' THEN 1 END) as active_devices,
    MAX(ce.measurement_timestamp) as last_measurement
FROM facilities f
LEFT JOIN devices d ON f.facility_id = d.facility_id
LEFT JOIN carbon_emissions ce ON f.facility_name = ce.facility_name
GROUP BY f.facility_id, f.facility_name, f.facility_type, f.city, f.status
ORDER BY f.facility_name;

-- =====================================================
-- 11. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emission_factors_updated_at BEFORE UPDATE ON emission_factors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emission_reports_updated_at BEFORE UPDATE ON emission_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Carbon Emissions Tracking Database Migration Completed Successfully';
    RAISE NOTICE 'Created tables: devices, emission_factors, facilities, emission_reports, alert_rules, alerts';
    RAISE NOTICE 'Created indexes for performance optimization';
    RAISE NOTICE 'Created views: daily_emission_summary, facility_overview';
    RAISE NOTICE 'Added sample data for testing';
END $$;