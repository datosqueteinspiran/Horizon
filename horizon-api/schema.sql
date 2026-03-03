-- MariaDB Schema for Horizon

CREATE DATABASE IF NOT EXISTS horizon_db;
USE horizon_db;

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    initials VARCHAR(5),
    color VARCHAR(20),
    can_edit BOOLEAN DEFAULT FALSE,
    can_view_all BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_projects (
    user_id VARCHAR(50),
    project_id VARCHAR(50),
    PRIMARY KEY (user_id, project_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS objectives (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50),
    title VARCHAR(100) NOT NULL,
    `order` INT DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    objective_id VARCHAR(50),
    content TEXT NOT NULL,
    status ENUM('To Do', 'Doing', 'Done') DEFAULT 'To Do',
    priority ENUM('Urgente', 'Alta', 'Media', 'Baja') DEFAULT 'Media',
    assigned_to VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);
