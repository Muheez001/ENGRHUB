import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OnboardingForm from './components/auth/OnboardingForm';
import Sidebar from './components/Sidebar';
import StateDisplay from './components/StateDisplay';

// ── Route-level code splitting ──
// Pages are lazy-loaded to reduce initial bundle size.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const GapView = lazy(() => import('./pages/GapView'));
const Upload = lazy(() => import('./pages/Upload'));
const Voting = lazy(() => import('./pages/Voting'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Exercise = lazy(() => import('./pages/Exercise'));

function AppLayout() {
  const { hasProfile, profileLoading, refetchProfile } = useUser();

  // Show loading while checking Firestore for user profile
  if (profileLoading) {
    return <StateDisplay type="loading" message="Loading your profile..." />;
  }

  // First-time user — show onboarding form (no sidebar)
  if (!hasProfile) {
    return <OnboardingForm onComplete={refetchProfile} />;
  }

  // Existing user — show full app with sidebar
  return (
    <>
      <Sidebar />
      <main className="main">
        <div className="content">
          <Suspense fallback={<StateDisplay type="loading" message="Loading page..." />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseDetail />} />
              <Route path="/courses/:courseId/exercises" element={<Exercise />} />
              <Route path="/gap-view" element={<GapView />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/voting" element={<Voting />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public route — no sidebar, no protection */}
            <Route
              path="/login"
              element={
                <Suspense fallback={<StateDisplay type="loading" />}>
                  <LoginPage />
                </Suspense>
              }
            />

            {/* Protected routes — auth required, onboarding check */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <UserProvider>
                    <AppLayout />
                  </UserProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
