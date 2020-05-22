module.exports  = function requiresLogin(req, res, next) {
    if (req.session && req.session.uid && req.session.user) {
      return next();
    } else {
      req.session.destroy();
      return res.status(401).json({
        message:'Unauthorized',
        erro:'No session'
      });
    }
}
