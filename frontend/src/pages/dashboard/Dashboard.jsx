import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContentApi";
import apiClient from "../../apiClient";
import { FaTimes, FaSearch } from "react-icons/fa";
import { RiLogoutBoxLine } from "react-icons/ri";
import SocketContext from "../socket/SocketContext";

const Dashboard = () => {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [me, setMe] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const hasJoined = useRef(false);

  const socket = SocketContext.getSocket();
  useEffect(() => {
    if (user && socket && !hasJoined.current) {
      socket.emit("join", { id: user._id, name: user.username });
      hasJoined.currect = true;
    }
    socket.on("me", (id) => setMe(id));
    socket.on("online-users", (onlineUser) => {
      setOnlineUsers(onlineUser);
    });
    return () => {
      socket.off("me");
      socket.off("online-users");
    };
  }, [user, socket]);
  console.log("onlineUsers", onlineUsers);
  const isOnlineUser = (userId) => onlineUsers.some((u) => u.userId === userId);
  const allusers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/user");
      if (response.data.success !== false) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    allusers();
  }, []);

  const handelSelectedUser = (userId) => {
    setSelectedUser(userId);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      socket.off("disconnect");
      socket.disconnect();
      SocketContext.setSocket();
      updateUser(null);
      localStorage.removeItem("userData");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6fa]">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-10 md:hidden bg-black/30"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#1f2937] text-white w-64 h-full p-5 space-y-6 fixed z-20 transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 rounded-r-2xl shadow-xl`}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-wide">Users</h1>
          <button
            type="button"
            className="md:hidden text-white text-lg"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* User List */}
        <ul className="space-y-3 overflow-y-auto max-h-[70vh]">
          {filteredUsers.map((u) => (
            <li
              key={u._id}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-blue-600 ${
                selectedUser === u._id ? "bg-blue-700" : "bg-gray-800"
              }`}
              onClick={() => handelSelectedUser(u._id)}
            >
              <div className="relative">
                <img
                  src={u.profilepic || "/default-avatar.png"}
                  alt={u.username}
                  className="w-12 h-12 rounded-full border-2 border-gray-400"
                />
                {isOnlineUser(u._id) && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full shadow-lg animate-bounce"></span>
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="font-semibold text-white truncate">
                  {u.username}
                </span>
                <span className="text-xs text-gray-300 truncate w-36">
                  {u.email}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Logout */}
        {user && (
          <div
            onClick={handleLogout}
            className="absolute bottom-5 left-5 right-5 flex items-center justify-center gap-2 bg-red-500 py-2 rounded-lg cursor-pointer hover:bg-red-600 transition"
          >
            <RiLogoutBoxLine size={20} />
            <span className="font-medium">Logout</span>
          </div>
        )}
      </aside>

      {/* Main Content Placeholder */}
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome, {user?.username || "User"}
        </h2>
        <p className="text-gray-600">
          Select a user from the sidebar to start a chat or call.
        </p>
      </main>
    </div>
  );
};

export default Dashboard;
