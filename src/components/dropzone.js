// src/components/FileDropzone.js
import "./dropzone.css";
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// This component will take your upload function as a prop
function FileDropzone({ onFileDropped, videoPreviewUrl }) {
console.log('3. FileDropzone rendering with URL:', videoPreviewUrl);
  const onDrop = useCallback(acceptedFiles => {
    // 'acceptedFiles' is an array. If you only upload one file:
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // *** THIS IS THE KEY PART ***
      // Call the upload function you passed from the parent
      // with the new file.
      onFileDropped(file);
    }
  }, [onFileDropped]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'video/*' // Only accept video files (optional)
  });

  // These are the props for your div and hidden input
  return (
    <div {...getRootProps({ className: 'dropstyles' })}>
      <input {...getInputProps()} />
      {
        videoPreviewUrl ? (
          <video 
            src={videoPreviewUrl} 
            controls 
            style={{ width: '100%', width: '100%',maxHeight: '210px' }} 
            alt="Video preview" 
          />
        ):isDragActive ? (
          <p>Drop the video here ...</p> ) :
          (<p>Drag 'n' drop a video here, or click to select a file</p>)
      }
    </div>
  );
}

export default FileDropzone;