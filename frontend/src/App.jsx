// App.jsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
const API_URL = "http://localhost:6005";
function LandingPageWrapper() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onLogin={() => navigate("/login")}
      onRegister={() => navigate("/register")}
      onNavigate={(key) => {
        // maps nav tab keys to routes/anchors — see note below
        if (key === "home") navigate("/");
        else navigate(`/#${key}`);
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
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Login failed");
          }
          console.log("Login successful:", result.message);
          navigate("/dashboard"); // redirect after success
          
        } catch (error){
            console.error("Login error: ", error);
        }
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<RegisterWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}