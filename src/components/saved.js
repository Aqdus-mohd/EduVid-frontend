import React, { useState, useEffect } from "react";
import axios from "axios";
import "./courses.css"; // Reuse your existing premium course dashboard styling!

function SavedVideos() {
  const [savedVideos, setSavedVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedVideos();
  }, []);

  const fetchSavedVideos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://eduvid-backend-zfkv.onrender.com/api/upload/saved-videos-details", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedVideos(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading saved files data:", err);
      setLoading(false);
    }
  };

  const handleUnsaveToggle = async (e, videoId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`https://eduvid-backend-zfkv.onrender.com/api/upload/save/${videoId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Instantly remove it from the page list array so the screen updates cleanly
      setSavedVideos((prev) => prev.filter((video) => video.id !== videoId));
    } catch (err) {
      console.error("Error unsaving file context:", err);
    }
  };

  if (loading) return <div className="loading-text">Loading your bookmarks...</div>;

  return (
    <div className="courses-page-wrapper">
      <h2 className="courses-heading">🔖 Your Saved Lectures</h2>
      
      {savedVideos.length === 0 ? (
        <div style={{ padding: "40px", background: "white", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: "#666", margin: 0 }}>You haven't bookmarked any lecture videos yet.</p>
        </div>
      ) : (
        <div className="video-grid">
          {savedVideos.map((video, index) => (
            <div key={video.id} className="video-card">
              
              {/* Dynamic Option Header Box */}
              <div className="menu-container" style={{ padding: "16px 20px 0 20px", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                  <h4 className="video-title" title={video.title} style={{ margin: 0, fontSize: "1rem" }}>
                    {index + 1}. {video.title}
                  </h4>
                  <button 
                    onClick={(e) => handleUnsaveToggle(e, video.id)}
                    style={{ background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600" }}
                    title="Remove Bookmark"
                  >
                    <i className="fa-solid fa-bookmark-slash"></i> Unsave
                  </button>
                </div>
              </div>

              {/* Course Video Thumbnail Asset Frame wrapper layout */}
              <div className="video-thumbnail-container" style={{ marginTop: "10px" }}>
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="video-thumbnail" />
                ) : (
                  <div className="video-thumbnail-fallback">
                    <i className="fa-solid fa-video"></i>
                  </div>
                )}
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedVideos;