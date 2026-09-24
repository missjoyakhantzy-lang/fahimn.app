(function () {
    'use strict';

    const CONFIG = {
        // NOTE: Make sure this Client ID is correct and authorized in Google Cloud Console
        GOOGLE_CLIENT_ID: "247971292356-8906dpm406huv7uidlblhjum8vg3dfj3.apps.googleusercontent.com",
        GOOGLE_PROMPT_TIMEOUT_MS: 30000, // Increased timeout for popup window
        OTP_LENGTH: 6,
        MIN_PASSWORD_LENGTH: 6,
        RESEND_COOLDOWN_SECONDS: 30,
        TOAST_DURATION: 3000,
        VIEW_TRANSITION_DELAY: 400,
        AUTO_SUBMIT_DELAY_MS: 150,
        STORAGE_KEYS: {
            NAME: 'aavira_display_name',
            EMAIL: 'aavira_user_email'
        }
    };

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const GOOGLE_BTN_ORIGINAL_HTML =
        '<img src="https://www.svgrepo.com/show/475656/google-color.svg" class="w-4 h-4" alt="Google">' +
        '<span>Continue with Google</span>';

    let pendingSignup = { name: '', email: '', pwd: '' };
    let pendingReset = { email: '' };
    let toastTimer = null;
    let resendCooldownInterval = null;
    let googlePromptTimeout = null;
    let activeGoogleBtnId = null; 
    let isSubmitting = false; 

    document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
        setupFixedBackground();
        setupEnterKeySubmit();
        setupOtpBoxGroup('otpBoxGroup', verifySignupOTP);
        setupOtpBoxGroup('resetOtpBoxGroup', processResetPassword);
    });

    function setupFixedBackground() {
        const fixedBg = document.getElementById('fixedBg');
        const setHeight = () => {
            fixedBg.style.height = (window.visualViewport ? window.visualViewport.height : window.innerHeight) + 'px';
        };
        setHeight();
        window.addEventListener('resize', setHeight);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', setHeight);
        }
    }

    function setupEnterKeySubmit() {
        const fieldToAction = {
            signupName: processSignup,
            signupEmail: processSignup,
            signupPassword: processSignup,
            loginEmail: processLogin,
            loginPassword: processLogin,
            forgotEmail: processForgotPassword,
            newPassword: processResetPassword,
            confirmPassword: processResetPassword
        };
        Object.keys(fieldToAction).forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    fieldToAction[id]();
                }
            });
        });
    }

    function setupOtpBoxGroup(groupId, onComplete) {
        const group = document.getElementById(groupId);
        if (!group) return;
        const boxes = Array.from(group.querySelectorAll('.otp-box'));

        const playPop = (box) => {
            box.classList.remove('otp-box-filled');
            void box.offsetWidth;
            box.classList.add('otp-box-filled');
        };

        const checkAutoSubmit = () => {
            const allFilled = boxes.every((b) => b.value.length === 1);
            if (allFilled && typeof onComplete === 'function') {
                setTimeout(onComplete, CONFIG.AUTO_SUBMIT_DELAY_MS);
            }
        };

        boxes.forEach((box, index) => {
            box.addEventListener('input', () => {
                box.value = box.value.replace(/[^0-9]/g, '').slice(-1);
                if (box.value) {
                    playPop(box);
                    if (boxes[index + 1]) boxes[index + 1].focus();
                } else {
                    box.classList.remove('otp-box-filled');
                }
                checkAutoSubmit();
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !box.value && boxes[index - 1]) {
                    boxes[index - 1].focus();
                } else if (e.key === 'ArrowLeft' && boxes[index - 1]) {
                    e.preventDefault();
                    boxes[index - 1].focus();
                } else if (e.key === 'ArrowRight' && boxes[index + 1]) {
                    e.preventDefault();
                    boxes[index + 1].focus();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (typeof onComplete === 'function') onComplete();
                }
            });

            box.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
                if (!pasted) return;
                pasted.split('').slice(0, boxes.length).forEach((digit, i) => {
                    boxes[i].value = digit;
                    playPop(boxes[i]);
                });
                const nextEmpty = boxes.findIndex((b) => !b.value);
                (boxes[nextEmpty] || boxes[boxes.length - 1]).focus();
                checkAutoSubmit();
            });
        });
    }

    function getOtpBoxValue(groupId) {
        const group = document.getElementById(groupId);
        if (!group) return '';
        return Array.from(group.querySelectorAll('.otp-box')).map((b) => b.value).join('');
    }

    function clearOtpBoxGroup(groupId) {
        const group = document.getElementById(groupId);
        if (!group) return;
        const boxes = Array.from(group.querySelectorAll('.otp-box'));
        boxes.forEach((b) => { b.value = ''; b.classList.remove('otp-box-filled'); });
        if (boxes[0]) boxes[0].focus();
    }

    function showToast(message, type = 'error') {
        // Normal success/info messages stay silent. Only actual errors are shown.
        if (type !== 'error') return;

        const toast = document.getElementById('toast');
        const msg = document.getElementById('toast-msg');
        const iconWrapper = document.getElementById('toast-icon-wrapper');
        if (!toast || !msg || !iconWrapper) return;

        clearTimeout(toastTimer);
        msg.innerText = message;
        iconWrapper.innerHTML = '<i data-lucide="alert-circle" class="w-5 h-5 text-rani-pink"></i>';
        lucide.createIcons();

        toast.classList.remove('opacity-0', '-translate-y-24', 'pointer-events-none');
        toast.classList.add('translate-y-0');

        toastTimer = setTimeout(() => {
            toast.classList.add('opacity-0', '-translate-y-24', 'pointer-events-none');
            toast.classList.remove('translate-y-0');
        }, CONFIG.TOAST_DURATION);
    }

    function switchView(viewId) {
        const views = ['loginView', 'signupView', 'otpView', 'forgotView', 'resetOtpView'];

        if (viewId !== 'resetOtpView') {
            clearInterval(resendCooldownInterval);
            const resendBtn = document.getElementById('btnResendReset');
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.innerText = 'Resend Code';
            }
        }

        const target = document.getElementById(viewId);
        if (!target) return;

        views.forEach((id) => {
            const view = document.getElementById(id);
            if (view) view.className = id === viewId ? 'view-active' : 'view-hidden';
        });

        lucide.createIcons();
    }

    function togglePassword(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(buttonId);
        const isHidden = input.type === 'password';

        input.type = isHidden ? 'text' : 'password';
        btn.innerHTML = isHidden
            ? '<i data-lucide="eye" class="w-4 h-4"></i>'
            : '<i data-lucide="eye-off" class="w-4 h-4"></i>';
        lucide.createIcons();
    }

    function setBtnLoading(btnId, isLoading, originalHtml, opts = {}) {
        const btn = document.getElementById(btnId);
        const loaderColor = opts.loaderColor || 'text-white';
        const loadingLabel = opts.loadingLabel || 'Processing...';

        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('opacity-90', 'cursor-not-allowed');
            const spinnerClass = loaderColor === 'text-rani-pink' ? 'mini-spin rani' : 'mini-spin white';
            btn.innerHTML = `<span class="${spinnerClass}" aria-hidden="true"></span><span>${loadingLabel}</span>`;
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-90', 'cursor-not-allowed');
            btn.innerHTML = originalHtml;
        }
        lucide.createIcons();
    }

    function validateSignupInputs(name, email, pwd) {
        if (!name || !email || !pwd) return 'All fields are required.';
        if (name.length < 2) return 'Please enter your full name.';
        if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
        if (pwd.length < CONFIG.MIN_PASSWORD_LENGTH) return `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters.`;
        return null;
    }

    function validateLoginInputs(email, pwd) {
        if (!email || !pwd) return 'Please enter email & password.';
        return null;
    }

    function extractErrorMessage(result, fallback) {
        return (result && result.data && result.data.message) || fallback;
    }

    function persistSession(name, email) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.NAME, name);
            localStorage.setItem(CONFIG.STORAGE_KEYS.EMAIL, email);
        } catch (e) {
            console.warn('Unable to persist session locally:', e);
        }
    }

    function redirectHome(delay = 1000) {
        setTimeout(() => { window.location.href = '/'; }, delay);
    }

    function goToHome() {
        window.location.href = '/';
    }

    // ------------------------------------------------------------------
    // UPDATED GOOGLE LOGIN - Using Popup instead of One Tap
    // ------------------------------------------------------------------
    function performGoogleLogin(triggerBtnId) {
        if (typeof google === 'undefined' || !google.accounts) {
            showToast('Google service unable to load. Check connection.', 'error');
            return;
        }
        if (isSubmitting) return;

        isSubmitting = true;
        activeGoogleBtnId = triggerBtnId;
        setBtnLoading(triggerBtnId, true, GOOGLE_BTN_ORIGINAL_HTML, {
            loaderColor: 'text-rani-pink',
            loadingLabel: 'Connecting...'
        });

        try {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
                callback: (response) => {
                    if (response && response.access_token) {
                        handleGoogleLoginResponse(response.access_token);
                    }
                },
                error_callback: (error) => {
                    resetGoogleButton();
                    // Agar user ne khud window close ki hai, to error mat dikhao
                    if (error.type !== 'popup_closed' && error.type !== 'access_denied') {
                        showToast('Google sign-in failed or cancelled.', 'error');
                    }
                }
            });

            // Trigger the explicit popup
            client.requestAccessToken();
            
            // Safety timeout in case the popup gets stuck or blocked
            clearTimeout(googlePromptTimeout);
            googlePromptTimeout = setTimeout(() => {
                if(isSubmitting) {
                    resetGoogleButton();
                    showToast('Google sign-in timed out. Please try again.', 'error');
                }
            }, CONFIG.GOOGLE_PROMPT_TIMEOUT_MS);

        } catch (err) {
            resetGoogleButton();
            showToast('Unable to initialize Google Sign-In.', 'error');
        }
    }

    function resetGoogleButton() {
        isSubmitting = false;
        if (activeGoogleBtnId) {
            setBtnLoading(activeGoogleBtnId, false, GOOGLE_BTN_ORIGINAL_HTML);
            activeGoogleBtnId = null;
        }
    }

    async function handleGoogleLoginResponse(googleAccessToken) {
        clearTimeout(googlePromptTimeout);
        showToast('Google verified! Signing you in...', 'success');

        try {
            if (!window.DeliveryBoy || !window.DeliveryBoy.googleLogin) {
                showToast('Google login succeeded, but backend linking is pending.', 'success');
                return;
            }

            // Backend is given the OAuth access token
            const result = await window.DeliveryBoy.googleLogin(googleAccessToken);

            if (result && result.ok && result.data && result.data.success) {
                persistSession(result.data.userName, result.data.email);
                showToast('Signed in successfully!', 'success');
                redirectHome();
            } else {
                showToast(extractErrorMessage(result, 'Google login failed.'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            resetGoogleButton();
        }
    }
    // ------------------------------------------------------------------

    function resolveSendResetOtp() {
        if (!window.DeliveryBoy) return null;
        return window.DeliveryBoy.sendPasswordResetOTP
            || window.DeliveryBoy.sendResetOTP
            || window.DeliveryBoy.forgotPassword
            || null;
    }

    function resolveConfirmReset() {
        if (!window.DeliveryBoy) return null;
        return window.DeliveryBoy.resetPassword
            || window.DeliveryBoy.confirmPasswordReset
            || window.DeliveryBoy.verifyPasswordReset
            || null;
    }

    function validateForgotEmail(email) {
        if (!email) return 'Please enter your registered email.';
        if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
        return null;
    }

    function validateResetPasswordInputs(otp, newPwd, confirmPwd) {
        if (otp.length !== CONFIG.OTP_LENGTH) return `Enter the complete ${CONFIG.OTP_LENGTH}-digit code.`;
        if (newPwd.length < CONFIG.MIN_PASSWORD_LENGTH) return `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters.`;
        if (newPwd !== confirmPwd) return 'New password and confirm password do not match.';
        return null;
    }

    function startResendCooldown() {
        const btn = document.getElementById('btnResendReset');
        let remaining = CONFIG.RESEND_COOLDOWN_SECONDS;

        btn.disabled = true;
        btn.innerText = `Resend Code (${remaining}s)`;

        clearInterval(resendCooldownInterval);
        resendCooldownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(resendCooldownInterval);
                btn.disabled = false;
                btn.innerText = 'Resend Code';
            } else {
                btn.innerText = `Resend Code (${remaining}s)`;
            }
        }, 1000);
    }

    async function processForgotPassword() {
        if (isSubmitting) return;

        const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
        const validationError = validateForgotEmail(email);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        const sendResetOtp = resolveSendResetOtp();
        if (!sendResetOtp) {
            showToast('Password reset service is not available right now.', 'error');
            return;
        }

        const originalBtnHTML = '<span>Send Reset Code</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
        isSubmitting = true;
        setBtnLoading('btnForgotAction', true, originalBtnHTML);
        pendingReset = { email };

        try {
            const result = await sendResetOtp(email);
            if (result && result.ok && result.data && result.data.success) {
                showToast('Reset code sent to your email!', 'success');
                document.getElementById('resetOtpSubText').innerText = email;
                clearOtpBoxGroup('resetOtpBoxGroup');
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                switchView('resetOtpView');
                startResendCooldown();
            } else {
                showToast(extractErrorMessage(result, 'Unable to send reset code. Please check the email and try again.'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setBtnLoading('btnForgotAction', false, originalBtnHTML);
            isSubmitting = false;
        }
    }

    async function resendResetOtp() {
        if (isSubmitting || !pendingReset.email) return;

        const btn = document.getElementById('btnResendReset');
        const originalBtnHTML = btn ? btn.innerHTML : '<span>Resend Code</span>';
        const sendResetOtp = resolveSendResetOtp();
        if (!sendResetOtp) {
            showToast('Password reset service is not available right now.', 'error');
            return;
        }

        isSubmitting = true;
        setBtnLoading('btnResendReset', true, originalBtnHTML, { loadingLabel: 'Sending...' });

        try {
            const result = await sendResetOtp(pendingReset.email);
            if (result && result.ok && result.data && result.data.success) {
                showToast('A new code has been sent.', 'success');
                startResendCooldown();
            } else {
                showToast(extractErrorMessage(result, 'Unable to resend code.'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setBtnLoading('btnResendReset', false, originalBtnHTML);
            isSubmitting = false;
        }
    }

    async function processResetPassword() {
        if (isSubmitting) return;

        const otp = getOtpBoxValue('resetOtpBoxGroup');
        const newPwd = document.getElementById('newPassword').value.trim();
        const confirmPwd = document.getElementById('confirmPassword').value.trim();

        const validationError = validateResetPasswordInputs(otp, newPwd, confirmPwd);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        const confirmReset = resolveConfirmReset();
        if (!confirmReset) {
            showToast('Password reset service is not available right now.', 'error');
            return;
        }

        const originalBtnHTML = '<span>Reset Password</span><i data-lucide="check-circle" class="w-4 h-4"></i>';
        isSubmitting = true;
        setBtnLoading('btnResetAction', true, originalBtnHTML);

        try {
            const result = await confirmReset(pendingReset.email, otp, newPwd);
            if (result && result.ok && result.data && result.data.success) {
                showToast('Password reset successfully! Please login.', 'success');
                clearInterval(resendCooldownInterval);
                document.getElementById('loginEmail').value = pendingReset.email;
                document.getElementById('loginPassword').value = '';
                pendingReset = { email: '' };
                setTimeout(() => switchView('loginView'), 1200);
            } else {
                showToast(extractErrorMessage(result, 'Invalid or expired code.'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setBtnLoading('btnResetAction', false, originalBtnHTML);
            isSubmitting = false;
        }
    }

    async function processSignup() {
        if (isSubmitting) return;

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const pwd = document.getElementById('signupPassword').value.trim();

        const validationError = validateSignupInputs(name, email, pwd);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        if (!window.DeliveryBoy) {
            showToast('System error: Unable to connect to server.', 'error');
            return;
        }

        const originalBtnHTML = '<span>Create Account</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
        isSubmitting = true;
        setBtnLoading('btnSignupAction', true, originalBtnHTML);
        pendingSignup = { name, email, pwd };

        try {
            const result = await window.DeliveryBoy.sendOTP(email, name);
            if (result && result.ok && result.data && result.data.success) {
                showToast('Verification code sent!', 'success');
                document.getElementById('otpSubText').innerText = email;
                clearOtpBoxGroup('otpBoxGroup');
                switchView('otpView');
            } else {
                showToast(extractErrorMessage(result, 'Error sending code.'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setBtnLoading('btnSignupAction', false, originalBtnHTML);
            isSubmitting = false;
        }
    }

    async function verifySignupOTP() {
        if (isSubmitting) return;

        const otpVal = getOtpBoxValue('otpBoxGroup');
        if (otpVal.length !== CONFIG.OTP_LENGTH) {
            showToast(`Enter the complete ${CONFIG.OTP_LENGTH}-digit code.`, 'error');
            return;
        }

        if (!window.DeliveryBoy) {
            showToast('System error: Unable to connect to server.', 'error');
            return;
        }

        const originalBtnHTML = '<span>Verify & Login</span><i data-lucide="check-circle" class="w-4 h-4"></i>';
        isSubmitting = true;
        setBtnLoading('btnOtpAction', true, originalBtnHTML);

        try {
            const result = await window.DeliveryBoy.verifyOTP(
                pendingSignup.email, otpVal, pendingSignup.name, pendingSignup.pwd
            );
            if (result && result.ok && result.data && result.data.success) {
                persistSession(pendingSignup.name, pendingSignup.email);
                showToast('Welcome to Aavira!', 'success');
                redirectHome(1500);
            } else {
                showToast(extractErrorMessage(result, 'Invalid OTP code.'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setBtnLoading('btnOtpAction', false, originalBtnHTML);
            isSubmitting = false;
        }
    }

    async function processLogin() {
        if (isSubmitting) return;

        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const pwd = document.getElementById('loginPassword').value.trim();

        const validationError = validateLoginInputs(email, pwd);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        if (!window.DeliveryBoy) {
            showToast('System error: Unable to connect to server.', 'error');
            return;
        }

        const originalBtnHTML = '<span>Login</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
        isSubmitting = true;
        setBtnLoading('btnLoginAction', true, originalBtnHTML);

        try {
            const result = await window.DeliveryBoy.login(email, pwd);
            if (result && result.ok && result.data && result.data.success) {
                persistSession(result.data.userName || email.split('@')[0], email);
                showToast('Signed in successfully!', 'success');
                redirectHome();
            } else {
                showToast(extractErrorMessage(result, 'Invalid credentials.'), 'error');
            }
        } catch (err) {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setBtnLoading('btnLoginAction', false, originalBtnHTML);
            isSubmitting = false;
        }
    }

    window.showToast = showToast;
    window.switchView = switchView;
    window.togglePassword = togglePassword;
    window.performGoogleLogin = performGoogleLogin;
    window.processSignup = processSignup;
    window.verifySignupOTP = verifySignupOTP;
    window.processLogin = processLogin;
    window.processForgotPassword = processForgotPassword;
    window.resendResetOtp = resendResetOtp;
    window.processResetPassword = processResetPassword;
    window.goToHome = goToHome;
})();
