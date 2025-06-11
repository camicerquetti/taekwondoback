// Cargar las variables de entorno desde el archivo .env
require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET,  // Obtiene la clave secreta desde el .env
    jwtExpiresIn: process.env.JWT_EXPIRES_IN // Obtiene el tiempo de expiración desde el .env
};
