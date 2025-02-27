Tableconfiguration:

\c api;


CREATE TABLE users (
id SERIAL PRIMARY KEY,
username VARCHAR(50) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
last_login TIMESTAMP DEFAULT NULL,
failed_attempts INT DEFAULT 0,
role VARCHAR(20) DEFAULT 'user',
status VARCHAR(10) DEFAULT 'active'
);

-- Create enum
CREATE TYPE inv_item_category AS ENUM (
    'electronics',
    '3d_printing',
    'painting',
    'cleaning',
    'building_materials',
    'other'
);

-- Create rooms
CREATE TABLE inv_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create storages (shelves/drawers)
CREATE TABLE inv_storages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    room_id INTEGER REFERENCES inv_rooms(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create containers with optional storage reference
CREATE TABLE inv_containers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    room_id INTEGER REFERENCES inv_rooms(id),
    storage_id INTEGER REFERENCES inv_storages(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create item types
CREATE TABLE inv_item_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category inv_item_category NOT NULL,
    has_expiry BOOLEAN DEFAULT false,
    needs_voltage BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create items with optional storage reference
CREATE TABLE inv_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    item_type_id INTEGER REFERENCES inv_item_types(id),
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(20),
    container_id INTEGER REFERENCES inv_containers(id),
    storage_id INTEGER REFERENCES inv_storages(id),
    room_id INTEGER REFERENCES inv_rooms(id),
    voltage DECIMAL,
    wattage DECIMAL,
    component_type VARCHAR(50),
    material_type VARCHAR(50),
    color VARCHAR(50),
    weight_grams DECIMAL,
    paint_type VARCHAR(50),
    color_code VARCHAR(50),
    volume_ml DECIMAL,
    manufacturer VARCHAR(100),
    model_number VARCHAR(100),
    purchase_date DATE,
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
