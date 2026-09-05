// App.jsx
import { BrowserRouter, Routes, Route, useNavigate,useParams } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import ProjectDetail from "./pages/ProjectDetail";
import CitizenDashboard from "./pages/CitizenDashboard";
import MpDashboard from "./pages/MpDashboard";
const API_URL = "http://localhost:6005";
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
        // TODO: call your auth API here
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        })
        const result = await response.json();
        console.log(response)
        if (!response.ok) {
          throw new Error(result.message || "Login failed");
        }
        localStorage.setItem("role",data.role)
        localStorage.setItem("email",data.email)
        console.log("Login successful:", result.message);
        if (data.role === "government") {
          navigate("/dashboard");
        } else if (data.role === "mp") {
          navigate("/mp-dashboard"); // build later
        } else {
          navigate("/citizen-dashboard"); // build later
        } // redirect after success
        console.log("login", data);
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
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });
      
        const result = await response.json();
      
        if (!response.ok) {
          throw new Error(result.message || "Registration failed");
        }
      
        console.log("Registration successful:", result.message);
        navigate("/login");
      } catch (error) {
        console.error("Registration error:", error);
      }
}}
    />
  );
}

function GovernmentDashboardWrapper() {
  const navigate = useNavigate();

  const handleLogout = () => {
    cookieStore.delete("ticket");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/");
  };

  return (
    <GovernmentDashboard
      onNavigateToProject={(workId) => navigate(`/project/${workId}`)}
      onLogout={handleLogout}
    />
  );
}

function ProjectDetailWrapper() {
  const { workId } = useParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    cookieStore.delete("ticket");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/login");
  };

  return (
    <ProjectDetail
      workId={workId}
      onBack={() => navigate("/dashboard")}
      onLogout={handleLogout}
    />
  );
}



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<RegisterWrapper />} />
        <Route path="/dashboard" element={<GovernmentDashboardWrapper />} />
        <Route path="/project/:workId" element={<ProjectDetailWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}