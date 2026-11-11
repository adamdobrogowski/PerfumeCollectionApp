// Walidacja danych wejściowych rejestracji.
const EMAIL_MAX_LENGTH = 254;   
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

const ASCII_PRINTABLE = /^[\x21-\x7E]+$/;
const EMAIL_PATTERN = /^[^@]+@[^@]+\.[^@]+$/;

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function validateRegistration (body) {
    const input = body ?? {};
    const errors = {};
    let email = null;
    let password = null;

    if(typeof input.email !== 'string') {
        errors.email = 'Podaj adres e-mail.';
    } else {
        const normalized = normalizeEmail(input.email);
        const valid = normalized.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(normalized) && ASCII_PRINTABLE.test(normalized);
        
        if(valid) {
            email = normalized;
        } else {
            errors.email = 'Nieprawidłowy adres e-mail.';
        }
    }

    if(typeof input.password !== 'string') {
        errors.password = 'Podaj hasło.';
    } else {
        const length = Array.from(input.password).length;
        if(length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
            errors.password = `Hasło musi mieć od ${PASSWORD_MIN_LENGTH} do ${PASSWORD_MAX_LENGTH} znaków.`;
        } else {
            password = input.password;
        } 
    }

    if(Object.keys(errors).length > 0) {
        return { errors };
    }

    return { value: { email, password } };
}

function validateLogin (body) {
    const input = body ?? {};
    if (typeof input.email !== 'string' || typeof input.password !== 'string') {
        return { error: 'Podaj adres e-mail i hasło.' };
    }
    const email = normalizeEmail(input.email);
    if (email.length === 0 || email.length > EMAIL_MAX_LENGTH
        || input.password.length === 0 || Array.from(input.password).length > PASSWORD_MAX_LENGTH) {
        return { error: 'Podaj adres e-mail i hasło.' };
    }
    return { value: { email, password: input.password } };
}

function validatePasswordChange (body) {
    const input = body ?? {};
    const errors = {};

    if (typeof input.currentPassword !== 'string' || input.currentPassword.length === 0
        || Array.from(input.currentPassword).length > PASSWORD_MAX_LENGTH) {
        errors.currentPassword = 'Podaj obecne hasło.';
    }

    if (typeof input.newPassword !== 'string') {
        errors.newPassword = 'Podaj nowe hasło.';
    } else {
        const length = Array.from(input.newPassword).length;
        if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
            errors.newPassword = `Hasło musi mieć od ${PASSWORD_MIN_LENGTH} do ${PASSWORD_MAX_LENGTH} znaków.`;
        }
    }

    if (Object.keys(errors).length > 0) {
        return { errors };
    }
    return { value: { currentPassword: input.currentPassword, newPassword: input.newPassword } };
}

function validateDeleteAccount(body) {
    const input = body ?? {};
    if (typeof input.password !== 'string' || input.password.length === 0
        || Array.from(input.password).length > PASSWORD_MAX_LENGTH) {
        return { error: 'Podaj hasło.' };
    }
    return { value: { password: input.password } };
}

module.exports = {
    validateRegistration,
    validateLogin,
    validatePasswordChange,
    validateDeleteAccount
};