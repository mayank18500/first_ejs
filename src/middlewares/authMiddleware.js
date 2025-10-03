exports.ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please login to view this page');
  res.redirect('/auth/login');
};
