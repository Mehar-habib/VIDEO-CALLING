import { useState } from "react";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../apiClient";
import { useUser } from "../../context/UserContentApi";

const Auth = ({ type }) => {
  const { updateUser } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "male",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === "signup" && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const endpoint = type === "signup" ? "/auth/signup" : "/auth/login";
      const response = await apiClient.post(endpoint, formData);

      toast.success(response.data.message || "Success!");

      if (type === "signup") navigate("/login");

      if (type === "login") {
        updateUser(response.data);
        const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        document.cookie = `jwt=${response.data.token}; path=/; expires=${date.toUTCString()}`;
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4">
      <div className="w-full max-w-md rounded-xl bg-[#111827] border border-white/10 shadow-xl p-8 text-white">
        <h2 className="text-2xl font-semibold text-center mb-1">
          {type === "signup" ? "Create account" : "Welcome back"}
        </h2>
        <p className="text-center text-sm text-gray-400 mb-6">
          {type === "signup"
            ? "Get started with SlrTechCalls"
            : "Login to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "signup" && (
            <>
              <Input
                icon={<FaUser />}
                placeholder="Full name"
                name="fullname"
                onChange={handleChange}
              />
              <Input
                icon={<FaUser />}
                placeholder="Username"
                name="username"
                onChange={handleChange}
              />
            </>
          )}

          <Input
            icon={<FaEnvelope />}
            type="email"
            placeholder="Email address"
            name="email"
            onChange={handleChange}
          />

          <Input
            icon={<FaLock />}
            type="password"
            placeholder="Password"
            name="password"
            onChange={handleChange}
          />

          {type === "signup" && (
            <Input
              icon={<FaLock />}
              type="password"
              placeholder="Confirm password"
              name="confirmPassword"
              onChange={handleChange}
            />
          )}

          {type === "signup" && (
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleChange}
                />
                Male
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleChange}
                />
                Female
              </label>
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-medium hover:bg-blue-500 transition disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : type === "signup"
                ? "Sign up"
                : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {type === "signup" ? (
            <>
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:underline">
                Login
              </Link>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <Link to="/signup" className="text-blue-400 hover:underline">
                Register
              </Link>
            </>
          )}
        </p>
      </div>

      <Toaster position="top-center" />
    </div>
  );
};

const Input = ({ icon, ...props }) => (
  <div className="flex items-center gap-3 rounded-lg bg-[#0b0f19] border border-white/10 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-600">
    <span className="text-gray-400">{icon}</span>
    <input
      {...props}
      required
      className="w-full bg-transparent outline-none text-sm placeholder-gray-500 text-white"
    />
  </div>
);

export default Auth;
