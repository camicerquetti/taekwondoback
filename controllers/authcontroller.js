const db = require('../config/db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Paso 1: Registrar datos básicos
exports.registerStep1 = async (req, res) => {
  try {
    console.log('Datos recibidos en el cuerpo:', req.body);

    if (!req.body) {
      return res.status(400).json({ message: 'No se enviaron datos en la solicitud.' });
    }

    const { email, password, nombre, apellido } = req.body;

    if (!email || !password || !nombre || !apellido) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    const username = email;

    // ✅ Cambiado 'king' por 'usuarios'
    const [existingUser] = await db.query(
      'SELECT * FROM usuarios WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El usuario o correo ya están registrados.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO usuarios (username, email, password, nombre, apellido)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, nombre, apellido]
    );

    return res.status(201).json({ message: 'Usuario registrado exitosamente en el paso 1.' });
  } catch (error) {
    console.error('Error en registerStep1:', error);
    return res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Paso 2: Completar el perfil
exports.registerStep2 = async (req, res) => {
  const { username, plan, role, fecha_nacimiento, pais, grado, graduacion, instructor_mayor } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username es obligatorio para completar el registro.' });
  }

  try {
    const [user] = await db.query('SELECT * FROM usuarios WHERE username = ?', [username]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    await db.query(
      `UPDATE usuarios SET plan = ?, role = ?, fecha_nacimiento = ?, pais = ?, grado = ?, graduacion = ?, instructor_mayor = ?
       WHERE username = ?`,
      [plan, role, fecha_nacimiento, pais, grado, graduacion, instructor_mayor, username]
    );

    res.status(200).json({ message: 'Datos completados exitosamente en el paso 2.' });
  } catch (error) {
    console.error('Error en registerStep2:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};


// Login de usuario
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const [user] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const validPassword = await bcrypt.compare(password, user[0].password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // Enviar datos incluyendo el plan
    const userData = {
      id: user[0].id,
      nombre: user[0].nombre,
      email: user[0].email,
      role: user[0].role,
      plan: user[0].plan,   // Agregas el plan aquí
    };
    

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: userData
    });
  } catch (error) {
    console.error('Error en loginUser:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Nueva función: Enviar email de recuperación de contraseña
exports.sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email es obligatorio.' });
  }

  try {
    const [user] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar o actualizar token
    await db.query(`
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)
    `, [email, token, expiresAt]);

    // Configurar el transporte de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'devsfullstack2024@gmail.com',              // <- CAMBIA esto
        pass: '@hola2025'     // <- CAMBIA esto
      }
    });

    const resetLink = `https://tudominio.com/reset-password?token=${token}`;

    await transporter.sendMail({
      from: 'no-reply@tudominio.com',
      to: email,
      subject: 'Recuperación de contraseña',
      text: `Hola, haz clic en este enlace para restablecer tu contraseña:\n\n${resetLink}\n\nEste enlace expira en 1 hora.`
    });

    res.status(200).json({ message: 'Correo de recuperación enviado con éxito.' });
  } catch (error) {
    console.error('Error en sendPasswordResetEmail:', error);
    res.status(500).json({ message: 'Error del servidor al enviar el email.' });
  }
};
// Obtener el plan del usuario
// Obtener el plan del usuario por userId (desde params)
exports.getUserPlan = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'Falta el parámetro userId.' });
  }

  try {
    // Consulta para obtener el plan del usuario activo
    const [rows] = await db.query(
      'SELECT plan FROM usuarios WHERE id = ? AND estado = "activo"',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    return res.status(200).json({ userId, plan: rows[0].plan });
  } catch (error) {
    console.error('Error en getUserPlan:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
// Obtener todos los tules
exports.getAllTules = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tuls WHERE activo = 1');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error al obtener tules:', error);
    res.status(500).json({ message: 'Error al obtener los tules.' });
  }
};

// Obtener un tule por ID
exports.getTuleById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM tuls WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tule no encontrado.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error al obtener tule:', error);
    res.status(500).json({ message: 'Error al obtener el tule.' });
  }
};

// Crear un nuevo tule
exports.createTule = async (req, res) => {
  const { nombre, nivel, grado, colores } = req.body;

  if (!nombre || !nivel || !grado) {
    return res.status(400).json({ message: 'Faltan campos obligatorios.' });
  }

  try {
    await db.query(
      'INSERT INTO tuls (nombre, nivel, grado, colores, activo) VALUES (?, ?, ?, ?, 1)',
      [nombre, nivel, grado, colores]
    );
    res.status(201).json({ message: 'Tule creado correctamente.' });
  } catch (error) {
    console.error('Error al crear tule:', error);
    res.status(500).json({ message: 'Error al crear el tule.' });
  }
};
// Actualizar un tul

// Función para actualizar tul
exports.updateTule = async (req, res) => {
  const { id } = req.params;

  console.log('=== DEBUG ACTUALIZACIÓN TULE ===');
  console.log('ID del tule:', id);
  console.log('Archivo recibido:', req.file);
  console.log('Body recibido:', req.body);

  try {
    // Verificar que el tul existe
    const [rows] = await db.query('SELECT * FROM tuls WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tul no encontrado.' });
    }

    const tuleActual = rows[0];

    // Extraer datos del body (se usan los actuales como fallback)
    const {
      nombre = tuleActual.nombre,
      nivel = tuleActual.nivel,
      grado = tuleActual.grado,
      colores = tuleActual.colores,
      activo = tuleActual.activo,
      descripcion = tuleActual.descripcion,
      movimientos = tuleActual.movimientos,
      colorInicial = tuleActual.colorInicial,
      colorFinal = tuleActual.colorFinal,
      plan = tuleActual.plan,
      movimientoEditar = tuleActual.movimientoEditar,
      tituloPrincipal = tuleActual.tituloPrincipal,
      deberes = tuleActual.deberes,
      coloresCinturon = tuleActual.coloresCinturon,
      seccionesCuerpo = tuleActual.seccionesCuerpo,
      posicionPreparatoria = tuleActual.posicionPreparatoria,
      contenido = tuleActual.contenido,
      video = tuleActual.video,
      tul = tuleActual.tul
    } = req.body;

    // Archivos de imagen
    let imagen = tuleActual.imagen;
    let imagenCinturon = tuleActual.imagenCinturon;
    let imagenCuerpo = tuleActual.imagenCuerpo;
    let imagenPosicion = tuleActual.imagenPosicion;
    let logotipo = tuleActual.logotipo;

    // Manejo de archivos si vienen varios
    if (req.files) {
      if (req.files.imagen) imagen = req.files.imagen[0].filename;
      if (req.files.imagenCinturon) imagenCinturon = req.files.imagenCinturon[0].filename;
      if (req.files.imagenCuerpo) imagenCuerpo = req.files.imagenCuerpo[0].filename;
      if (req.files.imagenPosicion) imagenPosicion = req.files.imagenPosicion[0].filename;
      if (req.files.logotipo) logotipo = req.files.logotipo[0].filename;
    } else if (req.file) {
      imagen = req.file.filename;
    }

    // Actualizar base de datos
    const query = `
      UPDATE tuls SET 
        nombre = ?, 
        nivel = ?, 
        grado = ?, 
        colores = ?, 
        activo = ?, 
        descripcion = ?, 
        movimientos = ?, 
        colorInicial = ?, 
        colorFinal = ?, 
        plan = ?, 
        movimientoEditar = ?, 
        tituloPrincipal = ?, 
        deberes = ?, 
        coloresCinturon = ?, 
        imagenCinturon = ?, 
        seccionesCuerpo = ?, 
        imagenCuerpo = ?, 
        posicionPreparatoria = ?, 
        imagenPosicion = ?, 
        logotipo = ?, 
        tul = ?, 
        video = ?, 
        contenido = ?, 
        imagen = ?
      WHERE id = ?
    `;

    const queryParams = [
      nombre,
      nivel,
      grado,
      colores,
      activo,
      descripcion,
      movimientos,
      colorInicial,
      colorFinal,
      plan,
      movimientoEditar,
      tituloPrincipal,
      deberes,
      coloresCinturon,
      imagenCinturon,
      seccionesCuerpo,
      imagenCuerpo,
      posicionPreparatoria,
      imagenPosicion,
      logotipo,
      tul,
      video,
      contenido,
      imagen,
      id
    ];

    await db.query(query, queryParams);

    const [updatedRows] = await db.query('SELECT * FROM tuls WHERE id = ?', [id]);
    const updatedTul = updatedRows[0];

    // Construir URLs para las imágenes
    const baseUrl = 'http://localhost:5000/uploads/';
    const imageFields = ['imagen', 'imagenCinturon', 'imagenCuerpo', 'imagenPosicion', 'logotipo'];

    imageFields.forEach(field => {
      if (updatedTul[field]) {
        updatedTul[`${field}Uri`] = `${baseUrl}${updatedTul[field]}`;
      }
    });

    return res.status(200).json({
      message: 'Tul actualizado correctamente.',
      tul: updatedTul
    });

  } catch (error) {
    console.error('Error al actualizar tul:', error);
    return res.status(500).json({ 
      message: 'Error al actualizar el tul.', 
      error: error.message 
    });
  }
};


// Función para obtener todos los tules
exports.getAllTules = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tuls ORDER BY id DESC');
    
    // Agregar URLs de imágenes
    const tulesWithImages = rows.map(tul => {
      if (tul.imagen) {
        tul.imageUri = `http://localhost:5000/uploads/${tul.imagen}`;
      }
      return tul;
    });

    return res.status(200).json(tulesWithImages);
  } catch (error) {
    console.error('Error al obtener tules:', error);
    return res.status(500).json({ 
      message: 'Error al obtener los tules.', 
      error: error.message 
    });
  }
};

// Función para obtener un tul específico
exports.getTuleById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.query('SELECT * FROM tuls WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tul no encontrado.' });
    }
    
    const tul = rows[0];
    
    // Agregar URL de imagen si existe
    if (tul.imagen) {
      tul.imageUri = `http://localhost:5000/uploads/${tul.imagen}`;
    }
    
    return res.status(200).json(tul);
  } catch (error) {
    console.error('Error al obtener tul:', error);
    return res.status(500).json({ 
      message: 'Error al obtener el tul.', 
      error: error.message 
    });
  }
};
// Eliminar un tule (borrado lógico)
exports.deleteTule = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('UPDATE tuls SET activo = 0 WHERE id = ?', [id]);
    res.status(200).json({ message: 'Tule eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar tule:', error);
    res.status(500).json({ message: 'Error al eliminar el tule.' });
  }
};
// Obtener posturas por tul_id
exports.getPosturasPorTul = async (req, res) => {
  const { tulId } = req.params;
  console.log('tulId recibido:', tulId);  // <--- Agrega esto para debug

  try {
    const [rows] = await db.query(
      'SELECT * FROM posturas WHERE tul_id = ? ORDER BY orden ASC',
      [tulId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener posturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
exports.updateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const existingUser = rows[0];
    const fieldsToUpdate = {};
    const allowedFields = [
      'username', 'email', 'password', 'role', 'plan', 'estado',
      'nombre', 'apellido', 'fecha_nacimiento', 'pais', 'grado',
      'instructor_mayor', 'graduacion'
    ];

    // Validaciones simples
    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
      return res.status(400).json({ message: 'Email inválido.' });
    }
    if (req.body.role && !['estudiante', 'padre', 'profesor', 'admin'].includes(req.body.role)) {
      return res.status(400).json({ message: 'Rol inválido.' });
    }
    if (req.body.plan && !['basico', 'pro'].includes(req.body.plan)) {
      return res.status(400).json({ message: 'Plan inválido.' });
    }
    if (req.body.estado && !['activo', 'inactivo'].includes(req.body.estado)) {
      return res.status(400).json({ message: 'Estado inválido.' });
    }
    if (req.body.grado && !['practicante', 'gup', 'i_dan', 'ii_dan', 'iii_dan', 'iv_dan', 'v_dan', 'vi_dan'].includes(req.body.grado)) {
      return res.status(400).json({ message: 'Grado inválido.' });
    }
    if (req.body.graduacion && !['Gup',
    'I a III Dan',
    'III a VI Dan',
    'Master VII',
    'Master VIII',
    'Gran Master',].includes(req.body.graduacion)) {
      return res.status(400).json({ message: 'Graduación inválida.' });
    }
    if (req.body.fecha_nacimiento) {
      const fecha = new Date(req.body.fecha_nacimiento);
      if (isNaN(fecha.getTime())) {
        return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
      }
    }

    // Preparar campos para actualizar
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        if (field === 'password') {
          fieldsToUpdate.password = await bcrypt.hash(req.body.password.trim(), 10);
        } else {
          fieldsToUpdate[field] = req.body[field].trim?.() || req.body[field];
        }
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
    }

    const setClause = Object.keys(fieldsToUpdate)
      .map(field => `${field} = ?`)
      .join(', ');

    const values = Object.values(fieldsToUpdate);

    await db.query(
      `UPDATE usuarios SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    res.status(200).json({ message: 'Usuario actualizado correctamente.' });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};
// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [usuario] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);

    if (usuario.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(usuario[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};
exports.createNota = async (req, res) => {
  const { posturaId, interlocutor, fecha, lugar, nota, tipo, userId } = req.body;

  if (!posturaId || !nota || !userId) {
    return res.status(400).json({ message: 'Faltan campos obligatorios: posturaId, nota o userId.' });
  }

  try {
    await db.query(
      `INSERT INTO notas (postura_id, interlocutor, fecha, lugar, nota, tipo, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        posturaId,
        interlocutor || null,
        fecha || null,
        lugar || null,
        nota,
        tipo || null,
        userId,
      ]
    );

    res.status(201).json({ message: 'Nota creada exitosamente.' });
  } catch (error) {
    console.error('Error al crear nota:', error);
    res.status(500).json({ message: 'Error del servidor al crear la nota.' });
  }
};

exports.getNotas = async (req, res) => {
  const { posturaId, userId } = req.params;

  if (!posturaId || !userId) {
    return res.status(400).json({ message: 'Faltan parámetros posturaId o userId.' });
  }

  try {
    const [notas] = await db.query(
      `SELECT * FROM notas 
       WHERE postura_id = ? AND user_id = ? 
       ORDER BY fecha DESC`,
      [posturaId, userId]
    );

    res.status(200).json(notas);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener las notas.' });
  }
};

exports.getAllUsuarios = async (req, res) => {
  try {
    const [usuarios] = await db.query(
      // Selecciona solo las columnas que necesites; aquí traemos todas
      'SELECT id, username, email, role, plan, fecha_registro, estado, nombre, apellido, fecha_nacimiento, pais, grado, instructor_mayor, graduacion FROM usuarios ORDER BY id DESC'
    );
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error del servidor al obtener los usuarios.' });
  }
};
exports.exportarUsuariosCSV = async (req, res) => {
  try {
    // 1. Obtener todos los usuarios
    const [usuarios] = await db.query(`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        plan, 
        DATE_FORMAT(fecha_registro, '%Y-%m-%d') AS fecha_registro,
        estado, 
        nombre, 
        apellido, 
        DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
        pais, 
        grado, 
        instructor_mayor, 
        graduacion
      FROM usuarios
      ORDER BY id DESC
    `);

    // 2. Construir CSV
    const encabezados = [
      'id',
      'username',
      'email',
      'role',
      'plan',
      'fecha_registro',
      'estado',
      'nombre',
      'apellido',
      'fecha_nacimiento',
      'pais',
      'grado',
      'instructor_mayor',
      'graduacion'
    ];
    const line1 = encabezados.join(',');

    const filas = usuarios.map((u) => {
      const valores = [
        u.id,
        u.username,
        u.email,
        u.role,
        u.plan,
        u.fecha_registro,
        u.estado,
        u.nombre,
        u.apellido,
        u.fecha_nacimiento,
        u.pais,
        u.grado,
        u.instructor_mayor ?? '',
        u.graduacion
      ];
      const escapado = valores.map((celda) => {
        if (celda == null) return '';
        const texto = celda.toString().replace(/"/g, '""');
        return /,|\n/.test(texto) ? `"${texto}"` : texto;
      });
      return escapado.join(',');
    });

    const csvFinal = [line1, ...filas].join('\n');

    // 3. Enviar CSV con encabezados de descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="usuarios_export.csv"'
    );
    return res.status(200).send(csvFinal);
  } catch (error) {
    console.error('Error al exportar usuarios a CSV:', error);
    return res.status(500).json({
      message: 'Error del servidor al exportar usuarios.'
    });
  }
};
exports.getEscuelas = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id, 
        nombre, 
        direccion, 
        ciudad, 
        pais, 
        instructor, 
        instructor_mayor, 
        dias, 
        clases, 
        created_at 
      FROM escuelas
      ORDER BY created_at DESC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error en getEscuelas:', error);
    return res.status(500).json({ message: 'Error al obtener las escuelas.' });
  }
};

/**
 * Obtener una escuela por su ID
 * GET /api/escuelas/:id
 */
exports.getEscuelaById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'Falta el parámetro id.' });
  }
  try {
    const [rows] = await db.query(
      `SELECT 
         id, nombre, direccion, ciudad, pais, instructor, instructor_mayor, dias, clases, created_at,
         latitude, longitude
       FROM escuelas 
       WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Escuela no encontrada.' });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error en getEscuelaById:', error);
    return res.status(500).json({ message: 'Error al obtener la escuela.' });
  }
};


/**
 * Crear una nueva escuela
 * POST /api/escuelas
 */
exports.createEscuela = async (req, res) => {
  const {
    nombre,
    direccion = '',
    ciudad = '',
    pais = 'ARG',
    instructor = null,
    instructor_mayor = null,
    dias = '',
    clases = ''
  } = req.body;

  if (!nombre) {
    return res.status(400).json({
      message: 'El campo nombre es obligatorio.'
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO escuelas 
         (nombre, direccion, ciudad, pais, instructor, instructor_mayor, dias, clases) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, direccion, ciudad, pais, instructor, instructor_mayor, dias, clases]
    );

    return res.status(201).json({
      id: result.insertId,
      nombre,
      direccion,
      ciudad,
      pais,
      instructor,
      instructor_mayor,
      dias,
      clases
    });
  } catch (error) {
    console.error('Error en createEscuela:', error);
    return res.status(500).json({ message: 'Error al crear la escuela.' });
  }
};


/**
 * Actualizar una escuela existente
 * PUT /api/escuelas/:id
 */
exports.updateEscuela = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    direccion,
    ciudad,
    pais,
    instructor,
    instructor_mayor,
    dias,
    clases
  } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Falta el parámetro id.' });
  }

  try {
    const [existe] = await db.query('SELECT id FROM escuelas WHERE id = ?', [id]);
    if (existe.length === 0) {
      return res.status(404).json({ message: 'Escuela no encontrada.' });
    }

    // Construir dinámicamente SET de campos a actualizar
    const campos = [];
    const valores = [];

    if (nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(nombre);
    }
    if (direccion !== undefined) {
      campos.push('direccion = ?');
      valores.push(direccion);
    }
    if (ciudad !== undefined) {
      campos.push('ciudad = ?');
      valores.push(ciudad);
    }
    if (pais !== undefined) {
      campos.push('pais = ?');
      valores.push(pais);
    }
    if (instructor !== undefined) {
      campos.push('instructor = ?');
      valores.push(instructor);
    }
    if (instructor_mayor !== undefined) {
      campos.push('instructor_mayor = ?');
      valores.push(instructor_mayor);
    }
    if (dias !== undefined) {
      campos.push('dias = ?');
      valores.push(dias);
    }
    if (clases !== undefined) {
      campos.push('clases = ?');
      valores.push(clases);
    }

    if (campos.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar.' });
    }

    valores.push(id); // para el WHERE

    const sql = `UPDATE escuelas SET ${campos.join(', ')} WHERE id = ?`;

    await db.query(sql, valores);

    return res.status(200).json({ message: 'Escuela actualizada correctamente.' });
  } catch (error) {
    console.error('Error en updateEscuela:', error);
    return res.status(500).json({ message: 'Error al actualizar la escuela.' });
  }
};


/**
 * Eliminar una escuela
 * DELETE /api/escuelas/:id
 */
exports.deleteEscuela = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'Falta el parámetro id.' });
  }

  try {
    const [existe] = await db.query('SELECT id FROM escuelas WHERE id = ?', [id]);
    if (existe.length === 0) {
      return res.status(404).json({ message: 'Escuela no encontrada.' });
    }

    await db.query('DELETE FROM escuelas WHERE id = ?', [id]);
    return res.status(200).json({ message: 'Escuela eliminada correctamente.' });
  } catch (error) {
    console.error('Error en deleteEscuela:', error);
    return res.status(500).json({ message: 'Error al eliminar la escuela.' });
  }
};
// Obtener todos los contenidos, opcionalmente filtrando por tul_id
exports.getTulContenidos = async (req, res) => {
  try {
    const tulId = req.query.tul_id || null;

    let query = 'SELECT * FROM tul_contenidos';
    const params = [];

    if (tulId) {
      query += ' WHERE tul_id = ?';
      params.push(tulId);
    }

    query += ' ORDER BY orden ASC';

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron contenidos.' });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error en getTulContenidos:', error);
    return res.status(500).json({ message: 'Error al obtener contenidos de tul.' });
  }
};


// Obtener contenido específico por ID
// Obtener todos los contenidos o filtrados por tul_id (query param)
exports.getTulContenidos = async (req, res) => {
  try {
    const tulId = req.query.tul_id || null;
    let query = 'SELECT * FROM tul_contenidos';
    const params = [];
    if (tulId) {
      query += ' WHERE tul_id = ?';
      params.push(tulId);
    }
    query += ' ORDER BY orden ASC';
    const [rows] = await db.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron contenidos.' });
    }
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Error en getTulContenidos:', error);
    return res.status(500).json({ message: 'Error al obtener contenidos de tul.' });
  }
};

// Obtener contenido específico por id (params)
exports.getTulContenidoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Falta el parámetro id.' });
    }
    const [rows] = await db.query('SELECT * FROM tul_contenidos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Contenido no encontrado.' });
    }
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error en getTulContenidoById:', error);
    return res.status(500).json({ message: 'Error al obtener contenido de tul.' });
  }
};

// Crear nuevo contenido
exports.createTulContenido = async (req, res) => {
  try {
    const {
      tul_id,
      tipo_seccion,
      titulo,
      contenido_texto,
      video_link,
      orden,
      movimiento_o_academia // <-- agregar esta línea
    } = req.body;

    // Para la imagen: suponiendo que multer guarda en disco y tienes req.file.filename
    let imagen = null;
    if (req.file) {
      imagen = req.file.filename;  // guardo solo el nombre de archivo
    }

    // Validaciones básicas
    if (!tul_id || !tipo_seccion) {
      return res.status(400).json({ message: 'tul_id y tipo_seccion son requeridos.' });
    }

    // Insertar en DB, agregando movimiento_o_academia
    const [result] = await db.query(
      `INSERT INTO tul_contenidos 
       (tul_id, tipo_seccion, titulo, contenido_texto, video_link, imagen, orden, movimiento_o_academia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tul_id,
        tipo_seccion,
        titulo || null,
        contenido_texto || null,
        video_link || null,
        imagen,
        orden || null,
        movimiento_o_academia || null
      ]
    );

    const newId = result.insertId;
    const [newRow] = await db.query('SELECT * FROM tul_contenidos WHERE id = ?', [newId]);

    return res.status(201).json(newRow[0]);
  } catch (error) {
    console.error('Error en createTulContenido:', error);
    return res.status(500).json({ message: 'Error al crear contenido de tul.' });
  }
};

// Actualizar contenido existente
exports.updateTulContenido = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Falta el parámetro id.' });
    }

    const {
      tul_id,
      tipo_seccion,
      titulo,
      contenido_texto,
      video_link,
      orden,
      movimiento_o_academia
    } = req.body;

    // Imagen actualizada si se sube una nueva
    let imagen = null;
    if (req.file) {
      imagen = req.file.filename;
    }

    // Verificar existencia
    const [existing] = await db.query('SELECT * FROM tul_contenidos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Contenido no encontrado.' });
    }

    const fields = [];
    const params = [];

    if (tul_id !== undefined) {
      fields.push('tul_id = ?');
      params.push(tul_id);
    }
    if (tipo_seccion !== undefined) {
      fields.push('tipo_seccion = ?');
      params.push(tipo_seccion);
    }
    if (titulo !== undefined) {
      fields.push('titulo = ?');
      params.push(titulo);
    }
    if (contenido_texto !== undefined) {
      fields.push('contenido_texto = ?');
      params.push(contenido_texto);
    }
    if (video_link !== undefined) {
      fields.push('video_link = ?');
      params.push(video_link);
    }
    if (imagen !== null) {
      fields.push('imagen = ?');
      params.push(imagen);
    }
    if (orden !== undefined) {
      fields.push('orden = ?');
      params.push(orden);
    }
    if (movimiento_o_academia !== undefined) {
      fields.push('movimiento_o_academia = ?');
      params.push(movimiento_o_academia);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar.' });
    }

    const sql = `UPDATE tul_contenidos SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    await db.query(sql, params);

    const [updated] = await db.query('SELECT * FROM tul_contenidos WHERE id = ?', [id]);
    return res.json(updated[0]);
  } catch (error) {
    console.error('Error en updateTulContenido:', error);
    return res.status(500).json({ message: 'Error al actualizar contenido de tul.' });
  }
};

// Eliminar contenido
exports.deleteTulContenido = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Falta el parámetro id.' });
    }

    const [existing] = await db.query('SELECT id FROM tul_contenidos WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Contenido no encontrado.' });
    }

    await db.query('DELETE FROM tul_contenidos WHERE id = ?', [id]);
    return res.json({ message: 'Contenido eliminado correctamente.' });
  } catch (error) {
    console.error('Error en deleteTulContenido:', error);
    return res.status(500).json({ message: 'Error al eliminar contenido de tul.' });
  }
};
// Actualizar contenido existente en la tabla posturas
exports.updatePostura = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Falta el parámetro id.' });
    }

    const {
      tul_id,
      nombre,
      descripcion,
      orden,
      deberes,
      secciones,
      coloresCinturon,
      imagenCinturon,
      seccionesCuerpo,
      imagenCuerpo,
      posicionPreparatoria,
      imagenPosicion,
      logotipo,
      video,
      imagenTul,
      contenido
    } = req.body;

    // Manejo de imágenes subidas
    let imagen = null;
    let imagen2 = null;

    if (req.files) {
      if (req.files.imagen && req.files.imagen[0]) {
        imagen = req.files.imagen[0].filename;
      }
      if (req.files.imagen2 && req.files.imagen2[0]) {
        imagen2 = req.files.imagen2[0].filename;
      }
    }

    // Verificar existencia del registro
    const [existing] = await db.query('SELECT * FROM posturas WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Postura no encontrada.' });
    }

    const fields = [];
    const params = [];

    // Campos normales
    if (tul_id !== undefined) { fields.push('tul_id = ?'); params.push(tul_id); }
    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
    if (descripcion !== undefined) { fields.push('descripcion = ?'); params.push(descripcion); }
    if (orden !== undefined) { fields.push('orden = ?'); params.push(orden); }
    if (imagen !== null) { fields.push('imagen = ?'); params.push(imagen); }
    if (imagen2 !== null) { fields.push('imagen2 = ?'); params.push(imagen2); }

    // Nuevos campos
    if (deberes !== undefined) { fields.push('deberes = ?'); params.push(deberes); }

    if (secciones !== undefined) {
      try {
        const parsed = typeof secciones === 'string' ? JSON.parse(secciones) : secciones;
        fields.push('secciones = ?');
        params.push(JSON.stringify(parsed));
      } catch (err) {
        return res.status(400).json({ message: 'Formato de secciones inválido. Debe ser JSON.' });
      }
    }

    if (coloresCinturon !== undefined) { fields.push('coloresCinturon = ?'); params.push(coloresCinturon); }
    if (imagenCinturon !== undefined) { fields.push('imagenCinturon = ?'); params.push(imagenCinturon); }
    if (seccionesCuerpo !== undefined) { fields.push('seccionesCuerpo = ?'); params.push(seccionesCuerpo); }
    if (imagenCuerpo !== undefined) { fields.push('imagenCuerpo = ?'); params.push(imagenCuerpo); }
    if (posicionPreparatoria !== undefined) { fields.push('posicionPreparatoria = ?'); params.push(posicionPreparatoria); }
    if (imagenPosicion !== undefined) { fields.push('imagenPosicion = ?'); params.push(imagenPosicion); }
    if (logotipo !== undefined) { fields.push('logotipo = ?'); params.push(logotipo); }
    if (video !== undefined) { fields.push('video = ?'); params.push(video); }
    if (imagenTul !== undefined) { fields.push('imagenTul = ?'); params.push(imagenTul); }
    if (contenido !== undefined) { fields.push('contenido = ?'); params.push(contenido); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar.' });
    }

    const sql = `UPDATE posturas SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    await db.query(sql, params);

    const [updated] = await db.query('SELECT * FROM posturas WHERE id = ?', [id]);
    return res.json(updated[0]);

  } catch (error) {
    console.error('Error en updatePostura:', error);
    return res.status(500).json({ message: 'Error al actualizar postura.' });
  }
};
