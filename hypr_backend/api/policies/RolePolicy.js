module.exports = async (req, res, next) => {
    try {
        const { locals: { userData: { role } } } = res;
        const { HyprRoles: { CONSUMER, SUPERVISOR, COMPANY_OWNER, DELIVERY, ADMIN, SUPER_AGENT }, SLUGS: { WAREHOUSE } } = Constants;
        if (role.id !== CONSUMER && role.id !== SUPERVISOR && role.id !== COMPANY_OWNER && role.id !== DELIVERY && role.id !== ADMIN && role.id !== SUPER_AGENT && role.name !== WAREHOUSE ) return res.unauthorized();
        next();
    }
    catch (err) {
        res.badRequest(err.message);
    }
};
