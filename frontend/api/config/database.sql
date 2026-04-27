-- Esquema de Base de Datos para App de Inventario y Compras (SQLite)

CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_comercial TEXT NOT NULL,
    razon_social TEXT,
    nit_rut TEXT UNIQUE,
    direccion TEXT,
    telefono TEXT,
    correo TEXT,
    logo_url TEXT,
    moneda TEXT DEFAULT 'COP',
    regimen_fiscal TEXT,
    datos_bancarios TEXT,
    whatsapp_numero TEXT,
    whatsapp_plantilla TEXT,
    whatsapp_firma TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT CHECK (rol IN ('SUPERUSUARIO', 'ADMINISTRADOR', 'CAJERO', 'BODEGUERO', 'AUDITOR')),
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
    foto_perfil TEXT,
    ultimo_acceso DATETIME,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    documento_identidad TEXT UNIQUE,
    telefono TEXT, 
    correo TEXT,
    direccion_entrega TEXT,
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'BLOQUEADO', 'CON_DEUDA')),
    tipo_cliente TEXT DEFAULT 'REGULAR' CHECK (tipo_cliente IN ('REGULAR', 'CREDITO', 'VIP', 'BLOQUEADO')),
    cupo_credito REAL DEFAULT 0.00,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    condiciones_pago TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
    codigo_barras TEXT UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    subcategoria TEXT,
    precio_costo REAL NOT NULL,
    precio_venta REAL NOT NULL,
    precio_mayorista REAL,
    unidad_medida TEXT,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER,
    ubicacion_bodega TEXT,
    imagen_url TEXT,
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'DESCONTINUADO', 'AGOTADO')),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    tipo_movimiento TEXT CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION')),
    cantidad INTEGER NOT NULL,
    motivo TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    cliente_id INTEGER REFERENCES clientes(id),
    usuario_id INTEGER REFERENCES usuarios(id), 
    numero_referencia TEXT UNIQUE,
    subtotal REAL NOT NULL,
    impuestos REAL DEFAULT 0.00,
    descuento REAL DEFAULT 0.00,
    total REAL NOT NULL,
    tipo_pago TEXT CHECK (tipo_pago IN ('CONTADO', 'CREDITO', 'PARCIAL')),
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ABONADA', 'PAGADA', 'ANULADA')),
    fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS cobros_pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    monto REAL NOT NULL,
    metodo_pago TEXT,
    comprobante_url TEXT,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion TEXT NOT NULL,
    detalle TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);
