
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { firebaseApp } from '../JS/firebase.js';


"use strict";

///////////////////////////////////////////

// ====== functions ======
const auth = getAuth(firebaseApp);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
    return emailRegex.test(email);
}


/////////////////////////////////////////

// ====== event listeners ======

document.addEventListener('DOMContentLoaded', (event) => {
    // === consts ===
    const registerBtn = document.getElementById('registerBtn');
    const registerSection = document.getElementById('registerSection');
    const loginSection = document.getElementById('loginSection');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const successfullLoginSection = document.getElementById('successfullLoginSection');

    // === listeners ===

    //register button click event:
    registerBtn.addEventListener('click', function () {
        loginSection.classList.add("d-none");
        registerSection.classList.remove("d-none");
    });

    ///////

    // register form handler:
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value.toLowerCase().trim();
        const password = document.getElementById('registerPassword').value;

        await createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up
                console.log(userCredential.user);
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                // ..
            });

        registerForm.reset();
        loginSection.classList.remove("d-none");
        registerSection.classList.add("d-none");

    });

    ///////

    // register form handler:
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.toLowerCase().trim();
        const password = document.getElementById('loginPassword').value;

        await signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                loginForm.reset();
                loginSection.classList.add("d-none");
                registerSection.classList.add("d-none");
                successfullLoginSection.classList.remove("d-none");
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
            });

        // loginForm.reset();
        // loginSection.classList.add("d-none");
        // registerSection.classList.add("d-none");
        // successfullLoginSection.classList.remove("d-none");

    });


});