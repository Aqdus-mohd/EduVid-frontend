import React, { useState, useEffect } from "react";
import axios from "axios";
import "./courses.css"; 
import "./saved.css";   

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
      setSavedVideos((prev) => prev.filter((video) => video.id !== videoId));
    } catch (err) {
      console.error("Error unsaving file context:", err);
    }
  };

  if (loading) return <div className="loading-text">Loading your bookmarks...</div>;

  return (
    <div className="courses-page-wrapper">
      <h2 className="courses-heading">Your Saved Lectures</h2>
      
      {savedVideos.length === 0 ? (
        <div className="no-saved-box">
          <p className="no-saved-text">You haven't bookmarked any lecture videos yet.</p>
        </div>
      ) : (
        <div className="video-grid">
          {savedVideos.map((video, index) => (
            <div key={video.id} className="video-card">
              
              <div className="menu-container saved-menu-container">
                <div className="saved-header-layout">
                  <h4 className="video-title saved-video-title" title={video.title}>
                    {index + 1}. {video.title}
                  </h4>
                  <button 
                    onClick={(e) => handleUnsaveToggle(e, video.id)}
                    className="unsave-action-btn"
                    title="Remove Bookmark"
                  >
                    <i className="fa-solid fa-bookmark-slash"></i> Unsave
                  </button>
                </div>
              </div>

              <div className="video-thumbnail-container saved-thumbnail-spacer">
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