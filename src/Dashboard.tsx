import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";

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
  AreaChart,
  Area,
} from "recharts";

import {
  RefreshCw,
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Building2,
  ShieldCheck,
  PieChart as PieChartIcon,
  SlidersHorizontal,
  Clock,
  Check,
} from "lucide-react";

import "./App.css";

import type {
  DashboardData,
  Pipeline,
  Evaluation,
  PipelineResponse,
  EvaluationResponse,
  ChartItem,
} from "./types";

const COLORS = ["#6366f1", "#fb923c"];

const PALETTE = [
  "#6366f1",
  "#fb923c",
  "#10b981",
  "#0ea5e9",
  "#f43f5e",
  "#a855f7",
  "#eab308",
  "#14b8a6",
];

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
  icon?: ReactNode;
  action?: ReactNode;
}

interface BarChartCardProps {
  title: string;
  data: ChartItem[];
  rotate?: boolean;
  height?: number;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: "indigo" | "blue" | "emerald" | "amber";
}

interface RankedListProps {
  title: string;
  icon?: ReactNode;
  data: ChartItem[];
}

interface HighlightCardProps {
  label: string;
  value: string;
  sublabel?: string;
  data: { name?: string; date?: string; count: number }[];
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

const initials = (value: string | null | undefined): string => {
  if (!value || value === "N/A") return "-";

  const parts = value.trim().split(/\s+/);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

/* =========================================
   FILTER
========================================= */

const Filter: FC<FilterProps> = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div
      className={`filter ${value !== "All" ? "filter-active" : ""}`}
      ref={rootRef}
    >
      <label>{label}</label>

      <div className="filter-dropdown">
        <button
          type="button"
          className="filter-dropdown-trigger"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span>{value}</span>
          <ChevronDown
            size={14}
            className={`filter-caret ${open ? "filter-caret-open" : ""}`}
          />
        </button>

        {open && (
          <div className="filter-dropdown-menu">
            <button
              type="button"
              className={`filter-dropdown-option ${value === "All" ? "is-selected" : ""}`}
              onClick={() => handleSelect("All")}
            >
              <span>All</span>
              {value === "All" && <Check size={13} />}
            </button>

            {options?.map((option: string) => (
              <button
                type="button"
                key={option}
                className={`filter-dropdown-option ${value === option ? "is-selected" : ""}`}
                onClick={() => handleSelect(option)}
              >
                <span>{option}</span>
                {value === option && <Check size={13} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================
   CARD
========================================= */

const Card: FC<CardProps> = ({ title, children, className = "", icon, action }) => {
  return (
    <div className={`card ${className}`}>
      <div className="card-title">
        <span className="card-title-text">
          {icon && <span className="card-title-icon">{icon}</span>}
          {title}
        </span>

        {action}
      </div>

      <div className="card-body">{children}</div>
    </div>
  );
};

/* =========================================
   STAT CARD
========================================= */

const StatCard: FC<StatCardProps> = ({ label, value, icon, accent = "indigo" }) => {
  return (
    <div className={`stat-tile stat-tile--${accent}`}>
      <div className="stat-tile-icon">{icon}</div>

      <div className="stat-tile-text">
        <div className="stat-tile-value">{value}</div>
        <div className="stat-tile-label">{label}</div>
      </div>
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
  if (data.length === 0) {
    return (
      <Card title={title} className="chart-card">
        <div className="chart-empty" style={{ height }}>
          <PieChartIcon size={22} />
          <span>No data available</span>
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} className="chart-card">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          barCategoryGap={data.length <= 4 ? "35%" : "18%"}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: rotate ? 70 : 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />

          <XAxis
            dataKey="name"
            interval={0}
            angle={rotate ? -45 : 0}
            textAnchor={rotate ? "end" : "middle"}
            tick={{
              fontSize: 10,
              fill: "#64748b",
            }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />

          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 10,
              fill: "#64748b",
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              fontSize: 12,
            }}
          />

          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={54}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

/* =========================================
   RANKED LIST (colorful ranking bars)
========================================= */

const RankedList: FC<RankedListProps> = ({ title, icon, data }) => {
  const max = Math.max(...data.map((item) => item.count), 1);

  if (data.length === 0) {
    return (
      <Card title={title} icon={icon}>
        <div className="chart-empty">
          <Building2 size={22} />
          <span>No data available</span>
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} icon={icon}>
      <div className="ranked-list">
        {data.map((item, index) => (
          <div className="ranked-row" key={item.name}>
            <span
              className="ranked-dot"
              style={{ background: PALETTE[index % PALETTE.length] }}
            />

            <span className="ranked-name" title={item.name}>
              {truncate(item.name, 18)}
            </span>

            <div className="ranked-bar-track">
              <div
                className="ranked-bar-fill"
                style={{
                  width: `${(item.count / max) * 100}%`,
                  background: PALETTE[index % PALETTE.length],
                }}
              />
            </div>

            <span className="ranked-count">{item.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* =========================================
   HIGHLIGHT CARD (gradient CTA)
========================================= */

const HighlightCard: FC<HighlightCardProps> = ({
  label,
  value,
  sublabel,
  data,
}) => {
  return (
    <div className="highlight-card">
      <div>
        <div className="highlight-card-value">{value}</div>
        <div className="highlight-card-label">{label}</div>
        {sublabel && <div className="highlight-card-sub">{sublabel}</div>}
      </div>

      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="highlightArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="count"
            stroke="#ffffff"
            strokeWidth={2}
            fill="url(#highlightArea)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
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

  const managingDirectorListData = managingDirectorData.slice(0, 8);

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

  const passCount =
    evaluationSummary.total_executions -
    evaluationSummary.critical -
    evaluationSummary.high -
    evaluationSummary.medium -
    evaluationSummary.low;

  const adoptionPct = (
    (wizCount / Math.max(filteredPipelines.length, 1)) *
    100
  ).toFixed(1);

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== "All",
  ).length;

  /* =====================================
     RENDER
  ====================================== */

  return (
    <div className="dashboard">
      {/* =================================
          HEADER
      ================================== */}

      <header className="dash-header">
        <div className="dash-header-brand">
          <div className="dash-logo">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h1>Pipeline Security Dashboard</h1>
            <p>Real-time visibility into pipeline compliance &amp; ownership</p>
          </div>
        </div>

        <button className="action-button action-button--ghost" onClick={loadData}>
          <RefreshCw size={15} />
          Refresh Data
        </button>
      </header>

      {/* =================================
          TABS
      ================================== */}

      <nav className="tabs">
        <button type="button" className="tab active">
          Wiz Templates
        </button>

        <div className="tab-more-wrap">
          <select
            className="tab-more-select"
            value=""
            onChange={() => {}}
            aria-label="Other templates"
          >
            <option value="" disabled>
              Other Templates
            </option>

            {[
              "Overall Templates",
              "Java Template",
              "Node Js Template",
              "CI Dot Net Template",
              "OIDC Template",
              "Rapid Recovery",
              "LambdaCI Python",
              "SSM Templates",
              "ECS CD Template",
              "Kong Templates",
            ].map((tab: string) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>

          <ChevronDown size={14} className="tab-more-caret" />
        </div>
      </nav>

      <div className="content">
        {/* ===============================
            FILTERS
        ================================ */}

        <div className="filter-panel">
          <div className="filter-panel-heading">
            <span>
              <SlidersHorizontal size={14} />
              Filters
            </span>

            {activeFilterCount > 0 && (
              <span className="filter-count-pill">{activeFilterCount} active</span>
            )}
          </div>

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

            <button className="action-button" onClick={resetFilters}>
              <X size={15} />
              Clear Filters
            </button>
          </div>
        </div>

        {/* ===============================
            KPI ROW
        ================================ */}

        <div className="stat-row">
          <StatCard
            label="Pipelines Using Wiz Template"
            value={formatNumber(summary.total_pipelines)}
            icon={<GitBranch size={20} />}
            accent="indigo"
          />

          <StatCard
            label="Appci Count"
            value={formatNumber(summary.appci_count)}
            icon={<Building2 size={20} />}
            accent="blue"
          />

          <StatCard
            label="Total Executions"
            value={formatNumber(evaluationSummary.total_executions)}
            icon={<Clock size={20} />}
            accent="emerald"
          />

          <StatCard
            label="Wiz Adoption Rate"
            value={`${adoptionPct}%`}
            icon={<PieChartIcon size={20} />}
            accent="amber"
          />
        </div>

        {/* ===============================
            DASHBOARD
        ================================ */}

        <div className="row-grid row-grid--donut">
          {/* PIE */}

          <Card title="Wiz Pipeline Adoption" className="pie" icon={<PieChartIcon size={14} />}>
            {filteredPipelines.length === 0 ? (
              <div className="chart-empty" style={{ height: 230 }}>
                <PieChartIcon size={22} />
                <span>No data available</span>
              </div>
            ) : (
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={2}
                      cornerRadius={6}
                      strokeWidth={0}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />

                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center">
                  <strong>{adoptionPct}%</strong>
                  <span>Adoption</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="row-grid row-grid--triple-equal">
          <BarChartCard title="#Pipeline by Projects" data={projectsData} />

          <BarChartCard title="#Pipeline by VP" data={vpData} />

          <BarChartCard
            title="#Pipeline by Director"
            data={directorData}
            rotate
          />

          <HighlightCard
            label="Wiz Adoption Rate"
            value={`${adoptionPct}%`}
            sublabel={`${formatNumber(wizCount)} of ${formatNumber(filteredPipelines.length)} pipelines`}
            data={dashboard.charts.evaluations_by_date}
          />
        </div>

        {/* ===============================
            MANAGEMENT CHARTS
        ================================ */}

        <div className="two-column">
          <RankedList
            title="#Pipeline by Managing Director"
            icon={<Building2 size={14} />}
            data={managingDirectorListData}
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
            title={`Pipeline Inventory`}
            className="table-card"
            icon={<GitBranch size={14} />}
            action={
              <span className="card-title-count">
                {formatNumber(filteredPipelines.length)} results
              </span>
            }
          >
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Wiz Template</th>

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
                          <span className="status-dot" />
                          {pipeline.uses_wiz_template ? "True" : "False"}
                        </span>
                      </td>

                      <td>
                        <span className="project-chip">{pipeline.project}</span>
                      </td>

                      <td>{pipeline.project_name}</td>

                      <td title={pipeline.pipeline}>
                        <code className="pipeline-name">
                          {truncate(pipeline.pipeline, 35)}
                        </code>
                      </td>

                      <td>
                        {pipeline.iac_tool ? (
                          <span className="iac-pill">{pipeline.iac_tool}</span>
                        ) : (
                          <span className="cell-muted">-</span>
                        )}
                      </td>

                      <td>
                        <span className="person-cell">
                          <span className="person-avatar">
                            {initials(pipeline.vp)}
                          </span>
                          {truncate(pipeline.vp)}
                        </span>
                      </td>

                      <td>{truncate(pipeline.managing_director)}</td>

                      <td>{truncate(pipeline.director)}</td>

                      <td>{truncate(pipeline.managed_by)}</td>
                    </tr>
                  ))}

                  {visiblePipelines.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-row">
                        No pipelines match the current filters.
                      </td>
                    </tr>
                  )}
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
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <span className="pagination-page">
                  {page} / {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>

          {/* =============================
              EVALUATION
          ============================== */}

          <Card title="Evaluation Summary" className="evaluation" icon={<ShieldCheck size={14} />}>
            <div className="evaluation-stats">
              <div>
                <strong>
                  {formatNumber(evaluationSummary.total_executions)}
                </strong>

                <span>Executions</span>
              </div>

              <div className="stat-pass">
                <strong>{formatNumber(passCount)}</strong>

                <span>Pass</span>
              </div>

              <div className="stat-high">
                <strong>{evaluationSummary.high}</strong>

                <span>High</span>
              </div>

              <div className="stat-medium">
                <strong>{evaluationSummary.medium}</strong>

                <span>Medium</span>
              </div>

              <div className="stat-low">
                <strong>{evaluationSummary.low}</strong>

                <span>Low</span>
              </div>

              <div className="stat-critical">
                <strong>{evaluationSummary.critical}</strong>

                <span>Critical</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={dashboard.charts.evaluations_by_date}>
                <defs>
                  <linearGradient id="evalArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4338ca" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />

                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#4338ca"
                  strokeWidth={2.5}
                  fill="url(#evalArea)"
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="evaluation-list">
              {evaluations
                .slice(0, 8)
                .map((evaluation: Evaluation, index: number) => (
                  <div className="evaluation-row" key={index}>
                    <span>{truncate(evaluation.pipeline, 30)}</span>

                    <span
                      className={`status-pill status-${evaluation.evaluation_status?.toLowerCase()}`}
                    >
                      {evaluation.evaluation_status}
                    </span>
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
