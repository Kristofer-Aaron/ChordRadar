export function authorizeRole(...roles) {
  return (req, res, next) =>
    roles.includes(req.user?.role) ? next() : res.status(403).json({ error: "Forbidden" });
}

export function authorizeSelfOrAdmin(param = 'id') {
  return (req, res, next) => {
    const targetId = Number(req.params[param]);
    const isSelf = req.user?.id === targetId;
    const isAdmin = req.user?.role === 'admin';
    return isSelf || isAdmin
      ? next()
      : res.status(403).json({ error: "Forbidden" });
  };
}