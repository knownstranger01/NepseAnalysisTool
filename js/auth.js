// लगइन र साइनअप ट्याब स्विचिङ
document.addEventListener('DOMContentLoaded', function() {
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // ट्याब सक्रिय गर्ने
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // फर्म देखाउने
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabId}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });
    
    // पासवर्ड देखाउने/लुकाउने टगल
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            }
        });
    });
    
    // पासवर्ड बलियोपना जाँच
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        const strengthMeter = document.querySelector('.strength-meter-fill');
        const strengthText = document.querySelector('.strength-text');
        
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            strengthMeter.setAttribute('data-strength', strength.score);
            strengthText.textContent = strength.message;
        });
    }
    
    // लगइन फर्म सबमिट
    const emailLoginForm = document.getElementById('email-form');
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // यहाँ लगइन लजिक थप्नुहोस्
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember')?.checked;
            
            console.log('लगइन प्रयास:', { email, password, remember });
            
            // सफल लगइन पछि होमपेजमा रिडाइरेक्ट गर्ने
            // window.location.href = 'index.html';
            
            // डेमोको लागि अलर्ट देखाउने
            alert('लगइन सफल भयो! (डेमो मात्र)');
        });
    }
    
    // मोबाइल लगइन फर्म सबमिट
    const mobileLoginForm = document.getElementById('mobile-form');
    if (mobileLoginForm) {
        mobileLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // यहाँ OTP पठाउने लजिक थप्नुहोस्
            const mobile = document.getElementById('mobile').value;
            
            console.log('OTP पठाउने प्रयास:', { mobile });
            
            // डेमोको लागि अलर्ट देखाउने
            alert(`+977 ${mobile} मा OTP पठाइएको छ। (डेमो मात्र)`);
        });
    }
    
    // साइनअप फर्म सबमिट
    const emailSignupForm = document.getElementById('email-form');
    if (emailSignupForm && window.location.href.includes('signup.html')) {
        emailSignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // यहाँ साइनअप लजिक थप्नुहोस्
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const terms = document.getElementById('terms').checked;
            
            if (password !== confirmPassword) {
                alert('पासवर्ड मिलेन! कृपया पुन: जाँच गर्नुहोस्।');
                return;
            }
            
            if (!terms) {
                alert('कृपया सेवा सर्तहरू स्वीकार गर्नुहोस्।');
                return;
            }
            
            console.log('साइनअप प्रयास:', { fullname, email, password, terms });
            
            // सफल साइनअप पछि होमपेजमा रिडाइरेक्ट गर्ने
            // window.location.href = 'index.html';
            
            // डेमोको लागि अलर्ट देखाउने
            alert('साइनअप सफल भयो! (डेमो मात्र)');
        });
    }
    
    // मोबाइल साइनअप फर्म सबमिट
    const mobileSignupForm = document.getElementById('mobile-form');
    if (mobileSignupForm && window.location.href.includes('signup.html')) {
        mobileSignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // यहाँ OTP पठाउने लजिक थप्नुहोस्
            const fullname = document.getElementById('fullname-mobile').value;
            const mobile = document.getElementById('mobile').value;
            const terms = document.getElementById('terms-mobile').checked;
            
            if (!terms) {
                alert('कृपया सेवा सर्तहरू स्वीकार गर्नुहोस्।');
                return;
            }
            
            console.log('OTP पठाउने प्रयास:', { fullname, mobile, terms });
            
            // डेमोको लागि अलर्ट देखाउने
            alert(`+977 ${mobile} मा OTP पठाइएको छ। (डेमो मात्र)`);
        });
    }
    
    // प्रोफाइल ड्रपडाउन टगल
    const profileButton = document.getElementById('profile-button');
    const profileDropdown = document.getElementById('profile-dropdown');
    
    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', function() {
            profileDropdown.classList.toggle('active');
        });
        
        // बाहिर क्लिक गर्दा ड्रपडाउन बन्द गर्ने
        document.addEventListener('click', function(e) {
            if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
    }
    
    // लगआउट बटन
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // यहाँ लगआउट लजिक थप्नुहोस्
            console.log('लगआउट प्रयास');
            
            // डेमोको लागि अलर्ट देखाउने
            alert('लगआउट सफल भयो! (डेमो मात्र)');
            
            // होमपेजमा रिडाइरेक्ट गर्ने
            // window.location.href = 'index.html';
        });
    }
});

// पासवर्ड बलियोपना जाँच गर्ने फंक्सन
function checkPasswordStrength(password) {
    let score = 0;
    let message = '';
    
    // लम्बाइ जाँच
    if (password.length < 6) {
        message = 'कमजोर: कम्तिमा 6 वर्ण चाहिन्छ';
    } else {
        score += 1;
        
        // अपरकेस अक्षर जाँच
        if (/[A-Z]/.test(password)) {
            score += 1;
        }
        
        // नम्बर जाँच
        if (/[0-9]/.test(password)) {
            score += 1;
        }
        
        // विशेष वर्ण जाँच
        if (/[^A-Za-z0-9]/.test(password)) {
            score += 1;
        }
        
        // स्कोर अनुसार सन्देश
        if (score === 1) {
            message = 'कमजोर: ठूलो अक्षर, नम्बर र विशेष वर्ण थप्नुहोस्';
        } else if (score === 2) {
            message = 'मध्यम: अझै सुधार गर्न सकिन्छ';
        } else if (score === 3) {
            message = 'राम्रो: सुरक्षित पासवर्ड';
        } else if (score === 4) {
            message = 'बलियो: अति उत्तम पासवर्ड';
        }
    }
    
    return { score, message };
} 