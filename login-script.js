import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

// 🔥 TUMHARA FIREBASE CONFIG YAHAN AAYEGA 🔥
const firebaseConfig = {
    // Paste your config here
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 🔥 NAYA VERCEL BACKEND URL 🔥
const SERVER_URL = "https://ecommerce-backend-eight-lac.vercel.app";

let isSignup = true;
let tempSignupData = { name: "", email: "", pwd: "" };
let tempResetEmail = "";

if(window.innerWidth <= 850) { document.getElementById('mobileLogo').style.display = 'block'; }
window.addEventListener('resize', () => {
    if(window.innerWidth <= 850) document.getElementById('mobileLogo').style.display = 'block';
    else document.getElementById('mobileLogo').style.display = 'none';
});

window.showToast = function(msg, isSuccess = false) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').innerText = msg;
    toast.style.backgroundColor = isSuccess ? '#10b981' : '#ef4444';
    document.getElementById('toastIconType').className = isSuccess ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

window.toggleTheme = function() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    if(body.getAttribute('data-theme') === 'dark') { 
        body.setAttribute('data-theme', 'light'); 
        icon.className = 'fa-solid fa-moon'; 
    } else { 
        body.setAttribute('data-theme', 'dark'); 
        icon.className = 'fa-solid fa-sun'; 
    }
}

window.switchMode = function(mode) {
    isSignup = (mode === 'signup');
    document.getElementById('tabSignup').classList.toggle('active', isSignup);
    document.getElementById('tabLogin').classList.toggle('active', !isSignup);
    document.getElementById('nameBox').style.display = isSignup ? 'block' : 'none';
    document.getElementById('showForgotBtn').style.display = isSignup ? 'none' : 'block';
    document.getElementById('headerTitle').innerText = isSignup ? 'Create Account' : 'Welcome Back';
    document.getElementById('headerSub').innerText = isSignup ? 'Join Aavira to unlock premium access.' : 'Sign in to jump back into your account.';
    document.getElementById('mainActionBtn').innerHTML = isSignup ? 'Create My Account' : 'Secure Login <i class="fa-solid fa-arrow-right-to-bracket" style="margin-left: 5px;"></i>';
}

window.togglePwd = function(inputId, iconId) {
    const inp = document.getElementById(inputId); 
    const ico = document.getElementById(iconId);
    if(inp.type === 'password') { 
        inp.type = 'text'; 
        ico.className = 'fa-regular fa-eye eye-btn'; 
    } else { 
        inp.type = 'password'; 
        ico.className = 'fa-regular fa-eye-slash eye-btn'; 
    }
}

window.openForgotScreen = function() {
    document.getElementById('headerTitle').innerText = 'Reset Password';
    document.getElementById('headerSub').innerText = 'Securely recover your account.';
    document.getElementById('authTabs').style.display = 'none';
    document.getElementById('screenMain').classList.remove('active');
    setTimeout(() => document.getElementById('screenForgot').classList.add('active'), 200);
}

window.backToMain = function() {
    document.getElementById('authTabs').style.display = 'flex';
    document.getElementById('screenForgot').classList.remove('active');
    document.getElementById('screenReset').classList.remove('active');
    setTimeout(() => { 
        document.getElementById('screenMain').classList.add('active'); 
        window.switchMode('login'); 
    }, 200);
}

window.backToLoginFromOtp = function() {
    document.getElementById('authTabs').style.display = 'flex';
    document.getElementById('screenOTP').classList.remove('active');
    setTimeout(() => { 
        document.getElementById('screenMain').classList.add('active'); 
        window.switchMode('signup'); 
    }, 200);
}

window.processAuth = function() {
    const email = document.getElementById('authEmail').value.trim();
    const pwd = document.getElementById('authPwd').value.trim();
    const name = document.getElementById('regName').value.trim();

    if(!email || !pwd) { window.showToast("Email and password required!"); return; }

    const btn = document.getElementById('mainActionBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;

    if(!isSignup) {
        signInWithEmailAndPassword(auth, email, pwd)
        .then((userCredential) => {
            const user = userCredential.user;
            const userData = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || "Aavira User"
            };
            localStorage.setItem('aavira_user', JSON.stringify(userData));
            window.showToast("Login Successful! Redirecting...", true);
            setTimeout(() => window.location.href = "index.html", 1500);
        })
        .catch((error) => { 
            window.showToast(error.message.replace('Firebase: ', '')); 
            btn.innerHTML = originalText; 
            btn.disabled = false; 
        });
    } else {
        if(!name) { window.showToast("Please enter Full Name."); btn.innerHTML = originalText; btn.disabled = false; return; }
        tempSignupData = { name, email, pwd };

        fetch(`${SERVER_URL}/api/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: email, userName: name })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                window.showToast("Verification OTP sent!", true);
                document.getElementById('headerTitle').innerText = 'Verify Identity';
                document.getElementById('headerSub').innerText = `OTP sent to ${email}`;
                document.getElementById('authTabs').style.display = 'none';
                document.getElementById('screenMain').classList.remove('active');
                setTimeout(() => document.getElementById('screenOTP').classList.add('active'), 200);
                btn.innerHTML = originalText; btn.disabled = false;
            } else { 
                window.showToast(data.message || "Failed to send OTP."); 
                btn.innerHTML = originalText; btn.disabled = false; 
            }
        })
        .catch(err => { window.showToast("Backend Server not connected!"); btn.innerHTML = originalText; btn.disabled = false; });
    }
}

window.verifyOTP = function() {
    const otpVal = document.getElementById('otpInput').value.trim();
    if(otpVal.length !== 6) { window.showToast("Enter complete 6-digit OTP!"); return; }
    const vBtn = document.getElementById('verifyOtpBtn');
    vBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Finalizing...'; 
    vBtn.disabled = true;

    fetch(`${SERVER_URL}/api/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: tempSignupData.email, userOTP: otpVal })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            createUserWithEmailAndPassword(auth, tempSignupData.email, tempSignupData.pwd)
            .then((cred) => {
                updateProfile(cred.user, { displayName: tempSignupData.name }).then(() => {
                    const userData = {
                        uid: cred.user.uid,
                        email: cred.user.email,
                        name: tempSignupData.name
                    };
                    localStorage.setItem('aavira_user', JSON.stringify(userData));
                    
                    fetch(`${SERVER_URL}/api/welcome`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userEmail: tempSignupData.email, userName: tempSignupData.name })
                    });
                    window.showToast("Account Created! Welcome to Aavira.", true);
                    setTimeout(() => window.location.href = "index.html", 2000);
                });
            })
            .catch((error) => { 
                window.showToast(error.message.replace('Firebase: ', '')); 
                vBtn.innerHTML = 'Verify & Complete Setup'; 
                vBtn.disabled = false; 
            });
        } else { 
            window.showToast(data.message || "Invalid OTP!"); 
            vBtn.innerHTML = 'Verify & Complete Setup'; 
            vBtn.disabled = false; 
        }
    })
    .catch(err => { window.showToast("Server error!"); vBtn.innerHTML = 'Verify & Complete Setup'; vBtn.disabled = false; });
}

window.sendResetOTP = function() {
    const email = document.getElementById('resetEmail').value.trim();
    if(!email) { window.showToast("Please enter your email."); return; }
    const btn = document.getElementById('sendResetOtpBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending OTP...'; 
    btn.disabled = true;

    fetch(`${SERVER_URL}/api/send-reset-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            tempResetEmail = email;
            window.showToast("OTP sent to your email!", true);
            document.getElementById('headerTitle').innerText = 'Set New Password';
            document.getElementById('headerSub').innerText = 'Create a strong new password.';
            document.getElementById('screenForgot').classList.remove('active');
            setTimeout(() => document.getElementById('screenReset').classList.add('active'), 200);
        } else { 
            window.showToast(data.message || "Failed to send OTP."); 
            btn.innerHTML = 'Send Reset OTP <i class="fa-solid fa-paper-plane"></i>'; 
            btn.disabled = false; 
        }
    }).catch(err => { window.showToast("Server error!"); btn.innerHTML = 'Send Reset OTP <i class="fa-solid fa-paper-plane"></i>'; btn.disabled = false; });
}

window.updatePassword = function() {
    const otpVal = document.getElementById('resetOtpInput').value.trim();
    const newPwd = document.getElementById('newPwdInput').value.trim();
    if(otpVal.length !== 6) { window.showToast("Please enter 6-digit OTP!"); return; }
    if(newPwd.length < 6) { window.showToast("Password must be at least 6 characters!"); return; }
    const btn = document.getElementById('updatePwdBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...'; 
    btn.disabled = true;

    fetch(`${SERVER_URL}/api/update-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: tempResetEmail, userOTP: otpVal, newPassword: newPwd })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            window.showToast("Password Updated Successfully!", true);
            document.getElementById('resetOtpInput').value = ""; 
            document.getElementById('newPwdInput').value = "";
            setTimeout(() => window.backToMain(), 2000);
        } else { 
            window.showToast(data.message || "Invalid OTP!"); 
            btn.innerHTML = 'Secure Update <i class="fa-solid fa-check"></i>'; 
            btn.disabled = false; 
        }
    }).catch(err => { window.showToast("Server error!"); btn.innerHTML = 'Secure Update <i class="fa-solid fa-check"></i>'; btn.disabled = false; });
}

window.continueWithGoogle = function() {
    signInWithPopup(auth, googleProvider).then((result) => {
        const user = result.user;
        const userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "Aavira User"
        };
        localStorage.setItem('aavira_user', JSON.stringify(userData));
        
        fetch(`${SERVER_URL}/api/welcome`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ userEmail: user.email, userName: user.displayName }) 
        });
        window.showToast("Verified with Google!", true);
        setTimeout(() => window.location.href = "index.html", 1500);
    }).catch((error) => { 
        window.showToast("Google Login cancelled."); 
    });
}
