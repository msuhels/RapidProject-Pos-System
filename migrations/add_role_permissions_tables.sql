-- Migration: Add role permission management tables
-- This migration adds support for module-level, data-level, and field-level permissions

-- Role Module Access - Controls whether a role has access to a module
CREATE TABLE IF NOT EXISTS role_module_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    has_access BOOLEAN DEFAULT FALSE NOT NULL,
    data_access VARCHAR(20) DEFAULT 'none' NOT NULL CHECK (data_access IN ('none', 'own', 'team', 'all')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(role_id, module_id)
);

CREATE INDEX idx_role_module_access_role ON role_module_access(role_id);
CREATE INDEX idx_role_module_access_module ON role_module_access(module_id);

-- Role Module Permissions - Granular permissions for a role within a module
CREATE TABLE IF NOT EXISTS role_module_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(role_id, module_id, permission_id)
);

CREATE INDEX idx_role_module_permissions_role ON role_module_permissions(role_id);
CREATE INDEX idx_role_module_permissions_module ON role_module_permissions(module_id);
CREATE INDEX idx_role_module_permissions_permission ON role_module_permissions(permission_id);

-- Module Fields - Defines fields that can have field-level permissions
CREATE TABLE IF NOT EXISTS module_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    field_type VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(module_id, code)
);

CREATE INDEX idx_module_fields_module ON module_fields(module_id);
CREATE INDEX idx_module_fields_code ON module_fields(code);

-- Role Field Permissions - Field-level visibility and editability permissions
CREATE TABLE IF NOT EXISTS role_field_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES module_fields(id) ON DELETE CASCADE,
    is_visible BOOLEAN DEFAULT FALSE NOT NULL,
    is_editable BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(role_id, module_id, field_id)
);

CREATE INDEX idx_role_field_permissions_role ON role_field_permissions(role_id);
CREATE INDEX idx_role_field_permissions_module ON role_field_permissions(module_id);
CREATE INDEX idx_role_field_permissions_field ON role_field_permissions(field_id);

