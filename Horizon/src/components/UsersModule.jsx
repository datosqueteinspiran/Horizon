import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { motion } from 'framer-motion';
import { Users, Mail, User, Shield, Check, X, Search, Plus, Trash2, Edit2, Bookmark } from 'lucide-react';

const UsersModule = () => {
    const { users, projects, addUser, updateUser, deleteUser } = usePlanner();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        username: '',
        canEdit: false,
        canViewAll: false,
        assignedProjects: []
    });

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddUser = (e) => {
        e.preventDefault();
        addUser(newUser);
        setNewUser({
            name: '',
            email: '',
            username: '',
            canEdit: false,
            canViewAll: false,
            assignedProjects: []
        });
        setIsAdding(false);
    };

    const togglePermission = (userId, field) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            updateUser(userId, { [field]: !user[field] });
        }
    };

    const toggleProjectAssignment = (userId, projectId) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            const assigned = user.assignedProjects || [];
            const newAssigned = assigned.includes(projectId)
                ? assigned.filter(id => id !== projectId)
                : [...assigned, projectId];
            updateUser(userId, { assignedProjects: newAssigned });
        }
    };

    return (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', background: 'var(--bg-app)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Gestión de Usuarios</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Configura accesos, permisos y asignaciones del equipo.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="glass"
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        background: 'var(--accent-blue)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        transition: 'var(--transition-smooth)'
                    }}
                >
                    <Plus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="glass"
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {filteredUsers.map(user => (
                    <motion.div
                        key={user.id}
                        layout
                        className="glass"
                        style={{
                            padding: '1.5rem',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: user.color, color: '#fff', fontSize: '1.25rem',
                                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {user.initials}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{user.name}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        <Mail size={14} />
                                        {user.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        <User size={14} />
                                        @{user.username}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteUser(user.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                title="Eliminar usuario"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Configuración de Permisos</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <PermissionToggle
                                    active={user.canEdit}
                                    label="Puede Editar"
                                    onClick={() => togglePermission(user.id, 'canEdit')}
                                    icon={<Edit2 size={14} />}
                                />
                                <PermissionToggle
                                    active={user.canViewAll}
                                    label="Ver Todas las Actividades"
                                    onClick={() => togglePermission(user.id, 'canViewAll')}
                                    icon={<Search size={14} />}
                                />
                            </div>

                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Proyectos Asignados</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {projects.map(project => (
                                    <ProjectTag
                                        key={project.id}
                                        active={(user.assignedProjects || []).includes(project.id)}
                                        name={project.name}
                                        onClick={() => toggleProjectAssignment(user.id, project.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {isAdding && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass"
                        style={{
                            width: '450px',
                            padding: '2rem',
                            borderRadius: '20px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Plus size={24} color="var(--accent-blue)" />
                            Nuevo Usuario
                        </h2>
                        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre Completo</label>
                                <input
                                    required
                                    className="glass"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    className="glass"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nombre de Usuario</label>
                                <input
                                    className="glass"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                    value={newUser.username}
                                    placeholder="Dejar vacío para auto-generar"
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: '#fff', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'var(--accent-blue)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const PermissionToggle = ({ active, label, onClick, icon }) => (
    <div
        onClick={onClick}
        style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            background: active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: '1px solid',
            borderColor: active ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)',
            color: active ? '#10b981' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
        }}
    >
        {active ? <Check size={14} /> : icon}
        {label}
    </div>
);

const ProjectTag = ({ active, name, onClick }) => (
    <div
        onClick={onClick}
        style={{
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            border: '1px solid',
            borderColor: active ? 'var(--accent-blue)' : 'var(--border-color)',
            color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'var(--transition-smooth)'
        }}
    >
        <Bookmark size={12} fill={active ? 'currentColor' : 'none'} />
        {name}
        {active && <Check size={12} />}
    </div>
);

export default UsersModule;
