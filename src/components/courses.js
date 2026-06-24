import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";
import UserContext from "../context/UserContext";
import "./courses.css";
import toast from "react-hot-toast";

function Courses() {
  const { userInfo } = useContext(UserContext);
  const isValidUser =
    userInfo &&
    Object.keys(userInfo).length > 0 &&
    userInfo.username !== "Guest User";
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // State to track which video is currently playing
  const [playingVideo, setPlayingVideo] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");

  const selectedCourse = courses.find(
    (c) => c.id.toString() === selectedCourseId,
  );
  const [expandedDescId, setExpandedDescId] = useState(null);

  const [activeMenuId, setActiveMenuId] = useState(null);

  // 🤖 NEW AI FEATURE HUB STATES
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  //update the video saved or not
  const [savedVideoIds, setSavedVideoIds] = useState([]);

  useEffect(() => {
    fetchAllCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      if (!isValidUser) {
        setSearchParams({});
        setVideos([]);
        return;
      }
      fetchVideos(selectedCourseId);
    } else {
      setVideos([]);
      setPlayingVideo(null); // Close video if we go back to the grid
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      // 🛑 THE ULTIMATE BLOCKER: Stop the fetch if they aren't logged in!
      if (!userInfo) {
        setSearchParams({}); // Instantly erase the '?course=X' from the URL
        setVideos([]); // Ensure videos array is empty
        return;
      }

      // If they ARE logged in, go ahead and fetch!
      fetchVideos(selectedCourseId);
    } else {
      setVideos([]); // Clear videos if we go back to the grid
      setPlayingVideo(null);
    }
  }, [userInfo, selectedCourseId, setSearchParams]);

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://eduvid-backend-zfkv.onrender.com/api/courses/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCourses(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching all courses:", err);
      setLoading(false);
    }
  };

  const fetchVideos = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `https://eduvid-backend-zfkv.onrender.com/api/upload/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("🕵️ REACT SPY - DATA FROM BACKEND:", res.data);
      setVideos(res.data);
      //fetch videos that are saved
      const token = localStorage.getItem("token");
      axios
        .get(
          "https://eduvid-backend-zfkv.onrender.com/api/upload/saved-list-ids",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        .then((response) => {
          setSavedVideoIds(response.data); // e.g., returns array [102, 105, 110]
        })
        .catch((err) =>
          console.error("Error fetching initial bookmarks list:", err),
        );
    } catch (err) {
      console.error("Error fetching videos:", err);
    }
  };

  const handleCourseClick = (course) => {
    if (!isValidUser) {
      alert("Please login first to view the course videos!");
      return;
    }
    setSearchParams({ course: course.id });
  };

  const handleBackClick = () => {
    setSearchParams({});
    setPlayingVideo(null); // Ensure video closes when going back
  };

  // ==========================================
  // 🤖 NEW AI FEATURE HUB OPERATIONS HANDLERS
  // ==========================================

  // Fires off initial overview explanation prompt
  const triggerAiExplanation = async (videoInfo) => {
    setAiLoading(true);
    try {
      const token = localStorage.getItem("token");
      const promptText = `Provide a brief overview and core concepts for a computer science lecture video titled "${videoInfo.title}". Description context: ${videoInfo.description || "None"}. Keep it informative and highly readable for a college student.`;

      const res = await axios.post(
        "https://eduvid-backend-zfkv.onrender.com/api/ai/ask",
        { prompt: promptText },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setAiMessages([{ sender: "bot", text: res.data.reply }]);
    } catch (err) {
      console.error("AI Error:", err);
      // 🚨 Extract the exact message from our new backend debug route
      const systemError =
        err.response?.data?.message || "Error fetching response.";
      setAiMessages((prev) => [...prev, { sender: "bot", text: systemError }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Handles custom chat questions typed by the student
  const handleAiChatSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim() || aiLoading) return;

    const userQuery = aiInput.trim();
    setAiMessages((prev) => [...prev, { sender: "user", text: userQuery }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const token = localStorage.getItem("token");
      const promptText = `The student is watching a coding video lecture titled "${playingVideo.title}". Answer this question about it: ${userQuery}`;

      const res = await axios.post(
        "https://eduvid-backend-zfkv.onrender.com/api/ai/ask",
        { prompt: promptText },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setAiMessages((prev) => [
        ...prev,
        { sender: "bot", text: res.data.reply },
      ]);
    } catch (err) {
      console.error("AI Error:", err);
      // 🚨 Extract the exact message from our new backend debug route
      const systemError =
        err.response?.data?.message || "Error fetching response.";
      setAiMessages((prev) => [...prev, { sender: "bot", text: systemError }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Update and delete operations
  const toggleMenu = (e, videoId) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === videoId ? null : videoId);
  };

  const handleDeleteClick = async (e, videoId) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video?",
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://eduvid-backend-zfkv.onrender.com/api/upload/${videoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setVideos(videos.filter((video) => video.id !== videoId));
      setActiveMenuId(null);
      alert("Video deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete video.");
    }
  };

  //function to add or remove video from saved video table
  const handleSaveClick = async (e, videoId) => {
    e.stopPropagation(); // Prevents the video modal player from jumping up
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `https://eduvid-backend-zfkv.onrender.com/api/upload/save/${videoId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast(res.data.message);
      if (res.data.isSaved) {
        setSavedVideoIds((prev) => [...prev, videoId]); // Saved! Add to list
      } else {
        setSavedVideoIds((prev) => prev.filter((id) => id !== videoId)); // Unsaved! Remove from list
      }
      setActiveMenuId(null); // Close the dropdown menu neatly
    } catch (err) {
      console.error("Failed to save video:", err);
      alert("Error bookmarking video.");
    }
  };

  if (loading) return <div className="loading-text">Loading courses...</div>;

  return (
    <div className="courses-page-wrapper">
      {!userInfo && (
        <div className="login-warning-banner">
          🔒 Please{" "}
          <Link to="/Login" className="banner-login-link">
            Login
          </Link>{" "}
          first to access and play course videos.
        </div>
      )}

      {/* --- VIEW 1: LIST ALL COURSES --- */}
      {!selectedCourse ? (
        <>
          <h2 className="courses-heading">Explore All Courses</h2>
          <div className="public-course-grid">
            {courses.length === 0 ? <p>No courses available yet.</p> : null}

            {courses.map((course) => (
              <div
                key={course.id}
                className="public-course-card"
                onClick={() => handleCourseClick(course)}
              >
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="public-card-img"
                />
                <div className="public-card-info">
                  <h3 className="public-card-title">{course.title}</h3>
                  <span className="view-btn">View Videos ➔</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* --- VIEW 2: LIST VIDEOS FOR SELECTED COURSE --- */
        <div className="course-detail-view">
          <button className="back-btn" onClick={handleBackClick}>
            ⬅ Back to Courses
          </button>

          <div className="course-detail-header">
            <img
              src={selectedCourse.thumbnail_url}
              alt="thumb"
              className="detail-thumb"
            />
            <h2 className="detail-title">{selectedCourse.title}</h2>
          </div>

          <h3 className="videos-heading">Course Videos ({videos.length})</h3>

          {!isValidUser ? (
            <div
              style={{
                backgroundColor: "#ffeeba",
                padding: "20px",
                borderRadius: "8px",
                color: "#856404",
              }}
            >
              <h3>🔒 Access Denied</h3>
              <p>You must be logged in to view and play these videos.</p>
            </div>
          ) : (
            <div className="video-grid">
              {videos.length === 0 ? (
                <p>No videos uploaded to this course yet.</p>
              ) : (
                videos.map((video, index) => (
                  <div key={video.id} className="video-card">
                    {/* THE SECURE THREE-DOT MENU (ONLY TEACHERS SEE THIS) */}
                    {userInfo?.role === "teacher" && (
                      <div className="menu-container">
                        <div
                          className="video-card-info"
                          style={{ position: "relative" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <h4
                              className="video-title clickable-title"
                              onClick={() => setPlayingVideo(video)}
                              title={video.title}
                            >
                              {index + 1}. {video.title}
                            </h4>
                          </div>
                        </div>
                        {/* button visible to everyone so students can click it to open options */}
                        <button
                          className="three-dots-btn"
                          onClick={(e) => toggleMenu(e, video.id)}
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>

                        {activeMenuId === video.id && (
                          <div className="dropdown-options-menu">
                            {savedVideoIds.includes(video.id) ? (
                              <div
                                className="dropdown-item delete-opt"
                                onClick={(e) => handleSaveClick(e, video.id)}
                              >
                                <i className="fa-solid fa-bookmark-slash"></i>{" "}
                                Unsave Video
                              </div>
                            ) : (
                              <div
                                className="dropdown-item edit-opt"
                                onClick={(e) => handleSaveClick(e, video.id)}
                              >
                                <i className="fa-solid fa-bookmark"></i> Save
                                Video
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* THUMBNAIL CONTAINER */}
                    <div
                      className="video-thumbnail-container"
                      onClick={() => setPlayingVideo(video)}
                    >
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="video-thumbnail"
                        />
                      ) : (
                        <div className="video-thumbnail-fallback">
                          <i className="fa-solid fa-video"></i>
                        </div>
                      )}

                      <div className="play-overlay">
                        <i className="fa-solid fa-play"></i>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* --- VIEW 3: THE CINEMATIC SPLIT VIDEO PLAYER MODAL --- */}
      {playingVideo && (
        <div
          className={`video-player-overlay ${isAiOpen ? "ai-layout-active" : ""}`}
        >
          <div className="video-player-container">
            {/* 🎥 LEFT SIDE PANEL: LECTURE PRESENTATION WINDOW */}
            <div className="video-content-side">
              <div className="player-header">
                <h3 className="Vidtitle">{playingVideo.title}</h3>
                <div className="player-header-actions">
                  {/* AI CONTEXT TRIGGER ACCESS BUTTON */}
                  <button
                    className="ask-gemini-btn"
                    onClick={() => {
                      setIsAiOpen(!isAiOpen);
                      if (aiMessages.length === 0) {
                        triggerAiExplanation(playingVideo);
                      }
                    }}
                  >
                    <span>Ask Gemini</span>
                  </button>

                  <button
                    className="close-player-btn"
                    onClick={() => {
                      setPlayingVideo(null);
                      setIsAiOpen(false);
                      setAiMessages([]);
                    }}
                  >
                    ✖ Close
                  </button>
                </div>
              </div>

              <video
                controls
                autoPlay
                className="actual-video-element"
                src={playingVideo.video_url}
              >
                Your browser does not support HTML video.
              </video>

              {playingVideo.description && (
                <div className="player-description-box">
                  <h4 className="about-video-header">About this video</h4>
                  <p className="about-video-paragraph">
                    {playingVideo.description}
                  </p>
                </div>
              )}
            </div>

            {/* 🤖 RIGHT PANEL / TOP FLUID SLIDE DOWN SHEET PANEL */}
            {isAiOpen && (
              <div className="gemini-split-panel">
                <div className="ai-panel-header">
                  <h4>
                    <i className="fa-solid fa-brain"></i> Gemini AI Assistant
                  </h4>
                  <button onClick={() => setIsAiOpen(false)}>✖</button>
                </div>

                <div className="ai-chat-body">
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`ai-bubble ${msg.sender}`}>
                      <strong>
                        {msg.sender === "user" ? "You" : "Gemini"}
                      </strong>

                      {/* 🚨 PARSES THE AI BOLD STARS (**) GRACEFULLY INTO HTML ELEMENTS */}
                      <p
                        dangerouslySetInnerHTML={{
                          __html: msg.text.replace(
                            /\*\*(.*?)\*\*/g,
                            "<strong>$1</strong>",
                          ),
                        }}
                      />
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="ai-bubble bot loading">
                      Gemini is thinking...
                    </div>
                  )}
                </div>

                <form onSubmit={handleAiChatSubmit} className="ai-chat-footer">
                  <input
                    type="text"
                    placeholder="Ask anything about this lecture..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    disabled={aiLoading}
                  />
                  <button type="submit" disabled={aiLoading || !aiInput.trim()}>
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
