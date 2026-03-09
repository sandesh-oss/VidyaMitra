import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Target, Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";
import api from "../services/api";

export default function Register({ onLogin }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api.post("/auth/send-otp", { email });
      setStep(2);
      setMessage("OTP sent to your email.");
      setResendTimer(60);
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next box
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setError("Please enter the full 6-digit code");
      setLoading(false);
      return;
    }
    try {
      const res = await api.post("/auth/register", { name, email, password, otp: otpString });
      localStorage.setItem("token", res.data.token);
      onLogin(res.data.user);
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains a special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 mb-6">
            <Target className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h2>
          <p className="text-slate-500">
            {step === 1 
              ? "Join VidyāMitra and boost your career with AI." 
              : `We've sent a code to ${email}`}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium flex items-start gap-2">
              <X size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {message && (
            <div className="p-4 bg-emerald-50 text-emerald-600 text-sm rounded-xl font-medium flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0" />
              {message}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {password && (
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, i) => (
                        <div key={i} className={`flex items-center gap-2 text-xs font-medium ${req.met ? "text-emerald-600" : "text-slate-400"}`}>
                          {req.met ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                          {req.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button 
                disabled={loading || password.length < 8}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : (
                  <>
                    Send OTP
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700 block text-center">Verification Code</label>
                <div className="flex justify-center gap-1 sm:gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 bg-slate-50 border border-slate-100 rounded-xl text-center text-xl sm:text-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  ))}
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Verify & Create Account"}
              </button>
              
              <div className="space-y-4">
                <button 
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="w-full text-sm text-emerald-600 font-bold hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                </button>

                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-slate-500 font-medium hover:text-slate-700"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
