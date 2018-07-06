DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL CHECK(first_name!=""),
        last_name VARCHAR(50) NOT NULL CHECK(last_name!=""),
        signature TEXT NOT NULL CHECK(signature!=""),
        time_stamp TIMESTAMP
);
