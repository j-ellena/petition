DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    signature TEXT NOT NULL CHECK(signature!=''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL CHECK(first_name!=''),
    last_name VARCHAR(50) NOT NULL CHECK(last_name!=''),
    email VARCHAR(50) NOT NULL CHECK(email!='') UNIQUE,
    hashed_password VARCHAR(100) NOT NULL CHECK(hashed_password!=''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
