import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";
import UserContext from "../context/UserContext";
import "./courses.css";

function Courses() {
  const { userInfo } = useContext(UserContext);
  const isValidUser =
    userInfo &&
    Object.keys(userInfo).length > 0 &&
    userInfo.username !== "Guest User";
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👉 NEW: State to track which video is currently playing
  const [playingVideo, setPlayingVideo] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");

  const selectedCourse = courses.find(
    (c) => c.id.toString() === selectedCourseId,
  );

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
        return; // <--- This 'return' completely stops the function right here!
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
      const res = await axios.get("http://localhost:5000/api/courses/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        `http://localhost:5000/api/upload/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("🕵️ REACT SPY - DATA FROM BACKEND:", res.data);
      setVideos(res.data);
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

          {/* 👉 NEW: Square Video Grid */}
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
                    <div className="video-card-icon">
                      <i className="fa-solid fa-play"></i>
                    </div>
                    <div className="video-card-info">
                      <h4>
                        {index + 1}. {video.title}
                      </h4>
                      <p>{video.description}</p>
                    </div>
                    {/* 👉 NEW: onClick to trigger the video player */}
                    <button
                      className="video-play-btn"
                      onClick={() => setPlayingVideo(video)}
                    >
                      Play Video
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* --- VIEW 3: THE CINEMATIC VIDEO PLAYER MODAL --- */}
      {playingVideo && (
        <div className="video-player-overlay">
          <div className="video-player-container">
            <div className="player-header">
              <h3>{playingVideo.title}</h3>
              <button
                className="close-player-btn"
                onClick={() => setPlayingVideo(null)}
              >
                ✖ Close
              </button>
            </div>

            {/* The actual HTML5 Video Player */}
            <video
              controls
              autoPlay
              className="actual-video-element"
              src={playingVideo.video_url}
            >
              Your browser does not support HTML video.
            </video>
          </div>
        </div>
      )}
    </div>
  );
}

export default Courses;
