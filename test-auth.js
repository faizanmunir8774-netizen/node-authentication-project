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
            headers: {
                ...headers
            }
        };

        if (data) {
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let responseData = "";

            res.on("data", (chunk) => {
                responseData += chunk;
            });

            res.on("end", () => {
                let parsedData;

                try {
                    parsedData = responseData
                        ? JSON.parse(responseData)
                        : {};
                } catch {
                    parsedData = responseData;
                }

                resolve({
                    status: res.statusCode,
                    body: parsedData
                });
            });
        });

        req.on("error", (error) => {
            reject(error);
        });

        if (data) {
            req.write(data);
        }

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
    console.log("   NODE AUTH AUTOMATIC TESTS");
    console.log("================================\n");

    // Unique email so registration works every time
    const email = `test${Date.now()}@example.com`;
    const password = "123456";
    const name = "Automatic Test User";

    let token = "";

    // 1. Home / Server Test
    await test("Server / Home Route", async () => {
        const response = await request("GET", "/");

        expect(
            response.status === 200,
            `Expected 200 but got ${response.status}`
        );
    });

    // 2. Get All Users
    await test("Get All Users", async () => {
        const response = await request("GET", "/users");

        expect(
            response.status === 200,
            `Expected 200 but got ${response.status}`
        );
    });

    // 3. Successful Registration
    await test("Successful Registration", async () => {
        const response = await request("POST", "/users", {
            name: name,
            email: email,
            password: password
        });

        expect(
            response.status === 201,
            `Expected 201 but got ${response.status}`
        );

        expect(
            response.body.message === "User created successfully",
            "Unexpected registration message"
        );
    });

    // 4. Duplicate Email
    await test("Duplicate Email", async () => {
        const response = await request("POST", "/users", {
            name: "Another User",
            email: email,
            password: password
        });

        expect(
            response.status === 409,
            `Expected 409 but got ${response.status}`
        );

        expect(
            response.body.message === "Email already exists",
            "Unexpected duplicate email message"
        );
    });

    // 5. Missing Fields
    await test("Missing Required Fields", async () => {
        const response = await request("POST", "/users", {
            name: "",
            email: "",
            password: ""
        });

        expect(
            response.status === 400,
            `Expected 400 but got ${response.status}`
        );
    });

    // 6. Short Password
    await test("Short Password Validation", async () => {
        const response = await request("POST", "/users", {
            name: "Short Password User",
            email: `short${Date.now()}@example.com`,
            password: "123"
        });

        expect(
            response.status === 400,
            `Expected 400 but got ${response.status}`
        );

        expect(
            response.body.message ===
                "Password must be at least 6 characters long",
            "Unexpected password validation message"
        );
    });

    // 7. Invalid Email
    await test("Invalid Email Validation", async () => {
        const response = await request("POST", "/users", {
            name: "Invalid Email User",
            email: "wrong-email",
            password: "123456"
        });

        expect(
            response.status === 400,
            `Expected 400 but got ${response.status}`
        );

        expect(
            response.body.message ===
                "Please provide a valid email address",
            "Unexpected email validation message"
        );
    });

    // 8. Successful Login
    await test("Successful Login + JWT", async () => {
        const response = await request("POST", "/login", {
            email: email,
            password: password
        });

        expect(
            response.status === 200,
            `Expected 200 but got ${response.status}`
        );

        expect(
            response.body.message === "Login successful",
            "Unexpected login message"
        );

        expect(
            response.body.token,
            "JWT token was not returned"
        );

        token = response.body.token;
    });

    // 9. Wrong Password
    await test("Wrong Password", async () => {
        const response = await request("POST", "/login", {
            email: email,
            password: "wrong123"
        });

        expect(
            response.status === 401,
            `Expected 401 but got ${response.status}`
        );

        expect(
            response.body.message === "Invalid email or password",
            "Unexpected wrong password message"
        );
    });

    // 10. Protected Profile Tests
    await test("Profile Without Token", async () => {
        const response = await request("GET", "/profile");

        expect(
            response.status === 401,
            `Expected 401 but got ${response.status}`
        );
    });

    await test("Profile With Invalid Token", async () => {
        const response = await request(
            "GET",
            "/profile",
            null,
            {
                Authorization: "Bearer invalid-token"
            }
        );

        expect(
            response.status === 403,
            `Expected 403 but got ${response.status}`
        );
    });

    await test("Profile With Valid JWT", async () => {
        const response = await request(
            "GET",
            "/profile",
            null,
            {
                Authorization: `Bearer ${token}`
            }
        );

        expect(
            response.status === 200,
            `Expected 200 but got ${response.status}`
        );

        expect(
            response.body.user,
            "User information not returned"
        );
    });

    console.log("\n================================");
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("================================");

    if (failed === 0) {
        console.log("\n🎉 ALL AUTHENTICATION TESTS PASSED!\n");
    } else {
        console.log("\n⚠ Some tests failed.\n");
        process.exitCode = 1;
    }
}

runTests();