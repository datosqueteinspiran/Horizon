import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanner } from '../context/PlannerContext';
import { Plus, Layers } from 'lucide-react';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    DragOverlay,
    defaultDropAnimationSideEffects,
    useDroppable
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import GanttChart from './GanttChart';

const DroppableColumn = ({ id, children }) => {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className="custom-scrollbar"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                flex: '1 1 0%', // Force it to be a flexible height child
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0.5rem',
                paddingRight: '1rem', // Added more room for scrollbar
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                transition: 'var(--transition-smooth)',
                minHeight: 0 // Ensure it doesn't expand beyond parent
            }}
        >
            {children}
        </div>
    );
};

const Board = () => {
    const { activeProject, selectedObjectiveIds, updateTaskStatus, addTask, users, assignTask, activeUserId, moveTask, reorderTask, updateTaskPriority, exportProjectToCSV } = usePlanner();
    const [addingToGroup, setAddingToGroup] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [groupBy, setGroupBy] = useState('status'); // 'status', 'priority', 'objective', or 'user'

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    if (!activeProject) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 500 }}>
            Selecciona un proyecto para comenzar
        </div>
    );

    const tasks = (activeProject?.objectives || [])
        .filter(o => selectedObjectiveIds.includes(o.id))
        .flatMap(o => (o.tasks || []).map(t => ({ ...t, objectiveTitle: o.title, objectiveId: o.id })))
        .filter(t => !activeUserId || t.assignedTo === activeUserId);

    const columns = groupBy === 'status'
        ? ['To Do', 'Doing', 'Done']
        : groupBy === 'priority'
            ? ['Urgente', 'Alta', 'Media', 'Baja']
            : groupBy === 'objective'
                ? (activeProject?.objectives || []).filter(o => selectedObjectiveIds.includes(o.id)).map(o => o.id)
                : [...users.map(u => u.id), 'unassigned-user'];

    const handleDragStart = (event) => {
        if (event.active.data.current.type === 'Task') {
            setActiveTask(event.active.data.current.task);
        }
    };

    const handleDragEnd = (event) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const overId = over.id;

        // Find the group of the column/task we dropped into
        let newGroupValue = null;
        if (columns.includes(overId)) {
            newGroupValue = overId;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                if (groupBy === 'status') newGroupValue = overTask.status;
                else if (groupBy === 'priority') newGroupValue = overTask.priority;
                else if (groupBy === 'objective') newGroupValue = overTask.objectiveId;
                else newGroupValue = overTask.assignedTo || 'unassigned-user';
            }
        }

        if (newGroupValue) {
            if (columns.includes(overId)) {
                // Drop on column (update property)
                if (groupBy === 'status') {
                    if (active.data.current.task.status !== newGroupValue) updateTaskStatus(taskId, newGroupValue);
                } else if (groupBy === 'priority') {
                    if (active.data.current.task.priority !== newGroupValue) updateTaskPriority(taskId, newGroupValue);
                } else if (groupBy === 'objective') {
                    moveTask(taskId, overId);
                } else {
                    // Group by user
                    assignTask(taskId, overId === 'unassigned-user' ? null : overId);
                }
            } else if (active.id !== overId) {
                // Drop over another task (handle as reordering)
                reorderTask(taskId, overId);
            }
        }
    };

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-main)',
                minHeight: 0 // Constrain height for children
            }}>
                {/* View Switcher & Export */}
                <div style={{ padding: '1.5rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                        {activeProject.name}
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={() => exportProjectToCSV(activeProject)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: '1px solid var(--accent-blue)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--accent-blue)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.2)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(59, 130, 246, 0.1)'}
                        >
                            <Layers size={14} />
                            Exportar CSV
                        </button>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '4px',
                            borderRadius: '10px',
                            display: 'flex',
                            gap: '4px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <button
                                onClick={() => setGroupBy('status')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: groupBy === 'status' ? 'var(--accent-blue)' : 'transparent',
                                    color: groupBy === 'status' ? '#fff' : 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Estado
                            </button>
                            <button
                                onClick={() => setGroupBy('priority')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: groupBy === 'priority' ? 'var(--accent-blue)' : 'transparent',
                                    color: groupBy === 'priority' ? '#fff' : 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Prioridad
                            </button>
                            <button
                                onClick={() => setGroupBy('objective')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: groupBy === 'objective' ? 'var(--accent-blue)' : 'transparent',
                                    color: groupBy === 'objective' ? '#fff' : 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Objetivos
                            </button>
                            <button
                                onClick={() => setGroupBy('user')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: groupBy === 'user' ? 'var(--accent-blue)' : 'transparent',
                                    color: groupBy === 'user' ? '#fff' : 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Equipo
                            </button>
                            <button
                                onClick={() => setGroupBy('gantt')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    background: groupBy === 'gantt' ? 'var(--accent-blue)' : 'transparent',
                                    color: groupBy === 'gantt' ? '#fff' : 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Cronograma
                            </button>
                        </div>
                    </div>
                </div>

                {groupBy === 'gantt' ? (
                    <GanttChart tasks={tasks} />
                ) : (
                    <div style={{
                        flex: 1,
                        padding: '2rem',
                        display: 'flex',
                        gap: '2rem',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        alignItems: 'stretch',
                        minHeight: 0 // Constrain height for columns
                    }}>
                        {columns.map(column => {
                            const columnTasks = tasks.filter(t => {

                                if (groupBy === 'status') return t.status === column;
                                if (groupBy === 'priority') return t.priority === column;
                                if (groupBy === 'objective') return t.objectiveId === column;
                                return (t.assignedTo || 'unassigned-user') === column;
                            });

                            const columnTitle = groupBy === 'status'
                                ? (column === 'Doing' ? 'EN PROCESO' : column === 'To Do' ? 'PENDIENTES' : 'HECHO')
                                : groupBy === 'priority'
                                    ? column.toUpperCase()
                                    : groupBy === 'objective'
                                        ? (activeProject.objectives.find(o => o.id === column)?.title || 'Sin Objetivo').toUpperCase()
                                        : (users.find(u => u.id === column)?.name || 'Sin asignar').toUpperCase();

                            return (
                                <div key={column} style={{
                                    flex: '0 0 350px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    height: '100%',
                                    minHeight: 0 // Crucial for nested flex scrolling
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {columnTitle}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '2px 8px',
                                                borderRadius: '100px',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 600
                                            }}>
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                    </div>

                                    <SortableContext
                                        id={column}
                                        items={columnTasks.map(t => t.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <DroppableColumn id={column}>
                                            <AnimatePresence mode="popLayout">
                                                {columnTasks.map(task => (
                                                    <TaskCard
                                                        key={task.id}
                                                        task={task}
                                                        columns={['To Do', 'Doing', 'Done']}
                                                        isShowingMultiple={selectedObjectiveIds.length > 1}
                                                    />
                                                ))}
                                            </AnimatePresence>

                                            <div style={{ position: 'relative', marginTop: 'auto' }}>
                                                <button
                                                    onClick={() => {
                                                        if (groupBy === 'objective') {
                                                            const content = prompt(`Nueva actividad en "${columnTitle.toLowerCase()}":`);
                                                            if (content) addTask(column, content);
                                                        } else {
                                                            setAddingToGroup(addingToGroup === column ? null : column);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        borderRadius: '12px',
                                                        border: '1px dashed var(--border-color)',
                                                        background: 'transparent',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'var(--transition-smooth)'
                                                    }}
                                                >
                                                    <Plus size={18} />
                                                    Añadir Actividad
                                                </button>

                                                <AnimatePresence>
                                                    {addingToGroup === column && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '100%',
                                                                left: 0,
                                                                width: '100%',
                                                                marginBottom: '10px',
                                                                background: 'var(--bg-card)',
                                                                border: '1px solid var(--border-color)',
                                                                borderRadius: '12px',
                                                                padding: '0.5rem',
                                                                zIndex: 100,
                                                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '2px'
                                                            }}
                                                        >
                                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', padding: '4px 8px' }}>
                                                                Seleccionar objetivo:
                                                            </p>
                                                            {activeProject.objectives
                                                                .filter(o => selectedObjectiveIds.includes(o.id) || o.id === `unassigned-${activeProject.id}`)
                                                                .map(obj => (
                                                                    <div
                                                                        key={obj.id}
                                                                        onClick={() => {
                                                                            const content = prompt(`Nueva actividad en "${obj.title}":`);
                                                                            if (content) {
                                                                                if (groupBy === 'status') {
                                                                                    addTask(obj.id, content, 'Media', null);
                                                                                } else if (groupBy === 'priority') {
                                                                                    addTask(obj.id, content, column, null);
                                                                                } else if (groupBy === 'user') {
                                                                                    const targetUserId = column === 'unassigned-user' ? null : column;
                                                                                    addTask(obj.id, content, 'Media', targetUserId);
                                                                                }
                                                                            }
                                                                            setAddingToGroup(null);
                                                                        }}
                                                                        style={{
                                                                            padding: '8px 10px',
                                                                            fontSize: '0.8rem',
                                                                            borderRadius: '6px',
                                                                            cursor: 'pointer',
                                                                            color: 'var(--text-primary)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            transition: 'background 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                                    >
                                                                        <Layers size={14} color="var(--accent-purple)" />
                                                                        {obj.title}
                                                                    </div>
                                                                ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </DroppableColumn>
                                    </SortableContext>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeTask ? (
                    <div className="glass-card" style={{ padding: '1.25rem', width: '300px', opacity: 0.8, cursor: 'grabbing' }}>
                        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{activeTask.content}</p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Board;
