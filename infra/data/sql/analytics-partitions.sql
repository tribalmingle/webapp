CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.analytics_snapshots (
  snapshot_id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  range TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  dimensions JSONB NOT NULL,
  metrics JSONB NOT NULL,
  source TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (date_trunc('month', window_start));

CREATE TABLE IF NOT EXISTS analytics.funnel_metrics (
  funnel_metric_id UUID PRIMARY KEY,
  funnel_id TEXT NOT NULL,
  step_order INT NOT NULL,
  step_name TEXT NOT NULL,
  audience_filters JSONB NOT NULL,
  counts JSONB NOT NULL,
  conversion_rate NUMERIC NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  experiment_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (date_trunc('month', window_start));

CREATE TABLE IF NOT EXISTS analytics.cohort_metrics (
  cohort_metric_id UUID PRIMARY KEY,
  cohort_key TEXT NOT NULL,
  cohort_date DATE NOT NULL,
  dimension TEXT NOT NULL,
  week_number INT NOT NULL,
  retention_rate NUMERIC NOT NULL,
  revenue_per_user NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
) PARTITION BY RANGE (cohort_date);

-- Sample partitions
CREATE TABLE IF NOT EXISTS analytics.analytics_snapshots_2025_01 PARTITION OF analytics.analytics_snapshots
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS analytics.funnel_metrics_2025_01 PARTITION OF analytics.funnel_metrics
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS analytics.cohort_metrics_2025 PARTITION OF analytics.cohort_metrics
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
