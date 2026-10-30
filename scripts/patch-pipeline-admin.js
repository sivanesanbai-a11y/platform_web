const fs = require('fs');

let content = fs.readFileSync('src/components/forms/ServiceWorkflowPipeline.tsx', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Allow Admin to advance in Section 2 (Verification)
content = content.replace(
  'disabled={stage !== "AWAITING_ARAVINDH_ACCEPT"}',
  'disabled={stage !== "AWAITING_ARAVINDH_ACCEPT" && !isAdminOrMd}'
);
content = content.replace(
  '{stage === "AWAITING_ARAVINDH_ACCEPT" && (',
  '{(stage === "AWAITING_ARAVINDH_ACCEPT" || isAdminOrMd) && ('
);

// 2. Allow Admin to advance in Section 3 (Repair)
content = content.replace(
  '{(stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH") && (',
  '{(stage === "UNDER_REPAIR_SENTHIL" || stage === "UNDER_REPAIR_ARAVINDH" || isAdminOrMd) && ('
);

// 3. Allow Admin to advance in Section 4 (Pricing)
content = content.replace(
  '{stage === "AWAITING_PRIYA_PRICING" && (',
  '{(stage === "AWAITING_PRIYA_PRICING" || isAdminOrMd) && ('
);

// 4. In Section 1, allow Admin to click Send buttons if stage is INTAKE_RECEIVED or isAdminOrMd
content = content.replace(
  '{stage === "INTAKE_RECEIVED" && (',
  '{(stage === "INTAKE_RECEIVED" || isAdminOrMd) && ('
);

// 5. In Section 6, allow Admin to click Dispatch
content = content.replace(
  '{stage !== "JOB_COMPLETED" && (',
  '{(stage !== "JOB_COMPLETED" || isAdminOrMd) && ('
);

// 6. In Section 7, allow Admin to click Record Payment
content = content.replace(
  '{stage !== "JOB_COMPLETED" && (',
  '{(stage !== "JOB_COMPLETED" || isAdminOrMd) && ('
);

// 7. Add an Admin Executive Fast-Forward Process Bar at the top of the workflow pipeline
const targetTop = `{/* Pipeline Header */}`;
const adminTopBar = `{/* Pipeline Header */}
      {isAdminOrMd && (
        <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚡ Admin Executive Fast-Forward Controller
              </span>
              <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#64748b' }}>
                Admin has full oversight: click any stage below to run or fast-forward this job instantly.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {[
                { s: 'INTAKE_RECEIVED', l: '1. Intake' },
                { s: 'AWAITING_ARAVINDH_ACCEPT', l: '2. Verify' },
                { s: 'UNDER_REPAIR_SENTHIL', l: '3. Repair' },
                { s: 'AWAITING_PRIYA_PRICING', l: '4. Pricing' },
                { s: 'AWAITING_MD_APPROVAL', l: '5. MD Approval' },
                { s: 'READY_FOR_HANDOVER', l: '6. Handover' },
                { s: 'JOB_COMPLETED', l: '✓ Complete All' },
              ].map(st => (
                <button
                  key={st.s}
                  type="button"
                  onClick={() => {
                    if (st.s === 'INTAKE_RECEIVED' && onSendToSenthilDirect) onSendToSenthilDirect();
                    else if (st.s === 'AWAITING_ARAVINDH_ACCEPT' && onSendToAravindh) onSendToAravindh();
                    else if (st.s === 'UNDER_REPAIR_SENTHIL' && onAravindhApproveAndSendToSenthil) onAravindhApproveAndSendToSenthil(verificationPhoto, verificationVideo, verificationNotes);
                    else if (st.s === 'AWAITING_PRIYA_PRICING' && onSenthilSubmitRepairToPriya) onSenthilSubmitRepairToPriya(repairScope, repairNotes, proofPhotos, proofVideo);
                    else if (st.s === 'AWAITING_MD_APPROVAL' && onPriyaSubmitPriceToMd) onPriyaSubmitPriceToMd(priyaServiceEstimate, priyaPartsCost, priyaDiscount, priyaGstRate, priyaTotalQuotation, priyaPricingNotes);
                    else if (st.s === 'READY_FOR_HANDOVER' && onMdApprovePrice) onMdApprovePrice(mdPriceDecision, mdDiscountInput, mdNoteText);
                    else if (st.s === 'JOB_COMPLETED' && onRecordPaymentAndCloseJob) onRecordPaymentAndCloseJob('UPI', 'ADMIN_DIRECT', priyaTotalQuotation || 3000, 'Admin Director', 'Admin Fast-Forward Approval');
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: stage === st.s ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                    background: stage === st.s ? '#2563eb' : '#ffffff',
                    color: stage === st.s ? '#ffffff' : '#334155',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {st.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('Admin Executive Fast-Forward Controller')) {
  content = content.replace(targetTop, adminTopBar);
}

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/components/forms/ServiceWorkflowPipeline.tsx', content, 'utf8');
console.log('[OK] ServiceWorkflowPipeline.tsx updated for Admin process execution');
