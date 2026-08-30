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

const headerSubtitle = document.querySelector(".header p");


// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {
    loginSection.classList.remove("hidden");
    registerSection.classList.add("hidden");
    profileSection.classList.add("hidden");
    tabs.classList.remove("hidden");
    loginTab.classList.remove("hidden");
    registerTab.classList.remove("hidden");
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
    tabs.classList.remove("hidden");
    loginTab.classList.remove("hidden");
    registerTab.classList.remove("hidden");
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
    tabs.classList.add("hidden");
    headerSubtitle.classList.add("hidden");
    loadTasks();
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

const loginPassword = document.getElementById("loginPassword");
const loginPasswordToggle = document.getElementById("loginPasswordToggle");

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

const registerPassword = document.getElementById("registerPassword");
const registerPasswordToggle = document.getElementById("registerPasswordToggle");

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

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const message = document.getElementById("registerMessage");

    try {

        const response = await fetch(
            "http://localhost:3000/users",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            }
        );

        const data = await response.json();
        message.textContent = data.message;

        if (response.status === 201) {
            registerForm.reset();
            setTimeout(function () { showLogin(); }, 1000);
        }

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to connect to server.";
    }

});


// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    try {

        const response = await fetch(
            "http://localhost:3000/login",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            }
        );

        const data = await response.json();
        message.textContent = data.message;

        if (response.status === 200 && data.token) {
            localStorage.setItem("token", data.token);
            getProfile();
        }

    } catch (error) {
        console.error(error);
        message.textContent = "Unable to connect to server.";
    }

});


// ===============================
// GET PROFILE
// ===============================

async function getProfile() {

    const token = localStorage.getItem("token");

    if (!token) {
        showLogin();
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/profile",
            {
                method: "GET",
                headers: { "Authorization": "Bearer " + token }
            }
        );

        const data = await response.json();

        if (response.status === 200) {
            document.getElementById("profileName").textContent = data.user.name || "User";
            document.getElementById("profileEmail").textContent = data.user.email;
            showProfile();
        } else {
            localStorage.removeItem("token");
            showLogin();
            document.getElementById("loginMessage").textContent = data.message;
        }

    } catch (error) {
        console.error(error);
        document.getElementById("loginMessage").textContent = "Unable to connect to server.";
        showLogin();
    }

}


// ===============================
// LOGOUT
// ===============================

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", function () {
    localStorage.removeItem("token");
    document.getElementById("profileName").textContent = "";
    document.getElementById("profileEmail").textContent = "";
    showLogin();
    document.getElementById("loginMessage").textContent = "You have been logged out.";
});


// ===============================
// TASKS - LOAD ALL TASKS
// ===============================

async function loadTasks() {

    const taskList = document.getElementById("taskList");
    const taskMessage = document.getElementById("taskMessage");

    try {

        const response = await fetch("http://localhost:3000/api/tasks");
        const tasks = await response.json();

        taskList.innerHTML = "";

        if (tasks.length === 0) {
            taskMessage.textContent = "No tasks yet. Add one above!";
            return;
        }

        taskMessage.textContent = "";

        tasks.forEach(function (task) {
            renderTask(task);
        });

    } catch (error) {
        console.error(error);
        taskMessage.textContent = "Failed to load tasks.";
    }

}


// ===============================
// TASKS - RENDER ONE TASK
// ===============================

function renderTask(task) {

    const taskList = document.getElementById("taskList");

    const li = document.createElement("li");
    li.className = "task-item";
    li.setAttribute("data-id", task.id);

    li.innerHTML = `
        <input
            type="checkbox"
            class="task-checkbox"
            ${task.is_done ? "checked" : ""}
        >
        <span class="task-title ${task.is_done ? "done" : ""}">
            ${task.title}
        </span>
        <button class="delete-btn">Delete</button>
    `;

    // Checkbox - mark done/undone
    const checkbox = li.querySelector(".task-checkbox");
    checkbox.addEventListener("change", function () {
        updateTask(task.id, checkbox.checked);
    });

    // Delete button
    const deleteBtn = li.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", function () {
        deleteTask(task.id, li);
    });

    taskList.appendChild(li);

}


// ===============================
// TASKS - ADD TASK
// ===============================

const addTaskBtn = document.getElementById("addTaskBtn");

addTaskBtn.addEventListener("click", async function () {

    const taskInput = document.getElementById("taskInput");
    const taskMessage = document.getElementById("taskMessage");
    const title = taskInput.value.trim();

    if (!title) {
        taskMessage.textContent = "Please enter a task title!";
        return;
    }

    try {

        const response = await fetch("http://localhost:3000/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title })
        });

        const data = await response.json();

        if (response.status === 201) {
            taskInput.value = "";
            taskMessage.textContent = "";
            renderTask(data);
        } else {
            taskMessage.textContent = data.error || "Failed to add task.";
        }

    } catch (error) {
        console.error(error);
        taskMessage.textContent = "Failed to connect to server.";
    }

});


// ===============================
// TASKS - UPDATE TASK (is_done)
// ===============================

async function updateTask(id, is_done) {

    const taskMessage = document.getElementById("taskMessage");

    try {

        const response = await fetch(`http://localhost:3000/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_done })
        });

        if (!response.ok) {
            taskMessage.textContent = "Failed to update task.";
        }

        // Update the title style
        const li = document.querySelector(`[data-id="${id}"]`);
        const titleSpan = li.querySelector(".task-title");

        if (is_done) {
            titleSpan.classList.add("done");
        } else {
            titleSpan.classList.remove("done");
        }

    } catch (error) {
        console.error(error);
        taskMessage.textContent = "Failed to connect to server.";
    }

}


// ===============================
// TASKS - DELETE TASK
// ===============================

async function deleteTask(id, li) {

    const taskMessage = document.getElementById("taskMessage");

    try {

        const response = await fetch(`http://localhost:3000/api/tasks/${id}`, {
            method: "DELETE"
        });

        if (response.status === 204) {
            li.remove();
        } else {
            taskMessage.textContent = "Failed to delete task.";
        }

    } catch (error) {
        console.error(error);
        taskMessage.textContent = "Failed to connect to server.";
    }

}


// ===============================
// CHECK LOGIN ON PAGE LOAD
// ===============================

window.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");

    if (token) {
        getProfile();
    } else {
        showLogin();
    }

});