import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../../context/UserContentApi";

const IsLogin = () => {
  const { user, loading } = useUser();
  console.log("user ", user, "loading", loading);
  // If user data is still loading, show a loader (prevent flickering issues)
  if (loading) return <div>Loading...</div>;
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default IsLogin;
