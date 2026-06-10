import "./VideoUpload.css";
import React, { useCallback, useEffect, useContext, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import FileDropzone from "./dropzone";
import UserContext from "../context/UserContext";

function VideoUpload() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseThumb, setNewCourseThumb] = useState(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoThumbnail, setVideoThumbnail] = useState(null);

  const { userInfo } = useContext(UserContext);

  // --- 1. FETCH COURSES ON LOAD ---
  useEffect(() => {
    if (userInfo?.id) fetchCourses();
  }, [userInfo]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token"); // Grab token
      const res = await axios.get(
        `https://eduvid-backend-zfkv.onrender.com/api/courses`,
        {
          headers: { Authorization: `Bearer ${token}` }, // Show token
        },
      );
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses", err);
    }
  };

  // --- 2. HANDLE CREATE COURSE (In Modal) ---
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseThumb) {
      toast.warning("Please enter a title and select a thumbnail image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", newCourseTitle);
    formData.append("thumbnail", newCourseThumb);

    const token = localStorage.getItem("token"); // Grab token

    const createcoursepromise = axios.post(
      "https://eduvid-backend-zfkv.onrender.com/api/courses",
      formData,
      {
        headers: { Authorization: `Bearer ${token}` }, // Show token
      },
    );
    toast.promise(createcoursepromise, {
      loading: "Creating course, please wait...",
      success: (res) => {
        // res.data is the Axios response
        setCourses([res.data.data, ...courses]);
        setSelectedCourseId(res.data.data.id);
        setShowModal(false);
        setNewCourseTitle("");
        setNewCourseThumb(null);
        return "New Course Created!";
      },
      error: (err) => {
        return err.response?.data?.message || "Error creating course";
      },
    });
  };

  // --- 3. HANDLE VIDEO UPLOAD ---
  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.warning("Please select a video file.");
    if (!selectedCourseId)
      return toast.warning("Please click on a Course box above to select it.");

    // NEW CODE (Text first, File last)
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("courseId", selectedCourseId);

    formData.append("video", file);

    if (videoThumbnail) {
      formData.append("thumbnail", videoThumbnail);
    }
    const token = localStorage.getItem("token"); //Grab Token
    const uploadPromise = axios.post(
      "https://eduvid-backend-zfkv.onrender.com/api/upload/finish-upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // Show Token
        },
      },
    );

    toast.promise(uploadPromise, {
      loading: "Uploading video and thumbnail... Please wait.",
      success: (res) => {
        // Reset Video Form after successful upload
        setFile(null);
        setFileName("");
        setTitle("");
        setDescription("");
        setVideoThumbnail(null);
        if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
        setVideoPreviewUrl("");
        return "Video uploaded successfully!";
      },
      error: "Upload failed.",
    });
  };

  // --- HELPERS ---
  const handleFileDrop = useCallback((droppedFile) => {
    setFile(droppedFile);
    setFileName(droppedFile.name);
    setVideoPreviewUrl(URL.createObjectURL(droppedFile));
  }, []);

  const handleRemoveFile = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setFile(null);
    setFileName("");
    setVideoPreviewUrl("");
  };

  return (
    <div className="upload-page-wrapper">
      <h2 className="upheading">Select a Course</h2>

      {/* --- GRID OF COURSES --- */}
      <div className="course-grid">
        {/* List of Existing Courses */}
        {courses.map((course) => (
          <div
            key={course.id}
            className={`course-card ${selectedCourseId === course.id ? "active" : ""}`}
            onClick={() => setSelectedCourseId(course.id)}
          >
            <img src={course.thumbnail_url} alt="thumb" className="card-img" />
            <div className="card-title">{course.title}</div>
            {/* {selectedCourseId === course.id && <div className="selected-badge">✔</div>} */}
          </div>
        ))}

        {/* The "Create New" Box (First Item) */}
        <div className="course-card add-new" onClick={() => setShowModal(true)}>
          <div className="plus-icon">+</div>
          <p>Create New Course</p>
        </div>
      </div>

      {/* --- MODAL POPUP --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Create New Course</h3>
            <input
              type="text"
              placeholder="Course Name"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              className="modal-input"
            />
            <label>Course Thumbnail:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewCourseThumb(e.target.files[0])}
              className="modal-input"
            />
            <div className="modal-buttons">
              <button
                onClick={() => setShowModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button onClick={handleCreateCourse} className="create-btn">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <hr className="divider" />

      <h2 className="upheading">Fill Video Details</h2>

      {/* --- VIDEO FORM (Only enables if course is selected) --- */}
      <div className={`uploadForm ${!selectedCourseId ? "dimmed" : ""}`}>
        <form onSubmit={handleVideoUpload}>
          <div className="fillInfo">
            <div className="info">
              <div className="title">
                <label>Video Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="titleInputBox"
                />
              </div>
              <div className="description">
                <label>Description:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="desInputBox"
                  maxLength={150} /* 👉 Stops them from typing past 150! */
                />
                {/* 👉 The Live Counter */}
                <div className="char-counter">
                  <span
                    style={{
                      color: description.length >= 150 ? "red" : "#6c757d",
                    }}
                  >
                    {description.length}
                  </span>
                  /150 characters
                </div>
              </div>
            </div>
            {/*3: The HTML Input for the Video Thumbnail */}
            <div className="thumbnail-upload" style={{ marginTop: "15px" }}>
              <label>
                Video Thumbnail:
                <br />
                <span
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    fontWeight: "normal",
                  }}
                >
                  Recommended: 16:9 shape(1280x720)
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setVideoThumbnail(e.target.files[0])}
                className="titleInputBox"
              />
            </div>
            <div className="dropbox">
              <FileDropzone
                onFileDropped={handleFileDrop}
                videoPreviewUrl={videoPreviewUrl}
              />
            </div>
          </div>

          <div className="submit">
            <button
              className="remove-btn"
              type="button"
              onClick={handleRemoveFile}
            >
              Remove Video
            </button>
            <button
              className="upload-btn"
              type="submit"
              disabled={!selectedCourseId}
            >
              {selectedCourseId ? "Upload Video" : "Select Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VideoUpload;
