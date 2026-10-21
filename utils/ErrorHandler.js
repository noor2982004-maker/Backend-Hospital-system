export const ErrorHandler = (err, req, res, next) => {

  let statusCode = err.statusCode || 500;
  let message = err.message || "server error";


  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map(e => e.message)
      .join(", ");
  }


  else if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value";
  }


  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

 
console.log(err.name, err.message);
  res.status(statusCode).json({
    success: false,
    message
  });
};