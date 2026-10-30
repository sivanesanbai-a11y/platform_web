const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/app/workshop/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Make sure queue card clicks also setMobileView('workbench')
content = content.replace(
  /onClick=\{\(\) => setSelectedJobId\(String\(j\.id \|\| j\.jobNo\)\)\}/g,
  'onClick={() => { setSelectedJobId(String(j.id || j.jobNo)); setMobileView("workbench"); }}'
);

// 2. Replace the repair proof section
const startTag = '{/* Proof Photos & Video */}';
const endTag = '{/* Submit Buttons */}';
const idx1 = content.indexOf(startTag);
const idx2 = content.indexOf(endTag);

if (idx1 === -1 || idx2 === -1) {
  console.error('Could not find start or end tags for proof section!');
  process.exit(1);
}

const newProofSection = `{/* Proof Photos & Video */}
                  <div style={{ marginBottom: "16px", background: "#ffffff", border: "1.5px solid #a7f3d0", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 850, color: "#065f46" }}>
                        📸 Repair Proof Media (Live Camera / Video & Snapshots):
                      </label>
                      <span style={{ fontSize: "10.5px", color: "#059669", fontWeight: 700 }}>
                        {repairPhotos.length} photo(s) • {repairVideo ? "1 video" : "0 video"}
                      </span>
                    </div>

                    {/* Camera Control Action Buttons */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginBottom: "12px" }}>
                      <button
                        type="button"
                        onClick={() => openLiveCamera("repair", "photo")}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1.5px solid #059669",
                          background: "#ecfdf5",
                          color: "#065f46",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 2px 4px rgba(5, 150, 105, 0.1)",
                        }}
                      >
                        <Camera size={16} color="#059669" />
                        <span>📸 Live Camera</span>
                      </button>

                      <label
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #10b981",
                          background: "#ffffff",
                          color: "#047857",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                        title="Direct 1-tap snap using phone camera"
                      >
                        <Smartphone size={15} color="#059669" />
                        <span>📱 Phone Snap</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(e, "repair")}
                          style={{ display: "none" }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => openLiveCamera("repair", "video")}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1.5px solid #7c3aed",
                          background: "#fdf4ff",
                          color: "#6b21a8",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 2px 4px rgba(124, 58, 237, 0.1)",
                        }}
                      >
                        <Video size={16} color="#7c3aed" />
                        <span>🎥 Live Video</span>
                      </button>

                      <label
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #8b5cf6",
                          background: "#ffffff",
                          color: "#6d28d9",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                        title="Record 1-tap video using phone camera"
                      >
                        <Film size={15} color="#7c3aed" />
                        <span>📹 Record Clip</span>
                        <input
                          type="file"
                          accept="video/*"
                          capture="environment"
                          onChange={(e) => handleVideoUpload(e, "repair")}
                          style={{ display: "none" }}
                        />
                      </label>

                      <label
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          background: "#f8fafc",
                          color: "#475569",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                        title="Select file from gallery"
                      >
                        <Upload size={14} color="#64748b" />
                        <span>📁 Gallery</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]?.type.startsWith('video/')) {
                              handleVideoUpload(e, 'repair');
                            } else {
                              handlePhotoUpload(e, 'repair');
                            }
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {/* Attached Photo Thumbnails */}
                    {repairPhotos.length > 0 && (
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>
                          Captured Photos ({repairPhotos.length}):
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                          {repairPhotos.map((photo, i) => (
                            <div key={i} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #10b981", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                              <img src={photo} alt="Repair Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <button
                                type="button"
                                onClick={() => setRepairPhotos((p) => p.filter((_, idx) => idx !== i))}
                                title="Remove photo"
                                style={{ position: "absolute", top: "3px", right: "3px", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", display: "grid", placeItems: "center" }}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Video Player */}
                    {repairVideo && (
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b21a8", marginBottom: "6px" }}>
                          Recorded Video Clip:
                        </div>
                        <div style={{ position: "relative", maxWidth: "260px", height: "140px", borderRadius: "8px", overflow: "hidden", border: "1.5px solid #8b5cf6", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
                          <video src={repairVideo} controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => setRepairVideo("")}
                            title="Remove video"
                            style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.65)", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "grid", placeItems: "center" }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>\n\n                  `;

content = content.slice(0, idx1) + newProofSection + content.slice(idx2);

// 3. Render LiveCameraModal and style jsx before closing tags
const lastClosingDiv = '      </div>\n    </div>\n  );\n}';
const lastClosingDivCRLF = '      </div>\r\n    </div>\r\n  );\r\n}';
let endIdx = content.lastIndexOf(lastClosingDiv);
let len = lastClosingDiv.length;
if (endIdx === -1) {
  endIdx = content.lastIndexOf(lastClosingDivCRLF);
  len = lastClosingDivCRLF.length;
}

if (endIdx === -1) {
  console.error('Could not find last closing div sequence');
  process.exit(1);
}

const footerAdditions = `      </div>
      </div>

      {/* Real-time In-App Live Camera & Video Capture Modal */}
      <LiveCameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapturePhoto={handleLiveCameraPhoto}
        onCaptureVideo={handleLiveCameraVideo}
        defaultMode={cameraDefaultMode}
      />

      {/* Responsive Styles for Phone & Desktop Workshop Views */}
      <style jsx global>{\`
        @media (max-width: 768px) {
          .workshop-mobile-switcher {
            display: flex !important;
          }
          .workshop-main-layout {
            grid-template-columns: 1fr !important;
          }
          .workshop-queue-col {
            display: \${mobileView === "queue" ? "flex" : "none"} !important;
          }
          .workshop-workbench-col {
            display: \${mobileView === "workbench" ? "block" : "none"} !important;
          }
          .workshop-mobile-back-btn {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .workshop-mobile-switcher {
            display: none !important;
          }
          .workshop-queue-col {
            display: flex !important;
          }
          .workshop-workbench-col {
            display: block !important;
          }
          .workshop-mobile-back-btn {
            display: none !important;
          }
        }
      \`}</style>
    </div>
  );
}
`;

content = content.slice(0, endIdx) + footerAdditions;

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated src/app/workshop/page.tsx');
