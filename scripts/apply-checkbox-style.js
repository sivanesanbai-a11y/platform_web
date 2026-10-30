const fs = require('fs');
const path = require('path');

// 1. Update PurchasingOrderForm.tsx
const formPath = path.resolve(__dirname, '../src/components/forms/PurchasingOrderForm.tsx');
let formContent = fs.readFileSync(formPath, 'utf8');

const oldCheckboxes = `            {/* Service Checkboxes */}
            <div className="nunes-service-options">
              <b>Included Services:</b>
              <label className="nunes-check-label">
                <input type="checkbox" checked={order.service_demo} onChange={e => updateOrder('service_demo', e.target.checked)} />
                <span>Demo Required</span>
              </label>
              <label className="nunes-check-label">
                <input type="checkbox" checked={order.service_installation} onChange={e => updateOrder('service_installation', e.target.checked)} />
                <span>Installation Required</span>
              </label>
              <label className="nunes-check-label">
                <input type="checkbox" checked={order.service_calibration} onChange={e => updateOrder('service_calibration', e.target.checked)} />
                <span>Calibration</span>
              </label>
            </div>`;

const newCheckboxes = `            {/* Service Checkboxes */}
            <div className="nunes-service-options">
              <b>Included Services:</b>
              <label className="cl-checkbox">
                <input type="checkbox" checked={order.service_demo} onChange={e => updateOrder('service_demo', e.target.checked)} />
                <span>Demo Required</span>
              </label>
              <label className="cl-checkbox">
                <input type="checkbox" checked={order.service_installation} onChange={e => updateOrder('service_installation', e.target.checked)} />
                <span>Installation Required</span>
              </label>
              <label className="cl-checkbox">
                <input type="checkbox" checked={order.service_calibration} onChange={e => updateOrder('service_calibration', e.target.checked)} />
                <span>Calibration</span>
              </label>
            </div>`;

const normalize = s => s.replace(/\r\n/g, '\n');
let normForm = normalize(formContent);
if (normForm.includes(normalize(oldCheckboxes))) {
  normForm = normForm.replace(normalize(oldCheckboxes), normalize(newCheckboxes));
  fs.writeFileSync(formPath, normForm.replace(/\n/g, '\r\n'), 'utf8');
  console.log('Updated PurchasingOrderForm.tsx with .cl-checkbox');
} else {
  console.error('Failed to find oldCheckboxes in PurchasingOrderForm.tsx');
}

// 2. Append .cl-checkbox to globals.css
const cssPath = path.resolve(__dirname, '../src/app/globals.css');
let cssContent = fs.readFileSync(cssPath, 'utf8').trimEnd();

const checkboxCss = `

/* =========================================================
   CUSTOM MATERIAL CHECKBOX (.cl-checkbox)
   ========================================================= */

.cl-checkbox,
.nunes-check-label {
 position: relative;
 display: inline-block;
 font-size: 13px;
 font-weight: 600;
 color: #1e293b;
 user-select: none;
 vertical-align: middle;
}

/* Input */
.cl-checkbox > input,
.nunes-check-label > input,
.nunes-form-fields .cl-checkbox > input,
.nunes-form-fields .nunes-check-label > input {
 appearance: none;
 -moz-appearance: none;
 -webkit-appearance: none;
 z-index: -1;
 position: absolute;
 left: -10px;
 top: -8px;
 display: block;
 margin: 0;
 padding: 0 !important;
 border: none !important;
 border-radius: 50%;
 width: 40px;
 height: 40px;
 background-color: rgba(0, 0, 0, 0.6);
 box-shadow: none !important;
 outline: none;
 opacity: 0;
 transform: scale(1);
 pointer-events: none;
 transition: opacity 0.3s, transform 0.2s;
}

/* Span */
.cl-checkbox > span,
.nunes-check-label > span {
 display: inline-block;
 width: 100%;
 cursor: pointer;
}

/* Box */
.cl-checkbox > span::before,
.nunes-check-label > span::before {
 content: "";
 display: inline-block;
 box-sizing: border-box;
 margin: 3px 11px 3px 1px;
 border: solid 2px;
 /* Safari */
 border-color: rgba(0, 0, 0, 0.6);
 border-radius: 2px;
 width: 18px;
 height: 18px;
 vertical-align: top;
 transition: border-color 0.2s, background-color 0.2s;
}

/* Checkmark */
.cl-checkbox > span::after,
.nunes-check-label > span::after {
 content: "";
 display: block;
 position: absolute;
 top: 3px;
 left: 1px;
 width: 10px;
 height: 5px;
 border: solid 2px transparent;
 border-right: none;
 border-top: none;
 transform: translate(3px, 4px) rotate(-45deg);
}

/* Checked, Indeterminate */
.cl-checkbox > input:checked,
.cl-checkbox > input:indeterminate,
.nunes-check-label > input:checked,
.nunes-check-label > input:indeterminate {
 background-color: #018786 !important;
}

.cl-checkbox > input:checked + span::before,
.cl-checkbox > input:indeterminate + span::before,
.nunes-check-label > input:checked + span::before,
.nunes-check-label > input:indeterminate + span::before {
 border-color: #018786 !important;
 background-color: #018786 !important;
}

.cl-checkbox > input:checked + span::after,
.cl-checkbox > input:indeterminate + span::after,
.nunes-check-label > input:checked + span::after,
.nunes-check-label > input:indeterminate + span::after {
 border-color: #fff !important;
}

.cl-checkbox > input:indeterminate + span::after,
.nunes-check-label > input:indeterminate + span::after {
 border-left: none;
 transform: translate(4px, 3px);
}

/* Hover, Focus */
.cl-checkbox:hover > input,
.nunes-check-label:hover > input {
 opacity: 0.04;
}

.cl-checkbox > input:focus,
.nunes-check-label > input:focus {
 opacity: 0.12;
}

.cl-checkbox:hover > input:focus,
.nunes-check-label:hover > input:focus {
 opacity: 0.16;
}

/* Active */
.cl-checkbox > input:active,
.nunes-check-label > input:active {
 opacity: 1;
 transform: scale(0);
 transition: transform 0s, opacity 0s;
}

.cl-checkbox > input:active + span::before,
.nunes-check-label > input:active + span::before {
 border-color: #85b8b7 !important;
}

.cl-checkbox > input:checked:active + span::before,
.nunes-check-label > input:checked:active + span::before {
 border-color: transparent !important;
 background-color: rgba(0, 0, 0, 0.6) !important;
}

/* Disabled */
.cl-checkbox > input:disabled,
.nunes-check-label > input:disabled {
 opacity: 0;
}

.cl-checkbox > input:disabled + span,
.nunes-check-label > input:disabled + span {
 color: rgba(0, 0, 0, 0.38);
 cursor: initial;
}

.cl-checkbox > input:disabled + span::before,
.nunes-check-label > input:disabled + span::before {
 border-color: currentColor;
}

.cl-checkbox > input:checked:disabled + span::before,
.cl-checkbox > input:indeterminate:disabled + span::before,
.nunes-check-label > input:checked:disabled + span::before,
.nunes-check-label > input:indeterminate:disabled + span::before {
 border-color: transparent;
 background-color: currentColor;
}
`;

fs.writeFileSync(cssPath, cssContent + '\n' + checkboxCss + '\n', 'utf8');
console.log('Appended .cl-checkbox CSS to globals.css');
