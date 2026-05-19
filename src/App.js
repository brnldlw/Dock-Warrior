import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Search from './pages/Search'
import FacilityDetail from './pages/FacilityDetail'
import DetentionTimer from './pages/DetentionTimer'
import DetentionInvoice from './pages/DetentionInvoice'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import BrokerRatings from './pages/BrokerRatings'
import Pricing from './pages/Pricing'
import SafetyCheckIn from './pages/SafetyCheckIn'
import AddFacility from './pages/AddFacility'
import Admin from './pages/Admin'
import TruckStops from './pages/TruckStops'
import RouteIntelligence from './pages/RouteIntelligence'
import LoadCalculator from './pages/LoadCalculator'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/facility/:id" element={<FacilityDetail />} />
              <Route path="/timer" element={<DetentionTimer />} />
              <Route path="/invoice" element={<DetentionInvoice />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/brokers" element={<BrokerRatings />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/safety" element={<SafetyCheckIn />} />
              <Route path="/add-facility" element={<AddFacility />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/truck-stops" element={<TruckStops />} />
              <Route path="/route" element={<RouteIntelligence />} />
              <Route path="/calculator" element={<LoadCalculator />} />
            </Routes>
          </main>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid #FF6B00',
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '16px',
                letterSpacing: '0.5px'
              }
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  )
}
