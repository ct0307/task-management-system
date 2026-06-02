import React, { useEffect, useState } from "react";
import { Card, Row, Col, Typography, Button, List, Tag, Space, Empty, Modal } from "antd";
import {
  PlusOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AlertOutlined,
  RightOutlined,
  FireOutlined,
  SmileOutlined,
  RocketOutlined,
  AppstoreOutlined,
  DashboardOutlined
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatCard from "@/component/StatCard";
import ScheduleCalendar from "@/component/ScheduleCalendar";
import CountdownDays from "@/component/CountdownDays";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart
} from "recharts";
import { get } from "@/util/request";
import { API_TASK_STATS, API_TASK_LIST, API_TASK_TREND } from "@/constants/urls";
import s from "./index.module.less";

const { Title, Text } = Typography;

// 状态颜色映射
const STATUS_COLORS = {
  pending: { color: "#d4972e", bg: "#fef5e6", label: "待处理" },
  in_progress: { color: "#e85d3a", bg: "#fdf0eb", label: "进行中" },
  completed: { color: "#3d8c5c", bg: "#eaf5ee", label: "已完成" }
};

const PRIORITY_COLORS = {
  high: { color: "#d94436", label: "高" },
  medium: { color: "#d4972e", label: "中" },
  low: { color: "#3d8c5c", label: "低" }
};

const PIE_COLORS = ["#d4972e", "#e85d3a", "#3d8c5c"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  // 新用户欢迎引导
  useEffect(() => {
    const isWelcome = searchParams.get("welcome");
    const hasSeenWelcome = localStorage.getItem("WELCOME_SHOWN");
    if (isWelcome === "1" && hasSeenWelcome !== "1") {
      setWelcomeVisible(true);
      localStorage.setItem("WELCOME_SHOWN", "1");
      // 清除 URL 上的 welcome 参数
      searchParams.delete("welcome");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);
  const [recentTasks, setRecentTasks] = useState([]);
  const [trend, setTrend] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const [statsData, tasksData, trendData, calData] = await Promise.all([
          get(API_TASK_STATS),
          get(`${API_TASK_LIST}?limit=5`),
          get(`${API_TASK_TREND}?days=14`),
          get(`${API_TASK_LIST}?dateRange=${start},${end}&limit=200&includeSubtasks=1`)
        ]);
        setStats(statsData.data);
        setRecentTasks(tasksData.data || []);
        setTrend(trendData.data || []);
        setCalendarTasks((calData.data?.data || calData.data || []).filter(t => t.due_date));
      } catch (err) {
        // 静默降级
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 构建饼图数据
  const pieData = stats ? [
    { name: "待处理", value: stats.byStatus?.pending || 0, color: PIE_COLORS[0] },
    { name: "进行中", value: stats.byStatus?.in_progress || 0, color: PIE_COLORS[1] },
    { name: "已完成", value: stats.byStatus?.completed || 0, color: PIE_COLORS[2] }
  ].filter(d => d.value > 0) : [];

  // 构建优先级数据
  const priorityData = stats ? [
    { name: "高优先级", value: stats.byPriority?.high || 0, fill: "#d94436" },
    { name: "中优先级", value: stats.byPriority?.medium || 0, fill: "#d4972e" },
    { name: "低优先级", value: stats.byPriority?.low || 0, fill: "#3d8c5c" }
  ] : [];

  // 完成率
  const total = stats?.total || 0;
  const completed = stats?.byStatus?.completed || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 统计卡片配置
  const statCards = [
    {
      title: "任务总数",
      value: stats?.total || 0,
      icon: <FileTextOutlined />,
      color: "#e85d3a",
      bgColor: "#fdf0eb"
    },
    {
      title: "待处理",
      value: stats?.byStatus?.pending || 0,
      icon: <ClockCircleOutlined />,
      color: "#d4972e",
      bgColor: "#fef5e6"
    },
    {
      title: "进行中",
      value: stats?.byStatus?.in_progress || 0,
      icon: <ThunderboltOutlined />,
      color: "#e85d3a",
      bgColor: "#fdf0eb"
    },
    {
      title: "已完成",
      value: stats?.byStatus?.completed || 0,
      icon: <CheckCircleOutlined />,
      color: "#3d8c5c",
      bgColor: "#eaf5ee"
    },
    {
      title: "高优先级",
      value: stats?.byPriority?.high || 0,
      icon: <WarningOutlined />,
      color: "#d94436",
      bgColor: "#fce8e6"
    },
    {
      title: "已逾期",
      value: stats?.overdue || 0,
      icon: <AlertOutlined />,
      color: stats?.overdue > 0 ? "#d94436" : "#3d8c5c",
      bgColor: stats?.overdue > 0 ? "#fce8e6" : "#eaf5ee"
    }
  ];

  // 新用户欢迎引导弹窗（不受 loading 影响）
  const welcomeModal = (
    <Modal open={welcomeVisible} onCancel={() => setWelcomeVisible(false)} footer={null} width={520} centered>
      <div style={{ textAlign: "center", padding: "20px 12px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
          background: "linear-gradient(135deg, #e85d3a 0%, #d4972e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <SmileOutlined style={{ fontSize: 32, color: "#fff" }} />
        </div>
        <Title level={4} style={{ marginBottom: 8 }}>欢迎使用轻量化任务管理系统！</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 28, fontSize: 14 }}>
          让我们一起高效管理工作任务
        </Text>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {[
            { icon: PlusOutlined, label: "创建任务", color: "#e85d3a", bg: "#fdf0eb" },
            { icon: AppstoreOutlined, label: "看板视图", color: "#d4972e", bg: "#fef5e6" },
            { icon: DashboardOutlined, label: "统计概览", color: "#3d8c5c", bg: "#eaf5ee" }
          ].map((item) => (
            <div key={item.label} style={{
              flex: "1 1 130px", maxWidth: 160, padding: 16, borderRadius: 12,
              background: item.bg, textAlign: "center"
            }}>
              <item.icon style={{ fontSize: 22, color: item.color, marginBottom: 6 }} />
              <br /><Text strong style={{ fontSize: 13 }}>{item.label}</Text>
            </div>
          ))}
        </div>
        <Button type="primary" size="large" icon={<RocketOutlined />}
          onClick={() => setWelcomeVisible(false)}
          style={{ minWidth: 180, height: 44, borderRadius: 10 }}>
          开始使用
        </Button>
      </div>
    </Modal>
  );

  if (loading) {
    return (
      <div className={s.dashboard}>
        {welcomeModal}
        <div className={s.loadingContainer}>
          <div className={s.loadingSkeleton}>
            <div className={s.skeletonHeader} />
            <div className={s.skeletonRow}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${s.skeletonCard} skeleton`} />
              ))}
            </div>
            <div className={s.skeletonChartRow}>
              <div className={`${s.skeletonChart} skeleton`} />
              <div className={`${s.skeletonChart} skeleton`} />
              <div className={`${s.skeletonChart} skeleton`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.dashboard}>
      {welcomeModal}

      {/* 顶部标题区 */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <div className={s.headerIcon}>
            <DashboardOutlined style={{ fontSize: 20, color: '#fff' }} />
          </div>
          <div>
            <Title level={2} className={s.pageTitle}>仪表盘</Title>
            <Text className={s.pageSubtitle}>任务管理概览与快捷操作</Text>
          </div>
        </div>
        <div className={s.headerActions}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/tasks")}
            className={s.primaryBtn}
          >
            新建任务
          </Button>
          <Button
            icon={<UnorderedListOutlined />}
            onClick={() => navigate("/tasks")}
          >
            查看全部
          </Button>
        </Space>
      </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className={s.statsRow}>
        {statCards.map((card) => (
          <Col xs={12} sm={8} lg={4} key={card.title}>
            <StatCard icon={card.icon} label={card.title} value={card.value} color={card.color} bgColor={card.bgColor} />
          </Col>
        ))}
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} className={s.chartsRow}>
        {/* 饼图 - 任务状态分布 */}
        <Col xs={24} lg={8}>
          <Card
            title={<span className={s.chartTitle}><FileTextOutlined /> 任务状态分布</span>}
            className={s.chartCard}
            styles={{ body: { padding: "16px 8px" } }}
          >
            {pieData.length > 0 ? (
              <div className={s.pieChartWrap}>
                <div className={s.pieChartInner}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <ReTooltip
                        formatter={(value, name) => [`${value} 个`, name]}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e8eaed" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={s.centerStat}>
                    <div className={s.centerStatValue}>{total}</div>
                    <div className={s.centerStatLabel}>总计</div>
                  </div>
                </div>
                <div className={s.pieLegend}>
                  {pieData.map(item => (
                    <div key={item.name} className={s.legendItem}>
                      <span className={s.legendDot} style={{ backgroundColor: item.color }} />
                      <span className={s.legendLabel}>{item.name}</span>
                      <span className={s.legendValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Empty description="暂无任务数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* 柱状图 - 优先级分布 */}
        <Col xs={24} lg={8}>
          <Card
            title={<span className={s.chartTitle}><WarningOutlined /> 优先级分布</span>}
            className={s.chartCard}
            styles={{ body: { padding: "16px 8px" } }}
          >
            {total > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <ReTooltip
                    formatter={(value) => [`${value} 个`]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e8eaed" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无任务数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* 完成进度环 */}
        <Col xs={24} lg={8}>
          <Card
            title={<span className={s.chartTitle}><CheckCircleOutlined /> 完成进度</span>}
            className={s.chartCard}
            styles={{ body: { padding: "16px 8px" } }}
          >
            <div className={s.progressWrap}>
              <div className={s.progressRing}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "已完成", value: completed },
                        { name: "未完成", value: total - completed }
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={70}
                      startAngle={90} endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#3d8c5c" />
                      <Cell fill="#ece6e0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className={s.progressCenter}>
                  <span className={s.progressPercent}>{completionRate}%</span>
                  <span className={s.progressLabel}>完成率</span>
                </div>
              </div>
              <div className={s.progressStats}>
                <div className={s.progressItem}>
                  <span className={s.progressItemLabel}>已完成</span>
                  <span className={s.progressItemValue} style={{ color: "#3d8c5c" }}>{completed}</span>
                </div>
                <div className={s.progressItem}>
                  <span className={s.progressItemLabel}>未完成</span>
                  <span className={s.progressItemValue} style={{ color: "#d4972e" }}>{total - completed}</span>
                </div>
                <div className={s.progressItem}>
                  <span className={s.progressItemLabel}>逾期</span>
                  <span className={s.progressItemValue} style={{ color: stats?.overdue > 0 ? "#d94436" : "#3d8c5c" }}>
                    {stats?.overdue || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 趋势图 — 近14天完成任务趋势 */}
      {trend.length > 0 && (
        <Row gutter={[16, 16]} className={s.chartsRow}>
          <Col span={24}>
            <Card
              title={<span className={s.chartTitle}><CheckCircleOutlined /> 近14天完成任务趋势</span>}
              className={s.chartCard}
              styles={{ body: { padding: "16px 8px" } }}
            >
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3d8c5c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3d8c5c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => v.slice(5)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <ReTooltip
                    formatter={(value) => [`${value} 个任务`, '完成数']}
                    labelFormatter={(label) => `日期: ${label}`}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e8eaed" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3d8c5c"
                    strokeWidth={2}
                    fill="url(#colorCompleted)"
                    dot={{ r: 3, fill: "#3d8c5c", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}

      {/* 倒数日 */}
      <Row gutter={[16, 16]} className={s.chartsRow}>
        <Col span={24}>
          <CountdownDays tasks={calendarTasks} />
        </Col>
      </Row>

      {/* 日程图 + 近期任务 */}
      <Row gutter={[16, 16]} className={s.chartsRow}>
        <Col xs={24} lg={14}>
          <ScheduleCalendar tasks={calendarTasks} />
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className={s.chartTitle}>
                <FireOutlined style={{ color: "#d94436" }} /> 近期任务
              </span>
            }
            className={s.chartCard}
            extra={
              <Button type="link" onClick={() => navigate("/tasks")}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {recentTasks.length > 0 ? (
              <List
                dataSource={recentTasks}
                renderItem={(task) => {
                  const statusConfig = STATUS_COLORS[task.status] || {};
                  const priorityConfig = PRIORITY_COLORS[task.priority] || {};
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
                  return (
                    <List.Item className={s.taskItem}>
                      <List.Item.Meta
                        title={
                          <Space>
                            <span className={s.taskTitle}>{task.title}</span>
                            {task.priority === "high" && <Tag color="error" style={{ margin: 0 }}>高优</Tag>}
                            {isOverdue && <Tag color="warning" style={{ margin: 0 }}>已逾期</Tag>}
                          </Space>
                        }
                        description={
                          <Space size={12}>
                            {statusConfig.label && (
                              <span className={s.taskMetaTag} style={{ color: statusConfig.color }}>
                                {statusConfig.label}
                              </span>
                            )}
                            {task.category_name && (
                              <span className={s.taskMetaText}>{task.category_name}</span>
                            )}
                            {task.due_date && (
                              <span className={s.taskMetaText} style={isOverdue ? { color: "#d94436" } : {}}>
                                截止: {task.due_date.split("T")[0]}
                              </span>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description="暂无任务，快去创建第一个任务吧" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/tasks")}>
                  创建任务
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
