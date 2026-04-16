export interface AnalyticsParams {
  start_date?: string
  end_date?: string
  period?: 'daily' | 'weekly' | 'monthly'
  granularity?: 'hour' | 'day' | 'week' | 'month'
  filters?: Record<string, any>
}

export interface UserAnalytics {
  overview: UserOverview
  growth_trend: DataPoint[]
  status_distribution: StatusDistribution[]
  geographic_data: GeographicData[]
  activity_data: ActivityData[]
  top_countries: CountryData[]
  top_cities: CityData[]
  language_stats: LanguageData[]
  tag_distribution: TagDistribution[]
  time_range: TimeRange
}

export interface UserOverview {
  total_users: number
  active_users: number
  new_users: number
  online_users: number
  growth_rate: number
  retention_rate: number
  activity_rate: number
  avg_message_count: number
}

export interface GrowthTrend {
  period: string
  data_points: DataPoint[]
  summary: GrowthSummary
  projection?: DataPoint[]
}

export interface ActivityAnalytics {
  online_activity: TimeSeriesData[]
  message_activity: TimeSeriesData[]
  peak_hours: HourlyData[]
  active_users_by_hour: HourlyData[]
  user_engagement: UserEngagementData
}

export interface MessageAnalytics {
  overview: MessageOverview
  trend_data: TimeSeriesData[]
  top_users: TopUserData[]
  message_patterns: MessagePattern[]
  hourly_pattern: HourlyData[]
}

export interface GeographicAnalytics {
  country_distribution: CountryData[]
  city_distribution: CityData[]
  region_growth: RegionGrowth[]
  heatmap_data: HeatmapPoint[]
}

export interface RealTimeStats {
  online_users: number
  active_sessions: number
  messages_per_min: number
  new_users_today: number
  top_active_users: TopUserData[]
  system_load: SystemLoadData
  last_updated: string
}

export interface CustomReportConfig {
  title: string
  description?: string
  data_sources: DataSource[]
  filters?: Record<string, any>
  charts: ChartConfig[]
  time_range: TimeRange
}

// 基础数据类型
export interface DataPoint {
  date: string
  value: number
  label?: string
}

export interface TimeSeriesData {
  timestamp: string
  value: number
  label?: string
}

export interface StatusDistribution {
  status: string
  count: number
  percentage: number
}

export interface GeographicData {
  country: string
  city?: string
  count: number
  lat?: number
  lng?: number
}

export interface CountryData {
  country: string
  user_count: number
  percentage: number
  growth_rate?: number
}

export interface CityData {
  city: string
  country: string
  user_count: number
  percentage: number
}

export interface ActivityData {
  hour: number
  count: number
  rate: number
}

export interface HourlyData {
  hour: number
  value: number
}

export interface LanguageData {
  language: string
  user_count: number
  percentage: number
}

export interface TagDistribution {
  tag_id: number
  tag_name: string
  user_count: number
  percentage: number
}

export interface TimeRange {
  start_date: string
  end_date: string
  period: string
}

export interface GrowthSummary {
  total_growth: number
  avg_growth_rate: number
  peak_growth_date: string
  peak_growth_rate: number
}

export interface UserEngagementData {
  highly_engaged: number
  moderately_engaged: number
  low_engaged: number
  engagement_score: number
}

export interface MessageOverview {
  total_messages: number
  avg_messages_per_user: number
  peak_message_time: string
  growth_rate: number
}

export interface TopUserData {
  user_id: number
  name: string
  message_count: number
  online_time?: number
}

export interface MessagePattern {
  pattern: string
  frequency: number
  percentage: number
  description: string
}

export interface RegionGrowth {
  region: string
  growth_rate: number
  new_users: number
}

export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

export interface SystemLoadData {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_io: number
}

export interface DataSource {
  type: string
  table: string
  fields: string[]
  joins?: JoinConfig[]
}

export interface JoinConfig {
  table: string
  on: string
  type: string
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap'
  title: string
  x_axis: string
  y_axis: string
  series: SeriesConfig[]
}

export interface SeriesConfig {
  name: string
  data: string
  color?: string
}

// 高级分析类型
export interface UserSegmentAnalytics {
  segments: UserSegment[]
  segment_comparison: SegmentComparison[]
  recommended_actions: ActionRecommendation[]
}

export interface UserSegment {
  id: string
  name: string
  description: string
  user_count: number
  percentage: number
  criteria: Record<string, any>
}

export interface SegmentComparison {
  segment_a: string
  segment_b: string
  metric: string
  value_a: number
  value_b: number
  difference: number
}

export interface ActionRecommendation {
  segment: string
  action: string
  description: string
  priority: string
  impact: string
}

export interface BehaviorAnalytics {
  user_id: number
  activity_pattern: ActivityPattern
  message_pattern: MessagePattern
  online_pattern: OnlinePattern
  behavior_score: BehaviorScore
  recommendations: string[]
}

export interface ActivityPattern {
  most_active_hour: number
  least_active_hour: number
  activity_score: number
  consistency_score: number
}

export interface OnlinePattern {
  avg_online_time: number
  online_frequency: number
  preferred_hours: number[]
}

export interface BehaviorScore {
  overall: number
  activity: number
  engagement: number
  consistency: number
}

export interface CohortAnalysis {
  period: string
  cohort_table: number[][]
  cohort_labels: string[]
  period_labels: string[]
  summary: CohortSummary
}

export interface CohortSummary {
  avg_retention: number
  best_cohort: string
  worst_cohort: string
  retention_trend: string
}

export interface PredictionResponse {
  type: string
  predictions: DataPoint[]
  confidence: number
  model: string
  accuracy: number
}

export interface ChurnPrediction {
  churn_rate: number
  at_risk_users: AtRiskUser[]
  churn_factors: ChurnFactor[]
  prevention_tips: string[]
  prediction_model: PredictionModelInfo
}

export interface AtRiskUser {
  user_id: number
  name: string
  churn_score: number
  risk_factors: string[]
  last_seen: string
}

export interface ChurnFactor {
  factor: string
  weight: number
  impact: string
}

export interface PredictionModelInfo {
  name: string
  version: string
  accuracy: number
  last_trained: string
}

// 仪表板相关类型
export interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'map'
  title: string
  description?: string
  config: any
  position: WidgetPosition
  size: WidgetSize
}

export interface WidgetPosition {
  x: number
  y: number
}

export interface WidgetSize {
  width: number
  height: number
}

export interface MetricCard {
  title: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  format?: 'number' | 'percentage' | 'currency' | 'time'
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export interface ChartData {
  labels: string[]
  datasets: ChartDataset[]
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
}

export interface TableData {
  columns: TableColumn[]
  rows: any[]
}

export interface TableColumn {
  key: string
  title: string
  width?: number
  align?: 'left' | 'center' | 'right'
  formatter?: (value: any) => string
}