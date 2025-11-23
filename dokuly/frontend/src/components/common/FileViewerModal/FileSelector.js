import React, { useState, useEffect } from "react";
import { getFilesForEntity } from "../filesTable/functions/queries";
import { toast } from "react-toastify";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";

export default function FileSelector({
  app,
  revisionEntityId,
  currentFileName,
  currentDisplayName,
  currentFileExtension,
  onFileSelect,
}) {
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Helper function to extract filename from path
  const getFileNameFromPath = (path) => {
    if (!path) return "";
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  useEffect(() => {
    if (app && revisionEntityId) {
      setLoading(true);
      getFilesForEntity(app, revisionEntityId)
        .then((fileList) => {
          console.log("Files fetched for revision:", fileList);
          console.log("Current file extension:", currentFileExtension);
          console.log("Current file name:", currentFileName);
          console.log("Current display name:", currentDisplayName);
          
          // Extract just the filename from currentFileName if it's a path
          const getFileNameFromPath = (path) => {
            if (!path) return "";
            // Handle both forward and backslash paths
            const parts = path.split(/[/\\]/);
            return parts[parts.length - 1];
          };
          
          const currentFileNameOnly = getFileNameFromPath(currentFileName);
          const currentFileExtFromPath = currentFileNameOnly.split(".").pop().toLowerCase();
          
          // Filter files by same extension/type
          // Note: We'll show files with valid IDs, but also try to match by extension even if file_name is missing
          const filteredFiles = fileList.filter((file) => {
            const fileId = file.file_id || file.id;
            const isValidFileId = fileId && fileId !== -1;
            
            // Skip placeholder files (file_id: -1) unless we can't determine extension and want to show all
            // But first, let's try to match by extension
            // Handle different file structures (pcbas have special files with different structure)
            let fileName = file.file_name || "";
            
            // If file_name is empty, try to extract from view_uri or uri
            if (!fileName && (file.view_uri || file.uri)) {
              const uri = file.view_uri || file.uri;
              // Try to extract filename from URI (e.g., "api/files/view/123/" -> we need to fetch or use title)
              // For now, we'll use the title as a fallback and check the type
              fileName = file.title || "";
            }
            
            // Extract extension from file_name
            let fileExt = "";
            if (fileName?.includes(".")) {
              fileExt = fileName.split(".").pop().toLowerCase();
            }
            
            // If still no extension and we have a valid file_id, we might need to fetch the file info
            // But for now, let's be more lenient - if file_id is valid and file_name is empty,
            // we'll include it if the type suggests it might be the right file type
            // OR if we can't determine, we'll show all files and let the user choose
            
            // Check if this might be a PDF based on type or other hints
            const mightBePdf = file.type === "Generic" || 
                              file.title?.toLowerCase().includes("pdf") ||
                              file.title?.toLowerCase().includes("drawing") ||
                              (file.file_id && file.file_id !== -1) ||
                              (file.id && file.id !== -1);
            
            // If file_name is empty but we have a valid file_id, include it for PDFs
            // The user can then select it and we'll handle it
            if (!fileExt && mightBePdf && currentFileExtension.toLowerCase() === "pdf") {
              // Include files with valid IDs even if we can't determine extension
              // This handles cases where the backend doesn't return file_name
              fileExt = "pdf"; // Assume PDF if we can't determine
            }
            
            // Match extension (case insensitive)
            const matchesExtension = fileExt === currentFileExtension.toLowerCase() || 
                                   fileExt === currentFileExtFromPath;
            const notArchived = !file.is_archived && file.archived !== 1 && file.archived !== true;
            
            console.log("File:", {
              file_id: file.file_id || file.id,
              fileName,
              fileExt,
              currentFileExtension,
              currentFileExtFromPath,
              matchesExtension,
              isArchived: file.is_archived,
              archived: file.archived,
              notArchived,
              isValidFileId,
              title: file.title,
              display_name: file.display_name,
              type: file.type,
            });
            
            // For files with empty file_name, we need to be more lenient
            // If file_id is -1, it's likely a placeholder/special file without actual content - skip it
            if (!isValidFileId) {
              return false; // Skip placeholder files
            }
            
            // If we can't determine extension but file_id is valid, include it for PDFs
            // This handles cases where the backend doesn't return file_name but the file exists
            if (!fileExt && isValidFileId && currentFileExtension.toLowerCase() === "pdf") {
              // Include valid files when looking for PDFs, even if extension can't be determined
              return notArchived;
            }
            
            // Otherwise, require matching extension
            return matchesExtension && notArchived;
          });

          console.log("Filtered files:", filteredFiles);
          console.log("Filtered count:", filteredFiles.length);
          
          // If no files match by extension but we have files with valid IDs,
          // show all non-archived files with valid IDs and let user choose (they might have same type)
          if (filteredFiles.length === 0 && fileList.length > 0) {
            const allValidFiles = fileList.filter((file) => {
              const fileId = file.file_id || file.id;
              const hasValidFileId = fileId && fileId !== -1;
              const notArchived = !file.is_archived && file.archived !== 1 && file.archived !== true;
              return hasValidFileId && notArchived;
            });
            
            if (allValidFiles.length > 0) {
              console.log("No files matched by extension, showing all valid files:", allValidFiles);
              console.warn("Note: Files shown may not match the current file type. Please verify before comparing.");
              setFiles(allValidFiles);
              setLoading(false);
              return;
            }
            console.warn("No valid files found in this revision. The revision may not have any files attached, or files may be stored differently.");
          }

          // Sort files: try to match by display_name first, then file_name
          const sortedFiles = [...filteredFiles].sort((a, b) => {
            const aDisplayMatch = (a.display_name || a.title) === currentDisplayName ? 1 : 0;
            const bDisplayMatch = (b.display_name || b.title) === currentDisplayName ? 1 : 0;
            if (aDisplayMatch !== bDisplayMatch) return bDisplayMatch - aDisplayMatch;

            const aFileNameMatch = (a.file_name || a.title) === currentFileName ? 1 : 0;
            const bFileNameMatch = (b.file_name || b.title) === currentFileName ? 1 : 0;
            return bFileNameMatch - aFileNameMatch;
          });

          setFiles(sortedFiles);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching files:", error);
          console.error("Error details:", {
            app,
            revisionEntityId,
            error: error?.response?.data || error?.message,
          });
          toast.error("Failed to load files for selected revision.");
          setLoading(false);
        });
    }
  }, [app, revisionEntityId, currentFileName, currentDisplayName, currentFileExtension]);

  const handleFileSelect = (fileId) => {
    setSelectedFileId(fileId);
    if (fileId && onFileSelect) {
      const selectedFile = files.find((f) => {
        const fId = f.file_id || f.id;
        return fId === fileId;
      });
      if (selectedFile) {
        // Check if file is valid before selecting
        const isValidFile = (selectedFile.file_id && selectedFile.file_id !== -1) || (selectedFile.id && selectedFile.id !== -1);
        if (!isValidFile) {
          console.warn("Selected file is a placeholder without actual file content:", selectedFile);
          return;
        }
        onFileSelect(selectedFile);
      }
    }
  };
  
  // Format files for dropdown
  const fileOptions = files.map((file) => {
    const fileId = file.file_id || file.id;
    const displayName = file.display_name || file.title || "";
    const fileName = file.file_name || "";
    const fileNameOnly = getFileNameFromPath(fileName);
    
    // Use display name, or filename (without path), or fallback
    const label = displayName || fileNameOnly || `File ${fileId}`;
    
    // Check if this file matches the current file (by display name or filename)
    const currentFileNameOnly = getFileNameFromPath(currentFileName);
    const isMatch = displayName === currentDisplayName || fileNameOnly === currentFileNameOnly;
    
    return {
      label: isMatch ? `${label} ✓` : label,
      value: fileId,
    };
  });

  if (loading) {
    return <div style={{ fontSize: "12px", color: "#666" }}>Loading files...</div>;
  }

  if (files.length === 0) {
    return (
      <div style={{ fontSize: "12px", color: "#666" }}>
        No matching files found in this revision (same file type required).
      </div>
    );
  }

  return (
    <div>
      <GenericDropdownSelector
        state={selectedFileId}
        setState={handleFileSelect}
        dropdownValues={fileOptions.length > 0 ? fileOptions : [
          { 
            label: "No files available", 
            value: null,
            isDisabled: true
          }
        ]}
        placeholder="Select file to compare"
        borderIfPlaceholder={true}
        textSize="12px"
      />
    </div>
  );
}

