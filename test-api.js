const http = require("http");

const BASE_URL = "http://127.0.0.1:3000";

let passed = 0;
let failed = 0;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);

        const data = body ? JSON.stringify(body) : null;

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: { ...headers }
        };

        if (data) {
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let responseData = "";
            res.on("data", (chunk) => { responseData += chunk; });
            res.on("end", () => {
                let parsedData;
                try {
                    parsedData = responseData ? JSON.parse(responseData) : {};
                } catch {
                    parsedData = responseData;
                }
                resolve({ status: res.statusCode, body: parsedData });
            });
        });

        req.on("error", (error) => { reject(error); });
        if (data) { req.write(data); }
        req.end();
    });
}

async function test(name, testFunction) {
    try {
        await testFunction();
        console.log(`✓ ${name}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Reason: ${error.message}`);
        failed++;
    }
}

function expect(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function runTests() {

    console.log("\n================================");
    console.log("   NODE AUTH + TASKS API TESTS");
    console.log("================================\n");

    const email = `test${Date.now()}@example.com`;
    const password = "123456";
    const name = "Automatic Test User";

    let token = "";
    let taskId = null;

    // ==================
    // AUTH TESTS
    // ==================

    await test("Server / Home Route", async () => {
        const response = await request("GET", "/");
        expect(response.status === 200, `Expected 200 but got ${response.status}`);
    });

    await test("Get All Users", async () => {
        const response = await request("GET", "/users");
        expect(response.status === 200, `Expected 200 but got ${response.status}`);
    });

    await test("Successful Registration", async () => {
        const response = await request("POST", "/users", { name, email, password });
        expect(response.status === 201, `Expected 201 but got ${response.status}`);
        expect(response.body.message === "User created successfully", "Unexpected registration message");
    });

    await test("Duplicate Email", async () => {
        const response = await request("POST", "/users", { name: "Another User", email, password });
        expect(response.status === 409, `Expected 409 but got ${response.status}`);
        expect(response.body.message === "Email already exists", "Unexpected duplicate email message");
    });

    await test("Missing Required Fields", async () => {
        const response = await request("POST", "/users", { name: "", email: "", password: "" });
        expect(response.status === 400, `Expected 400 but got ${response.status}`);
    });

    await test("Short Password Validation", async () => {
        const response = await request("POST", "/users", {
            name: "Short Password User",
            email: `short${Date.now()}@example.com`,
            password: "123"
        });
        expect(response.status === 400, `Expected 400 but got ${response.status}`);
        expect(response.body.message === "Password must be at least 6 characters long", "Unexpected password validation message");
    });

    await test("Invalid Email Validation", async () => {
        const response = await request("POST", "/users", {
            name: "Invalid Email User",
            email: "wrong-email",
            password: "123456"
        });
        expect(response.status === 400, `Expected 400 but got ${response.status}`);
        expect(response.body.message === "Please provide a valid email address", "Unexpected email validation message");
    });

    await test("Successful Login + JWT", async () => {
        const response = await request("POST", "/login", { email, password });
        expect(response.status === 200, `Expected 200 but got ${response.status}`);
        expect(response.body.token, "JWT token was not returned");
        token = response.body.token;
    });

    await test("Wrong Password", async () => {
        const response = await request("POST", "/login", { email, password: "wrong123" });
        expect(response.status === 401, `Expected 401 but got ${response.status}`);
        expect(response.body.message === "Invalid email or password", "Unexpected wrong password message");
    });

    await test("Profile Without Token", async () => {
        const response = await request("GET", "/profile");
        expect(response.status === 401, `Expected 401 but got ${response.status}`);
    });

    await test("Profile With Invalid Token", async () => {
        const response = await request("GET", "/profile", null, { Authorization: "Bearer invalid-token" });
        expect(response.status === 403, `Expected 403 but got ${response.status}`);
    });

    await test("Profile With Valid JWT", async () => {
        const response = await request("GET", "/profile", null, { Authorization: `Bearer ${token}` });
        expect(response.status === 200, `Expected 200 but got ${response.status}`);
        expect(response.body.user, "User information not returned");
    });


    // ==================
    // TASKS TESTS
    // ==================

    await test("Get Tasks Without Token - 401", async () => {
        const response = await request("GET", "/api/tasks");
        expect(response.status === 401, `Expected 401 but got ${response.status}`);
    });

    await test("Create Task - Empty Title - 400", async () => {
        const response = await request("POST", "/api/tasks", { title: "" }, { Authorization: `Bearer ${token}` });
        expect(response.status === 400, `Expected 400 but got ${response.status}`);
        expect(response.body.error === "Title is required", "Unexpected error message");
    });

    await test("Create Task - Success - 201", async () => {
        const response = await request("POST", "/api/tasks", { title: "Test Task" }, { Authorization: `Bearer ${token}` });
        expect(response.status === 201, `Expected 201 but got ${response.status}`);
        expect(response.body.id, "Task id was not returned");
        taskId = response.body.id;
    });

    await test("Get All Tasks - Success", async () => {
        const response = await request("GET", "/api/tasks", null, { Authorization: `Bearer ${token}` });
        expect(response.status === 200, `Expected 200 but got ${response.status}`);
        expect(Array.isArray(response.body), "Response should be an array");
    });

    await test("Mark Task Done - Success", async () => {
        const response = await request("PATCH", `/api/tasks/${taskId}`, { is_done: true }, { Authorization: `Bearer ${token}` });
        expect(response.status === 200, `Expected 200 but got ${response.status}`);
    });

    await test("Mark Task Done - Wrong ID - 404", async () => {
        const response = await request("PATCH", "/api/tasks/99999", { is_done: true }, { Authorization: `Bearer ${token}` });
        expect(response.status === 404, `Expected 404 but got ${response.status}`);
    });

    await test("Delete Task - Success", async () => {
        const response = await request("DELETE", `/api/tasks/${taskId}`, null, { Authorization: `Bearer ${token}` });
        expect(response.status === 204, `Expected 204 but got ${response.status}`);
    });

    await test("Delete Task - Wrong ID - 404", async () => {
        const response = await request("DELETE", "/api/tasks/99999", null, { Authorization: `Bearer ${token}` });
        expect(response.status === 404, `Expected 404 but got ${response.status}`);
    });


    console.log("\n================================");
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("================================");

    if (failed === 0) {
        console.log("\n🎉 ALL TESTS PASSED!\n");
    } else {
        console.log("\n⚠ Some tests failed.\n");
        process.exitCode = 1;
    }
}

runTests();