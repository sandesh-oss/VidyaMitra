import React, { useState } from "react";
import { BookOpen, Calendar, CheckCircle2, ChevronRight, Loader2, Sparkles } from "lucide-react";
import api from "../services/api";
import { generateTrainingPlan } from "../services/geminiService";
import { motion } from "motion/react";

export default function TrainingPlan() {
  const [role, setRole] = useState("");
  const [gaps, setGaps] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const handleGenerate = async () => {
    if (!role || !gaps) return;
    setLoading(true);
    try {
      const gapsList = gaps.split(",").map(s => s.trim()).filter(s => s !== "");
      const generatedPlan = await generateTrainingPlan(role, gapsList);
      
      if (!generatedPlan) {
        throw new Error("Failed to generate plan from AI");
      }

      setPlan(generatedPlan);

      // Save to backend
      await api.post("/training/save", {
        role,
        data: generatedPlan
      });
    } catch (e) {
      console.error("Training plan generation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const PlanSection = ({ title, data, delay }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
          {data.focus}
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Courses</h4>
          <div className="space-y-2">
            {data.courses.map((c: string, i: number) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <BookOpen size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-700">{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Projects</h4>
          <div className="space-y-2">
            {data.projects.map((p: string, i: number) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-sm text-slate-700">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Milestones</h4>
          <div className="space-y-2">
            {data.milestones.map((m: string, i: number) => (
              <div key={i} className="flex items-center space-x-3">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm text-slate-600">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Training Planner</h2>
        <p className="text-slate-500">AI-generated 90-day roadmap to bridge your skill gaps.</p>
      </div>

      {!plan ? (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Career Role</label>
              <input 
                type="text" 
                placeholder="e.g. Full Stack Developer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Identified Gaps</label>
              <textarea 
                placeholder="Docker, Kubernetes, System Design..."
                rows={3}
                value={gaps}
                onChange={(e) => setGaps(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </div>
          <button 
            disabled={loading || !role || !gaps}
            onClick={handleGenerate}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Generate 90-Day Plan"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PlanSection title="Days 1-30" data={plan.plan_30_days} delay={0} />
          <PlanSection title="Days 31-60" data={plan.plan_60_days} delay={0.1} />
          <PlanSection title="Days 61-90" data={plan.plan_90_days} delay={0.2} />
        </div>
      )}
    </div>
  );
}
