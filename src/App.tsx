import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  BookOpen, 
  HelpCircle, 
  Mic2, 
  TrendingUp, 
  LogOut,
  User as UserIcon,
  ChevronRight,
  Menu,
  X,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate,
  useNavigate
} from "react-router-dom";
import api from "./services/api";

// Pages
import Dashboard from "./pages/Dashboard";
import ResumeEvaluator from "./pages/ResumeEvaluator";
import SkillGap from "./pages/SkillGap";
import TrainingPlan from "./pages/TrainingPlan";
import Quiz from "./pages/Quiz";
import MockInterview from "./pages/MockInterview";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: any) => (
  <Link 
    to={path} 
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({ children, user, onLogout }: any) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifications = [
    { id: 1, title: "New Skill Gap Analysis", time: "2m ago", read: false },
    { id: 2, title: "Resume Score Updated", time: "1h ago", read: true },
    { id: 3, title: "Mock Interview scheduled", time: "5h ago", read: true },
  ];

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: FileText, label: "Resume Evaluator", path: "/resume" },
    { icon: Target, label: "Skill Gap", path: "/skills" },
    { icon: BookOpen, label: "Training Plan", path: "/training" },
    { icon: HelpCircle, label: "Quiz", path: "/quiz" },
    { icon: Mic2, label: "Mock Interview", path: "/interview" },
    { icon: TrendingUp, label: "Progress", path: "/progress" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 p-6">
        <div className="flex items-center space-x-2 mb-10 px-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Target className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-slate-900">VidyāMitra</span>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.path} 
              {...item} 
              active={location.pathname === item.path} 
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <UserIcon className="text-slate-500" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 lg:px-10 shrink-0 sticky top-0 z-30">
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center space-x-2 ml-2">
              <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center">
                <Target className="text-white" size={16} />
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">VidyāMitra</span>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-slate-900">
              {menuItems.find(i => i.path === location.pathname)?.label || "Welcome"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button 
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">Notifications</h3>
                      <button className="text-xs text-emerald-600 font-bold">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm ${n.read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>{n.title}</p>
                            {!n.read && <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5" />}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full p-3 text-center text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                      View All Notifications
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <UserIcon className="text-emerald-600" size={16} />
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50">
                      <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link 
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <UserIcon size={16} />
                        <span>My Profile</span>
                      </Link>
                      <Link 
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Target size={16} />
                        <span>Career Goals</span>
                      </Link>
                      <div className="h-px bg-slate-50 my-2" />
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Target className="text-white" size={20} />
                  </div>
                  <span className="text-xl font-bold text-slate-900">VidyāMitra</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500">
                  <X size={24} />
                </button>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarItem 
                    key={item.path} 
                    {...item} 
                    active={location.pathname === item.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </nav>
              <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-slate-100">
                <button 
                  onClick={onLogout}
                  className="flex items-center space-x-3 px-4 py-3 w-full text-slate-500 hover:text-red-600 rounded-xl transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/profile");
          setUser(res.data);
        } catch (e) {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={setUser} />} />
        
        <Route path="/*" element={
          user ? (
            <Layout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/resume" element={<ResumeEvaluator />} />
                <Route path="/skills" element={<SkillGap />} />
                <Route path="/training" element={<TrainingPlan />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/interview" element={<MockInterview />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
}
