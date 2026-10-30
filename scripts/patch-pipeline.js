const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'forms', 'ServiceWorkflowPipeline.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

if (!content.includes('FileDown,')) {
  content = content.replace('  FileText,\n  BadgeCheck,', '  FileText,\n  FileDown,\n  BadgeCheck,');
}

const oldButtons = `          {/* WhatsApp & Email & Preview buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <a
              href={getWhatsAppQuotationLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <MessageSquare size={12} />
              <span>Send WhatsApp</span>
            </a>

            <a
              href={getEmailQuotationLink()}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Mail size={12} />
              <span>Send Email</span>
            </a>

            <button
              type="button"
              onClick={onOpenQuotation}
              style={{
                background: "#ffffff",
                border: "1px solid #059669",
                color: "#059669",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FileText size={12} />
              <span>Preview Quotation</span>
            </button>
          </div>`;

const newButtons = `          {/* WhatsApp & Email & Official PDF Quotation buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
            <button
              type="button"
              onClick={onOpenQuotation}
              style={{
                background: "#059669",
                border: "1px solid #059669",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
              title="Open Official Quotation PDF with 1-click Download"
            >
              <FileDown size={13} />
              <span>📄 Official PDF Quotation</span>
            </button>

            <a
              href={getWhatsAppQuotationLink()}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Send via WhatsApp with quotation details & PDF"
            >
              <MessageSquare size={12} />
              <span>💬 WhatsApp (PDF)</span>
            </a>

            <a
              href={getEmailQuotationLink()}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title="Send via Email with quotation details & PDF"
            >
              <Mail size={12} />
              <span>✉ Email (PDF)</span>
            </a>
          </div>`;

if (content.includes(oldButtons)) {
  content = content.replace(oldButtons, newButtons);
  console.log('Updated Section 6 buttons with PDF options in ServiceWorkflowPipeline!');
} else {
  console.error('Failed to find oldButtons in ServiceWorkflowPipeline');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done updating pipeline!');
