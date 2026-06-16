-- ============================================================
--  Fast Food Service — Script de Base de Datos CORREGIDO
--  Ejecutar en phpMyAdmin o consola MySQL de XAMPP
-- ============================================================

CREATE DATABASE IF NOT EXISTS fast_food_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fast_food_db;

-- ── TABLA: usuarios ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(60)  NOT NULL UNIQUE,
    apellidos      VARCHAR(80)  NOT NULL,
    telefono       VARCHAR(20)  NOT NULL,
    correo         VARCHAR(120) NOT NULL UNIQUE,
    password       VARCHAR(255) NOT NULL,
    fechaRegistro  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── TABLA: menu ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    precio      INT          NOT NULL,
    categoria   VARCHAR(60)  NOT NULL DEFAULT 'General',
    disponible  TINYINT(1)   NOT NULL DEFAULT 1,
    orden       INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── TABLA: pedidos (CORREGIDA - coincide con api.php) ───────
CREATE TABLE IF NOT EXISTS pedidos (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    numero        VARCHAR(10)  NOT NULL DEFAULT '000',
    mesa          VARCHAR(50)  NOT NULL DEFAULT 'General',
    mesero        VARCHAR(60)  NOT NULL DEFAULT 'Anónimo',
    items         LONGTEXT,           -- JSON con los productos
    notas         TEXT,
    hora          VARCHAR(10),
    horaDespacho  VARCHAR(10),
    estado        VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    timestamp     BIGINT       NOT NULL DEFAULT 0,
    createdAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── DATOS DE EJEMPLO: Menú ───────────────────────────────────
INSERT INTO menu (nombre, precio, categoria, disponible, orden) VALUES
('Hamburguesa Clásica',    12000, 'Hamburguesas', 1, 1),
('Hamburguesa Doble',      16000, 'Hamburguesas', 1, 2),
('Hamburguesa BBQ',        14000, 'Hamburguesas', 1, 3),
('Hamburguesa Pollo',      13000, 'Hamburguesas', 1, 4),
('Perro Sencillo',          8000, 'Perros Calientes', 1, 1),
('Perro Especial',         10000, 'Perros Calientes', 1, 2),
('Perro Ranchero',         11000, 'Perros Calientes', 1, 3),
('Papas Medianas',          5000, 'Acompañamientos', 1, 1),
('Papas Grandes',           7000, 'Acompañamientos', 1, 2),
('Aros de Cebolla',         6000, 'Acompañamientos', 1, 3),
('Ensalada',                5000, 'Acompañamientos', 1, 4),
('Gaseosa 350ml',           3000, 'Bebidas', 1, 1),
('Gaseosa 600ml',           4500, 'Bebidas', 1, 2),
('Jugo Natural',            5000, 'Bebidas', 1, 3),
('Agua',                    2000, 'Bebidas', 1, 4),
('Combo Clásico',          18000, 'Combos', 1, 1),
('Combo Doble',            22000, 'Combos', 1, 2),
('Combo Familiar',         45000, 'Combos', 1, 3);

-- ── USUARIO ADMIN POR DEFECTO (fastfood / 1504) ────────────
INSERT INTO usuarios (nombre, apellidos, telefono, correo, password) VALUES
('fastfood', 'Administrador', '3000000000', 'admin@fastfood.com', '1504');

CREATE TABLE IF NOT EXISTS pedido_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id       INT NOT NULL,
    menu_id         INT,
    cantidad        INT NOT NULL DEFAULT 1,
    precio_unitario INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE pedido_items
ADD CONSTRAINT fk_pedidoitems_pedido
FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedido_items
ADD CONSTRAINT fk_pedidoitems_menu
FOREIGN KEY (menu_id) REFERENCES menu(id)
ON DELETE SET NULL ON UPDATE CASCADE;
