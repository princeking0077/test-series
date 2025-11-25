import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

// --- Types ---

type UserType = 'student' | 'admin';
type UserStatus = 'pending' | 'active' | 'inactive';

interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: UserType;
  status: UserStatus;
  token?: string;
  phone?: string;
}

interface Course {
  id: number;
  course_name: string;
  description: string;
  duration_months: number;
}

interface Test {
  id: number;
  test_title: string;
  course_id: number;
  duration_minutes: number;
  total_marks: number;
  is_active: number;
  available_from: string;
  available_until: string;
  test_type?: string;
}

interface Question {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  marks: number;
  difficulty?: string;
}

interface TestResult {
  id: number;
  test_title: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  status: string;
  created_at: string;
  user_name?: string; // For admin view
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// --- Mock Data Store (Demo Mode) ---

const mockStore = {
    users: [
        { id: 1, email: 'student@pharma.com', full_name: 'Rahul Sharma', user_type: 'student', status: 'active', phone: '9876543210' },
        { id: 2, email: 'admin@pharma.com', full_name: 'Admin User', user_type: 'admin', status: 'active', phone: '1234567890' },
        { id: 3, email: 'pending@pharma.com', full_name: 'New Student', user_type: 'student', status: 'pending', phone: '5555555555' }
    ] as User[],
    courses: [
        { id: 1, course_name: 'GPAT 2026 Comprehensive', description: 'Complete syllabus coverage for GPAT 2026.', duration_months: 12 },
        { id: 2, course_name: 'MPSC Drug Inspector', description: 'Specialized batch for Drug Inspector exams.', duration_months: 6 }
    ] as Course[],
    tests: [
        { id: 101, test_title: 'GPAT 2026 Mock Test 1', course_id: 1, duration_minutes: 60, total_marks: 20, is_active: 1, available_from: '2024-01-01', available_until: '2025-12-31', test_type: 'Mock' },
        { id: 102, test_title: 'Pharmacology: CNS Drugs', course_id: 1, duration_minutes: 30, total_marks: 20, is_active: 1, available_from: '2024-01-01', available_until: '2025-12-31', test_type: 'Unit' }
    ] as Test[],
    results: [
        { id: 1, test_title: 'GPAT 2026 Mock Test 1', marks_obtained: 16, total_marks: 20, percentage: 80.0, status: 'pass', created_at: '2024-05-20', user_name: 'Rahul Sharma' }
    ] as TestResult[]
};

const getMockData = (endpoint: string, method: string, bodyStr?: string): ApiResponse => {
    const body = bodyStr ? JSON.parse(bodyStr) : {};
    
    // Auth
    if(endpoint.includes('action=login')) {
        const user = mockStore.users.find(u => u.email === body.email);
        if(user) {
            if(body.user_type && user.user_type !== body.user_type) return { success: false, message: 'Invalid user type' };
            if(user.status !== 'active') return { success: false, message: 'Account is pending approval' };
            return { success: true, message: 'Login success', data: { user, token: 'mock-token-xyz' } };
        }
        return { success: false, message: 'Invalid credentials. Try admin@pharma.com or student@pharma.com' };
    }
    if(endpoint.includes('action=register')) return { success: true, message: 'Registration successful! Wait for admin approval.' };
    
    // Students
    if(endpoint.includes('students.php?action=dashboard')) return { success: true, message: 'Dashboard loaded', data: { completed_tests: 12, pending_tests: 2, avg_score: 76.5 } };
    if(endpoint.includes('students.php?action=courses')) return { success: true, message: 'Courses loaded', data: mockStore.courses };
    if(endpoint.includes('students.php?action=tests')) return { success: true, message: 'Tests loaded', data: mockStore.tests };
    if(endpoint.includes('students.php?action=enroll')) return { success: true, message: 'Enrolled successfully' };
    
    // Admin
    if(endpoint.includes('admin.php?action=dashboard')) return { success: true, message: 'Admin dashboard loaded', data: { total_students: 120, pending_users: 5, active_tests: 8, total_attempts: 450 } };
    if(endpoint.includes('admin.php?action=users')) return { success: true, message: 'Users loaded', data: mockStore.users };
    if(endpoint.includes('admin.php?action=tests')) return { success: true, message: 'Tests loaded', data: mockStore.tests };
    if(endpoint.includes('admin.php?action=create_test')) return { success: true, message: 'Test created' };
    if(endpoint.includes('admin.php?action=update_user')) return { success: true, message: 'User updated' };
    if(endpoint.includes('admin.php?action=delete_test')) return { success: true, message: 'Test deleted' };
    
    // Tests
    if(endpoint.includes('tests.php?action=get_test')) return { 
        success: true, 
        message: 'Test loaded',
        data: { 
            test: mockStore.tests[0], 
            questions: [
                { id: 1, question_text: 'What is the mechanism of action of Aspirin?', option_a: 'Irreversible COX-1 Inhibition', option_b: 'Beta Blocker', option_c: 'Calcium Channel Blocker', option_d: 'Reversible COX-2 Inhibition', correct_option: 'A', marks: 4 },
                { id: 2, question_text: 'Which of the following is an antimalarial drug?', option_a: 'Paracetamol', option_b: 'Chloroquine', option_c: 'Metformin', option_d: 'Amlodipine', correct_option: 'B', marks: 4 },
                { id: 3, question_text: 'The half-life of Digoxin is approximately:', option_a: '36-48 hours', option_b: '2-4 hours', option_c: '10-12 hours', option_d: '100 hours', correct_option: 'A', marks: 4 },
                { id: 4, question_text: 'Schedule H of the Drugs and Cosmetics Act refers to:', option_a: 'List of dyes', option_b: 'Prescription drugs', option_c: 'Biological products', option_d: 'Life period of drugs', correct_option: 'B', marks: 4 },
                { id: 5, question_text: 'Which vitamin is known as Riboflavin?', option_a: 'Vitamin B1', option_b: 'Vitamin B2', option_c: 'Vitamin B6', option_d: 'Vitamin B12', correct_option: 'B', marks: 4 },
            ] 
        } 
    };
    if(endpoint.includes('tests.php?action=submit_test')) return { success: true, message: 'Test submitted successfully' };
    if(endpoint.includes('tests.php?action=get_results')) return { success: true, message: 'Results loaded', data: mockStore.results };
    if(endpoint.includes('tests.php?action=get_all_results')) return { success: true, message: 'All results loaded', data: mockStore.results };
    if(endpoint.includes('tests.php?action=bulk_import')) return { success: true, message: 'Questions imported successfully' };
    if(endpoint.includes('admin.php?action=change_password')) return { success: true, message: 'Password changed successfully' };

    return { success: false, message: 'Endpoint not found' };
};

// --- API Helper ---

const API_BASE = '/backend/api';

const api = {
  async request<T = any>(endpoint: string, method: string = 'GET', body?: any, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Create a timeout promise to fail fast if backend is unreachable (300ms)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 300)
      );

      const fetchPromise = fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Race against the timeout
      const response: any = await Promise.race([fetchPromise, timeoutPromise]);

      if(!response.ok) throw new Error('Network Error');
      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback to Mock Data if backend is unreachable or times out
      console.warn('Backend unavailable/timeout, using mock data for demo:', endpoint);
      return getMockData(endpoint, method, body ? JSON.stringify(body) : undefined) as ApiResponse<T>;
    }
  },
  
  // Auth
  login: (data: any) => api.request<{user: User, token: string}>('/auth.php?action=login', 'POST', data),
  register: (data: any) => api.request('/auth.php?action=register', 'POST', data),
  verify: (token: string) => api.request(`/auth.php?action=verify&token=${token}`, 'GET'),
  logout: (token: string) => api.request('/auth.php?action=logout', 'POST', { token }),

  // Student
  getStudentDashboard: (userId: number, token: string) => api.request<any>(`/students.php?action=dashboard&user_id=${userId}`, 'GET', undefined, token),
  getAvailableCourses: (token: string) => api.request<Course[]>('/students.php?action=courses', 'GET', undefined, token),
  enrollCourse: (userId: number, courseId: number, token: string) => api.request('/students.php?action=enroll', 'POST', { user_id: userId, course_id: courseId }, token),
  getAvailableTests: (userId: number, token: string) => api.request<Test[]>(`/students.php?action=tests&user_id=${userId}`, 'GET', undefined, token),
  getTest: (testId: number, token: string) => api.request<{test: Test, questions: Question[]}>(`/tests.php?action=get_test&test_id=${testId}`, 'GET', undefined, token),
  submitTest: (data: any, token: string) => api.request('/tests.php?action=submit_test', 'POST', data, token),
  getResults: (token: string) => api.request<TestResult[]>('/tests.php?action=get_results', 'GET', undefined, token),

  // Admin
  getAdminDashboard: (token: string) => api.request<any>('/admin.php?action=dashboard', 'GET', undefined, token),
  getUsers: (status: string, token: string) => api.request<User[]>(`/admin.php?action=users&status=${status}`, 'GET', undefined, token),
  updateUserStatus: (userId: number, status: string, token: string) => api.request('/admin.php?action=update_user', 'POST', { user_id: userId, status }, token),
  getAdminTests: (token: string) => api.request<Test[]>('/admin.php?action=tests', 'GET', undefined, token),
  createTest: (data: any, token: string) => api.request('/admin.php?action=create_test', 'POST', data, token),
  deleteTest: (testId: number, token: string) => api.request('/admin.php?action=delete_test', 'POST', { test_id: testId }, token),
  bulkImport: (testId: number, questions: any[], token: string) => api.request('/tests.php?action=bulk_import', 'POST', { test_id: testId, questions }, token),
  getAllResults: (token: string) => api.request<TestResult[]>('/tests.php?action=get_all_results', 'GET', undefined, token),
  changePassword: (data: any, token: string) => api.request('/admin.php?action=change_password', 'POST', data, token),
};

// --- Auth Context ---

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('pharma_session');
    const storedUser = localStorage.getItem('pharma_user');

    if (storedToken && storedUser) {
        setUser({ ...JSON.parse(storedUser), token: storedToken });
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    const userWithToken = { ...userData, token };
    setUser(userWithToken);
    localStorage.setItem('pharma_session', token);
    localStorage.setItem('pharma_user', JSON.stringify(userData));
  };

  const logout = async () => {
    if (user?.token) {
        await api.logout(user.token);
    }
    setUser(null);
    localStorage.removeItem('pharma_session');
    localStorage.removeItem('pharma_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Components ---

const Icon = ({ name, className = '' }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }: any) => {
  const baseClass = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "text-brand-600 hover:bg-brand-50"
  };
  return (
    <button type={type} onClick={onClick} className={`${baseClass} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
  </div>
);

const Card = ({ children, className = '' }: any) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        {children}
    </div>
);

const Table = ({ headers, children }: { headers: string[], children: ReactNode }) => (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {headers.map((h, i) => (
                        <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {children}
            </tbody>
        </table>
    </div>
);

// --- Pages ---

const LandingPage = ({ onNavigate }: any) => (
  <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col">
    <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2 text-brand-700 font-bold text-2xl">
        <Icon name="medication" className="text-3xl" />
        Pharma Success
      </div>
      <div className="flex gap-4">
        <button onClick={() => onNavigate('login_admin')} className="text-gray-600 hover:text-brand-600 font-medium">Admin Login</button>
        <Button onClick={() => onNavigate('login_student')}>Student Login</Button>
      </div>
    </nav>

    <main className="flex-1 flex items-center justify-center px-6">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Master GPAT & MPSC <br/> <span className="text-brand-600">Drug Inspector Exams</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          The ultimate platform for pharmacy aspirants. Take comprehensive tests, track your progress, and achieve your dreams.
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={() => onNavigate('register')} className="text-lg px-8 py-3">Start Learning Now</Button>
          <Button variant="secondary" onClick={() => onNavigate('login_student')} className="text-lg px-8 py-3">Existing Student</Button>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <Card className="hover:shadow-md transition-shadow">
                <div className="bg-brand-100 w-12 h-12 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                    <Icon name="quiz" />
                </div>
                <h3 className="font-bold text-lg mb-2">Real-Exam Tests</h3>
                <p className="text-gray-600 text-sm">Practice with high-yield questions designed by experts.</p>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
                <div className="bg-brand-100 w-12 h-12 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                    <Icon name="analytics" />
                </div>
                <h3 className="font-bold text-lg mb-2">Detailed Analytics</h3>
                <p className="text-gray-600 text-sm">Understand your strengths and weaknesses with deep insights.</p>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
                <div className="bg-brand-100 w-12 h-12 rounded-lg flex items-center justify-center text-brand-600 mb-4">
                    <Icon name="verified" />
                </div>
                <h3 className="font-bold text-lg mb-2">Verified Content</h3>
                <p className="text-gray-600 text-sm">Up-to-date syllabus for GPAT 2026 and MPSC exams.</p>
            </Card>
        </div>
      </div>
    </main>
    
    <footer className="py-6 text-center text-gray-500 text-sm">
        © 2024 Pharma Success. All rights reserved.
    </footer>
  </div>
);

const AuthPage = ({ type, onLogin }: any) => {
  const [isRegister, setIsRegister] = useState(type === 'register');
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({ ...formData, user_type: 'student' });
        if (res.success) {
          setSuccess('Registration successful! Please wait for admin approval.');
          setIsRegister(false);
        } else {
          setError(res.message);
        }
      } else {
        const userType = type === 'login_admin' ? 'admin' : 'student';
        const res = await api.login({ email: formData.email, password: formData.password, user_type: userType });
        if (res.success && res.data) {
           login(res.data.user, res.data.token);
           onLogin(); // Trigger navigation update
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const title = isRegister ? 'Student Registration' : (type === 'login_admin' ? 'Admin Login' : 'Student Login');
  const demoCreds = type === 'login_admin' ? 'admin@pharma.com' : 'student@pharma.com';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-100 text-brand-600 mb-4">
                <Icon name={type === 'login_admin' ? 'admin_panel_settings' : 'school'} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{success}</div>}
        
        {!isRegister && <div className="mb-4 text-xs text-gray-500 text-center bg-gray-100 p-2 rounded">Demo Credentials: <b>{demoCreds}</b><br/>Password: <b>Any</b></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <Input label="Full Name" type="text" required value={formData.full_name} onChange={(e: any) => setFormData({...formData, full_name: e.target.value})} />
              <Input label="Phone (Optional)" type="tel" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} />
            </>
          )}
          <Input label="Email Address" type="email" required value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} />
          <Input label="Password" type="password" required value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />

          <Button type="submit" className="w-full justify-center py-3" disabled={loading}>
            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
          </Button>
        </form>

        {type !== 'login_admin' && (
          <div className="mt-6 text-center text-sm">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }} className="text-brand-600 hover:underline">
              {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        )}
        
        <div className="mt-4 text-center">
             <button onClick={() => window.location.reload()} className="text-gray-400 text-xs hover:text-gray-600">Back to Home</button>
        </div>
      </div>
    </div>
  );
};

// --- Student Components ---

const StudentDashboard = ({ onStartTest }: any) => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<any>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      Promise.all([
        api.getStudentDashboard(user.id, user.token),
        api.getAvailableTests(user.id, user.token),
        api.getAvailableCourses(user.token)
      ]).then(([statsRes, testsRes, coursesRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (testsRes.success) setTests(testsRes.data || []);
        if (coursesRes.success) setCourses(coursesRes.data || []);
        setLoading(false);
      });
    }
  }, [user]);

  const handleEnroll = async (courseId: number) => {
    if (user?.token) {
      const res = await api.enrollCourse(user.id, courseId, user.token);
      if (res.success) {
        alert('Enrolled successfully!');
        // Ideally fetch new state here
      } else {
        alert(res.message);
      }
    }
  }

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name}</h1>
        <p className="text-gray-600">Here's your progress overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-brand-500 to-brand-600 text-white border-none">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-brand-100 text-sm font-medium mb-1">Tests Completed</p>
              <h3 className="text-3xl font-bold">{stats?.completed_tests || 0}</h3>
            </div>
            <Icon name="check_circle" className="text-brand-200 text-3xl opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Pending Tests</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats?.pending_tests || 0}</h3>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <Icon name="pending_actions" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Average Score</p>
              <h3 className="text-3xl font-bold text-gray-900">{stats?.avg_score || 0}%</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Icon name="monitoring" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Available Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No active tests available. Please enroll in a course.</p>
                </div>
            ) : (
                tests.map(test => (
                <Card key={test.id} className="flex flex-col h-full hover:border-brand-300 transition-colors">
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <span className="bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded font-medium uppercase tracking-wide">
                                {test.test_type || 'General'}
                            </span>
                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                <Icon name="timer" className="text-base" /> {test.duration_minutes}m
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{test.test_title}</h3>
                        <div className="text-sm text-gray-500 mb-4 space-y-1">
                            <p>Total Marks: {test.total_marks}</p>
                            <p>Available until: {new Date(test.available_until).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <Button onClick={() => onStartTest(test.id)} className="w-full justify-center mt-4">
                    Start Test <Icon name="arrow_forward" />
                    </Button>
                </Card>
                ))
            )}
          </div>
        </div>
        
        <div className="space-y-6">
           <h2 className="text-xl font-bold text-gray-900">Courses</h2>
           {courses.map(course => (
              <Card key={course.id}>
                 <h3 className="font-bold text-lg">{course.course_name}</h3>
                 <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                 <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{course.duration_months} Months</span>
                    <Button variant="secondary" className="text-xs px-3 py-1" onClick={() => handleEnroll(course.id)}>Enroll</Button>
                 </div>
              </Card>
           ))}
        </div>
      </div>
    </div>
  );
};

const TestTaking = ({ testId, onFinish }: any) => {
  const { user } = useContext(AuthContext);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.token && testId) {
      api.getTest(testId, user.token).then(res => {
        if (res.success && res.data) {
          setTest(res.data.test);
          setQuestions(res.data.questions);
          setTimeLeft(res.data.test.duration_minutes * 60);
        } else {
            alert("Failed to load test or you have already attempted it.");
            onFinish();
        }
        setLoading(false);
      });
    }
  }, [testId, user]);

  useEffect(() => {
    if (timeLeft > 0 && !submitting) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !loading && !submitting) {
      handleSubmit();
    }
  }, [timeLeft, submitting, loading]);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(([qId, opt]) => ({
      question_id: parseInt(qId),
      selected_option: opt
    }));

    if (user?.token) {
        await api.submitTest({ test_id: testId, answers: formattedAnswers }, user.token);
        onFinish();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Test...</div>;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = questions[currentQ];

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{test.test_title}</h2>
          <p className="text-sm text-gray-500">Question {currentQ + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-6">
            <div className={`text-xl font-mono font-bold px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-800'}`}>
                {formatTime(timeLeft)}
            </div>
            <Button variant="primary" onClick={() => { if(confirm('Are you sure you want to submit?')) handleSubmit(); }}>Submit Test</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
                <Card className="mb-6">
                    <div className="text-lg font-medium text-gray-900 mb-6 leading-relaxed">
                        {currentQuestion.question_text}
                    </div>
                    <div className="space-y-3">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                            const optionKey = `option_${opt.toLowerCase()}` as keyof Question;
                            const isSelected = answers[currentQuestion.id!] === opt;
                            return (
                                <div 
                                    key={opt}
                                    onClick={() => setAnswers({...answers, [currentQuestion.id!]: opt})}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                        {opt}
                                    </div>
                                    <span className="text-gray-700">{currentQuestion[optionKey]}</span>
                                </div>
                            )
                        })}
                    </div>
                </Card>
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>Previous</Button>
                    <Button variant="primary" onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))} disabled={currentQ === questions.length - 1}>Next</Button>
                </div>
            </div>
        </div>

        {/* Sidebar Palette */}
        <div className="w-72 bg-white border-l border-gray-200 p-6 overflow-y-auto hidden md:block">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Question Palette</h3>
            <div className="grid grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                    const isAnswered = answers[q.id!];
                    const isCurrent = idx === currentQ;
                    return (
                        <button 
                            key={q.id} 
                            onClick={() => setCurrentQ(idx)}
                            className={`h-10 w-10 rounded-lg text-sm font-medium flex items-center justify-center transition-all
                                ${isCurrent ? 'ring-2 ring-offset-1 ring-brand-500 border-brand-500' : ''}
                                ${isAnswered ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                            `}
                        >
                            {idx + 1}
                        </button>
                    )
                })}
            </div>
            
            <div className="mt-8 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-brand-500"></div> Answered
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-3 h-3 rounded bg-gray-100"></div> Not Answered
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const StudentResults = () => {
    const { user } = useContext(AuthContext);
    const [results, setResults] = useState<TestResult[]>([]);
    
    useEffect(() => {
        if(user?.token) {
            api.getResults(user.token).then(res => res.success && setResults(res.data || []));
        }
    }, [user]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">My Test Results</h2>
            <Card className="p-0 overflow-hidden">
                <Table headers={['Test Name', 'Date', 'Score', 'Status']}>
                    {results.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{r.test_title}</td>
                            <td className="px-6 py-4 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <span className="font-bold text-gray-900">{r.marks_obtained}/{r.total_marks}</span>
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${r.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {r.percentage.toFixed(1)}%
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 capitalize">{r.status}</td>
                        </tr>
                    ))}
                </Table>
                {results.length === 0 && <div className="p-8 text-center text-gray-500">No results found yet. Take a test!</div>}
            </Card>
        </div>
    );
};

// --- Admin Components ---

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.token) {
        api.getAdminDashboard(user.token).then(res => {
            if(res.success) setStats(res.data);
        });
    }
  }, [user]);

  return (
    <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-brand-500">
                <h3 className="text-gray-500 text-sm">Total Students</h3>
                <p className="text-2xl font-bold">{stats?.total_students || '-'}</p>
            </Card>
            <Card className="border-l-4 border-orange-500">
                <h3 className="text-gray-500 text-sm">Pending Approvals</h3>
                <p className="text-2xl font-bold">{stats?.pending_users || '-'}</p>
            </Card>
            <Card className="border-l-4 border-blue-500">
                <h3 className="text-gray-500 text-sm">Active Tests</h3>
                <p className="text-2xl font-bold">{stats?.active_tests || '-'}</p>
            </Card>
            <Card className="border-l-4 border-purple-500">
                <h3 className="text-gray-500 text-sm">Total Attempts</h3>
                <p className="text-2xl font-bold">{stats?.total_attempts || '-'}</p>
            </Card>
        </div>
        
        <div className="mt-8 bg-white p-8 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="bg-brand-50 p-4 rounded-full mb-4">
                <Icon name="verified_user" className="text-4xl text-brand-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">System is Live</h3>
            <p className="text-gray-500 max-w-md mt-2">Manage users, create tests, and view analytics from the sidebar menu.</p>
        </div>
    </div>
  );
};

const UserManagement = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState('pending');
    
    const fetchUsers = () => {
        if(user?.token) {
            api.getUsers(filter, user.token).then(res => {
                if(res.success && res.data) setUsers(res.data);
            });
        }
    }

    useEffect(fetchUsers, [filter, user]);

    const handleStatus = async (id: number, status: string) => {
        if(user?.token) {
            await api.updateUserStatus(id, status, user.token);
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">User Management</h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['pending', 'active', 'inactive'].map(s => (
                        <button 
                            key={s} 
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${filter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="overflow-hidden p-0">
                <Table headers={['Name', 'Email', 'Phone', 'Actions']}>
                    {users.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found.</td></tr>
                    ) : users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{u.full_name}</td>
                            <td className="px-6 py-4 text-gray-500">{u.email}</td>
                            <td className="px-6 py-4 text-gray-500">{u.phone || '-'}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                                {filter === 'pending' && (
                                    <>
                                        <Button variant="primary" className="inline-flex px-3 py-1 text-xs" onClick={() => handleStatus(u.id, 'active')}>Approve</Button>
                                        <Button variant="danger" className="inline-flex px-3 py-1 text-xs" onClick={() => handleStatus(u.id, 'rejected')}>Reject</Button>
                                    </>
                                )}
                                {filter === 'active' && (
                                    <Button variant="secondary" className="inline-flex px-3 py-1 text-xs" onClick={() => handleStatus(u.id, 'inactive')}>Deactivate</Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </Table>
            </Card>
        </div>
    )
}

const TestManagement = () => {
    const { user } = useContext(AuthContext);
    const [tests, setTests] = useState<Test[]>([]);
    const [view, setView] = useState<'list' | 'create' | 'import'>('list');
    
    // Create Test State
    const [newTest, setNewTest] = useState<Partial<Test>>({ course_id: 1, duration_minutes: 60, total_marks: 100, is_active: 1 });
    
    // Import State
    const [importText, setImportText] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
    const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

    const fetchTests = () => {
        if(user?.token) api.getAdminTests(user.token).then(res => res.success && setTests(res.data || []));
    }
    useEffect(fetchTests, [user, view]);

    const handleCreateTest = async () => {
        if(user?.token) {
            const res = await api.createTest(newTest, user.token);
            if(res.success) setView('list');
            else alert(res.message);
        }
    }

    const handleDeleteTest = async (id: number) => {
        if(confirm("Delete this test? This cannot be undone.") && user?.token) {
            await api.deleteTest(id, user.token);
            fetchTests();
        }
    }

    const parseQuestions = () => {
        // Simple parser for: Question text... \n A) ... \n B) ... \n Answer: A
        const blocks = importText.split(/\n\s*\n/);
        const parsed = blocks.map(block => {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            if(lines.length < 6) return null; // Very basic validation
            
            // Heuristic Parsing
            const qText = lines[0];
            const optA = lines.find(l => l.match(/^A\)/i))?.replace(/^A\)\s*/i, '');
            const optB = lines.find(l => l.match(/^B\)/i))?.replace(/^B\)\s*/i, '');
            const optC = lines.find(l => l.match(/^C\)/i))?.replace(/^C\)\s*/i, '');
            const optD = lines.find(l => l.match(/^D\)/i))?.replace(/^D\)\s*/i, '');
            const ansLine = lines.find(l => l.match(/^Answer:/i) || l.match(/^Correct:/i));
            const ans = ansLine ? ansLine.split(':')[1].trim().toUpperCase().charAt(0) : null;

            if(!optA || !optB || !optC || !optD || !ans) return null;

            return {
                question_text: qText,
                option_a: optA,
                option_b: optB,
                option_c: optC,
                option_d: optD,
                correct_option: ans,
                marks: 4, // default
                explanation: ''
            };
        }).filter(q => q !== null);
        setParsedQuestions(parsed);
    }

    const handleBulkImport = async () => {
        if(user?.token && selectedTestId && parsedQuestions.length > 0) {
            const res = await api.bulkImport(selectedTestId, parsedQuestions, user.token);
            if(res.success) {
                alert('Import successful');
                setView('list');
                setParsedQuestions([]);
                setImportText('');
            } else {
                alert('Import failed: ' + res.message);
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Test Management</h2>
                <div className="flex gap-2">
                    <Button onClick={() => setView('create')} variant={view === 'create' ? 'primary' : 'secondary'}>Create Test</Button>
                    <Button onClick={() => setView('import')} variant={view === 'import' ? 'primary' : 'secondary'}>Bulk Import</Button>
                    {view !== 'list' && <Button variant="ghost" onClick={() => setView('list')}>Back to List</Button>}
                </div>
            </div>

            {view === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests.map(t => (
                        <Card key={t.id} className="hover:border-brand-400">
                            <div className="flex justify-between">
                                <h3 className="font-bold text-gray-900">{t.test_title}</h3>
                                <button onClick={() => handleDeleteTest(t.id)} className="text-red-500 hover:text-red-700"><Icon name="delete"/></button>
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                ID: {t.id} • {t.duration_minutes} mins • {t.total_marks} marks
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button variant="secondary" className="text-xs px-2 py-1 w-full" onClick={() => { setSelectedTestId(t.id); setView('import'); }}>Add Questions</Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {view === 'create' && (
                <Card className="max-w-2xl">
                    <h3 className="text-lg font-bold mb-4">Create New Test</h3>
                    <div className="space-y-4">
                        <Input label="Test Title" value={newTest.test_title || ''} onChange={(e: any) => setNewTest({...newTest, test_title: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Course ID" type="number" value={newTest.course_id} onChange={(e: any) => setNewTest({...newTest, course_id: parseInt(e.target.value)})} />
                            <Input label="Duration (mins)" type="number" value={newTest.duration_minutes} onChange={(e: any) => setNewTest({...newTest, duration_minutes: parseInt(e.target.value)})} />
                            <Input label="Total Marks" type="number" value={newTest.total_marks} onChange={(e: any) => setNewTest({...newTest, total_marks: parseInt(e.target.value)})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Available From" type="datetime-local" onChange={(e: any) => setNewTest({...newTest, available_from: e.target.value})} />
                            <Input label="Available Until" type="datetime-local" onChange={(e: any) => setNewTest({...newTest, available_until: e.target.value})} />
                        </div>
                        <Button onClick={handleCreateTest} className="w-full justify-center">Create Test</Button>
                    </div>
                </Card>
            )}

            {view === 'import' && (
                <Card>
                    <h3 className="text-lg font-bold mb-4">Bulk Import Questions</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Test</label>
                        <select 
                            className="w-full px-3 py-2 border rounded-lg"
                            value={selectedTestId || ''} 
                            onChange={(e) => setSelectedTestId(parseInt(e.target.value))}
                        >
                            <option value="">Select a Test...</option>
                            {tests.map(t => <option key={t.id} value={t.id}>{t.test_title}</option>)}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Paste Content (Question, A), B), C), D), Answer: X)</label>
                        <textarea 
                            rows={10} 
                            className="w-full border rounded-lg p-3 font-mono text-xs" 
                            placeholder={`What is the capital of France?\nA) Berlin\nB) Madrid\nC) Paris\nD) Rome\nAnswer: C\n\nNext Question...`}
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-4 mb-6">
                        <Button variant="secondary" onClick={parseQuestions}>Parse Questions</Button>
                        <Button disabled={parsedQuestions.length === 0 || !selectedTestId} onClick={handleBulkImport}>Import {parsedQuestions.length} Questions</Button>
                    </div>

                    {parsedQuestions.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-bold text-sm mb-2">Preview ({parsedQuestions.length} valid)</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {parsedQuestions.map((q, i) => (
                                    <div key={i} className="text-xs border-b pb-2">
                                        <span className="font-semibold">{i+1}. {q.question_text}</span>
                                        <span className="ml-2 text-green-600 font-bold">[{q.correct_option}]</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}

const AdminResults = () => {
    const { user } = useContext(AuthContext);
    const [results, setResults] = useState<TestResult[]>([]);
    
    useEffect(() => {
        if(user?.token) {
            api.getAllResults(user.token).then(res => res.success && setResults(res.data || []));
        }
    }, [user]);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">All Student Results</h2>
            <Card className="p-0 overflow-hidden">
                <Table headers={['Student', 'Test', 'Score', 'Percentage', 'Date']}>
                    {results.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No results recorded yet.</td></tr>
                    ) : results.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{r.user_name}</td>
                            <td className="px-6 py-4 text-gray-500">{r.test_title}</td>
                            <td className="px-6 py-4 font-bold">{r.marks_obtained}/{r.total_marks}</td>
                            <td className="px-6 py-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${r.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {r.percentage.toFixed(1)}%
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </Table>
            </Card>
        </div>
    );
};

const AdminSettings = () => {
    const { user } = useContext(AuthContext);
    const [password, setPassword] = useState('');
    
    const handleChangePassword = async () => {
        if(!password) return;
        if(user?.token) {
            const res = await api.changePassword({ password }, user.token);
            if(res.success) {
                alert('Password updated successfully');
                setPassword('');
            } else {
                alert(res.message);
            }
        }
    }

    return (
        <div className="max-w-md">
            <h2 className="text-xl font-bold mb-6">Settings</h2>
            <Card>
                <h3 className="font-bold mb-4">Change Admin Password</h3>
                <Input label="New Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
                <Button onClick={handleChangePassword}>Update Password</Button>
            </Card>
        </div>
    );
}

// --- Main App Layout & Routing ---

const AppLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const [currentView, setCurrentView] = useState('dashboard');
    const [activeTestId, setActiveTestId] = useState<number | null>(null);

    const menuItems = user?.user_type === 'admin' ? [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'users', label: 'Users', icon: 'people' },
        { id: 'tests', label: 'Tests', icon: 'quiz' },
        { id: 'results', label: 'Results', icon: 'bar_chart' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ] : [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'my_results', label: 'My Results', icon: 'assignment_turned_in' },
    ];

    if (activeTestId) {
        return <TestTaking testId={activeTestId} onFinish={() => setActiveTestId(null)} />;
    }

    const renderContent = () => {
        if(user?.user_type === 'admin') {
            switch(currentView) {
                case 'dashboard': return <AdminDashboard />;
                case 'users': return <UserManagement />;
                case 'tests': return <TestManagement />;
                case 'results': return <AdminResults />;
                case 'settings': return <AdminSettings />;
                default: return <AdminDashboard />;
            }
        } else {
            switch(currentView) {
                case 'dashboard': return <StudentDashboard onStartTest={setActiveTestId} />;
                case 'my_results': return <StudentResults />;
                default: return <StudentDashboard onStartTest={setActiveTestId} />;
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg z-10 flex flex-col fixed inset-y-0">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2 text-brand-700 font-bold text-xl">
                        <Icon name="medication" className="text-2xl" />
                        PharmaSuccess
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === item.id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Icon name={item.icon} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center text-brand-800 font-bold">
                            {user?.full_name?.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user?.user_type}</p>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={logout} className="w-full justify-center text-xs">
                        <Icon name="logout" className="text-sm" /> Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {renderContent()}
            </main>
        </div>
    );
}

const App = () => {
  const { user, isLoading } = useContext(AuthContext);
  const [route, setRoute] = useState('landing');

  useEffect(() => {
    if (user) setRoute('app');
    else if(route === 'app') setRoute('landing');
  }, [user]);

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-white text-brand-600"><Icon name="hourglass_empty" className="animate-spin text-4xl"/></div>;

  if (user) {
    return <AppLayout />;
  }

  switch(route) {
    case 'login_student': return <AuthPage type="login_student" onLogin={() => setRoute('app')} />;
    case 'login_admin': return <AuthPage type="login_admin" onLogin={() => setRoute('app')} />;
    case 'register': return <AuthPage type="register" />;
    default: return <LandingPage onNavigate={setRoute} />;
  }
};

const Root = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Root />);