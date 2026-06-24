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
  // State for the editing modal for videos
  const [videoToUpdate, setVideoToUpdate] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  //states for delete and edit courses
  const [activeMenuCourseId, setActiveMenuCourseId] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [courseToUpdate, setCourseToUpdate] = useState(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");
  const [editCourseThumbFile, setEditCourseThumbFile] = useState(null);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);

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


  const toggleMenu = (e, videoId) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === videoId ? null : videoId);
  };

  
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
//COURSE UPDATE AND DELETE
 // Real API Execution for Deleting a Course
  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://eduvid-backend-zfkv.onrender.com/api/courses/${courseToDelete}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCourses(courses.filter((course) => course.id !== courseToDelete));
      toast.success("Course deleted successfully!");
    } catch (err) {
      console.error("Course delete failed:", err);
      toast.error("Failed to delete course. Remove its videos first!");
    } finally {
      setCourseToDelete(null);
    }
  };

  const handleCourseEditSubmit = async (e) => {
    e.preventDefault();
    if (!courseToUpdate) return;
    if (editCourseTitle.trim() === "") return toast.error("Course Title is required.");

    setIsUpdatingCourse(true);
    const formData = new FormData();
    formData.append("title", editCourseTitle.trim());
    
    if (editCourseThumbFile) {
      formData.append("thumbnail", editCourseThumbFile);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://eduvid-backend-zfkv.onrender.com/api/courses/${courseToUpdate.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const safeThumbnailUrl = res.data?.thumbnail_url || res.data?.data?.thumbnail_url || courseToUpdate.thumbnail_url;

      setCourses(
        courses.map((c) =>
          c.id === courseToUpdate.id
            ? { ...c, title: editCourseTitle.trim(), thumbnail_url: safeThumbnailUrl }
            : c
        )
      );

      toast.success("Course details updated!");
    } catch (err) {
      console.error("Course update failed:", err);
      
      // 🚨 FIXED: Detects if the backend sent raw HTML code (like a 404 page) and cleans it up
      let cleanMessage = "Failed to update course properties.";
      const serverData = err.response?.data;
      
      if (typeof serverData === "string" && serverData.includes("<!DOCTYPE html>")) {
        cleanMessage = "Backend route missing (404). Check your router paths!";
      } else if (serverData?.message) {
        cleanMessage = serverData.message;
      }
      
      toast.error(cleanMessage);
    } finally {
      // 🚨 FIXED: Moving this inside finally forces the modal to close every single time,
      // regardless of whether the network request fails or succeeds!
      setCourseToUpdate(null);
      setIsUpdatingCourse(false);
    }
  };
  //EDIT
  // 1. Opens the Edit Modal and clears input fields
  const handleUpdateClick = (e, video) => {
    e.stopPropagation(); // Stops video player from opening
    setVideoToUpdate(video);
    setEditTitle("");
    setEditDescription("");
    setEditThumbnailFile(null);
    setActiveMenuId(null); // Closes the three-dot menu
  };

  // 2. Sends the updated fields to your backend
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!videoToUpdate) return;
    //loading
    setIsUpdating(true);
    //  Create a FormData container
    const formData = new FormData();

    // If text fields are left blank, append original text values
    formData.append(
      "title",
      editTitle.trim() !== "" ? editTitle.trim() : videoToUpdate.title,
    );
    formData.append(
      "description",
      editDescription.trim() !== ""
        ? editDescription.trim()
        : videoToUpdate.description,
    );

    // Only append a file if the teacher actually selected a new one!
    if (editThumbnailFile) {
      formData.append("thumbnail", editThumbnailFile); // Matches your backend field name
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.put(
        `https://eduvid-backend-zfkv.onrender.com/api/upload/${videoToUpdate.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data", // MANDATORY FOR FILES
          },
        },
      );

      // Assuming your backend returns the final updated video object data (including new image link)
      const updatedVideoData = res.data.video || {
        ...videoToUpdate,//This keeps video_url, course_id, and everything else safe
        id: videoToUpdate.id,
        title: editTitle.trim() !== "" ? editTitle.trim() : videoToUpdate.title,
        description:  editDescription.trim() !== ""  ? editDescription.trim()  : videoToUpdate.description,
        thumbnail_url: res.data.thumbnail_url || videoToUpdate.thumbnail_url,
      };

      setVideos(
        videos.map((v) => (v.id === videoToUpdate.id ? updatedVideoData : v)),
      );
      toast.success("Video updated successfully!");
      setVideoToUpdate(null);
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update video.");
    }
    finally{
      setIsUpdating(false);
    }
  };


  if (loading)
    return <div className="loading-text">Loading your courses...</div>;

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

  // Only authorized teachers reach this line
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
                
                {/* 🚨 CLEAN JSX: All inline styles have been turned into class names! */}
                <div className="public-card-info">
                  <div className="course-header-row">
                    <h3 className="public-card-title">
                      {course.title}
                    </h3>
                    
                    {/* Options dropdown wrapper */}
                    <div className="course-menu-trigger-wrapper">
                      <button
                        className="course-three-dots-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Stops card layout click trigger
                          setActiveMenuCourseId(activeMenuCourseId === course.id ? null : course.id);
                        }}
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {activeMenuCourseId === course.id && (
                        <div className="course-action-dropdown">
                          <div
                            className="course-dropdown-item edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseToUpdate(course);
                              setEditCourseTitle(course.title);
                              setEditCourseThumbFile(null);
                              setActiveMenuCourseId(null);
                            }}
                          >
                            <i className="fa-solid fa-pen"></i> Edit
                          </div>
                          <div
                            className="course-dropdown-item delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseToDelete(course.id);
                              setActiveMenuCourseId(null);
                            }}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="course-manage-btn-text view-btn">Manage Videos ➔</span>
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



      {/* NEW MODALS: COURSE DELETE & UPDATE*/}

      {/* Course Delete Confirmation Modal */}
      {courseToDelete && (
        <div className="modal-blur-overlay" onClick={() => setCourseToDelete(null)}>
          <div className="custom-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-warn-icon">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3>Delete Entire Course?</h3>
            <p>
              Are you sure? This deletes the course framework. Make sure all videos inside are deleted first, or the server will reject this action.
            </p>
            <div className="modal-buttons-row">
              <button className="modal-btn-cancel" onClick={() => setCourseToDelete(null)}>
                Cancel
              </button>
              <button className="modal-btn-danger" onClick={confirmDeleteCourse}>
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Editing Layout Panel Modal */}
      {courseToUpdate && (
        <div className="modal-blur-overlay" onClick={() => setCourseToUpdate(null)}>
          <div className="custom-edit-box" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>⚙️ Edit Course Properties</h3>
              <button className="edit-modal-close" onClick={() => setCourseToUpdate(null)}>
                ✖
              </button>
            </div>

            <form onSubmit={handleCourseEditSubmit} className="edit-modal-form">
              <div className="form-group-edit">
                <label>Course Name</label>
                <input
                  type="text"
                  placeholder="Update Course Name"
                  value={editCourseTitle}
                  onChange={(e) => setEditCourseTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group-edit">
                <label>Change Thumbnail Banner (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditCourseThumbFile(e.target.files[0])}
                />
              </div>

              <div className="edit-modal-actions">
                <button type="button" className="edit-btn-cancel" onClick={() => setCourseToUpdate(null)}>
                  Cancel
                </button>
                <button type="submit" className="edit-btn-save" disabled={isUpdatingCourse}>
                  {isUpdatingCourse ? <span className="btn-spinner"></span> : "Save Course Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/*  EDIT / UPDATE MODAL*/}
      {videoToUpdate && (
        <div
          className="modal-blur-overlay"
          onClick={() => setVideoToUpdate(null)}
        >
          <div className="custom-edit-box" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>⚙️ Edit Video Details</h3>
              <button
                className="edit-modal-close"
                onClick={() => setVideoToUpdate(null)}
              >
                ✖
              </button>
            </div>

            {/* Clear Requirement Note */}
            <div className="edit-modal-note">
              📌 <strong>Note:</strong> Leave a field completely empty if you
              want it to remain unchanged.
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
                <label>New Thumbnail File</label>
                <input
                  type="file"
                  accept="image/*" // Restricts picker to image files only
                  onChange={(e) => setEditThumbnailFile(e.target.files[0])} // Captures raw file binary
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
                <button
                  type="button"
                  className="edit-btn-cancel"
                  onClick={() => setVideoToUpdate(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="edit-btn-save" disabled={isUpdating}>
                  {isUpdating ? <span className="btn-spinner"></span> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCourses;
