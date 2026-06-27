import { useState } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authScreen, setAuthScreen] = useState('login'); // 'login', 'signup', 'dashboard'
  
  // Dynamic User Session State
  const [credentials, setCredentials] = useState(null);

  const [targetRole, setTargetRole] = useState('');
  const [creating, setCreating] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  // Dynamic Auth Config Builder
  const getAuthConfig = (authInfo = credentials) => {
    return {
      auth: {
        username: authInfo.username,
        password: authInfo.password
      }
    };
  };

  // History Fetcher & Session Validator
  const fetchHistory = async (authInfo) => {
    setLoading(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/interviews/history/', {
        auth: { username: authInfo.username, password: authInfo.password }
      });
      setInterviews(response.data);
      setAuthScreen('dashboard'); // Success par dashboard load hoga
    } catch (error) {
      console.error(error);
      alert("Invalid Username or Password! Please try again.");
      setCredentials(null);
      setAuthScreen('login');
    } finally {
      setLoading(false);
    }
  };

  // Login click handler
  const handleLoginSubmit = (username, password) => {
    const userAuth = { username, password };
    setCredentials(userAuth);
    fetchHistory(userAuth);
  };

  // Connected perfectly with Django Endpoint
  const handleSignupSubmit = async (username, email, password) => {
    try {
      await axios.post('http://127.0.0.1:8000/api/interviews/register/', {
        username,
        email,
        password
      });
      alert(`Account created successfully for ${username}! Please sign in now.`);
      setAuthScreen('login'); // Redirect to login screen
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Signup failed. Try another username.";
      alert(errorMsg);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCredentials(null);
    setInterviews([]);
    setAuthScreen('login');
  };

  // Start interview
  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) return alert("Please enter a target role!");

    setCreating(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/interviews/start/', {
        target_role: targetRole
      }, getAuthConfig());
      
      setTargetRole('');
      // Refresh state from history
      const response = await axios.get('http://127.0.0.1:8000/api/interviews/history/', getAuthConfig());
      setInterviews(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to start interview.");
    } finally {
      setCreating(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async (questionId) => {
    const userAnswer = answers[questionId];
    if (!userAnswer || !userAnswer.trim()) return alert("Type an answer first!");

    setSubmittingId(questionId);
    try {
      await axios.post('http://127.0.0.1:8000/api/interviews/submit/', {
        question_id: questionId,
        user_answer: userAnswer
      }, getAuthConfig());

      setAnswers(prev => ({ ...prev, [questionId]: '' }));
      
      // Live refresh dashboard metrics
      const response = await axios.get('http://127.0.0.1:8000/api/interviews/history/', getAuthConfig());
      setInterviews(response.data);
    } catch (error) {
      console.error(error);
      alert("Evaluation failed.");
    } finally {
      setSubmittingId(null);
    }
  };

  // Screen Routing Logic
  if (authScreen === 'login') {
    return <Login onLogin={handleLoginSubmit} onSwitchToSignup={() => setAuthScreen('signup')} />;
  }

  if (authScreen === 'signup') {
    return <Signup onSignup={handleSignupSubmit} onSwitchToLogin={() => setAuthScreen('login')} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-slate-600">Verifying session dashboard...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Premium Navbar */}
      <nav className="bg-white/80 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Mock Interview</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-indigo-700">{credentials?.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Setup New Interview Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 transition-all hover:shadow-md">
          <h2 className="text-lg font-bold text-slate-800 mb-1">🚀 Setup a New Mock Interview</h2>
          <p className="text-sm text-slate-500 mb-4">Choose your domain role, and let Gemini AI generate custom targeted questions instantly.</p>
          
          <form onSubmit={handleStartInterview} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="e.g. Python Backend Developer, Data Scientist..." 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              disabled={creating}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 bg-slate-50/50"
            />
            <button 
              type="submit" 
              disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center space-x-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <span>Start Session</span>
              )}
            </button>
          </form>
        </div>

        {/* History Section */}
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">📜 Your Interview History</h3>
        
        {interviews.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
            No interviews found yet. Create your first session above!
          </div>
        ) : (
          <div className="space-y-6">
            {interviews.map((session) => (
              <div 
                key={session.id} 
                className={`bg-white border rounded-2xl p-6 shadow-sm transition-all border-l-4 ${
                  session.status === 'completed' ? 'border-l-emerald-500 border-slate-200' : 'border-l-amber-400 border-slate-200'
                }`}
              >
                {/* Session Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">{session.target_role}</h4>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400 font-medium">
                      <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Level: {session.experience_level}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    session.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {session.status}
                  </span>
                </div>

                {/* Questions List */}
                <div className="mt-6 space-y-4">
                  {session.questions.map((q, idx) => (
                    <div key={q.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <span className="bg-indigo-50 text-indigo-600 font-bold text-sm px-2.5 py-0.5 rounded-md mt-0.5">Q{idx + 1}</span>
                        <p className="font-semibold text-slate-700 text-base flex-1">{q.question_text}</p>
                      </div>

                      {/* User Answer Space */}
                      <div className="mt-4 sm:pl-11">
                        {q.user_answer ? (
                          <div className="bg-white border border-slate-200/60 rounded-xl p-3 text-slate-600 text-sm shadow-sm">
                            <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Your Answer:</span>
                            {q.user_answer}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea 
                              rows="3"
                              placeholder="Type your technical answer here..."
                              value={answers[q.id] || ''}
                              onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              disabled={submittingId === q.id}
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            />
                            <button
                              onClick={() => handleSubmitAnswer(q.id)}
                              disabled={submittingId === q.id}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center space-x-2 cursor-pointer"
                            >
                              {submittingId === q.id ? 'Evaluating Answer...' : 'Submit Response'}
                            </button>
                          </div>
                        )}

                        {/* AI Review Panel */}
                        {q.ai_score !== null && (
                          <div className="mt-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-center border-b border-slate-700/60 pb-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Gemini AI Feedback</span>
                              <span className={`text-sm font-black px-2 py-0.5 rounded ${
                                q.ai_score >= 6.0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {q.ai_score} / 10
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-300 font-medium italic">"{q.ai_feedback}"</p>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;