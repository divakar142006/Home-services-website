import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { useAuth } from "./contex/Authconfig";
import SignupPage from "./pages/SignupPage";
import "./App.css";
import Contact from "./pages/Contact";
import WorkerOperationsPage from "./pages/WorkerOperationsPage";
import Home from "./pages/Home";
import Bookingform from "./components/Bookingform";
import SignInPage from "./pages/SignInPage";
import Dashboard1 from "./components/Dashboard1";
import { isOwnerEmail } from "./utils/ownerAccess";
function App() {
  const { user } = useAuth();
  const isOwner = isOwnerEmail(user?.email);
  return (
  
    <BrowserRouter>
    <Routes>
  <Route path="/" element={<SignInPage/>} />
  <Route path="/signin" element={<SignInPage/>} />
  <Route path="/signup" element={<SignupPage />} />

  <Route path="/dashboard" element={<Dashboard1 />} />

  <Route
    path="/workerpage"
    element={
      !user ? (
        <Navigate to="/signin" replace />
      ) : isOwner ? (
        <WorkerOperationsPage />
      ) : (
        <Navigate to="/home" replace />
      )
    }
  />
  <Route path="/home" element={<Home/>} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/booking" element={<Bookingform/>} />
  <Route path="/dashboard1" element={<Dashboard1/>} />
</Routes>
    </BrowserRouter>
    
  );
}
export default App;