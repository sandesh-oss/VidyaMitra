import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import api from "../services/api";
import { evaluateResume } from "../services/geminiService";
import { motion } from "motion/react";

export default function ResumeEvaluator() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        setError("Only PDF and DOCX files are supported.");
        return;
      }
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    
    try {
      // 1. Evaluate resume directly using Gemini on frontend
      console.log("Starting frontend evaluation...");
      const evaluation = await evaluateResume(file);
      console.log("Evaluation result:", evaluation);

      if (!evaluation || Object.keys(evaluation).length === 0) {
        throw new Error("AI returned an empty evaluation. Please try a different file.");
      }

      // 2. Save the result to the backend for history/dashboard
      await api.post("/resume/save", evaluation);
      
      setResult(evaluation);
    } catch (e: any) {
      console.error("Evaluation error:", e);
      const msg = e.message || "Failed to evaluate resume. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Resume Evaluator</h2>
        <p className="text-slate-500">Upload your resume to get AI-powered feedback and score.</p>
      </div>

      {!result ? (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center space-y-6 transition-all ${
            isDragging 
              ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]" 
              : "border-slate-200 hover:border-emerald-300"
          }`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-500"
          }`}>
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">
              {file ? file.name : "Drag & drop your resume here"}
            </p>
            <p className="text-sm text-slate-500">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "or click to browse PDF/DOCX (Max 5MB)"}
            </p>
          </div>
          <input 
            type="file" 
            id="resume-upload" 
            className="hidden" 
            accept=".pdf,.docx"
            onChange={handleFileChange}
          />
          <div className="flex space-x-4">
            <label 
              htmlFor="resume-upload" 
              className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Browse Files
            </label>
            <button 
              disabled={!file || loading}
              onClick={handleUpload}
              className="px-8 py-3 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Analyzing...
                </>
              ) : (
                "Start Evaluation"
              )}
            </button>
          </div>
          {error && (
            <div className="flex items-center text-red-500 text-sm">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Score Header */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-100"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * (result?.score || 0)) / 100}
                    className="text-emerald-500 transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-2xl md:text-3xl font-bold text-slate-900">{result?.score || 0}%</span>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900">Overall Score</h3>
                <p className="text-sm text-slate-500">Based on industry standards and role relevance.</p>
              </div>
            </div>
            <button 
              onClick={() => setResult(null)}
              className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Re-evaluate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths & Weaknesses */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h4 className="font-bold text-slate-900 flex items-center">
                <CheckCircle2 size={20} className="text-emerald-500 mr-2" />
                Key Strengths
              </h4>
              <ul className="space-y-3">
                {(result?.strengths || []).map((s: any, i: number) => (
                  <li key={i} className="flex items-start text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 mr-3 shrink-0" />
                    {typeof s === 'string' ? s : JSON.stringify(s)}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h4 className="font-bold text-slate-900 flex items-center">
                <AlertCircle size={20} className="text-amber-500 mr-2" />
                Areas for Improvement
              </h4>
              <ul className="space-y-3">
                {(result?.improvements || []).map((s: any, i: number) => (
                  <li key={i} className="flex items-start text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 mr-3 shrink-0" />
                    {typeof s === 'string' ? s : JSON.stringify(s)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skills & Roles */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Skills Detected</h4>
              <div className="flex flex-wrap gap-2">
                {(result?.skills_detected || []).map((s: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                    {typeof s === 'string' ? s : JSON.stringify(s)}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Recommended Roles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(result?.recommended_roles || []).map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl group cursor-pointer hover:bg-emerald-100 transition-colors">
                    <span className="text-sm font-semibold text-emerald-700">{typeof r === 'string' ? r : JSON.stringify(r)}</span>
                    <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
