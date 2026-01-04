const fs = require('fs');

// Actualizar verify-email.html
let verifyContent = fs.readFileSync('firebase-hosting/public/verify-email.html', 'utf8');

// Reemplazar el emoji de success por un SVG de checkmark con estilo BondVibe
verifyContent = verifyContent.replace(
  `<div id="success" class="success" style="display: none;">
            <div class="status-icon">✅</div>`,
  `<div id="success" class="success" style="display: none;">
            <div class="status-icon-svg">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="38" stroke="#34C759" stroke-width="3" fill="rgba(52, 199, 89, 0.15)"/>
                    <path d="M24 40L35 51L56 30" stroke="#34C759" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>`
);

// Reemplazar el emoji de error
verifyContent = verifyContent.replace(
  `<div id="error" class="error" style="display: none;">
            <div class="status-icon">❌</div>`,
  `<div id="error" class="error" style="display: none;">
            <div class="status-icon-svg">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="38" stroke="#EF4444" stroke-width="3" fill="rgba(239, 68, 68, 0.15)"/>
                    <path d="M28 28L52 52M52 28L28 52" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
                </svg>
            </div>`
);

// Agregar estilo para status-icon-svg
verifyContent = verifyContent.replace(
  `.status-icon {
            font-size: 64px;
            margin-bottom: 16px;
        }`,
  `.status-icon {
            font-size: 64px;
            margin-bottom: 16px;
        }
        
        .status-icon-svg {
            margin-bottom: 20px;
        }`
);

fs.writeFileSync('firebase-hosting/public/verify-email.html', verifyContent);
console.log('✅ Updated verify-email.html');


// Actualizar reset-password.html
let resetContent = fs.readFileSync('firebase-hosting/public/reset-password.html', 'utf8');

// Reemplazar el emoji de success
resetContent = resetContent.replace(
  `<div class="success-icon">✅</div>`,
  `<div class="status-icon-svg">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="38" stroke="#34C759" stroke-width="3" fill="rgba(52, 199, 89, 0.15)"/>
                    <path d="M24 40L35 51L56 30" stroke="#34C759" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>`
);

// Reemplazar el emoji de error/invalid
resetContent = resetContent.replace(
  `<div class="invalid-link-icon">❌</div>`,
  `<div class="status-icon-svg">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="38" stroke="#EF4444" stroke-width="3" fill="rgba(239, 68, 68, 0.15)"/>
                    <path d="M28 28L52 52M52 28L28 52" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
                </svg>
            </div>`
);

// Agregar estilo status-icon-svg si no existe
if (!resetContent.includes('.status-icon-svg')) {
  resetContent = resetContent.replace(
    `.invalid-link-icon {
            font-size: 64px;
            margin-bottom: 16px;
        }`,
    `.invalid-link-icon {
            font-size: 64px;
            margin-bottom: 16px;
        }
        
        .status-icon-svg {
            margin-bottom: 20px;
        }`
  );
}

fs.writeFileSync('firebase-hosting/public/reset-password.html', resetContent);
console.log('✅ Updated reset-password.html');
