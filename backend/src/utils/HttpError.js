// lets any file throw an error that carries an HTTP status
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
module.exports = HttpError;