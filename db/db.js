const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

exports.insertSigner = (firstName, lastName, signature) => {
    const q = `
             INSERT INTO signatures (first_name, last_name, signature, time_stamp)
                VALUES ($1, $2, $3, $4)
             RETURNING *
              `;
    const params = [firstName, lastName, signature, new Date()];
    return db.query(q, params).then(results => {
        return results.rows[0];
    });
};

exports.returnSigners = () => {
    const q = `SELECT * FROM signatures;`;
    return db.query(q).then(results => {
        return results.rows;
    });
};

exports.getNumber = () => {
    const q = `SELECT COUNT(*) FROM signatures;`;
    return db.query(q).then(results => {
        return results.rows[0].count;
    });
};

exports.getSignature = signerId => {
    const q = `SELECT signature FROM signatures WHERE id = $1;`;
    const params = [signerId];
    return db.query(q, params).then(results => {
        return results.rows[0].signature;
    });
};
