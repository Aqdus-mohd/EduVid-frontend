import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";
import UserContext from "../context/UserContext";
import "./courses.css";
import toast from "react-hot-toast";

function MyCourses() {
  const { userInfo } = useContext(UserContext);

  const isTeacher = userInfo && userInfo.role === "teacher";

  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get("course");

  const [activeMenuId, setActiveMenuId] = useState(null);
  //state for deleting
  const [videoToDelete, setVideoToDelete] = useState(null);
  // State for the editing modal
  const [videoToUpdate, setVideoToUpdate] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editThumbnailUrl, setEditThumbnailUrl] = useState("");

  const selectedCourse = courses.find(
    (c) => c.id.toString() === selectedCourseId,
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
        },
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

  // 1. Show Loading Text while API runs
  if (loading)
    return <div className="loading-text">Loading your dashboard...</div>;

  // 2. 🛑 ACCESS DENIED VIEW: If a student tries to hack or type the URL manually
  if (!isTeacher) {
    return (
      <div
        className="courses-page-wrapper"
        style={{ textAlign: "center", marginTop: "100px" }}
      >
        <h2 style={{ color: "#ff4d4d" }}>🔒 Access Denied</h2>
        <p style={{ fontSize: "18px", color: "#32396e" }}>
          This area is restricted to instructors only. Please log in with a
          Teacher account to manage your contents.
        </p>
        <Link
          to="/Login"
          className="video-play-btn"
          style={{
            display: "inline-block",
            textDecoration: "none",
            marginTop: "15px",
          }}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const toggleMenu = (e, videoId) => {
    e.stopPropagation(); // Prevents clicking the dots from playing the video!
    setActiveMenuId(activeMenuId === videoId ? null : videoId);
  };
  //DELETE
  // 1. Frontend Delete
  const handleDeleteClick = (e, videoId) => {
    e.stopPropagation(); // Stops video player from opening
    setVideoToDelete(videoId); // Triggers the modal to open
    setActiveMenuId(null); // Closes the three-dot dropdown menu
  };

  // 2. This function executes the real API call when you click "Delete" inside the modal
  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://eduvid-backend-zfkv.onrender.com/api/upload/${videoToDelete}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Refresh your videos list instantly on screen after deleting
      setVideos(videos.filter((video) => video.id !== videoToDelete));
      toast.success("Video deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete video.");
    } finally {
      setVideoToDelete(null); // Closes the modal smoothly at the end
    }
  };
  //EDIT
  // 1. Opens the Edit Modal and clears input fields
  const handleUpdateClick = (e, video) => {
    e.stopPropagation(); // Stops video player from opening
    setVideoToUpdate(video);
    setEditTitle("");
    setEditDescription("");
    setEditThumbnailUrl("");
    setActiveMenuId(null); // Closes the three-dot menu
  };

  // 2. Sends the updated fields to your backend
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!videoToUpdate) return;

    //  If a field is empty, use the original data so it remains unchanged!
    const updatedData = {
      title: editTitle.trim() !== "" ? editTitle.trim() : videoToUpdate.title,
      description: editDescription.trim() !== "" ? editDescription.trim() : videoToUpdate.description,
      thumbnail_url: editThumbnailUrl.trim() !== "" ? editThumbnailUrl.trim() : videoToUpdate.thumbnail_url,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://eduvid-backend-zfkv.onrender.com/api/upload/${videoToUpdate.id}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh frontend state list instantly with updated values
      setVideos(
        videos.map((v) => (v.id === videoToUpdate.id ? { ...v, ...updatedData } : v))
      );
      
      toast.success("Video updated successfully!");
      setVideoToUpdate(null); // Close Modal
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update video.");
    }
  };

  // 3. ✅ TEACHER AREA (Only authorized teachers reach this line)
  return (
    <div className="courses-page-wrapper">
      {/* --- VIEW 1: LIST MY PRIVATE COURSES --- */}
      {!selectedCourse ? (
        <>
          <h2 className="courses-heading">My Uploaded Courses</h2>
          <div className="public-course-grid">
            {courses.length === 0 ? (
              <p>
                You haven't created any courses yet! Use the Upload tab to add
                your first course.
              </p>
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
                  {/* 🚨 THE SECURE THREE-DOT MENU (ONLY TEACHERS SEE THIS) 🚨 */}
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
                          {/* Video Title */}
                          <h4
                            className="video-title clickable-title"
                            onClick={() => setPlayingVideo(video)}
                            title={video.title}
                            // Leaves clean space for the dots
                          >
                            {index + 1}. {video.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        className="three-dots-btn"
                        onClick={(e) => toggleMenu(e, video.id)}
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {/* The Dropdown Options Box */}
                      {activeMenuId === video.id && (
                        <div className="dropdown-options-menu">
                          <div
                            className="dropdown-item edit-opt"
                            onClick={(e) => handleUpdateClick(e, video)}
                          >
                            <i className="fa-solid fa-pen"></i> Edit
                          </div>
                          <div
                            className="dropdown-item delete-opt"
                            onClick={(e) => handleDeleteClick(e, video.id)}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                <p
                  style={{
                    margin: 0,
                    lineHeight: "1.6",
                    color: "#eee",
                    wordWrap: "break-word",
                  }}
                >
                  {playingVideo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* delete modal */}
      {videoToDelete && (
        <div
          className="modal-blur-overlay"
          onClick={() => setVideoToDelete(null)}
        >
          <div
            className="custom-confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-warn-icon">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3>Are you sure?</h3>
            <p>
              Do you really want to delete this video? This action cannot be
              undone.
            </p>
            <div className="modal-buttons-row">
              <button
                className="modal-btn-cancel"
                onClick={() => setVideoToDelete(null)}
              >
                Cancel
              </button>
              <button className="modal-btn-danger" onClick={confirmDeleteVideo}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/*  EDIT / UPDATE MODAL*/}
      {videoToUpdate && (
        <div className="modal-blur-overlay" onClick={() => setVideoToUpdate(null)}>
          <div className="custom-edit-box" onClick={(e) => e.stopPropagation()}>
            
            <div className="edit-modal-header">
              <h3>⚙️ Edit Video Details</h3>
              <button className="edit-modal-close" onClick={() => setVideoToUpdate(null)}>✖</button>
            </div>

            {/* Clear Requirement Note */}
            <div className="edit-modal-note">
              📌 <strong>Note:</strong> Leave a field completely empty if you want it to remain unchanged.
            </div>

            <form onSubmit={handleEditSubmit} className="edit-modal-form">
              <div className="form-group-edit">
                <label>New Video Title</label>
                <input
                  type="text"
                  placeholder={`Current: ${videoToUpdate.title}`}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="form-group-edit">
                <label>New Thumbnail URL</label>
                <input
                  type="text"
                  placeholder="Paste new image URL link here..."
                  value={editThumbnailUrl}
                  onChange={(e) => setEditThumbnailUrl(e.target.value)}
                />
              </div>

              <div className="form-group-edit">
                <label>New Description</label>
                <textarea
                  rows="4"
                  placeholder="Type new video description text..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="edit-modal-actions">
                <button type="button" className="edit-btn-cancel" onClick={() => setVideoToUpdate(null)}>
                  Cancel
                </button>
                <button type="submit" className="edit-btn-save">
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      //END
    </div>
  );
}

export default MyCourses;
