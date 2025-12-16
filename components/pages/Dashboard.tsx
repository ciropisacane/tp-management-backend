// Dashboard Page Component
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  AlertCircle, 
  Calendar, 
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../services/api';

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">{trend.value > 0 ? '+' : ''}{trend.value}%</span>
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-sm text-gray-600">{title}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Mock data for demonstration
  const kpiData = {
    activeProjects: 24,
    overdueTasks: 8,
    upcomingDeadlines: 12,
    teamUtilization: '87%',
  };

  const projectStatusData = [
    { name: 'Planning', value: 8, color: '#3B82F6' },
    { name: 'In Progress', value: 12, color: '#10B981' },
    { name: 'Review', value: 6, color: '#F59E0B' },
    { name: 'Completed', value: 18, color: '#6366F1' },
  ];

  const deliverableData = [
    { name: 'Local File', count: 12 },
    { name: 'Master File', count: 8 },
    { name: 'Benchmark', count: 15 },
    { name: 'TP Policy', count: 6 },
    { name: 'Audit Support', count: 9 },
  ];

  const recentActivities = [
    { id: 1, action: 'Task completed', project: 'Acme Corp - Local File 2024', user: 'John Doe', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'Document uploaded', project: 'TechStart - Benchmark Analysis', user: 'Jane Smith', time: '4 hours ago', type: 'info' },
    { id: 3, action: 'Review requested', project: 'Global Inc - Master File', user: 'Mike Johnson', time: '5 hours ago', type: 'warning' },
    { id: 4, action: 'Project created', project: 'NewCo - TP Policy', user: 'Sarah Williams', time: '1 day ago', type: 'info' },
  ];

  const myTasks = [
    { id: 1, title: 'Complete FAR Analysis for Acme Corp', project: 'Acme Corp - Local File', dueDate: '2024-12-20', priority: 'high' },
    { id: 2, title: 'Review benchmark methodology', project: 'TechStart - Benchmark', dueDate: '2024-12-22', priority: 'medium' },
    { id: 3, title: 'Draft TP Policy section 3.2', project: 'NewCo - TP Policy', dueDate: '2024-12-25', priority: 'medium' },
    { id: 4, title: 'Prepare audit response documents', project: 'Global Inc - Audit Support', dueDate: '2024-12-18', priority: 'urgent' },
  ];

  useEffect(() => {
    // Load dashboard data
    const fetchDashboardData = async () => {
      try {
        // In production, replace with actual API calls
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your project overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Active Projects"
          value={kpiData.activeProjects}
          icon={<FolderKanban className="w-6 h-6 text-blue-600" />}
          trend={{ value: 12, label: 'vs last month' }}
          color="bg-blue-50"
        />
        <KPICard
          title="Overdue Tasks"
          value={kpiData.overdueTasks}
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          trend={{ value: -15, label: 'vs last week' }}
          color="bg-red-50"
        />
        <KPICard
          title="Upcoming Deadlines"
          value={kpiData.upcomingDeadlines}
          icon={<Calendar className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
        />
        <KPICard
          title="Team Utilization"
          value={kpiData.teamUtilization}
          icon={<Users className="w-6 h-6 text-green-600" />}
          trend={{ value: 5, label: 'vs last month' }}
          color="bg-green-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Deliverable Types Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects by Deliverable Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliverableData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-600">{activity.project}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
            <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {myTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{task.project}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Due {task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;