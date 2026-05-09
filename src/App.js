import "./App.css";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Courses from "./components/courses";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import MyCourses from "./components/yourcourses";
import { useState, useEffect, useRef } from "react";
import UserContext from "./context/UserContext";
import VideoUpload from "./components/VideoUpload";
import { Toaster } from "react-hot-toast";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activenav, setactivenav] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });
  const [isPrClicked, setprClicked] = useState(false);
  const [isuploadClicked, setuploadClicked] = useState(false);
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem("userInfo");
    return stored
      ? JSON.parse(stored)
      : { username: "Guest User", email: "guest@example.com" };
  });

  const menuRef = useRef();
  const imgRef = useRef();

  //to check if the token is genuine or not
  useEffect(() => {
    const checkSecurity = async () => {
      // Step 1: Grab whatever is in local storage. (It might be real, it might be fake).
      const token = localStorage.getItem("token");

      if (token) {
        try {
          // Step 2: Send it to the Backend Bouncer to be checked
          const res = await axios.get(
            "https://eduvid-backend-zfkv.onrender.com/verify",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          // Step 3: If the server responds normally, we do nothing! Let them use the app.
        } catch (err) {
          // Step 4: THE FIX!
          // If the code drops into this 'catch' block, it means the server responded
          // with that 403 Forbidden error. The token is fake or expired.
          if (
            err.response &&
            (err.response.status === 401 || err.response.status === 403)
          ) {
            // Nuke the local storage immediately so they can't try again
            localStorage.removeItem("token");
            localStorage.removeItem("userInfo");
            localStorage.removeItem("isLoggedIn");

            // Reset React's memory to "Logged Out"
            setIsLoggedIn(false);
            setUserInfo({ username: "Guest User", email: "guest@example.com" });

            // Force them to the login screen
            navigate("/login");
          } else {
            console.error(
              "Server check failed, but keeping user logged in:",
              err,
            );
          }
        }
      }
    };

    checkSecurity();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isPrClicked) return;

      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        imgRef.current &&
        !imgRef.current.contains(e.target)
      ) {
        setprClicked(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPrClicked]);

  //to prevent access pf any module by manually typing the url
  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return <Navigate to="/Login" replace />;
    }

    return children;
  };

  const getHeading = (pathname) => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/courses":
        return "Courses";
      case "/yourcourses":
        return " Your Courses";
      case "/Login":
        return "Log In";
      case "/VideoUpload":
        return "Upload";
      default:
        return "";
    }
  };


  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="fullpage">
        <div className="nav">
          <Link
            to="/"
            className={`nel nel-1 ${
              activenav === "dashboard" ? "setwhite" : "setblue"
            }`}
            onClick={() => setactivenav("dashboard")}
            draggable="false"
          >
            Dashboard
          </Link>
          <Link
            to="/courses"
            className={`nel nel-2 ${
              activenav === "course" ? "setwhite" : "setblue"
            }`}
            onClick={() => setactivenav("course")}
            draggable="false"
          >
            Courses
          </Link>
          <Link
            to="/yourcourses"
            className={`nel nel-3 ${
              activenav === "yourcourses" ? "setwhite" : "setblue"
            }`}
            onClick={() => setactivenav("yourcourses")}
            draggable="false"
          >
            Your Courses
          </Link>
        </div>
        {/* logout */}
        {isPrClicked && (
          <div className="pro-info" ref={menuRef}>
            <div className="pic"></div>
            <div className="details">
              <div className="det">
                {userInfo.username || "Guest User"}
                <br />
                {userInfo.email || "guest@example.com"}
              </div>
              <div
                className="log-out"
                onClick={() => {
                  try {
                    console.log("🚨 1. LOGOUT CLICKED!");

                    // NUKE ALL LOCAL STORAGE (This guarantees we don't miss the wrong key name)
                    localStorage.removeItem("token");
                    localStorage.removeItem("userInfo");
                    localStorage.removeItem("isLoggedIn");
                    console.log("🚨 2. LOCAL STORAGE NUKED!");

                    setIsLoggedIn(false);
                    setUserInfo({
                      username: "Guest User",
                      email: "guest@example.com",
                    });

                    navigate("/login");
                    setprClicked(false);
                  } catch (err) {
                    console.error("❌ LOGOUT BUTTON CRASHED:", err);
                  }
                }}
              >
                <span className="logout">Log out</span>
              </div>
            </div>
          </div>
        )}
        <div className="content">
          <div className="searchbar">
            <span className="page-title">{getHeading(location.pathname)}</span>
            {/* Uploading */}
            {userInfo.role === "teacher" && isLoggedIn && (
              <Link to="/VideoUpload" className="nel upload">
                <div
                  onClick={() => {
                    setuploadClicked(!isuploadClicked);
                  }}
                  className="upld"
                >
                  <span className="label">
                    Upload<i className="fa-solid fa-arrow-up"></i>
                  </span>
                </div>
              </Link>
            )}
            {/* Profile */}
            {isLoggedIn && (
              <Link to="#" className="nel profile">
                <div
                  ref={imgRef}
                  onClick={() => {
                    setprClicked(!isPrClicked);
                  }}
                  className="pro"
                ></div>
              </Link>
            )}

            {/* login */}
            {!isLoggedIn && (
              <Link to="/Login" className="nel login">
                <span className="icon">
                  <i className="fa-solid fa-plus"></i>
                </span>
                <span className="label">Log in</span>
              </Link>
            )}

            <Link to="/Setting" className="setting">
              <i className="fa-solid fa-gear"></i>
            </Link>
          </div>
          <br />
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  setactivenav={setactivenav}
                  isLoggedIn={isLoggedIn}
                />
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/Login"
              element={
                <Login
                  setactivenav={setactivenav}
                  setIsLoggedIn={setIsLoggedIn}
                />
              }
            />
            <Route
              path="/yourcourses"
              element={
                <ProtectedRoute>
                  <MyCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/VideoUpload"
              element={
                <ProtectedRoute>
                  <VideoUpload />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </UserContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
