var $loginForm;
var $signupForm;

$(function() {
    $loginForm = $('#login-form');
    $signupForm = $('#registration-form');

    $loginForm.submit(loginEvent);
    $signupForm.submit(signUpEvent);
});

/** login */
function loginEvent(e) {
    e.preventDefault();

    let email = $loginForm.children('#login-email').val().trim();
    let pw    = $loginForm.children('#login-password').val().trim();
    if (email === undefined || email === '') return;
    if (pw    === undefined || pw    === '') return;

    $.ajax({
        url: 'http://localhost:3000/home/login',
        method: 'POST',
        data: {
            email: email,
            pw: pw
        }
    })
    .done(function(res) {
        let username = `${res.firstName.toLowerCase()}${res.lastName.toLowerCase()}`;
        localStorage.setItem('userId', res.id);
        localStorage.setItem('username', username);
        window.location.href = `../${username}/boards`;
    })
    .fail(function(err) {
        console.log(err);
    })
}

/** sign up */
function signUpEvent(e) {
    e.preventDefault();

    let first = $signupForm.children('#regist-firstname').val().trim();
    let last  = $signupForm.children('#regist-lastname').val().trim();
    let email = $signupForm.children('#regist-email').val().trim();
    let pw    = $signupForm.children('#regist-password').val().trim();
    if (first === undefined || first === '') return;
    if (last  === undefined || last  === '') return;
    if (email === undefined || email === '') return;
    if (pw    === undefined || pw    === '') return;
    
    $.ajax({
        url: 'http://localhost:3000/home/signup',
        method: 'POST',
        data: {
            first: first,
            last: last,
            email: email,
            pw: pw
        }
    })
    .done(function(res) {
        console.log(res);
    })
    .fail(function(err) {
        console.log(err);
    });
} 

/** error checking */
function checkloginInputs() {
    return;
}

function checkSignUpInputs() {
    return;
}