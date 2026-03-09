import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  FileText, 
  Target, 
  Award, 
  Clock, 
  ArrowRight,
  ChevronRight,
  PlayCircle,
  HelpCircle,
  Mic2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import api from "../services/api";
import { Link } from "react-router-dom";

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
  </div>;

  const resumeScore = data?.latest_resume?.score || 0;
  const skillsCount = data?.latest_resume?.data?.skills_detected?.length || 0;
  const quizAvg = data?.quizzes?.length > 0 
    ? Math.round(data.quizzes.reduce((acc: any, q: any) => acc + (q.score / q.total), 0) / data.quizzes.length * 100)
    : 0;

  const chartData = [
    { name: "Mon", score: 65 },
    { name: "Tue", score: 72 },
    { name: "Wed", score: 68 },
    { name: "Thu", score: 85 },
    { name: "Fri", score: 78 },
    { name: "Sat", score: 90 },
    { name: "Sun", score: 88 },
  ];

  const handleDownloadReport = () => {
    if (!data) return;

    const reportContent = `
VIDYĀMITRA CAREER REPORT
Generated on: ${new Date().toLocaleString()}

USER OVERVIEW
Resume Score: ${resumeScore}/100
Skills Detected: ${skillsCount}
Quiz Average: ${quizAvg}%
Learning Hours: 24.5h

LATEST RESUME ANALYSIS
Score: ${data.latest_resume?.score}%
Strengths: ${data.latest_resume?.data?.strengths?.join(", ") || "N/A"}
Improvements: ${data.latest_resume?.data?.improvements?.join(", ") || "N/A"}

SKILL GAP ANALYSIS
Target Role: ${data.latest_skills?.role || "N/A"}
Missing Skills: ${data.latest_skills?.data?.missing_skills?.join(", ") || "N/A"}
Estimated Learning Time: ${data.latest_skills?.data?.estimated_time || "N/A"}

QUIZ HISTORY
${data.quizzes?.map((q: any) => `- ${q.skill}: ${q.score}/${q.total} (${new Date(q.created_at).toLocaleDateString()})`).join("\n") || "No quiz history"}

INTERVIEW PERFORMANCE
${data.interviews?.map((i: any) => `- ${i.role}: Score ${i.scores?.technical}% (Tech), ${i.scores?.communication}% (Comm)`).join("\n") || "No interview history"}

-------------------------------------------
VidyāMitra - Your Intelligent Career Agent
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VidyaMitra_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Career Overview</h2>
          <p className="text-sm text-slate-500">Track your progress and AI-driven insights.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
          <button 
            onClick={handleDownloadReport}
            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Download Report
          </button>
          <Link to="/resume" className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 text-center">
            Update Resume
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          icon={FileText} 
          label="Resume Score" 
          value={`${resumeScore}/100`} 
          trend={12} 
          color="bg-blue-500" 
        />
        <StatCard 
          icon={Target} 
          label="Skills Detected" 
          value={skillsCount} 
          trend={5} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={Award} 
          label="Quiz Average" 
          value={`${quizAvg}%`} 
          trend={8} 
          color="bg-amber-500" 
        />
        <StatCard 
          icon={Clock} 
          label="Learning Hours" 
          value="24.5h" 
          trend={-2} 
          color="bg-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Learning Activity</h3>
            <select className="text-xs font-medium text-slate-500 border-none bg-slate-50 rounded-lg px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Recommended Next Steps</h3>
          <div className="space-y-4">
            {[
              { title: "Complete Python Quiz", desc: "Boost your score by 15%", icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-50" },
              { title: "Mock Interview", desc: "Practice for SDE role", icon: Mic2, color: "text-blue-500", bg: "bg-blue-50" },
              { title: "Skill Gap Analysis", desc: "Check your readiness", icon: Target, color: "text-emerald-500", bg: "bg-emerald-50" },
            ].map((action, i) => (
              <div key={i} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className={`p-2 rounded-lg ${action.bg} ${action.color}`}>
                  <action.icon size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
            View All Tasks
          </button>
        </div>
      </div>

      {/* Recent Activity / News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Recent Evaluations</h3>
          <div className="space-y-4">
            {data?.latest_resume ? (
              <div className="flex items-center justify-between p-4 border border-slate-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Resume Scanned</p>
                    <p className="text-xs text-slate-500">{new Date(data.latest_resume.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{data.latest_resume.score}%</p>
                  <p className="text-xs text-emerald-500 font-medium">Excellent</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No evaluations yet. Upload your resume to start.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Career Insights</h3>
          <div className="space-y-4">
            {[
              { title: "AI in Software Engineering", source: "TechCrunch", time: "2h ago" },
              { title: "Top 10 Skills for 2026", source: "Forbes", time: "5h ago" },
            ].map((news, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                  <img src={`https://picsum.photos/seed/news${i}/100/100`} alt="news" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 line-clamp-1">{news.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{news.source}</span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-400">{news.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
