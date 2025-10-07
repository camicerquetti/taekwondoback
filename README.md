# 🥋 Taekwondo App - Backend

Este es el backend de la aplicación Taekwondo, desarrollado con **Node.js** y **MySQL**. Proporciona una API REST que permite autenticar usuarios, gestionar roles, dojanes, posturas, clases, comentarios y más.

---

## 🚀 Tecnologías utilizadas

- Node.js + Express
- MySQL
- JWT (autenticación)
- Bcrypt (hash de contraseñas)
- Dotenv
- Cors
- MySQL Triggers (para lógica automática)
- Sequelize o MySQL2 (dependiendo del ORM que utilices)

---

## 🔐 Roles de Usuario

- **Administrador**
  - Crea, edita y elimina usuarios
  - Cambia planes (gratuito o Pro)
  - Gestiona escuelas, tules y posturas

- **Instructor / Instructor Mayor**
  - Registra sus propios dojanes
  - Carga clases y contenido

- **Alumno**
  - Comenta en clases
  - Visualiza contenidos según el plan

---

## 📂 Estructura del proyecto

/controllers → Lógica de cada entidad
/routes → Endpoints de la API
/models → Modelos de base de datos
/config → Configuración de base de datos
/middlewares → Autenticación y roles
/utils → Funciones auxiliares

---

## 📊 Base de Datos

- Base de datos relacional en **MySQL**
- Uso de **triggers** para:
  - Relacionar clases con instructores
  - Registrar cambios automáticos
  - Validar relaciones entre tablas

### Tablas principales:
- `usuarios`
- `dojanes`
- `posturas`
- `tules`
- `escuelas`
- `comentarios`
- `planes`
- entre otras.

---

## 🔧 Instalación del proyecto

1. Clona el repositorio:

```bash
git clone https://github.com/tuusuario/taekwondoback.git
cd taekwondoback

