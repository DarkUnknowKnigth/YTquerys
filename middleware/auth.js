module.exports  = function requiresLogin(req, res, next) {
    if (req.body.session && req.body.session.uid && req.body.user) {
      return next();
    } else {
      req.session.destroy();
      return res.status(401).json({
        message:'Unauthorized',
        erro:'No session'
      });
    }
}
