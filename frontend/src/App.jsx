// App.jsx
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
        console.log("login", data);
        navigate("/dashboard"); // redirect after success
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
        // TODO: call your auth API here
        console.log("register", data);
        navigate("/dashboard"); // or wherever makes sense
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