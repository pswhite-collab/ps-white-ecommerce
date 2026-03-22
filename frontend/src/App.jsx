import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Library from './pages/Library';
import Reader from './pages/Reader';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageBooks from './pages/Admin/ManageBooks';
import { useAuth } from './context/AuthContext';
import api from './services/api';

const ProtectedRoute = ({ children, requireAdmin = false, redirectTo = '/' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-mocha">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AdminRouteSwitch = () => {
  const location = useLocation();
  if (location.pathname.endsWith('/manage-books')) {
    return <ManageBooks />;
  }
  return <AdminDashboard />;
};

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-milk text-charcoal">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/library"
            element={(
              <ProtectedRoute redirectTo="/">
                <Library />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/reader/:bookId"
            element={(
              <ProtectedRoute redirectTo="/">
                <Reader />
              </ProtectedRoute>
            )}
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <AdminRouteSwitch />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await api.get('/test');
        console.log('API test response:', response.data);
      } catch (error) {
        console.error('API test failed:', error.message);
      }
    };

    checkApi();
  }, []);

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
