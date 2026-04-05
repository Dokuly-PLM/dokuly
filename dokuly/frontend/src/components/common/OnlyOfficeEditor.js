import axios from "axios";
import { tokenConfig } from "../../configs/auth";
import { toast } from "react-toastify";

/**
 * Opens the OnlyOffice editor for a file in a new browser tab.
 * Fetches the editor config from the backend, then opens a standalone
 * HTML page that loads the OnlyOffice JS API and initializes the editor.
 */
export async function openOnlyOfficeEditor(fileId) {
  try {
    const response = await axios.get(
      `api/files/onlyoffice/config/${fileId}/`,
      tokenConfig()
    );

    const { config, is_read_only, lock_info, ds_url } = response.data;

    // Build a standalone HTML page for the editor
    const editorHtml = buildEditorHtml(config, ds_url, is_read_only, lock_info, fileId);

    // Open in a new tab
    const editorWindow = window.open("", "_blank");
    if (editorWindow) {
      editorWindow.document.write(editorHtml);
      editorWindow.document.close();
    } else {
      toast.error("Pop-up blocked. Please allow pop-ups for this site.");
    }
  } catch (err) {
    console.error("Error opening OnlyOffice editor:", err);
    toast.error(
      err.response?.data?.message ||
        "Failed to open document editor. Ensure OnlyOffice Document Server is running."
    );
  }
}

function buildEditorHtml(config, dsUrl, isReadOnly, lockInfo, fileId) {
  const title = config.document?.title || "Document Editor";
  const configJson = JSON.stringify(config);
  const token = localStorage.getItem("token");

  let statusBarHtml = "";
  if (isReadOnly && lockInfo && !lockInfo.is_owner) {
    statusBarHtml = `<div class="status-bar status-readonly">
      <strong>Read-only</strong> &mdash; currently being edited by ${escapeHtml(lockInfo.locked_by_name)}
      <button onclick="generatePdf()" class="action-btn" id="pdf-btn">Generate PDF</button>
    </div>`;
  } else if (isReadOnly && !lockInfo) {
    statusBarHtml = `<div class="status-bar status-readonly">
      <strong>Read-only</strong> &mdash; this document is released
      <button onclick="generatePdf()" class="action-btn" id="pdf-btn">Generate PDF</button>
    </div>`;
  } else if (!isReadOnly && lockInfo?.is_owner) {
    statusBarHtml = `<div class="status-bar status-editing">
      <span>You are editing this file</span>
      <button onclick="generatePdf()" class="action-btn" id="pdf-btn">Generate PDF</button>
      <button onclick="unlockFile()" class="unlock-btn">Unlock file</button>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Dokuly</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; font-family: Inter, -apple-system, sans-serif; }
    body { display: flex; flex-direction: column; }
    .status-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; font-size: 0.85rem;
      border-bottom: 1px solid #E5E5E5;
    }
    .status-readonly { background-color: #FFF3CD; }
    .status-editing { background-color: #D4EDDA; }
    .action-btn, .unlock-btn {
      padding: 4px 12px;
      border: 1px solid #6c757d; border-radius: 4px;
      background: white; cursor: pointer; font-size: 0.8rem;
      font-weight: 600;
    }
    .action-btn:hover, .unlock-btn:hover { background: #f0f0f0; }
    .action-btn:active, .unlock-btn:active { transform: scale(0.98); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .unlock-btn { margin-left: auto; }
    #editor-container { flex: 1; }
  </style>
</head>
<body>
  ${statusBarHtml}
  <div id="editor-container"></div>

  <script src="${escapeHtml(dsUrl)}/web-apps/apps/api/documents/api.js"></script>
  <script>
    var editorConfig = ${configJson};
    editorConfig.width = "100%";
    editorConfig.height = "100%";
    editorConfig.events = {
      onError: function(event) {
        console.error("OnlyOffice editor error:", event);
      },
      onDocumentStateChange: function(event) {
        if (event.data) {
          document.title = "* ${escapeHtml(title)} - Dokuly";
        } else {
          document.title = "${escapeHtml(title)} - Dokuly";
        }
      }
    };

    if (window.DocsAPI) {
      new DocsAPI.DocEditor("editor-container", editorConfig);
    } else {
      document.getElementById("editor-container").innerHTML =
        '<div style="padding:40px;text-align:center;color:#dc3545;">' +
        'Failed to load OnlyOffice Document Server.<br>' +
        'Please check that the server is running.</div>';
    }

    function generatePdf() {
      var btn = document.getElementById("pdf-btn");
      if (btn) { btn.disabled = true; btn.textContent = "Generating PDF..."; }
      fetch("/api/files/onlyoffice/convert-to-pdf/${fileId}/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Token ${token}"
        },
        body: "{}"
      }).then(function(res) {
        return res.json().then(function(data) {
          if (res.ok) {
            // Notify the document page to refresh
            try {
              var channel = new BroadcastChannel("dokuly_file_updates");
              channel.postMessage({ type: "pdf_generated", fileId: ${fileId} });
              channel.close();
            } catch(e) {}

            if (confirm("PDF generated successfully. Unlock file and close editor?")) {
              unlockFile();
            }
          } else {
            alert("PDF generation failed: " + (data.error || "Unknown error"));
          }
        });
      }).catch(function() {
        alert("PDF generation failed.");
      }).finally(function() {
        if (btn) { btn.disabled = false; btn.textContent = "Generate PDF"; }
      });
    }

    function unlockFile() {
      fetch("/api/files/onlyoffice/unlock/${fileId}/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Token ${token}"
        },
        body: "{}"
      }).then(function(res) {
        if (res.ok) {
          alert("File unlocked.");
          window.close();
        } else {
          alert("Failed to unlock file.");
        }
      }).catch(function() {
        alert("Failed to unlock file.");
      });
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
