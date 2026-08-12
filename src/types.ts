export interface PipelineSummary {
  total_pipelines: number;
  appci_count: number;
  uses_wiz_template: {
    true: number;
    false: number;
  };
}

export interface EvaluationSummary {
  total_executions: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ChartItem {
  name: string;
  count: number;
}

export interface EvaluationByDate {
  date: string;
  count: number;
  high: number;
  medium: number;
  low: number;
  critical: number;
}

export interface DashboardCharts {
  pipelines_by_project: ChartItem[];
  pipelines_by_vp: ChartItem[];
  pipelines_by_director: ChartItem[];
  pipelines_by_managing_director: ChartItem[];
  pipelines_by_managed_by: ChartItem[];
  evaluations_by_date: EvaluationByDate[];
  evaluations_by_status: ChartItem[];
}

export interface FilterOptions {
  projects: string[];
  vps: string[];
  directors: string[];
  managing_directors: string[];
  managed_by: string[];
  iac_tools?: string[];
}

export interface DashboardData {
  pipeline_summary: PipelineSummary;
  evaluation_summary: EvaluationSummary;
  charts: DashboardCharts;
  filter_options: FilterOptions;
}

export interface Pipeline {
  uses_wiz_template: boolean;
  project: string;
  project_name: string;
  pipeline: string;
  stage_id: string | null;
  iac_tool: string;
  vp: string;
  managing_director: string;
  managed_by: string;
  director: string;
}

export interface Evaluation {
  pipeline: string;
  project: string;
  environment: string | null;
  high: number;
  medium: number;
  low: number;
  critical: number;
  evaluation_status: string;
  execution_datetime: string;
  execution_url: string;
  policy_name: string;
}

export interface EvaluationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Evaluation[];
}

export interface PipelineResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Pipeline[];
}
