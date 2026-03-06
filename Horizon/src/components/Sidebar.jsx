import React from 'react';
import { createPortal } from 'react-dom';
import { usePlanner } from '../context/PlannerContext';
import { Layout, CheckSquare, Layers, Plus, Trash2, Edit2, Users, User, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    closestCenter,
    rectIntersection,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

const Sidebar = ({ currentView, setCurrentView }) => {
    const {
        projects, activeProject, setActiveProjectId,
        selectedObjectiveIds, toggleObjective, toggleAllObjectives,
        addProject, updateProject, deleteProject,
        addObjective, updateObjective, deleteObjective,
        users, addUser, updateUser, deleteUser,
        activeUserId, setActiveUserId,
        reorderObjectives,
        currentUser, logout, changePassword, migrateLocalData
    } = usePlanner();

    const [expanded, setExpanded] = React.useState({
        projects: true,
        projectMembers: true,
        objectives: true,
        team: true,
        profile: false
    });
    const [activeId, setActiveId] = React.useState(null);
    const [activeObjective, setActiveObjective] = React.useState(null);

    // Sidebar Resize State
    const [sidebarWidth, setSidebarWidth] = React.useState(280);
    const [isResizing, setIsResizing] = React.useState(false);

    const startResizing = React.useCallback((mouseDownEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback((mouseMoveEvent) => {
        if (isResizing) {
            const newWidth = mouseMoveEvent.clientX;
            if (newWidth >= 200 && newWidth <= 600) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    React.useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        const obj = activeProject?.objectives?.find(o => o.id === active.id);
        setActiveObjective(obj);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveObjective(null);
        if (over && active.id !== over.id) {
            reorderObjectives(activeProject.id, active.id, over.id);
        }
    };

    const toggleSection = (section) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const SectionHeader = ({ title, section, onAdd }) => (
        <div
            onClick={() => toggleSection(section)}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                cursor: 'pointer',
                userSelect: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {expanded[section] ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronRight size={14} color="var(--text-secondary)" />}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title}
                </p>
            </div>
            {onAdd && (
                <Plus
                    size={14}
                    style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd();
                    }}
                />
            )}
        </div>
    );

    const SortableObjectiveItem = ({
        objective,
        isSelected,
        onToggle,
        onAddTask,
        onEdit,
        onDelete
    }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({ id: objective.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0 : 1,
            zIndex: isDragging ? 0 : 1,
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            color: isSelected ? '#fff' : 'var(--text-secondary)',
            position: 'relative',
            background: isDragging ? 'rgba(255,255,255,0.02)' : undefined
        };

        return (
            <li ref={setNodeRef} style={style}>
                <div
                    {...attributes}
                    {...listeners}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flex: 1,
                        minWidth: 0,
                        cursor: 'grab'
                    }}
                >
                    <div
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        onPointerDown={(e) => { e.stopPropagation(); }}
                        style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: '2px solid',
                            borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)',
                            backgroundColor: isSelected ? 'var(--accent-blue)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            cursor: 'pointer'
                        }}>
                        {isSelected && <CheckSquare size={12} color="#fff" />}
                    </div>
                    <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontStyle: objective.id === 'unassigned' ? 'italic' : 'normal'
                    }}>
                        {objective.title}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', opacity: 0.6, flexShrink: 0 }}>
                    <Plus
                        size={14}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddTask();
                        }}
                        style={{ cursor: 'pointer', color: 'var(--accent-blue)' }}
                        title="Añadir actividad aquí"
                    />
                    {objective.id !== 'unassigned' && (
                        <>
                            <Edit2
                                size={14}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit();
                                }}
                                style={{ cursor: 'pointer' }}
                            />
                            <Trash2
                                size={14}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                style={{ cursor: 'pointer', color: '#ef4444' }}
                            />
                        </>
                    )}
                </div>
            </li>
        );
    };

    return (
        <aside className="glass" style={{
            width: `${sidebarWidth}px`,
            height: '100%',
            borderRight: '1px solid var(--border-color)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            overflowY: 'auto',
            position: 'relative', // Container for overlays
            flexShrink: 0,
            userSelect: isResizing ? 'none' : 'auto'
        }}>
            {/* Resize Handle */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '4px',
                    cursor: 'col-resize',
                    zIndex: 100,
                    backgroundColor: isResizing ? 'var(--accent-blue)' : 'transparent',
                    transition: 'background-color 0.2s',
                    opacity: 0.5
                }}
                onMouseDown={startResizing}
                onMouseEnter={(e) => { if (!isResizing) e.target.style.backgroundColor = 'var(--accent-blue)'; }}
                onMouseLeave={(e) => { if (!isResizing) e.target.style.backgroundColor = 'transparent'; }}
            />

            <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                }} onClick={() => setCurrentView('board')}>
                    <Layout size={20} color="white" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => setCurrentView('board')}>Horizon</span>
            </div>

            {currentUser?.canViewAll && (
                <div
                    onClick={() => setCurrentView('users')}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        backgroundColor: currentView === 'users' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: currentView === 'users' ? 'var(--accent-blue)' : 'var(--text-primary)',
                        transition: 'var(--transition-smooth)',
                        marginBottom: '1rem',
                        border: currentView === 'users' ? '1px solid var(--accent-blue)' : '1px solid transparent',
                        flexShrink: 0
                    }}
                >
                    <Users size={18} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Panel de Usuarios</span>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, minWidth: 0 }}>
                    <div>
                        <SectionHeader
                            title="Proyectos"
                            section="projects"
                            onAdd={() => {
                                const name = prompt('Nombre del nuevo proyecto:');
                                if (name) addProject(name);
                            }}
                        />
                        <AnimatePresence>
                            {expanded.projects && (
                                <motion.ul
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}
                                >
                                    {projects
                                        .filter(p => currentUser?.canViewAll || (currentUser?.assignedProjects || []).includes(p.id))
                                        .map(project => (
                                            <li
                                                key={project.id}
                                                onClick={() => {
                                                    setActiveProjectId(project.id);
                                                    setCurrentView('board');
                                                }}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '0.5rem',
                                                    backgroundColor: activeProject?.id === project.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                    color: activeProject?.id === project.id ? 'var(--accent-blue)' : 'var(--text-primary)',
                                                    transition: 'var(--transition-smooth)',
                                                    minWidth: 0
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                                    <Layers size={18} style={{ flexShrink: 0 }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {project.name}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem', opacity: 0.6, flexShrink: 0 }}>
                                                    <Edit2
                                                        size={14}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newName = prompt('Nuevo nombre del proyecto:', project.name);
                                                            if (newName) updateProject(project.id, newName);
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <Trash2
                                                        size={14}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('¿Estás seguro de que quieres borrar este proyecto y TODO su contenido?')) {
                                                                deleteProject(project.id);
                                                            }
                                                        }}
                                                        style={{ cursor: 'pointer', color: '#ef4444' }}
                                                    />
                                                </div>
                                            </li>
                                        ))}
                                </motion.ul>
                            )}
                        </AnimatePresence>
                    </div>

                    {activeProject && (
                        <div>
                            <SectionHeader
                                title="Miembros"
                                section="projectMembers"
                                onAdd={() => {
                                    const identifier = prompt("Ingresa el correo electrónico o nombre de usuario:");
                                    if (!identifier) return;

                                    const targetUser = users.find(u =>
                                        u.email.toLowerCase() === identifier.toLowerCase().trim() ||
                                        u.username.toLowerCase() === identifier.toLowerCase().trim()
                                    );

                                    if (!targetUser) {
                                        alert("Usuario no encontrado.");
                                        return;
                                    }

                                    if ((targetUser.assignedProjects || []).includes(activeProject.id) || targetUser.canViewAll) {
                                        alert(`${targetUser.name} ya tiene acceso.`);
                                        return;
                                    }

                                    updateUser(targetUser.id, { assignedProjects: [...(targetUser.assignedProjects || []), activeProject.id] });
                                }}
                            />
                            <AnimatePresence>
                                {expanded.projectMembers && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 0.5rem 1rem' }}>
                                            {users
                                                .filter(u => u.canViewAll || (u.assignedProjects || []).includes(activeProject.id))
                                                .map(user => (
                                                    <div
                                                        key={user.id}
                                                        title={`${user.name}`}
                                                        style={{
                                                            width: '28px', height: '28px', borderRadius: '50%',
                                                            background: user.color, color: '#fff', fontSize: '10px',
                                                            fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '2px solid var(--bg-card)',
                                                            position: 'relative',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        {user.initials}
                                                        {(!user.canViewAll && user.id !== currentUser?.id) && (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm(`¿Quitar a ${user.name}?`)) {
                                                                        updateUser(user.id, {
                                                                            assignedProjects: user.assignedProjects.filter(id => id !== activeProject.id)
                                                                        });
                                                                    }
                                                                }}
                                                                style={{
                                                                    position: 'absolute', top: -4, right: -4,
                                                                    width: 14, height: 14, borderRadius: '50%',
                                                                    background: '#ef4444', color: '#fff',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '8px', cursor: 'pointer', border: '1px solid var(--bg-card)'
                                                                }}
                                                            >
                                                                <Trash2 size={8} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {activeProject && (
                        <div>
                            <SectionHeader
                                title="Objetivos"
                                section="objectives"
                                onAdd={() => {
                                    const title = prompt('Título del nuevo objetivo:');
                                    if (title) addObjective(activeProject.id, title);
                                }}
                            />
                            <AnimatePresence>
                                {expanded.objectives && (
                                    <motion.ul
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}
                                    >
                                        <li
                                            onClick={() => toggleAllObjectives()}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                backgroundColor: activeProject && selectedObjectiveIds.length === activeProject.objectives.length ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                                color: activeProject && selectedObjectiveIds.length === activeProject.objectives.length ? '#fff' : 'var(--text-secondary)',
                                                transition: 'var(--transition-smooth)',
                                                marginBottom: '0.5rem',
                                                borderBottom: '1px solid var(--border-color)',
                                                minWidth: 0
                                            }}
                                        >
                                            <Layout size={16} style={{ flexShrink: 0, color: activeProject && selectedObjectiveIds.length === activeProject.objectives.length ? 'var(--accent-blue)' : 'inherit' }} />
                                            <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Todos</span>
                                        </li>

                                        <SortableContext
                                            items={activeProject.objectives
                                                .filter(obj => obj.id !== 'unassigned' || (obj.tasks && obj.tasks.length > 0))
                                                .map(o => o.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {activeProject.objectives
                                                .filter(obj => obj.id !== 'unassigned' || (obj.tasks && obj.tasks.length > 0))
                                                .map(objective => (
                                                    <SortableObjectiveItem
                                                        key={objective.id}
                                                        objective={objective}
                                                        isSelected={selectedObjectiveIds.includes(objective.id)}
                                                        onToggle={() => toggleObjective(objective.id)}
                                                        onAddTask={() => {
                                                            const content = prompt(`Actividad para "${objective.title}":`);
                                                            if (content) {
                                                                addTask(objective.id, content);
                                                                if (!selectedObjectiveIds.includes(objective.id)) {
                                                                    toggleObjective(objective.id);
                                                                }
                                                            }
                                                        }}
                                                        onEdit={() => {
                                                            const newTitle = prompt('Nuevo título:', objective.title);
                                                            if (newTitle) updateObjective(objective.id, newTitle);
                                                        }}
                                                        onDelete={() => {
                                                            if (confirm('¿Borrar objetivo?')) {
                                                                deleteObjective(objective.id);
                                                            }
                                                        }}
                                                    />
                                                ))}
                                        </SortableContext>
                                    </motion.ul>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </nav>

                {createPortal(
                    <DragOverlay
                        dropAnimation={{
                            duration: 200,
                            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                        }}
                        zIndex={1000}
                    >
                        {activeId && activeObjective ? (
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(15px)',
                                border: '1px solid var(--accent-blue)',
                                color: '#fff',
                                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                width: `${sidebarWidth - 48}px`,
                                cursor: 'grabbing',
                                transform: 'scale(1.02)'
                            }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '4px',
                                    border: '2px solid var(--accent-blue)',
                                    backgroundColor: 'var(--accent-blue)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <CheckSquare size={12} color="#fff" />
                                </div>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                                    {activeObjective.title}
                                </span>
                            </div>
                        ) : null}
                    </DragOverlay>,
                    document.body
                )}

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
                    <div
                        onClick={() => toggleSection('profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid rgba(255,255,255,0.05)',
                            minWidth: 0
                        }}
                    >
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: currentUser?.color || 'var(--accent-blue)',
                            color: '#fff', fontSize: '12px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {currentUser?.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {currentUser?.name}
                            </p>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                            {expanded.profile ? <ChevronDown size={14} color="var(--text-secondary)" /> : <ChevronRight size={14} color="var(--text-secondary)" />}
                        </div>
                    </div>

                    <AnimatePresence>
                        {expanded.profile && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}
                            >
                                <button
                                    onClick={() => {
                                        const newName = prompt('Nombre:', currentUser.name);
                                        if (!newName) return;
                                        const newEmail = prompt('Correo:', currentUser.email || '');
                                        const newUsername = prompt('Usuario:', currentUser.username || newName.toLowerCase().replace(/\s+/g, '.'));
                                        if (newUsername !== null) {
                                            updateUser(currentUser.id, { name: newName, email: newEmail, username: newUsername });
                                        }
                                    }}
                                    style={{
                                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                                        border: 'none', background: 'transparent', color: 'var(--text-secondary)',
                                        fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <User size={14} />
                                    <span>Perfil</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const newPass = prompt('Nueva contraseña:');
                                        if (newPass) {
                                            changePassword(currentUser.id, newPass);
                                            alert('Actualizada');
                                        }
                                    }}
                                    style={{
                                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                                        border: 'none', background: 'transparent', color: 'var(--text-secondary)',
                                        fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <Edit2 size={14} />
                                    <span>Pass</span>
                                </button>
                                <button
                                    onClick={() => logout()}
                                    style={{
                                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                                        border: 'none', background: 'transparent', color: '#ef4444',
                                        fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <Trash2 size={14} />
                                    <span>Salir</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {currentUser?.canViewAll && (
                        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            <SectionHeader
                                title="Equipo"
                                section="team"
                                onAdd={() => {
                                    const name = prompt('Nombre:');
                                    if (name) addUser(name);
                                }}
                            />
                            <AnimatePresence>
                                {expanded.team && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {users.map(user => (
                                                <div
                                                    key={user.id}
                                                    title={`${user.name}`}
                                                    onClick={(e) => {
                                                        if (e.shiftKey) {
                                                            const newName = prompt('Nombre:', user.name);
                                                            if (newName) updateUser(user.id, newName);
                                                        } else {
                                                            setActiveUserId(activeUserId === user.id ? null : user.id);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: user.color, color: '#fff', fontSize: '12px',
                                                        fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: activeUserId === user.id ? '2px solid #fff' : '2px solid var(--bg-card)',
                                                        cursor: 'pointer',
                                                        flexShrink: 0,
                                                        transition: 'var(--transition-smooth)'
                                                    }}
                                                >
                                                    {user.initials}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </DndContext>
        </aside>
    );
};

export default Sidebar;
