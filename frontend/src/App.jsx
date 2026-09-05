// App.jsx
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CitizenDashboard from "./pages/CitizenDashboard";
import MpDashboard from "./pages/MpDashboard";
import CivilServantDashboard from "./pages/CivilServantDashboard";

function LandingPageWrapper() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onLogin={() => navigate("/login")}
      onRegister={() => navigate("/register")}
      onOpenPortal={(role) => {
        if (role === "mp") navigate("/mp");
        else if (role === "government" || role === "civil-servant") navigate("/civil-servant");
        else navigate("/citizen");
      }}
      onNavigate={(key) => {
        if (key === "home") navigate("/");
        else if (key === "citizen") navigate("/citizen");
        else if (key === "mp") navigate("/mp");
        else if (key === "government" || key === "civil-servant") navigate("/civil-servant");
        else if (key.startsWith("/")) navigate(key);
        else {
          const el = document.getElementById(key);
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else navigate(`/#${key}`);
        }
      }}
    />
  );
}

function LoginWrapper() {
  const navigate = useNavigate();
  return (
    <Login
      onNavigateRegister={() => navigate("/register")}
      onSubmit={async (data) => {
        console.log("login", data);
        if (data.role === "citizen") {
          navigate("/citizen");
        } else if (data.role === "mp") {
          navigate("/mp");
        } else {
          navigate("/civil-servant");
        }
      }}
    />
  );
}

function RegisterWrapper() {
  const navigate = useNavigate();
  return (
    <Register
      onNavigateLogin={() => navigate("/login")}
      onSubmit={async (data) => {
        console.log("register", data);
        if (data.role === "citizen") {
          navigate("/citizen");
        } else if (data.role === "mp") {
          navigate("/mp");
        } else {
          navigate("/civil-servant");
        }
      }}
    />
  );
}

function CitizenWrapper() {
  const navigate = useNavigate();
  return <CitizenDashboard onLogout={() => navigate("/")} />;
}

function MpWrapper() {
  const navigate = useNavigate();
  return <MpDashboard onLogout={() => navigate("/")} />;
}

function CivilServantWrapper() {
  const navigate = useNavigate();
  return <CivilServantDashboard onLogout={() => navigate("/")} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<RegisterWrapper />} />

        {/* Dashboards */}
        <Route path="/citizen" element={<CitizenWrapper />} />
        <Route path="/mp" element={<MpWrapper />} />
        <Route path="/civil-servant" element={<CivilServantWrapper />} />

        {/* Convenience aliases */}
        <Route path="/government" element={<Navigate to="/civil-servant" replace />} />
        <Route path="/dashboard" element={<Navigate to="/citizen" replace />} />
        <Route path="/dashboard/citizen" element={<Navigate to="/citizen" replace />} />
        <Route path="/dashboard/mp" element={<Navigate to="/mp" replace />} />
        <Route path="/dashboard/civil-servant" element={<Navigate to="/civil-servant" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}