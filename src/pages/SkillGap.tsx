import React, { useState } from "react";
import { Target, Search, Loader2, ChevronRight, BookOpen, Clock, AlertCircle } from "lucide-react";
import api from "../services/api";
import { analyzeSkillGap } from "../services/geminiService";
import { motion } from "motion/react";

export default function SkillGap() {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/skills/history");
      setHistory(res.data);
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const handleAnalyze = async () => {
    if (!role || !skills) return;
    setLoading(true);
    setError(null);
    try {
      const currentSkillsList = skills.split(",").map(s => s.trim()).filter(s => s !== "");
      const analysis = await analyzeSkillGap(currentSkillsList, role);
      
      if (!analysis) {
        throw new Error("Failed to get analysis from AI");
      }

      setResult(analysis);
      
      // Save to backend
      await api.post("/skills/save", {
        role,
        data: analysis
      });
      
      fetchHistory();
    } catch (e: any) {
      console.error("Skill analysis error:", e);
      const msg = e.message || "Failed to analyze skills. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Skill Gap Analysis</h2>
        <p className="text-slate-500">Compare your current skills with your target job role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Role</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="e.g. Senior Frontend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Current Skills</label>
              <textarea 
                placeholder="React, TypeScript, Node.js, CSS..."
                rows={4}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
              <p className="text-[10px] text-slate-400">Separate skills with commas</p>
            </div>
            <button 
              disabled={loading || !role || !skills}
              onClick={handleAnalyze}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : "Analyze Gap"}
            </button>
            {error && (
              <div className="flex items-center text-red-500 text-xs mt-2">
                <AlertCircle size={14} className="mr-2" />
                {error}
              </div>
            )}
          </div>

          {/* History Section */}
          {history.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Clock size={16} className="mr-2 text-slate-400" />
                Recent Analyses
              </h3>
              <div className="space-y-2">
                {history.slice(0, 5).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setResult(h.data);
                      setRole(h.role);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-emerald-600 truncate">{h.role}</p>
                    <p className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="h-full min-h-[400px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Target size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Enter your details to see analysis</p>
              <p className="text-sm max-w-xs mt-2">We'll compare your skills against industry requirements for your target role.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate">Priority</p>
                    <p className="text-base md:text-lg font-bold text-slate-900 capitalize truncate">{result.learning_priority}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl shrink-0">
                    <Clock size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider truncate">Estimated Time</p>
                    <p className="text-base md:text-lg font-bold text-slate-900 truncate">{result.estimated_time}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((s: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Recommended Learning</h3>
                  <div className="space-y-3">
                    {result.recommended_courses.map((c: string, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group cursor-pointer hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <BookOpen size={18} />
                          </div>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700 transition-colors">{c}</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
