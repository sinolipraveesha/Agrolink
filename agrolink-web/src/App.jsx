import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerificationPending from './pages/VerificationPending';
import FarmerLayout from './components/farmer/FarmerLayout';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import AddProduct from './pages/farmer/AddProduct';
import FarmerOrders from './pages/farmer/FarmerOrders';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserVerification from './pages/admin/UserVerification';
import ProductReview from './pages/admin/ProductReview';
import OrderManagement from './pages/admin/OrderManagement';
import LogisticsMap from './pages/admin/LogisticsMap'
import DriverLayout from './components/driver/DriverLayout'
import DriverDashboard from './pages/driver/DriverDashboard'
import ActiveTrip from './pages/driver/ActiveTrip'
import DriverWallet from './pages/driver/DriverWallet'
import VehicleProfile from './pages/driver/VehicleProfile'
import LiveTracking from './pages/buyer/LiveTracking'
import ProductDetails from './pages/marketplace/ProductDetails'
import Cart from './pages/marketplace/Cart'
import Checkout from './pages/marketplace/Checkout'
import MyOrders from './pages/buyer/MyOrders'
import PostRequest from './pages/marketplace/PostRequest'
import FarmerRequests from './pages/farmer/FarmerRequests'
import MyRequests from './pages/marketplace/MyRequests';
import Marketplace from './pages/marketplace/Marketplace';
import NotificationDropdown from './components/common/NotificationDropdown';

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/post-request" element={<PostRequest />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verification-pending" element={<VerificationPending />} />
            <Route path="/track" element={<LiveTracking />} />
            <Route path="/my-orders" element={<MyOrders />} />

            {/* Redirect for incorrect admin path */}
            <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Farmer Routes */}
            <Route path="/farmer" element={<FarmerLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="orders" element={<FarmerOrders />} />
              <Route path="requests" element={<FarmerRequests />} />
              <Route path="products" element={<div className="p-10">Products Page Coming Soon</div>} />
              <Route path="wallet" element={<div className="p-10">Wallet Page Coming Soon</div>} />
              <Route path="transport" element={<div className="p-10">Transport Page Coming Soon</div>} />
              <Route path="profile" element={<div className="p-10">Profile Page Coming Soon</div>} />
              <Route path="ai-advisor" element={<div className="p-10">AI Advisor Coming Soon</div>} />
              <Route path="insights" element={<div className="p-10">Insights Coming Soon</div>} />
            </Route>

            {/* Driver Routes */}
            <Route path="/driver" element={<DriverLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DriverDashboard />} />
              <Route path="active-trip" element={<ActiveTrip />} />
              <Route path="wallet" element={<DriverWallet />} />
              <Route path="vehicle" element={<VehicleProfile />} />
              <Route path="profile" element={<div className="p-10">My Profile Coming Soon</div>} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="verification" element={<UserVerification />} />
              <Route path="products" element={<ProductReview />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="logistics" element={<LogisticsMap />} />
              <Route path="settings" element={<div className="p-10 text-gray-500">Settings Coming Soon</div>} />
            </Route>

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
