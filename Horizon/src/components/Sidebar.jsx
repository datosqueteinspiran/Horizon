import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Layout, CheckSquare, Layers, Plus, Trash2, Edit2, Users, ChevronDown, ChevronRight } from 'lucide-react';
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

const Sidebar = () => {
    const {
        projects, activeProject, setActiveProjectId,
        selectedObjectiveIds, toggleObjective, toggleAllObjectives,
        addProject, updateProject, deleteProject,
        addObjective, updateObjective, deleteObjective,
        users, addUser, updateUser, deleteUser,
        activeUserId, setActiveUserId,
        reorderObjectives
    } = usePlanner();

    const [expanded, setExpanded] = React.useState({
        projects: true,
        objectives: true,
        team: true
    });
    const [activeId, setActiveId] = React.useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
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
            transform: isDragging ? undefined : CSS.Translate.toString(transform),
            transition: isDragging ? 'none' : transition,
            opacity: isDragging ? 0.3 : 1,
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
            <li ref={setNodeRef} style={style} onClick={onToggle}>
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
                    <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: '2px solid',
                        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--accent-blue)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
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
            width: '280px',
            height: '100%',
            borderRight: '1px solid var(--border-color)',
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            overflowY: 'auto',
            position: 'relative' // Container for overlays
        }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Layout size={20} color="white" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Horizon</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                                    {projects.map(project => (
                                        <li
                                            key={project.id}
                                            onClick={() => {
                                                setActiveProjectId(project.id);
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
                                                transition: 'var(--transition-smooth)'
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
                                                borderBottom: '1px solid var(--border-color)'
                                            }}
                                        >
                                            <Layout size={16} style={{ color: activeProject && selectedObjectiveIds.length === activeProject.objectives.length ? 'var(--accent-blue)' : 'inherit' }} />
                                            <span style={{ fontWeight: 600 }}>Todos los objetivos</span>
                                        </li>

                                        <SortableContext
                                            items={activeProject.objectives.map(o => o.id)}
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
                                                            const content = prompt(`Añadir actividad directamente a "${objective.title}":`);
                                                            if (content) {
                                                                addTask(objective.id, content);
                                                                if (!selectedObjectiveIds.includes(objective.id)) {
                                                                    toggleObjective(objective.id);
                                                                }
                                                            }
                                                        }}
                                                        onEdit={() => {
                                                            const newTitle = prompt('Nuevo nombre del objetivo:', objective.title);
                                                            if (newTitle) updateObjective(objective.id, newTitle);
                                                        }}
                                                        onDelete={() => {
                                                            if (confirm('¿Estás seguro de que quieres borrar este objetivo y todas sus tareas?')) {
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

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <SectionHeader
                        title="Equipo"
                        section="team"
                        onAdd={() => {
                            const name = prompt('Nombre del nuevo miembro:');
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
                                {activeUserId && (
                                    <div
                                        onClick={() => setActiveUserId(null)}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '20px',
                                            background: 'rgba(255,255,255,0.1)',
                                            fontSize: '0.7rem',
                                            cursor: 'pointer',
                                            color: 'var(--text-secondary)',
                                            marginBottom: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            width: 'fit-content'
                                        }}
                                    >
                                        Limpiar filtro de usuario
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {users.map(user => (
                                        <div
                                            key={user.id}
                                            title={`${user.name} (Clic para filtrar / Shift+Clic para editar)`}
                                            onClick={(e) => {
                                                if (e.shiftKey) {
                                                    const action = prompt(`Usuario: ${user.name}\n1. Editar nombre\n2. Eliminar de equipo\n\nEscribe 1 o 2:`);
                                                    if (action === '1') {
                                                        const newName = prompt('Nuevo nombre:', user.name);
                                                        if (newName) updateUser(user.id, newName);
                                                    } else if (action === '2') {
                                                        if (confirm(`¿Estás seguro de eliminar a ${user.name}? Se quitará de sus actividades asignadas.`)) {
                                                            deleteUser(user.id);
                                                        }
                                                    }
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
                                                boxShadow: activeUserId === user.id ? `0 0 10px ${user.color}` : 'none',
                                                transform: activeUserId === user.id ? 'scale(1.1)' : 'scale(1)',
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
                <DragOverlay dropAnimation={{
                    duration: 200,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}>
                    {activeId ? (
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
                            width: '232px',
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
                                justifyContent: 'center'
                            }}>
                                <CheckSquare size={12} color="#fff" />
                            </div>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                                {activeProject.objectives.find(o => o.id === activeId)?.title}
                            </span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </aside>
    );
};

export default Sidebar;
