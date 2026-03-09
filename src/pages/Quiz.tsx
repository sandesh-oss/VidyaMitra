import React, { useState } from "react";
import { HelpCircle, Loader2, CheckCircle2, XCircle, ArrowRight, RefreshCw, Trophy } from "lucide-react";
import api from "../services/api";
import { generateQuiz } from "../services/geminiService";
import { motion, AnimatePresence } from "motion/react";

export default function Quiz() {
  const [config, setConfig] = useState({ skill: "", difficulty: "intermediate", count: 5 });
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleStart = async () => {
    if (!config.skill) return;
    setLoading(true);
    try {
      const generatedQuestions = await generateQuiz(config.skill, config.difficulty, config.count);
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("Failed to generate quiz questions");
      }
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(""));
      setCurrentIndex(0);
      setShowResult(false);
    } catch (e) {
      console.error("Quiz generation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = option;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    return questions.reduce((acc, q, i) => acc + (q.correct_answer === answers[i] ? 1 : 0), 0);
  };

  const handleFinish = async () => {
    const score = calculateScore();
    setShowResult(true);
    
    // Save result to backend
    try {
      await api.post("/quiz/save", {
        skill: config.skill,
        score,
        total: questions.length
      });
    } catch (e) {
      console.error("Failed to save quiz result", e);
    }
  };

  if (showResult) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm space-y-6"
        >
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={48} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Quiz Completed!</h2>
            <p className="text-slate-500 mt-2">You've successfully finished the {config.skill} assessment.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Score</p>
              <p className="text-3xl font-bold text-slate-900">{score}/{questions.length}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Accuracy</p>
              <p className="text-3xl font-bold text-slate-900">{percentage}%</p>
            </div>
          </div>
          <button 
            onClick={() => setQuestions([])}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center"
          >
            <RefreshCw size={20} className="mr-2" />
            Try Another Quiz
          </button>
        </motion.div>

        <div className="space-y-4 text-left">
          <h3 className="font-bold text-slate-900 px-2">Review Answers</h3>
          {questions.map((q, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <p className="font-semibold text-slate-900">{i + 1}. {q.question}</p>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-slate-500">Your answer:</span>
                <span className={answers[i] === q.correct_answer ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                  {answers[i]}
                </span>
                {answers[i] === q.correct_answer ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
              </div>
              {answers[i] !== q.correct_answer && (
                <p className="text-sm text-emerald-600 font-medium">Correct: {q.correct_answer}</p>
              )}
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg">{q.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Skill Assessment</h2>
        <p className="text-slate-500">Test your knowledge and earn proficiency badges.</p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Topic</label>
              <input 
                type="text" 
                placeholder="e.g. React, Python, AWS"
                value={config.skill}
                onChange={(e) => setConfig({ ...config, skill: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Difficulty</label>
              <select 
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <button 
            disabled={loading || !config.skill}
            onClick={handleStart}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Generate Quiz"}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8"
            >
              <h3 className="text-xl font-bold text-slate-900 leading-relaxed">
                {questions[currentIndex].question}
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {questions[currentIndex].options.map((option: string, i: number) => (
                  <button 
                    key={i}
                    onClick={() => handleAnswer(option)}
                    className={`p-4 rounded-2xl text-left text-sm font-medium transition-all border-2 ${
                      answers[currentIndex] === option 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                        : "bg-slate-50 border-transparent text-slate-600 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mr-4 text-xs font-bold text-slate-400">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button 
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-6 py-2 text-slate-500 font-semibold disabled:opacity-30"
                >
                  Previous
                </button>
                {currentIndex === questions.length - 1 ? (
                  <button 
                    disabled={!answers[currentIndex]}
                    onClick={handleFinish}
                    className="px-10 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
                  >
                    Finish Quiz
                  </button>
                ) : (
                  <button 
                    disabled={!answers[currentIndex]}
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center"
                  >
                    Next Question
                    <ArrowRight size={18} className="ml-2" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
