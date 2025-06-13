const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authroutes');

dotenv.config();

const app = express();
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Middleware para procesar el cuerpo de las solicitudes
app.use(express.json({ limit: '10mb' }));


// Habilitar CORS (si es necesario)
app.use(cors());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
setInterval(() => {
  db.query('SELECT 1');
}, 5 * 60 * 1000); // cada 5 minutos
