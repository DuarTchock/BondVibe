const fs = require('fs');

let content = fs.readFileSync('firebase-hosting/public/reset-password.html', 'utf8');

// Agregar estilos para el toggle
content = content.replace(
  `input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }`,
  `input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }
        
        .input-wrapper {
            position: relative;
            width: 100%;
        }
        
        .input-wrapper input {
            padding-right: 50px;
        }
        
        .toggle-password {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .toggle-password svg {
            width: 20px;
            height: 20px;
            color: rgba(255, 255, 255, 0.4);
            transition: color 0.2s;
        }
        
        .toggle-password:hover svg {
            color: rgba(255, 255, 255, 0.6);
        }`
);

// Reemplazar los inputs de password con wrappers que incluyen el toggle
content = content.replace(
  `<div class="form-group">
                <label for="password">New Password</label>
                <input type="password" id="password" placeholder="Enter new password" autocomplete="new-password">
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input type="password" id="confirmPassword" placeholder="Confirm new password" autocomplete="new-password">
            </div>`,
  `<div class="form-group">
                <label for="password">New Password</label>
                <div class="input-wrapper">
                    <input type="password" id="password" placeholder="Enter new password" autocomplete="new-password">
                    <button type="button" class="toggle-password" onclick="togglePassword('password', this)">
                        <svg id="eyeIcon1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <div class="input-wrapper">
                    <input type="password" id="confirmPassword" placeholder="Confirm new password" autocomplete="new-password">
                    <button type="button" class="toggle-password" onclick="togglePassword('confirmPassword', this)">
                        <svg id="eyeIcon2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>`
);

// Agregar la función togglePassword antes del cierre del script
content = content.replace(
  `init();
    </script>`,
  `function togglePassword(inputId, button) {
            const input = document.getElementById(inputId);
            const svg = button.querySelector('svg');
            
            if (input.type === 'password') {
                input.type = 'text';
                // Eye-off icon
                svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
            } else {
                input.type = 'password';
                // Eye icon
                svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
            }
        }
        
        init();
    </script>`
);

fs.writeFileSync('firebase-hosting/public/reset-password.html', content);
console.log('✅ Added password toggle to reset-password.html');
