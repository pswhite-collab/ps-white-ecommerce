import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import QuotePopup from './components/common/QuotePopup';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Library from './pages/Library';
import Reader from './pages/Reader';
import Login from './pages/Login';
import Register from './pages/Register';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import OrderSuccess from './pages/OrderSuccess';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManageBooks from './pages/Admin/ManageBooks';
import ManageOrders from './pages/Admin/ManageOrders';
import Customers from './pages/Admin/Customers';
import ReadingAnalytics from './pages/Admin/ReadingAnalytics';
import ManageQuotes from './pages/Admin/ManageQuotes';
import ManageReviews from './pages/Admin/ManageReviews';
import ManageBlog from './pages/Admin/ManageBlog';
import ManageNewsletter from './pages/Admin/ManageNewsletter';
import Settings from './pages/Admin/Settings';
import api from './services/api';

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-milk text-charcoal">
      <QuotePopup />
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={(
              <ProtectedRoute redirectTo="/login">
                <Checkout />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/order-success/:orderId"
            element={(
              <ProtectedRoute redirectTo="/login">
                <OrderSuccess />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/library"
            element={(
              <ProtectedRoute redirectTo="/login">
                <Library />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/reader/:bookId"
            element={(
              <ProtectedRoute redirectTo="/login">
                <Reader />
              </ProtectedRoute>
            )}
          />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/manage-books"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <ManageBooks />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/orders"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <ManageOrders />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/customers"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <Customers />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/reading-analytics"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <ReadingAnalytics />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/quotes"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <ManageQuotes />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/reviews"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <ManageReviews />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/blog"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <ManageBlog />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/newsletter"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <ManageNewsletter />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/settings"
            element={(
              <ProtectedRoute requireAdmin redirectTo="/admin/login">
                <Settings />
              </ProtectedRoute>
            )}
          />
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />

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
