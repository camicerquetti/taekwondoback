const express = require('express');
const authController = require('../controllers/authcontroller');
const upload = require('../middlewares/multer'); // importa multer configurado

const router = express.Router();


// Ruta para registrar un usuario (Paso 1: Registro Básico)
router.post('/register-step1', authController.registerStep1);

// Ruta para el segundo paso del registro (Paso 2: Detalles adicionales)
router.post('/register-step2', authController.registerStep2);
router.get('/usuarios/:id', authController.getUserById);

router.get('/usuarios', authController.getAllUsuarios);
// Ruta para descargar CSV de usuarios
router.get('/usuarios/export', authController.exportarUsuariosCSV);
// Ruta para iniciar sesión
router.post('/login', authController.loginUser);
// Ruta para recuperación de contraseña
router.post('/reset-password', authController.sendPasswordResetEmail);
// Ruta para obtener el plan del usuario
router.get('/user/plan/:userId', authController.getUserPlan);
router.get('/tules', authController.getAllTules);
router.get('/tules/:id', authController.getTuleById); // Obtener tule por ID
router.post('/tules', authController.createTule); // Crear tule
// Ruta para actualizar un usuario por ID
router.put('/usuarios/:id', authController.updateUser);
router.post('/notas', authController.createNota);
router.get('/notas/:posturaId/:userId', authController.getNotas);

router.get('/escuelas', authController.getEscuelas);
router.get('/escuelas/:id', authController.getEscuelaById);
router.post('/escuelas', authController.createEscuela);
router.put('/escuelas/:id', authController.updateEscuela);
router.delete('/escuelas/:id', authController.deleteEscuela);
router.delete('/tules/:id', authController.deleteTule); // Eliminar tule (lógico)
// Ruta para obtener posturas por Tul
router.get('/posturas/:tulId', authController.getPosturasPorTul);
router.put('/tules/:id', upload.single('imagen'), authController.updateTule);
// Middleware para loggear todas las requests
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});




module.exports = router;
