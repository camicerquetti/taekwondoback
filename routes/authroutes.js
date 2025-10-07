const express = require('express');
const authController = require('../controllers/authcontroller');
const upload = require('../middlewares/multer'); // importa multer configurado
const { sendMail } = require('../controllers/authcontroller');

const router = express.Router();


// Ruta para registrar un usuario (Paso 1: Registro Básico)
router.post('/register-step1', authController.registerStep1);

// Ruta para el segundo paso del registro (Paso 2: Detalles adicionales)
router.post('/register-step2', authController.registerStep2);
router.get('/usuarios/:id', authController.getUserById);
// luego defines las rutas
router.delete('/usuarios/:id', authController.deleteUserById);
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
// Ruta para eliminar escuela por ID
router.delete('/escuelas/:id', authController.deleteEscuelaById);
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



// Rutas para tul_contenidos:
// GET todos o filtrados por query ?tul_id=...
router.get('/tul_contenidos', authController.getTulContenidos);

// GET por ID
router.get('/tul_contenidos/:id', authController.getTulContenidoById);


// POST para crear contenido con imagen
router.post('/tul_contenidos', upload.single('imagen'), authController.createTulContenido);

// PUT para actualizar contenido con imagen
router.put('/tul_contenidos/:id', upload.single('imagen'), authController.updateTulContenido);
// DELETE
router.delete('/tul_contenidos/:id', authController.deleteTulContenido);
// Ruta PUT para actualizar postura con hasta 2 imágenes
router.put(
  '/posturas/:id',
  upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'imagen2', maxCount: 1 }
  ]),
  authController.updatePostura
);
const { saveInstructorRelations } = require('../controllers/authcontroller');

router.post('/save-instructor-relations', saveInstructorRelations);
router.post('/send-mail', sendMail);
// Ruta para actualizar dojan y escuela del usuario
router.post('/actualizarDojan', authController.actualizarDojan);
// authroutes.js
const { resetPassword, sendPasswordResetEmail /* etc */ } = require('../controllers/authcontroller');
router.put('/reset-password', resetPassword);
router.post('/dojan', authController.registrarDojan);
router.put('/notas/:id', authController.updateNota);  // Ruta para editar
router.delete('/notas/:id', authController.deleteNota); // Ruta para borrar
// Ruta GET para obtener una postura por id
// Ruta para guardar información del formulario
// Ruta que recibe datos + imágenes (campo 'imagenes' para las fotos)
router.post('/informacion', upload.array('imagenes'), authController.crearInformacion);
router.get('/informacion/:id_tul', authController.verInformacion);
router.put('/informacion/:id', upload.array('imagenes'), authController.editarInformacion);

// Ruta para buscar escuelas por ciudad y dirección
router.post('/escuelas/buscar', authController.buscarEscuelaPorCiudadDireccion);
// Ruta para obtener postura por nombre (usando query params)
router.get('/postura', authController.obtenerPostura);
// Ruta para crear un nuevo registro
router.post('/crear-introduccion', authController.crearIntroduccion);
// Ruta para editar un registro existente
router.put('/editar-introduccion/:id', authController.editarIntroduccion);

// Ruta GET para obtener todas las introducciones
router.get('/introducciones',authController.obtenerTodasLasIntroducciones);
router.delete('/tul_contenidos/:id', authController.deleteTulContenido);
// Ruta para eliminar secciones por ID
router.delete('/secciones', authController.eliminarSecciones);
module.exports = router;
