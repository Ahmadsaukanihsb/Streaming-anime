const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmptyValue(value, allowEmptyString) {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') {
        if (allowEmptyString) return false;
        return value.trim().length === 0;
    }
    return false;
}

function isNumberLike(value) {
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'string' && value.trim().length > 0) {
        return Number.isFinite(Number(value));
    }
    return false;
}

function validateBody(rules, options = {}) {
    return (req, res, next) => {
        const errors = [];

        for (const rule of rules) {
            const value = req.body?.[rule.field];
            const empty = isEmptyValue(value, rule.allowEmptyString);

            if (rule.required && empty) {
                errors.push({ field: rule.field, message: 'Required' });
                continue;
            }

            if (empty) continue;

            if (rule.type === 'string') {
                if (typeof value !== 'string') {
                    errors.push({ field: rule.field, message: 'Must be a string' });
                    continue;
                }
                const length = value.trim().length;
                if (rule.minLength && length < rule.minLength) {
                    errors.push({ field: rule.field, message: `Minimum length is ${rule.minLength}` });
                }
                if (rule.maxLength && length > rule.maxLength) {
                    errors.push({ field: rule.field, message: `Maximum length is ${rule.maxLength}` });
                }
                if (rule.pattern && !rule.pattern.test(value)) {
                    errors.push({ field: rule.field, message: 'Invalid format' });
                }
            }

            if (rule.type === 'number') {
                if (!isNumberLike(value)) {
                    errors.push({ field: rule.field, message: 'Must be a number' });
                    continue;
                }
                const num = Number(value);
                if (rule.integer && !Number.isInteger(num)) {
                    errors.push({ field: rule.field, message: 'Must be an integer' });
                }
                if (rule.min !== undefined && num < rule.min) {
                    errors.push({ field: rule.field, message: `Minimum is ${rule.min}` });
                }
                if (rule.max !== undefined && num > rule.max) {
                    errors.push({ field: rule.field, message: `Maximum is ${rule.max}` });
                }
            }

            if (rule.type === 'boolean') {
                if (typeof value !== 'boolean') {
                    errors.push({ field: rule.field, message: 'Must be a boolean' });
                }
            }

            if (rule.type === 'array') {
                if (!Array.isArray(value)) {
                    errors.push({ field: rule.field, message: 'Must be an array' });
                }
            }

            if (rule.enum && !rule.enum.includes(value)) {
                errors.push({ field: rule.field, message: 'Invalid value' });
            }
        }

        if (options.atLeastOne && Array.isArray(options.atLeastOne)) {
            const hasAny = options.atLeastOne.some((field) => !isEmptyValue(req.body?.[field], false));
            if (!hasAny) {
                errors.push({ field: options.atLeastOne.join(', '), message: 'At least one field is required' });
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation error',
                details: errors
            });
        }

        next();
    };
}

module.exports = {
    validateBody,
    EMAIL_REGEX
};
