// ===============================
// GET ELEMENTS
// ===============================

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const profileSection = document.getElementById("profileSection");

const registerLink = document.getElementById("registerLink");
const loginLink = document.getElementById("loginLink");

const tabs = document.querySelector(".tabs");

// Welcome subtitle
const headerSubtitle = document.querySelector(".header p");


// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {

    loginSection.classList.remove("hidden");
    registerSection.classList.add("hidden");
    profileSection.classList.add("hidden");

    // Show Login/Register tabs
    tabs.classList.remove("hidden");

    loginTab.classList.remove("hidden");
    registerTab.classList.remove("hidden");

    // Show welcome subtitle
    headerSubtitle.classList.remove("hidden");

    loginTab.classList.add("active");
    registerTab.classList.remove("active");
}


// ===============================
// SHOW REGISTER
// ===============================

function showRegister() {

    loginSection.classList.add("hidden");
    registerSection.classList.remove("hidden");
    profileSection.classList.add("hidden");

    // Show Login/Register tabs
    tabs.classList.remove("hidden");

    loginTab.classList.remove("hidden");
    registerTab.classList.remove("hidden");

    // Show welcome subtitle
    headerSubtitle.classList.remove("hidden");

    loginTab.classList.remove("active");
    registerTab.classList.add("active");
}


// ===============================
// SHOW PROFILE
// ===============================

function showProfile() {

    loginSection.classList.add("hidden");
    registerSection.classList.add("hidden");
    profileSection.classList.remove("hidden");

    // Hide Login/Register tabs
    tabs.classList.add("hidden");

    // Hide welcome subtitle
    headerSubtitle.classList.add("hidden");
}


// ===============================
// TAB EVENTS
// ===============================

loginTab.addEventListener("click", showLogin);

registerTab.addEventListener("click", showRegister);

registerLink.addEventListener("click", showRegister);

loginLink.addEventListener("click", showLogin);


// ===============================
// LOGIN PASSWORD EYE
// ===============================

const loginPassword =
    document.getElementById("loginPassword");

const loginPasswordToggle =
    document.getElementById("loginPasswordToggle");


loginPasswordToggle.addEventListener("click", function () {

    if (loginPassword.type === "password") {

        loginPassword.type = "text";

        loginPasswordToggle.textContent = "🙈";

    } else {

        loginPassword.type = "password";

        loginPasswordToggle.textContent = "👁";

    }

});


// ===============================
// REGISTER PASSWORD EYE
// ===============================

const registerPassword =
    document.getElementById("registerPassword");

const registerPasswordToggle =
    document.getElementById("registerPasswordToggle");


registerPasswordToggle.addEventListener("click", function () {

    if (registerPassword.type === "password") {

        registerPassword.type = "text";

        registerPasswordToggle.textContent = "🙈";

    } else {

        registerPassword.type = "password";

        registerPasswordToggle.textContent = "👁";

    }

});


// ===============================
// REGISTER
// ===============================

const registerForm =
    document.getElementById("registerForm");


registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const message =
        document.getElementById("registerMessage");


    try {

        const response = await fetch(
            "http://localhost:3000/users",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();

        message.textContent = data.message;


        if (response.status === 201) {

            registerForm.reset();

            setTimeout(function () {

                showLogin();

            }, 1000);

        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to connect to server.";

    }

});


// ===============================
// LOGIN
// ===============================

const loginForm =
    document.getElementById("loginForm");


loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const message =
        document.getElementById("loginMessage");


    try {

        const response = await fetch(
            "http://localhost:3000/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();

        message.textContent = data.message;


        if (response.status === 200 && data.token) {

            // Save JWT
            localStorage.setItem("token", data.token);

            // Open profile
            getProfile();

        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to connect to server.";

    }

});


// ===============================
// GET PROFILE
// ===============================

async function getProfile() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        showLogin();

        return;

    }


    try {

        const response = await fetch(
            "http://localhost:3000/profile",
            {
                method: "GET",

                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );


        const data = await response.json();


        if (response.status === 200) {

            document.getElementById("profileName").textContent =
                data.user.name || "User";

            document.getElementById("profileEmail").textContent =
                data.user.email;

            // Open profile
            showProfile();

        } else {

            localStorage.removeItem("token");

            showLogin();

            document.getElementById("loginMessage").textContent =
                data.message;

        }

    } catch (error) {

        console.error(error);

        document.getElementById("loginMessage").textContent =
            "Unable to connect to server.";

        showLogin();

    }

}


// ===============================
// LOGOUT
// ===============================

const logoutButton =
    document.getElementById("logoutButton");


logoutButton.addEventListener("click", function () {

    // Remove JWT
    localStorage.removeItem("token");

    // Clear profile
    document.getElementById("profileName").textContent = "";
    document.getElementById("profileEmail").textContent = "";

    // Go back to login
    showLogin();

    document.getElementById("loginMessage").textContent =
        "You have been logged out.";

});


// ===============================
// CHECK LOGIN ON PAGE LOAD
// ===============================

window.addEventListener("DOMContentLoaded", function () {

    const token =
        localStorage.getItem("token");

    if (token) {

        getProfile();

    } else {

        showLogin();

    }

});