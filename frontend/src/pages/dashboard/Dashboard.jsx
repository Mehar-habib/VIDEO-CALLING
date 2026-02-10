import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContentApi";
import apiClient from "../../apiClient";
import { FaTimes, FaSearch, FaPhoneAlt, FaPhoneSlash } from "react-icons/fa";
import { RiLogoutBoxLine } from "react-icons/ri";
import SocketContext from "../socket/SocketContext";
import Peer from "simple-peer";

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
  const [stream, setStream] = useState();
  const [showReciverDetailPopUp, setShowReciverDetailPopUp] = useState(false);
  const [showReciverDetail, setShowReciverDetail] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callRejectedPopUp, setCallRejectedPopUp] = useState(false);
  const [callRejectedUser, setCallRejectedUser] = useState(null);

  const hasJoined = useRef(false);
  const myVideo = useRef();
  const connectionRef = useRef();

  const socket = SocketContext.getSocket();
  useEffect(() => {
    if (user && socket && !hasJoined.current) {
      socket.emit("join", { id: user._id, name: user.username });
      hasJoined.current = true;
    }
    socket.on("me", (id) => setMe(id));
    socket.on("online-users", (onlineUser) => {
      setOnlineUsers(onlineUser);
    });
    socket.on("callToUser", (data) => {
      setReceivingCall(true);
      setCaller(data);
      setCallerSignal(data.signal);
    });
    socket.on("callRejected", (data) => {
      setCallRejectedPopUp(true);
      setCallRejectedUser(data);
    });
    return () => {
      socket.off("me");
      socket.off("online-users");
    };
  }, [user, socket]);

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

  const isOnlineUser = (userId) => onlineUsers.some((u) => u.userId === userId);

  const startCall = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
        myVideo.current.muted = true;
        myVideo.current.volume = 0;
      }
      currentStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      setIsSidebarOpen(false);
      setCallRejectedPopUp(false);
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream,
      });
      peer.on("signal", (data) => {
        socket.emit("callToUser", {
          callToUserId: showReciverDetail._id,
          signalData: data,
          from: me,
          name: user.username,
          email: user.email,
          profilepic: user.profilepic,
        });
      });

      connectionRef.current = peer;
    } catch (error) {
      console.error(error);
    }
  };
  const handelSelectedUser = (user) => {
    // const selected  = filteredUsers.find((u) => u._id === user._id);
    setSelectedUser(user._id);
    setShowReciverDetailPopUp(true);
    setShowReciverDetail(user);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handelrejectCall = () => {
    setReceivingCall(false);
    setCallAccepted(false);

    socket.emit("reject-call", {
      to: caller.from,
      name: user.username,
      profilepic: user.profilepic,
    });
  };

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
              onClick={() => handelSelectedUser(u)}
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
      {selectedUser ? (
        <div className="relative w-full h-screen bg-black flex items-center justify-center">
          <div className="absolute bottom-[75px] md:bottom-0 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              className="w-32 h-40 md:w-56 object-cover rounded-lg"
            />
          </div>
        </div>
      ) : (
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome, {user?.username || "User"}
          </h2>
          <p className="text-gray-600">
            Select a user from the sidebar to start a chat or call.
          </p>
        </main>
      )}

      {/* call user popup */}
      {showReciverDetailPopUp && showReciverDetail && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl mb-2">User Details</p>
              <img
                src={showReciverDetail.profilepic || "/default-avatar.png"}
                alt="User"
                className="w-20 h-20 rounded-full border-4 border-blue-500"
              />
              <h3 className="text-lg font-bold mt-3">
                {showReciverDetail.username}
              </h3>
              <p className="text-sm text-gray-500">{showReciverDetail.email}</p>

              <div className="flex gap-4 mt-5">
                <button
                  onClick={() => {
                    setSelectedUser(showReciverDetail._id);
                    startCall(); // function that handles media and calling
                    setShowReciverDetailPopUp(false);
                  }}
                  className="bg-green-600 text-white px-4 py-1 rounded-lg w-28 flex items-center gap-2 justify-center"
                >
                  Call <FaPhoneAlt />
                </button>
                <button
                  onClick={() => setShowReciverDetailPopUp(false)}
                  className="bg-gray-400 text-white px-4 py-1 rounded-lg w-28"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* incoming call */}
      {receivingCall && !callAccepted && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl mb-2">Call From...</p>
              <img
                src={caller?.profilepic || "/default-avatar.png"}
                alt="Caller"
                className="w-20 h-20 rounded-full border-4 border-green-500"
              />
              <h3 className="text-lg font-bold mt-3">{caller?.name}</h3>
              <p className="text-sm text-gray-500">{caller?.email}</p>
              <div className="flex gap-4 mt-5">
                <button
                  type="button"
                  // onClick={handelacceptCall}
                  className="bg-green-500 text-white px-4 py-1 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Accept <FaPhoneAlt />
                </button>
                <button
                  type="button"
                  onClick={handelrejectCall}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Reject <FaPhoneSlash />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* call rejection popup */}
      {callRejectedPopUp && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl mb-2">Call Rejected From...</p>
              <img
                src={callRejectedUser.profilepic || "/default-avatar.png"}
                alt="Caller"
                className="w-20 h-20 rounded-full border-4 border-green-500"
              />
              <h3 className="text-lg font-bold mt-3">
                {callRejectedUser.name}
              </h3>
              <div className="flex gap-4 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    startCall(); // function that handles media and calling
                  }}
                  className="bg-green-500 text-white px-4 py-1 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Call Again <FaPhoneAlt />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // endCallCleanup();
                    setCallRejectedPopUp(false);
                    setShowReciverDetailPopUp(false);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Back <FaPhoneSlash />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
