# Node.js Authentication + To-Do App

A full-stack web application with user authentication and to-do list feature.

## Live URL

https://node-authentication-project-production.up.railway.app

## What the app does

- User registration with email and password
- User login with JWT authentication
- Protected profile page
- Add, complete, and delete to-do tasks
- Tasks are saved in MySQL database
- Each user sees only their own tasks

## Folder Structure

node-project/
├── middleware/
│ └── auth.js # JWT authentication middleware
├── public/ # Frontend files served by Express
│ ├── index.html
│ ├── script.js
│ └── style.css
├── routes/
│ ├── auth.js # Register, Login, Profile routes
│ └── tasks.js # Tasks API routes
├── db.js # MySQL connection pool
├── index.js # Main server file
├── .env.example # Environment variables example
└── package.json


## How to install

npm install

## How to create the database

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    is_done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL DEFAULT 1
);

## How to configure .env

Copy .env.example to .env and fill in your values:

JWT_SECRET=your_jwt_secret_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=node_auth
PORT=3000

## How to run

npm start

Then open http://localhost:3000 in your browser.