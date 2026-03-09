import React, { useState, useEffect } from "react";
import { TrendingUp, Award, Target, FileText, CheckCircle2, ChevronRight, Clock, Calendar } from "lucide-react";
import { 
  LineChart, 
  Line, 
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

export default function Progress() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get("/dashboard");
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-64 bg-slate-200 rounded-3xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="h-96 bg-slate-200 rounded-3xl"></div>
      <div className="h-96 bg-slate-200 rounded-3xl"></div>
    </div>
  </div>;

  const quizHistory = data?.quizzes?.map((q: any) => ({
    date: new Date(q.created_at).toLocaleDateString(),
    score: Math.round((q.score / q.total) * 100)
  })).reverse() || [];

  const interviewStats = data?.interviews?.map((i: any) => ({
    role: i.role,
    tech: i.scores.technical,
    comm: i.scores.communication,
    conf: i.scores.confidence
  })) || [];

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Progress Tracking</h2>
        <p className="text-slate-500">Visualize your career growth and assessment history.</p>
      </div>

      {/* Quiz Performance Chart */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Quiz Performance</h3>
            <p className="text-sm text-slate-500">Accuracy trends over time</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy %</span>
          </div>
        </div>
        <div className="h-72">
          {quizHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }} 
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic">
              No quiz data available yet.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Interview Performance */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Interview Metrics</h3>
          <div className="h-64">
            {interviewStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interviewStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="role" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="tech" name="Technical" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comm" name="Communication" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conf" name="Confidence" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                No interview data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Achievements</h3>
          <div className="space-y-4">
            {[
              { title: "Resume Scored", desc: "Achieved 85% score", icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
              { title: "Python Proficiency", desc: "Passed advanced quiz", icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
              { title: "Interview Ready", desc: "Completed 3 sessions", icon: Target, color: "text-emerald-500", bg: "bg-emerald-50" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`p-2.5 md:p-3 rounded-xl ${item.bg} ${item.color} shrink-0`}>
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                    <p className="text-[10px] md:text-xs text-slate-500 truncate">{item.desc}</p>
                  </div>
                </div>
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
