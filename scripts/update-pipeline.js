const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/components/forms/ServiceWorkflowPipeline.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Smartphone to lucide-react import if not present
if (!content.includes('Smartphone,')) {
  content = content.replace('CreditCard,\n} from "lucide-react";', 'CreditCard,\n  Smartphone,\n} from "lucide-react";');
}

// 2. Import LiveCameraModal if not present
if (!content.includes('import LiveCameraModal')) {
  content = content.replace(
    'import type { ServiceJob, WorkflowStage } from "@/types/service-job";',
    'import type { ServiceJob, WorkflowStage } from "@/types/service-job";\nimport LiveCameraModal from "@/components/LiveCameraModal";'
  );
}

// 3. Add Live Camera state in component body
const stateAnchor = '  // Stage 3: Repair Scope State';
const cameraStateCode = `  // Live Camera & Video Capture State
  const [pipelineCameraOpen, setPipelineCameraOpen] = useState<boolean>(false);
  const [pipelineCameraTarget, setPipelineCameraTarget] = useState<"verification" | "repair">("repair");
  const [pipelineCameraMode, setPipelineCameraMode] = useState<"photo" | "video">("photo");

  const openPipelineCamera = (target: "verification" | "repair", mode: "photo" | "video" = "photo") => {
    setPipelineCameraTarget(target);
    setPipelineCameraMode(mode);
    setPipelineCameraOpen(true);
  };

  const handlePipelineCameraPhoto = (dataUrl: string) => {
    if (pipelineCameraTarget === "verification") {
      setVerificationPhoto(dataUrl);
    } else {
      setProofPhotos((prev) => [...prev, dataUrl]);
    }
  };

  const handlePipelineCameraVideo = (dataUrl: string) => {
    if (pipelineCameraTarget === "verification") {
      setVerificationVideo(dataUrl);
    } else {
      setProofVideo(dataUrl);
    }
  };

  // Stage 3: Repair Scope State`;

if (content.includes(stateAnchor) && !content.includes('pipelineCameraOpen')) {
  content = content.replace(stateAnchor, cameraStateCode);
}

// 4. Update Section 3 proof media buttons
const oldSection3Media = `          {/* Proof Media */}
          <div style={{ marginBottom: "10px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {(stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH") && (
              <>
                <label style={{ padding: "5px 10px", borderRadius: "6px", border: "1px dashed #cbd5e1", background: "#ffffff", fontSize: "11px", fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Upload size={12} />
                  <span>Add Photo</span>
                  <input type="file" accept="image/*" onChange={handleAddProofPhoto} style={{ display: "none" }} />
                </label>

                <label style={{ padding: "5px 10px", borderRadius: "6px", border: "1px dashed #cbd5e1", background: "#ffffff", fontSize: "11px", fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Video size={12} />
                  <span>Add Video</span>
                  <input type="file" accept="video/*" onChange={handleAddProofVideo} style={{ display: "none" }} />
                </label>
              </>
            )}`;

const newSection3Media = `          {/* Proof Media */}
          <div style={{ marginBottom: "12px" }}>
            {(stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH") && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>
                <button
                  type="button"
                  onClick={() => openPipelineCamera("repair", "photo")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1.5px solid #059669",
                    background: "#ecfdf5",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#065f46",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Camera size={13} color="#059669" />
                  <span>📸 Live Camera</span>
                </button>

                <label
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #10b981",
                    background: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#047857",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Snap photo with phone camera"
                >
                  <Smartphone size={13} color="#059669" />
                  <span>📱 Snap Photo</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleAddProofPhoto} style={{ display: "none" }} />
                </label>

                <button
                  type="button"
                  onClick={() => openPipelineCamera("repair", "video")}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1.5px solid #7c3aed",
                    background: "#fdf4ff",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#6b21a8",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Video size={13} color="#7c3aed" />
                  <span>🎥 Live Video</span>
                </button>

                <label
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #8b5cf6",
                    background: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#6d28d9",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Record clip with phone camera"
                >
                  <Film size={13} color="#7c3aed" />
                  <span>📹 Record Clip</span>
                  <input type="file" accept="video/*" capture="environment" onChange={handleAddProofVideo} style={{ display: "none" }} />
                </label>

                <label
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Upload from gallery"
                >
                  <Upload size={12} color="#64748b" />
                  <span>📁 Gallery</span>
                  <input type="file" accept="image/*,video/*" onChange={handleAddProofPhoto} style={{ display: "none" }} />
                </label>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>`;

if (content.includes(oldSection3Media)) {
  content = content.replace(oldSection3Media, newSection3Media);
} else {
  console.log('oldSection3Media not exact match, checking index...');
  const idx = content.indexOf('{/* Proof Media */}');
  const idxEnd = content.indexOf('{proofPhotos.map((photo, i) =>');
  if (idx !== -1 && idxEnd !== -1) {
    content = content.slice(0, idx) + newSection3Media + '\n            ' + content.slice(idxEnd);
    console.log('Replaced Section 3 media using index slice.');
  }
}

// 5. Render LiveCameraModal at bottom before closing tag
const lastClosing = '    </div>\n  );\n}';
const lastClosingCRLF = '    </div>\r\n  );\r\n}';
let endIdx = content.lastIndexOf(lastClosing);
let cLen = lastClosing.length;
if (endIdx === -1) {
  endIdx = content.lastIndexOf(lastClosingCRLF);
  cLen = lastClosingCRLF.length;
}

if (endIdx !== -1 && !content.includes('<LiveCameraModal')) {
  const modalInsert = `      {/* In-App Live Camera Modal for Pipeline */}
      <LiveCameraModal
        isOpen={pipelineCameraOpen}
        onClose={() => setPipelineCameraOpen(false)}
        onCapturePhoto={handlePipelineCameraPhoto}
        onCaptureVideo={handlePipelineCameraVideo}
        defaultMode={pipelineCameraMode}
      />
    </div>
  );
}`;
  content = content.slice(0, endIdx) + modalInsert;
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated ServiceWorkflowPipeline.tsx');
