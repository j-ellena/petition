const spicedPg = require("spiced-pg");
let db;

if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
}

// *****************************************************************************
// signatures table queries
// *****************************************************************************

exports.insertSigner = (userId, signature) => {
    const params = [userId, signature];
    const q = `
            INSERT INTO signatures (user_id, signature)
                VALUES ($1, $2)
            RETURNING *;
            `;
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.getNumber = () => {
    const q = `SELECT COUNT(*) FROM signatures;`;
    return db.query(q).then(results => {
        return results.rows[0].count;
    });
};

exports.getSignature = userId => {
    const params = [userId];
    const q = `
            SELECT signature FROM signatures WHERE user_id = $1;
            `;
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

// *****************************************************************************
// users table queries
// *****************************************************************************

exports.insertUser = (firstName, lastName, email, hashedPassword) => {
    const params = [firstName, lastName, email, hashedPassword];
    const q = `
             INSERT INTO users
                (first_name, last_name, email, hashed_password)
                VALUES ($1, $2, $3, $4)
             RETURNING id, first_name, last_name, email;
              `;
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.getPassword = email => {
    const params = [email];
    const q = `
            SELECT hashed_password FROM users WHERE email = $1;
            `;
    return db.query(q, params).then(results => {
        if (results.rows[0] === undefined) throw new Error("Email not found!");
        return results.rows[0].hashed_password;
    });
};

exports.getEmail = email => {
    const params = [email];
    const q = `
            SELECT * FROM users WHERE email = $1;
            `;
    return db.query(q, params).then(results => {
        if (results.rows[0] !== undefined)
            throw new Error("This email is already registered!");
    });
};

exports.getUser = email => {
    const params = [email];
    const q = `
            SELECT id, first_name, last_name, email FROM users WHERE email = $1;
            `;
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

// *****************************************************************************
// user_profiles table queries
// *****************************************************************************

exports.insertProfile = (userId, age, city, homepage) => {
    const params = [userId, age || null, city || null, homepage || null];
    const q = `
             INSERT INTO user_profiles
                (user_id, age, city, homepage)
                VALUES ($1, $2, $3, $4)
             RETURNING *;
              `;
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

// *****************************************************************************
// joined table queries
// *****************************************************************************

exports.getSigners = () => {
    const q = `
        SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.city, user_profiles.homepage
            FROM users
            JOIN user_profiles
            ON user_profiles.user_id = users.id
            `;
    return db.query(q).then(results => {
        return results.rows;
    });
};

exports.getCity = city => {
    const params = [city];
    const q = `
        SELECT users.first_name, users.last_name, user_profiles.age, user_profiles.homepage
            FROM users
            JOIN user_profiles ON user_profiles.user_id = users.id
            WHERE user_profiles.city = $1;
            `;
    return db.query(q, params).then(results => {
        return results.rows;
    });
};
