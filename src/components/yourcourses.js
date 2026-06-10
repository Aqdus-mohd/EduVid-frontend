import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";
import UserContext from "../context/UserContext";
import "./courses.css"; 

function MyCourses() {
  const { userInfo } = useContext(UserContext);
  
  const isTeacher = userInfo && userInfo.role === "teacher";

  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");

  const selectedCourse = courses.find(
    (c) => c.id.toString() === selectedCourseId
  );

 
  useEffect(() => {
    if (userInfo?.id && isTeacher) {
      fetchMyCourses(userInfo.id);
    } else {
      setLoading(false); // Stop loading animation if security fails
    }
  }, [userInfo, isTeacher]);

  // Fetch videos when a course is clicked
  useEffect(() => {
    if (selectedCourseId && isTeacher) {
      fetchVideos(selectedCourseId);
    } else {
      setVideos([]);
      setPlayingVideo(null);
    }
  }, [selectedCourseId, isTeacher]);

  // API Call: Get courses belonging to the specific teacher ID
  const fetchMyCourses = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `https://eduvid-backend-zfkv.onrender.com/api/courses?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCourses(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching my courses:", err);
      setLoading(false);
    }
  };

  // API Call: Get videos for the selected course
  const fetchVideos = async (courseId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `https://eduvid-backend-zfkv.onrender.com/api/upload/course/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setVideos(res.data);
    } catch (err) {
      console.error("Error fetching videos:", err);
    }
  };

  const handleCourseClick = (course) => {
    setSearchParams({ course: course.id });
  };

  const handleBackClick = () => {
    setSearchParams({});
    setPlayingVideo(null);
  };

  // 1. Show Loading Text while API runs
  if (loading) return <div className="loading-text">Loading your dashboard...</div>;

  // 2. 🛑 ACCESS DENIED VIEW: If a student tries to hack or type the URL manually
  if (!isTeacher) {
    return (
      <div className="courses-page-wrapper" style={{ textAlign: "center", marginTop: "100px" }}>
        <h2 style={{ color: "#ff4d4d" }}>🔒 Access Denied</h2>
        <p style={{ fontSize: "18px", color: "#32396e" }}>
          This area is restricted to instructors only. Please log in with a Teacher account to manage your contents.
        </p>
        <Link to="/Login" className="video-play-btn" style={{ display: "inline-block", textDecoration: "none", marginTop: "15px" }}>
          Go to Login
        </Link>
      </div>
    );
  }

  // 3. ✅ TEACHER AREA (Only authorized teachers reach this line)
  return (
    <div className="courses-page-wrapper">
      
      {/* --- VIEW 1: LIST MY PRIVATE COURSES --- */}
      {!selectedCourse ? (
        <>
          <h2 className="courses-heading">My Uploaded Courses</h2>
          <div className="public-course-grid">
            {courses.length === 0 ? (
              <p>You haven't created any courses yet! Use the Upload tab to add your first course.</p>
            ) : null}

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
                  <span className="view-btn">Manage Videos ➔</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* --- VIEW 2: LIST VIDEOS INSIDE THE SELECTED COURSE --- */
        <div className="course-detail-view">
          <button className="back-btn" onClick={handleBackClick}>
            ⬅ Back to My Courses
          </button>

          <div className="course-detail-header">
            <img
              src={selectedCourse.thumbnail_url}
              alt="thumb"
              className="detail-thumb"
            />
            <h2 className="detail-title">{selectedCourse.title}</h2>
          </div>

          <h3 className="videos-heading">Uploaded Videos ({videos.length})</h3>

          <div className="video-grid">
            {videos.length === 0 ? (
              <p>No videos inside this course yet.</p>
            ) : (
              videos.map((video, index) => (
                <div key={video.id} className="video-card">
                  
                  {/* Thumbnail Container */}
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

                  {/* Video Title */}
                  <div className="video-card-info">
                    <h4
                      className="video-title clickable-title"
                      onClick={() => setPlayingVideo(video)}
                      title={video.title}
                    >
                      {index + 1}. {video.title}
                    </h4>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- VIEW 3: CINEMATIC VIDEO PLAYER MODAL (WITH DESCRIPTION FIX) --- */}
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

            <video
              controls
              autoPlay
              className="actual-video-element"
              src={playingVideo.video_url}
            >
              Your browser does not support HTML video.
            </video>

            {/* Description displays inside player modal box cleanly */}
            {playingVideo.description && (
              <div
                className="player-description-box"
                style={{
                  padding: "20px",
                  color: "white",
                  backgroundColor: "#111",
                  height: "auto",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0", color: "#ccc" }}>
                  About this video
                </h4>
                <p style={{ margin: 0, lineHeight: "1.6", color: "#eee", wordWrap: "break-word" }}>
                  {playingVideo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCourses;