import { Routes, Route } from "react-router-dom";
import Auth from "./pages/auth/Auth";
import Dashboard from "./pages/dashboard/Dashboard";
import IsLogin from "./pages/auth/IsLogin";

function App() {
  return (
    <>
      <Routes>
        <Route path="/signup" element={<Auth type="signup" />} />
        <Route path="/login" element={<Auth type="login" />} />
        <Route element={<IsLogin />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
