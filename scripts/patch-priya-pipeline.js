const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'components', 'forms', 'ServiceWorkflowPipeline.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const targetBlock = `          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Service (₹):
              </label>
              <input
                type="number"
                value={priyaServiceEstimate}
                onChange={(e) => setPriyaServiceEstimate(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Parts (₹):
              </label>
              <input
                type="number"
                value={priyaPartsCost}
                onChange={(e) => setPriyaPartsCost(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Discount (₹):
              </label>
              <input
                type="number"
                value={priyaDiscount}
                onChange={(e) => setPriyaDiscount(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                GST (18%):
              </label>
              <div style={{ padding: "6px 8px", borderRadius: "6px", background: "#f1f5f9", fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                ₹{priyaGstAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#0891b2", marginBottom: "2px" }}>
                Total (₹):
              </label>
              <div style={{ padding: "6px 8px", borderRadius: "6px", background: "#0891b2", color: "#ffffff", fontSize: "12px", fontWeight: 900 }}>
                ₹{priyaTotalQuotation.toLocaleString("en-IN")}
              </div>
            </div>
          </div>`;

const replacement = `          {/* Senthil Scope Quick Buttons */}
          {stage === "AWAITING_PRIYA_PRICING" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  const baseVal = Number(firstProduct.productValue || 4000);
                  setPriyaServiceEstimate(Math.round(baseVal * 0.3));
                }}
                style={{
                  background: "#ecfeff",
                  border: "1px solid #0891b2",
                  color: "#0e7490",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply 30% Standard Scope (₹{Math.round(Number(firstProduct.productValue || 4000) * 0.3).toLocaleString("en-IN")})
              </button>
              <button
                type="button"
                onClick={() => {
                  const baseVal = Number(firstProduct.productValue || 4000);
                  setPriyaServiceEstimate(Math.round(baseVal * 0.5));
                }}
                style={{
                  background: "#fdf4ff",
                  border: "1px solid #a855f7",
                  color: "#7e22ce",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Apply 50% Overhaul Scope (₹{Math.round(Number(firstProduct.productValue || 4000) * 0.5).toLocaleString("en-IN")})
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Service (₹):
              </label>
              <input
                type="number"
                value={priyaServiceEstimate}
                onChange={(e) => setPriyaServiceEstimate(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Parts (₹):
              </label>
              <input
                type="number"
                value={priyaPartsCost}
                onChange={(e) => setPriyaPartsCost(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                Discount (₹):
              </label>
              <input
                type="number"
                value={priyaDiscount}
                onChange={(e) => setPriyaDiscount(Number(e.target.value))}
                disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
                GST (18%):
              </label>
              <div style={{ padding: "6px 8px", borderRadius: "6px", background: "#f1f5f9", fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                ₹{priyaGstAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#0891b2", marginBottom: "2px" }}>
                Total (₹):
              </label>
              <div style={{ padding: "6px 8px", borderRadius: "6px", background: "#0891b2", color: "#ffffff", fontSize: "12px", fontWeight: 900 }}>
                ₹{priyaTotalQuotation.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
              Commercial Quotation Notes &amp; Warranty Terms:
            </label>
            <textarea
              rows={2}
              value={priyaPricingNotes}
              onChange={(e) => setPriyaPricingNotes(e.target.value)}
              disabled={stage !== "AWAITING_PRIYA_PRICING" && !isAdminOrMd}
              placeholder="e.g. 30% overhaul service charge + replacement seals. Includes 3 months calibration warranty."
              style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", resize: "vertical" }}
            />
          </div>`;

// Replace only the FIRST occurrence (which is in Section 4)
const idx = content.indexOf(targetBlock.replace(/\r\n/g, '\n'));
if (idx !== -1) {
  content = content.slice(0, idx) + replacement + content.slice(idx + targetBlock.replace(/\r\n/g, '\n').length);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('SUCCESS: Patched Section 4 in ServiceWorkflowPipeline.tsx');
} else {
  // Try CRLF
  const idx2 = content.indexOf(targetBlock.replace(/\n/g, '\r\n'));
  if (idx2 !== -1) {
    content = content.slice(0, idx2) + replacement.replace(/\n/g, '\r\n') + content.slice(idx2 + targetBlock.replace(/\n/g, '\r\n').length);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('SUCCESS (CRLF): Patched Section 4 in ServiceWorkflowPipeline.tsx');
  } else {
    console.error('ERROR: Could not find targetBlock in ServiceWorkflowPipeline.tsx');
    process.exit(1);
  }
}
