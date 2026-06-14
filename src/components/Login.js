import "./Login.css";
import React, { useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom"; 
import axios from "axios";
import UserContext from "../context/UserContext";
import toast from "react-hot-toast";

export default function Login({ setactivenav, setIsLoggedIn }) {
  const [loading, setLoading] = useState(false); //loading
  const [username, setusername] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPassword] = useState("");
  const [userhighlight, setuserhighlight] = useState(false);
  const [emailhighlight, setemailhighlight] = useState(false);
  const [passhighlight, setpasshighlight] = useState(false);
  const [isOn, setIsOn] = useState(false); // true = Login, false = Register
  const [isTeacher, setisTeacher] = useState(false);
  const [passKey, setpassKey] = useState("");

  const emailRef = useRef(null);
  const passRef = useRef(null);
  const passKeyRef = useRef(null); // NEW: Separate ref for passKey
  const navigate = useNavigate();
  const { setUserInfo } = useContext(UserContext);
  const location = useLocation();

  const submitting = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Processing...");
    const role = !isOn && isTeacher ? "teacher" : "student";

    // Construct payload dynamically based on whether it's login or register
    const payload = {
      email,
      pass,
    };

    if (!isOn) {
      // If Registering
      payload.username = username;
      payload.role = role;
      if (isTeacher) {
        payload.passKey = passKey; // Send passKey only for teacher registration
      }
    }

    try {
      const res = await axios.post(
        isOn
          ? "https://eduvid-backend-zfkv.onrender.com/Login"
          : "https://eduvid-backend-zfkv.onrender.com/Register",
        payload,
      );

      const msg = res.data.message || res.data;

      if (msg === "Login successful") {
        // Use strict comparison for clarity
        toast.success("Welcome back!", { id: toastId });
        //temporary
        console.log("SPY 1 - Server Response:", res.data);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("isLoggedIn", "true");

        // IMPORTANT: Save the entire user object, including ID, to localStorage
        const userData = {
          id: res.data.user.id,
          username: res.data.user.username,
          email: res.data.user.email,
          role: res.data.user.role,
        };
        localStorage.setItem("userInfo", JSON.stringify(userData));
        const destination = location.state?.from || "/";

        if (destination.includes("yourcourses")) {
          setactivenav?.("yourcourses"); 
        } else if (destination.includes("courses")) {
          setactivenav?.("courses"); 
        } else {
          setactivenav?.("dashboard");
        }
        setIsLoggedIn(true);
        //  Update context with the entire user object
        setUserInfo(userData);
        navigate(destination);
        
      } else if (msg === "successfully registered") {
        toast.success("Account created! Please log in.", { id: toastId });
        setIsOn(true); // Switch to login screen
      } else {
        console.error("Error:", err);
        toast.error(msg, { id: toastId });
      }
    } catch (err) {
      console.error("Error during submission:", err); // Log the actual error
      const specificError =
        err.response?.data?.message || err.response?.data || "Server crashed!";
      toast.error(`Error: ${specificError}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lgn">
      <div className="lgn-left"></div>
      <div className="lgn-right">
        <div className="head">
          {isOn ? "Log In To Your Account" : "Create Your Account"}
        </div>
        <div
          className={`select ${isOn ? "on" : ""}`}
          onClick={() => {
            setIsOn(!isOn);
            // Reset form states when switching between login and register
            setusername("");
            setEmail("");
            setPassword("");
            setpassKey("");
            setisTeacher(false);
          }}
        >
          <div className="toggle"></div>
          <div className={`register-btn ${isOn ? "off" : ""}`}>Register</div>
          <div className={`login-btn ${isOn ? "on" : ""}`}>Log In</div>
        </div>

        {/* Role Selection - only for Register */}
        {!isOn && (
          <>
            <div
              className={`selectTeacher ${isTeacher ? "on" : ""}`}
              onClick={() => {
                setisTeacher(!isTeacher);
                setpassKey(""); // Clear passKey if switching back to student
              }}
            >
              <div className="role-toggle"></div>
              <div className={`student-btn ${isTeacher ? "off" : ""}`}>
                Student
              </div>
              <div className={`teacher-btn ${isTeacher ? "on" : ""}`}>
                Teacher
              </div>
            </div>
          </>
        )}

        <div className="body">
          <form onSubmit={submitting}>
            {/* Username - only for Register */}
            {!isOn && (
              <>
                <label htmlFor="username" className="he user">
                  Username
                </label>
                <br />
                <input
                  onChange={(e) => setusername(e.target.value)}
                  type="text"
                  placeholder="Username"
                  value={username}
                  className={`user inpt ${userhighlight ? "glow" : "nonglow"}`}
                  onFocus={() => setuserhighlight(true)}
                  onBlur={() => setuserhighlight(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      emailRef.current.focus();
                    }
                  }}
                  required={!isOn} // Required only for registration
                />
                <br />
              </>
            )}

            {/* Email */}
            <label htmlFor="email" className="he mail">
              {" "}
              {/* Fixed htmlFor */}
              Email
            </label>
            <br />
            <input
              ref={emailRef}
              onChange={(e) => setEmail(e.target.value)}
              type="email" // Use type="email"
              placeholder="Email ID"
              value={email}
              className={`uname inpt ${emailhighlight ? "glow" : "nonglow"}`}
              onFocus={() => setemailhighlight(true)}
              onBlur={() => setemailhighlight(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  passRef.current.focus();
                }
              }}
              required
            />
            <br />

            {/* Password */}
            <label htmlFor="password" className="he pass">
              {" "}
              {/* Fixed htmlFor */}
              Password
            </label>
            <br />
            <input
              ref={passRef}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter Password"
              value={pass}
              className={`pword inpt ${passhighlight ? "glow" : "nonglow"}`}
              onFocus={() => setpasshighlight(true)}
              onBlur={() => setpasshighlight(false)}
              required
            />
            <br />

            {/* passKey - only for Teacher Register */}
            {!isOn && isTeacher && (
              <>
                <label htmlFor="passKey" className="he passKey">
                  {" "}
                  {/* Fixed htmlFor */}
                  PassKey
                </label>
                <br />
                <input
                  ref={passKeyRef} // Use the new dedicated ref
                  onChange={(e) => setpassKey(e.target.value)}
                  type="password"
                  placeholder="Enter Pass Key"
                  value={passKey}
                  // You might want a separate highlight state for this input
                  className={`pword inpt ${passhighlight ? "glow" : "nonglow"}`}
                  onFocus={() => setpasshighlight(true)}
                  onBlur={() => setpasshighlight(false)}
                  required={!isOn && isTeacher} // Required only for teacher registration
                />
                <br />
              </>
            )}

            {/* Submit */}
            <button type="submit" id="log">
              {loading ? "Processing..." : isOn ? "Log In" : "Start Now"}
              {!loading && (
                <span className="arrow">
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
