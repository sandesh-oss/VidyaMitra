import React, { useState } from "react";
import { Mic2, Loader2, Play, MessageSquare, Award, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import api from "../services/api";
import { generateInterviewQuestions, evaluateInterviewAnswer } from "../services/geminiService";
import { motion, AnimatePresence } from "motion/react";

export default function MockInterview() {
  const [config, setConfig] = useState({ role: "", level: "mid-level" });
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleStart = async () => {
    if (!config.role) return;
    setLoading(true);
    try {
      const generatedQuestions = await generateInterviewQuestions(config.role, config.level);
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("Failed to generate interview questions");
      }
      setQuestions(generatedQuestions);
      setAnswers([]);
      setCurrentIndex(0);
      setEvaluation(null);
    } catch (e) {
      console.error("Interview start error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const newAnswers = [...answers, { question: questions[currentIndex], answer: currentAnswer }];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setLoading(true);
      try {
        const result = await evaluateInterviewAnswer(config.role, newAnswers);
        if (!result) {
          throw new Error("Failed to evaluate interview answers");
        }
        setEvaluation(result);

        // Save to backend
        await api.post("/interview/save", {
          role: config.role,
          evaluation: result
        });
      } catch (e) {
        console.error("Interview evaluation error:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  if (evaluation) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Interview Performance</h2>
          <p className="text-slate-500">AI-driven feedback on your interview responses.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[
            { label: "Technical", score: evaluation.scores.technical, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Communication", score: evaluation.scores.communication, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Confidence", score: evaluation.scores.confidence, color: "text-amber-500", bg: "bg-amber-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
              <p className="text-[10px] md:text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">{s.label}</p>
              <p className={`text-3xl md:text-4xl font-black ${s.color}`}>{s.score}%</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
              <MessageSquare size={20} className="text-emerald-500 mr-2" />
              Overall Feedback
            </h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl italic">
              "{evaluation.feedback}"
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
              <Sparkles size={20} className="text-amber-500 mr-2" />
              Improvement Tips
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evaluation.tips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start p-4 border border-slate-100 rounded-2xl">
                  <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 mr-3 shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setQuestions([])}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          Start New Session
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Mock Interview</h2>
        <p className="text-slate-500">Practice with AI and get real-time feedback on your answers.</p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm space-y-8 text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Mic2 size={32} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Role</label>
              <input 
                type="text" 
                placeholder="e.g. Software Engineer"
                value={config.role}
                onChange={(e) => setConfig({ ...config, role: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Experience Level</label>
              <select 
                value={config.level}
                onChange={(e) => setConfig({ ...config, level: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="entry-level">Entry Level</option>
                <option value="mid-level">Mid Level</option>
                <option value="senior">Senior</option>
              </select>
            </div>
          </div>
          <button 
            disabled={loading || !config.role}
            onClick={handleStart}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Start Interview"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Session</span>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {questions[currentIndex]}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Your Answer</label>
                <button className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center">
                  <Mic2 size={14} className="mr-1" />
                  Voice Input
                </button>
              </div>
              <textarea 
                rows={6}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your response here..."
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end">
              <button 
                disabled={loading || !currentAnswer}
                onClick={handleNext}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : (
                  currentIndex === questions.length - 1 ? "Finish & Evaluate" : "Next Question"
                )}
                {!loading && <ChevronRight size={20} className="ml-2" />}
              </button>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Tip:</strong> Try to use the STAR method (Situation, Task, Action, Result) for behavioral questions to provide more structured and impactful answers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
