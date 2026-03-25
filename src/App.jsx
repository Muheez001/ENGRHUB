import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ThemeProvider } from './context/ThemeContext';
import { useUserProfile } from './hooks/useUserProfile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OnboardingForm from './components/auth/OnboardingForm';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import GapView from './pages/GapView';
import Upload from './pages/Upload';
import Voting from './pages/Voting';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function AppLayout() {
  const { hasProfile, loading, refetch } = useUserProfile();

  // Show loading while checking Firestore for user profile
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your profile...</p>
      </div>
    );
  }

  // First-time user — show onboarding form (no sidebar)
  if (!hasProfile) {
    return <OnboardingForm onComplete={refetch} />;
  }

  // Existing user — show full app with sidebar
  return (
    <>
      <Sidebar />
      <main className="main">
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/gap-view" element={<GapView />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/voting" element={<Voting />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public route — no sidebar, no protection */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — auth required, onboarding check */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
