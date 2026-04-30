import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import UserContext from "../context/UserContext"; // Make sure this path is correct!
import "./courses.css"; // We can re-use your exact same CSS file!

function MyCourses() {
  const { userInfo } = useContext(UserContext); // 👉 1. Grab the logged-in user

  const [myCourses, setMyCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");
  const selectedCourse = myCourses.find(
    (c) => c.id.toString() === selectedCourseId,
  );

  // 👉 2. Fetch only THIS teacher's courses
  useEffect(() => {
    // Only try to fetch if they are a logged-in teacher
    if (userInfo?.id && userInfo?.role === "teacher") {
      fetchMyCourses(userInfo.id);
    } else {
      setLoading(false); // Stop loading if they aren't a teacher
    }
  }, [userInfo]);

  // Fetch videos when they click a specific course
  useEffect(() => {
    if (selectedCourseId) {
      fetchVideos(selectedCourseId);
    } else {
      setVideos([]);
      setPlayingVideo(null);
    }
  }, [selectedCourseId]);

  const fetchMyCourses = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // We send the userId to the backend so it only returns THEIR courses
      const res = await axios.get(
        `http://localhost:5000/api/courses?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMyCourses(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching my courses:", err);
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

  // ==========================================
  // 🛑 SECURITY GATEWAY (STUDENTS STOP HERE)
  // ==========================================
  if (!userInfo || userInfo.role !== "teacher") {
    return (
      <div
        className="courses-page-wrapper"
        style={{ textAlign: "center", marginTop: "100px" }}
      >
        <h2 style={{ color: "#ff4d4d" }}>Access Denied</h2>
        <p style={{ fontSize: "18px", color: "#32396e" }}>
          This page is for instructors only. Please log in as a Teacher to
          manage your courses.
        </p>
      </div>
    );
  }

  if (loading)
    return <div className="loading-text">Loading your courses...</div>;

  // ==========================================
  // ✅ TEACHER DASHBOARD (TEACHERS SEE THIS)
  // ==========================================
  return (
    <div className="courses-page-wrapper">
      {/* --- VIEW 1: LIST MY COURSES --- */}
      {!selectedCourse ? (
        <>
          <h2 className="courses-heading">My Uploaded Courses</h2>
          <div className="public-course-grid">
            {myCourses.length === 0 ? (
              <p>
                You haven't uploaded any courses yet! Go to the upload page to
                create one.
              </p>
            ) : null}

            {myCourses.map((course) => (
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
        /* --- VIEW 2: LIST VIDEOS FOR SELECTED COURSE --- */
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

          <h3 className="videos-heading">Course Videos ({videos.length})</h3>

          {/* Square Video Grid */}
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

export default MyCourses;
