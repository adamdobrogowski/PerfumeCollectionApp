// Haszowanie i weryfikacja haseł (Argon2id).
// Cały hash (algorytm, parametry, sól i wynik) trafia jako jeden napis do users.password_hash.

const argon2 = require('argon2');

const HASH_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
};

async function hashPassword(password) {
    return await argon2.hash(password, HASH_OPTIONS);
}

async function verifyPassword(storedHash, plainPassword) {
    try {
        return await argon2.verify(storedHash, plainPassword);
    } catch (err) {
        console.error("Nie udało się zweryfikować hasha hasła:", err.message);
        return false;
    }
}

let dummyHashPromise = null;

async function verifyDummyPassword(plainPassword) {
    if (!dummyHashPromise) {
        dummyHashPromise = hashPassword("atrapa-wyrownujaca-czas-odpowiedzi");
    }
    return verifyPassword(await dummyHashPromise, plainPassword);
}

module.exports = {
    hashPassword,
    verifyPassword,
    verifyDummyPassword
};
