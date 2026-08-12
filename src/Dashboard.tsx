import { useEffect, useMemo, useState, type FC, type ChangeEvent } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

import { RefreshCw, Search, X } from "lucide-react";

import "./App.css";

import type {
  DashboardData,
  Pipeline,
  Evaluation,
  PipelineResponse,
  EvaluationResponse,
  ChartItem,
} from "./types";

const COLORS = ["#081b70", "#2878e8"];

const DATA_URLS = {
  dashboard: "/data/Dashboard.json",
  evaluations: "/data/evaluation_list.json",
  pipelines: "/data/wiz_pipeline_list.json",
};

type FilterState = {
  project: string;
  vp: string;
  managingDirector: string;
  director: string;
  managedBy: string;
  usesWiz: string;
  iacTool: string;
};

interface FilterProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface BarChartCardProps {
  title: string;
  data: ChartItem[];
  rotate?: boolean;
  height?: number;
}

/* =========================================
   HELPERS
========================================= */

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const truncate = (value: string | null | undefined, length = 22): string => {
  if (!value) return "-";

  return value.length > length ? `${value.substring(0, length)}...` : value;
};

/* =========================================
   FILTER
========================================= */

const Filter: FC<FilterProps> = ({ label, value, options, onChange }) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="filter">
      <label>{label}</label>

      <select value={value} onChange={handleChange}>
        <option value="All">All</option>

        {options?.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

/* =========================================
   CARD
========================================= */

const Card: FC<CardProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-title">{title}</div>

      {children}
    </div>
  );
};

/* =========================================
   BAR CHART
========================================= */

const BarChartCard: FC<BarChartCardProps> = ({
  title,
  data,
  rotate = false,
  height = 220,
}) => {
  return (
    <Card title={title} className="chart-card">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: rotate ? 70 : 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="name"
            interval={0}
            angle={rotate ? -45 : 0}
            textAnchor={rotate ? "end" : "middle"}
            tick={{
              fontSize: 10,
            }}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 10,
            }}
          />

          <Tooltip />

          <Bar
            dataKey="count"
            fill="#081b70"
            radius={[2, 2, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

/* =========================================
   APP
========================================= */

function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState<FilterState>({
    project: "All",
    vp: "All",
    managingDirector: "All",
    director: "All",
    managedBy: "All",
    usesWiz: "All",
    iacTool: "All",
  });

  const [search, setSearch] = useState<string>("");

  const [page, setPage] = useState<number>(1);

  const pageSize = 15;

  /* =====================================
     LOAD JSON
  ====================================== */

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);

      const [dashboardResponse, evaluationResponse, pipelineResponse] =
        await Promise.all([
          fetch(DATA_URLS.dashboard),
          fetch(DATA_URLS.evaluations),
          fetch(DATA_URLS.pipelines),
        ]);

      const dashboardData: DashboardData = await dashboardResponse.json();

      const evaluationData: EvaluationResponse =
        await evaluationResponse.json();

      const pipelineData: PipelineResponse = await pipelineResponse.json();

      setDashboard(dashboardData);

      setEvaluations(evaluationData.results || []);

      setPipelines(pipelineData.results || []);
    } catch (error) {
      console.error("Dashboard loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =====================================
     FILTER PIPELINES
  ====================================== */

  const filteredPipelines = useMemo(() => {
    return pipelines.filter((pipeline: Pipeline) => {
      if (filters.project !== "All" && pipeline.project !== filters.project) {
        return false;
      }

      if (filters.vp !== "All" && pipeline.vp !== filters.vp) {
        return false;
      }

      if (
        filters.managingDirector !== "All" &&
        pipeline.managing_director !== filters.managingDirector
      ) {
        return false;
      }

      if (
        filters.director !== "All" &&
        pipeline.director !== filters.director
      ) {
        return false;
      }

      if (
        filters.managedBy !== "All" &&
        pipeline.managed_by !== filters.managedBy
      ) {
        return false;
      }

      if (
        filters.usesWiz !== "All" &&
        String(pipeline.uses_wiz_template) !== filters.usesWiz
      ) {
        return false;
      }

      if (filters.iacTool !== "All" && pipeline.iac_tool !== filters.iacTool) {
        return false;
      }

      /* SEARCH */

      if (search) {
        const query = search.toLowerCase();

        const found = Object.values(pipeline).some(
          (value: string | boolean | null) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query),
        );

        if (!found) {
          return false;
        }
      }

      return true;
    });
  }, [pipelines, filters, search]);

  /* =====================================
     CHART DATA
  ====================================== */

  const createChartData = (key: keyof Pipeline): ChartItem[] => {
    const result: Record<string, number> = {};

    filteredPipelines.forEach((pipeline: Pipeline) => {
      const value = pipeline[key];

      const name = String(value || "Unknown");

      result[name] = (result[name] || 0) + 1;
    });

    return Object.entries(result)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const projectsData = createChartData("project").slice(0, 10);

  const vpData = createChartData("vp").slice(0, 8);

  const directorData = createChartData("director").slice(0, 18);

  const managingDirectorData = createChartData("managing_director").slice(
    0,
    20,
  );

  const managedByData = createChartData("managed_by").slice(0, 25);

  /* =====================================
     PIE DATA
  ====================================== */

  const wizCount = filteredPipelines.filter(
    (pipeline: Pipeline) => pipeline.uses_wiz_template === true,
  ).length;

  const nonWizCount = filteredPipelines.length - wizCount;

  const pieData = [
    {
      name: "Uses Wiz Template",
      value: wizCount,
    },
    {
      name: "Does Not Use",
      value: nonWizCount,
    },
  ];

  /* =====================================
     PAGINATION
  ====================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPipelines.length / pageSize),
  );

  const visiblePipelines = filteredPipelines.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  /* =====================================
     RESET
  ====================================== */

  const resetFilters = (): void => {
    setFilters({
      project: "All",
      vp: "All",
      managingDirector: "All",
      director: "All",
      managedBy: "All",
      usesWiz: "All",
      iacTool: "All",
    });

    setSearch("");
  };

  /* =====================================
     LOADING
  ====================================== */

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div className="error">Unable to load dashboard.</div>;
  }

  const summary = dashboard.pipeline_summary;

  const evaluationSummary = dashboard.evaluation_summary;

  const filterOptions = dashboard.filter_options;

  /* =====================================
     RENDER
  ====================================== */

  return (
    <div className="dashboard">
      {/* =================================
          TABS
      ================================== */}

      <div className="tabs">
        {[
          "Overall Templates",
          "Java Template",
          "Node Js Template",
          "CI Dot Net Template",
          "OIDC Template",
          "Rapid Recovery",
          "LambdaCI Python",
          "SSM Templates",
          "Wiz Templates",
          "ECS CD Template",
          "Kong Templates",
        ].map((tab: string) => (
          <div
            key={tab}
            className={tab === "Wiz Templates" ? "tab active" : "tab"}
          >
            {tab}
          </div>
        ))}
      </div>

      <div className="content">
        {/* ===============================
            FILTERS
        ================================ */}

        <div className="filters">
          <Filter
            label="Appci"
            value={filters.project}
            options={filterOptions.projects}
            onChange={(value: string) =>
              setFilters({
                ...filters,
                project: value,
              })
            }
          />

          <Filter
            label="VP"
            value={filters.vp}
            options={filterOptions.vps}
            onChange={(value: string) =>
              setFilters({
                ...filters,
                vp: value,
              })
            }
          />

          <Filter
            label="Managing Director"
            value={filters.managingDirector}
            options={filterOptions.managing_directors}
            onChange={(value: string) =>
              setFilters({
                ...filters,
                managingDirector: value,
              })
            }
          />

          <Filter
            label="Director"
            value={filters.director}
            options={filterOptions.directors}
            onChange={(value: string) =>
              setFilters({
                ...filters,
                director: value,
              })
            }
          />

          <Filter
            label="Owned By"
            value={filters.managedBy}
            options={filterOptions.managed_by}
            onChange={(value: string) =>
              setFilters({
                ...filters,
                managedBy: value,
              })
            }
          />

          <Filter
            label="Uses Wiz Template"
            value={filters.usesWiz}
            options={["true", "false"]}
            onChange={(value: string) =>
              setFilters({
                ...filters,
                usesWiz: value,
              })
            }
          />

          <Filter
            label="CF Vs TF"
            value={filters.iacTool}
            options={filterOptions.iac_tools || []}
            onChange={(value: string) =>
              setFilters({
                ...filters,
                iacTool: value,
              })
            }
          />
        </div>

        {/* ===============================
            ACTIONS
        ================================ */}

        <div className="actions">
          <div className="search-box">
            <Search size={16} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search pipelines..."
            />
          </div>

          <button className="action-button" onClick={loadData}>
            <RefreshCw size={15} />
            Refresh
          </button>

          <button className="action-button" onClick={resetFilters}>
            <X size={15} />
            Clear
          </button>
        </div>

        {/* ===============================
            DASHBOARD
        ================================ */}

        <div className="top-grid">
          <Card title="# of Pipelines Using Wiz Template" className="kpi">
            <div className="number">
              {formatNumber(summary.total_pipelines)}
            </div>
          </Card>

          <Card title="# Appci Count" className="kpi">
            <div className="number">{formatNumber(summary.appci_count)}</div>
          </Card>

          {/* PIE */}

          <Card title="Wiz Pipeline Adoption %" className="pie">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="40%"
                  cy="50%"
                  outerRadius={80}
                  label={({ value }) =>
                    `${value} (${(
                      (value / Math.max(filteredPipelines.length, 1)) *
                      100
                    ).toFixed(2)}%)`
                  }
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>

                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <BarChartCard title="#Pipeline by Projects" data={projectsData} />

          <BarChartCard title="#Pipeline by VP" data={vpData} />

          <BarChartCard
            title="#Pipeline by Director"
            data={directorData}
            rotate
          />
        </div>

        {/* ===============================
            MANAGEMENT CHARTS
        ================================ */}

        <div className="two-column">
          <BarChartCard
            title="#Pipeline by Managing Director"
            data={managingDirectorData}
            rotate
            height={260}
          />

          <BarChartCard
            title="#Pipeline by Managed by"
            data={managedByData}
            rotate
            height={260}
          />
        </div>

        {/* ===============================
            TABLE
        ================================ */}

        <div className="bottom-grid">
          <Card
            title={`Pipeline Inventory (${formatNumber(
              filteredPipelines.length,
            )})`}
            className="table-card"
          >
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Wiz Template In-Use</th>

                    <th>Project</th>

                    <th>Project Name</th>

                    <th>Pipeline Name</th>

                    <th>IaC Tool</th>

                    <th>VP</th>

                    <th>Managing Director</th>

                    <th>Director</th>

                    <th>Owned By</th>
                  </tr>
                </thead>

                <tbody>
                  {visiblePipelines.map((pipeline: Pipeline, index: number) => (
                    <tr
                      key={`${pipeline.project}-${pipeline.pipeline}-${index}`}
                    >
                      <td>
                        <span
                          className={pipeline.uses_wiz_template ? "yes" : "no"}
                        >
                          {String(pipeline.uses_wiz_template)}
                        </span>
                      </td>

                      <td>{pipeline.project}</td>

                      <td>{pipeline.project_name}</td>

                      <td title={pipeline.pipeline}>
                        {truncate(pipeline.pipeline, 35)}
                      </td>

                      <td>{pipeline.iac_tool || "-"}</td>

                      <td>{truncate(pipeline.vp)}</td>

                      <td>{truncate(pipeline.managing_director)}</td>

                      <td>{truncate(pipeline.director)}</td>

                      <td>{truncate(pipeline.managed_by)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span>
                Showing{" "}
                {filteredPipelines.length ? (page - 1) * pageSize + 1 : 0}-
                {Math.min(page * pageSize, filteredPipelines.length)} of{" "}
                {formatNumber(filteredPipelines.length)}
              </span>

              <div>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>

                <span>
                  {page} / {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </Card>

          {/* =============================
              EVALUATION
          ============================== */}

          <Card title="Evaluation Summary" className="evaluation">
            <div className="evaluation-stats">
              <div>
                <strong>
                  {formatNumber(evaluationSummary.total_executions)}
                </strong>

                <span>Executions</span>
              </div>

              <div>
                <strong>
                  {formatNumber(
                    evaluationSummary.total_executions -
                      evaluationSummary.critical -
                      evaluationSummary.high -
                      evaluationSummary.medium -
                      evaluationSummary.low,
                  )}
                </strong>

                <span>Pass</span>
              </div>

              <div>
                <strong>{evaluationSummary.high}</strong>

                <span>High</span>
              </div>

              <div>
                <strong>{evaluationSummary.medium}</strong>

                <span>Medium</span>
              </div>

              <div>
                <strong>{evaluationSummary.low}</strong>

                <span>Low</span>
              </div>

              <div>
                <strong>{evaluationSummary.critical}</strong>

                <span>Critical</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dashboard.charts.evaluations_by_date}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 10,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#081b70"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="evaluation-list">
              {evaluations
                .slice(0, 8)
                .map((evaluation: Evaluation, index: number) => (
                  <div className="evaluation-row" key={index}>
                    <span>{truncate(evaluation.pipeline, 30)}</span>

                    <span className="pass">{evaluation.evaluation_status}</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
