import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Plus, Clock, AlertCircle, Layers, User, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlanner } from '../context/PlannerContext';

const TaskCard = ({ task, isShowingMultiple, columns }) => {
    const { updateTaskStatus, users, assignTask, updateTask, deleteTask, activeProject, moveTask, updateTaskPriority } = usePlanner();
    const [dropdownDirection, setDropdownDirection] = React.useState('up');
    const [assigningTaskId, setAssigningTaskId] = React.useState(null);
    const [changingStatusTaskId, setChangingStatusTaskId] = React.useState(null);
    const [movingTaskId, setMovingTaskId] = React.useState(null);
    const [changingPriorityTaskId, setChangingPriorityTaskId] = React.useState(null);
    const [isEditingDates, setIsEditingDates] = React.useState(false);
    const [tempDates, setTempDates] = React.useState({ startDate: task.startDate || '', endDate: task.endDate || '' });

    React.useEffect(() => {
        setTempDates({
            startDate: task.startDate ? task.startDate.substring(0, 10) : '',
            endDate: task.endDate ? task.endDate.substring(0, 10) : ''
        });
    }, [task.startDate, task.endDate]);
    const statusRef = React.useRef(null);
    const priorityRef = React.useRef(null);
    const objectiveRef = React.useRef(null);
    const assignmentRef = React.useRef(null);

    const calculateDirection = (ref) => {
        if (!ref.current) return 'up';
        const rect = ref.current.getBoundingClientRect();
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        return spaceAbove > spaceBelow ? 'up' : 'down';
    };

    const priorities = ['Urgente', 'Alta', 'Media', 'Baja'];
    const priorityColors = {
        'Baja': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
        'Media': { bg: 'rgba(161, 161, 170, 0.1)', text: '#a1a1aa' },
        'Alta': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
        'Urgente': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
    };

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        zIndex: (changingStatusTaskId === task.id || movingTaskId === task.id || assigningTaskId === task.id || changingPriorityTaskId === task.id) ? 10 : 1
    };

    const Avatar = ({ userId, size = 24 }) => {
        const user = users.find(u => u.id === userId);
        if (!user) return <User size={size * 0.6} color="var(--text-secondary)" />;

        return (
            <div
                title={user.name}
                style={{
                    width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                    background: user.color, color: '#fff', fontSize: `${size * 0.4}px`,
                    fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                {user.initials}
            </div>
        );
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card"
        >
            <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span
                            ref={statusRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (changingStatusTaskId !== task.id) setDropdownDirection(calculateDirection(statusRef));
                                setChangingStatusTaskId(changingStatusTaskId === task.id ? null : task.id);
                            }}
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: task.status === 'Doing' ? 'rgba(139, 92, 246, 0.1)' : task.status === 'Done' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(161, 161, 170, 0.1)',
                                color: task.status === 'Doing' ? '#8b5cf6' : task.status === 'Done' ? '#10b981' : '#a1a1aa',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            {task.status}
                            <ChevronDown size={10} />

                            <AnimatePresence>
                                {changingStatusTaskId === task.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 5 : -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 5 : -5 }}
                                        style={{
                                            position: 'absolute',
                                            top: dropdownDirection === 'up' ? 'auto' : 'calc(100% + 4px)',
                                            bottom: dropdownDirection === 'up' ? 'calc(100% + 4px)' : 'auto',
                                            left: 0,
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            padding: '4px',
                                            zIndex: 101,
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                            minWidth: '100px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px'
                                        }}
                                    >
                                        {columns.map(status => (
                                            <div
                                                key={status}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateTaskStatus(task.id, status);
                                                    setChangingStatusTaskId(null);
                                                }}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    color: task.status === status ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                                    backgroundColor: task.status === status ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                {status}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </span>
                        <Edit2
                            size={12}
                            style={{ cursor: 'pointer', opacity: 0.5 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                const newContent = prompt('Editar texto de la actividad:', task.content);
                                if (newContent) updateTask(task.id, { content: newContent });
                            }}
                        />
                        <Trash2
                            size={12}
                            style={{ cursor: 'pointer', opacity: 0.5, color: '#ef4444' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('¿Estás seguro de que quieres borrar esta actividad?')) {
                                    deleteTask(task.id);
                                }
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                        <span
                            ref={priorityRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (changingPriorityTaskId !== task.id) setDropdownDirection(calculateDirection(priorityRef));
                                setChangingPriorityTaskId(changingPriorityTaskId === task.id ? null : task.id);
                            }}
                            style={{
                                fontSize: '0.6rem',
                                color: priorityColors[task.priority]?.text || '#a1a1aa',
                                background: priorityColors[task.priority]?.bg || 'rgba(161, 161, 170, 0.1)',
                                padding: '1px 8px',
                                borderRadius: '4px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                            }}
                        >
                            {task.priority || 'Media'}
                            <ChevronDown size={8} />

                            <AnimatePresence>
                                {changingPriorityTaskId === task.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 5 : -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 5 : -5 }}
                                        style={{
                                            position: 'absolute',
                                            top: dropdownDirection === 'up' ? 'auto' : 'calc(100% + 4px)',
                                            bottom: dropdownDirection === 'up' ? 'calc(100% + 4px)' : 'auto',
                                            right: 0,
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '8px',
                                            padding: '4px',
                                            zIndex: 102,
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                            minWidth: '100px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px'
                                        }}
                                    >
                                        {priorities.map(prio => (
                                            <div
                                                key={prio}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateTaskPriority(task.id, prio);
                                                    setChangingPriorityTaskId(null);
                                                }}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    color: task.priority === prio ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                                    backgroundColor: task.priority === prio ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'right'
                                                }}
                                            >
                                                {prio}
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </span>
                        <Clock
                            size={14}
                            color={task.startDate || task.endDate ? "var(--accent-blue)" : "var(--text-secondary)"}
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingDates(!isEditingDates);
                            }}
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {isEditingDates && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{
                                overflow: 'hidden',
                                marginBottom: '1rem',
                                padding: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>INICIO</label>
                                    <input
                                        type="date"
                                        value={tempDates.startDate ? tempDates.startDate.substring(0, 10) : ''}
                                        onChange={(e) => setTempDates({ ...tempDates, startDate: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.75rem', padding: '4px', borderRadius: '4px' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>FIN</label>
                                    <input
                                        type="date"
                                        value={tempDates.endDate ? tempDates.endDate.substring(0, 10) : ''}
                                        onChange={(e) => setTempDates({ ...tempDates, endDate: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.75rem', padding: '4px', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setIsEditingDates(false);
                                        setTempDates({ startDate: task.startDate || '', endDate: task.endDate || '' });
                                    }}
                                    style={{ padding: '4px 8px', fontSize: '0.65rem', borderRadius: '4px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        updateTask(task.id, { startDate: tempDates.startDate || null, endDate: tempDates.endDate || null });
                                        setIsEditingDates(false);
                                    }}
                                    style={{ padding: '4px 8px', fontSize: '0.65rem', borderRadius: '4px', background: 'var(--accent-blue)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Guardar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {(task.startDate || task.endDate) && !isEditingDates && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '0.8rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        {task.startDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <Clock size={10} color="var(--accent-blue)" />
                                <span>Ini: {new Date(task.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                            </div>
                        )}
                        {task.endDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.05)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <Clock size={10} color="var(--accent-blue)" />
                                <span>Fin: {new Date(task.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                            </div>
                        )}
                    </div>
                )}

                <p style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem', fontWeight: 500 }}>
                    {task.content}
                </p>

                <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--accent-purple)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    position: 'relative',
                    width: 'fit-content',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(168, 85, 247, 0.05)',
                    transition: 'var(--transition-smooth)'
                }}
                    ref={objectiveRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (movingTaskId !== task.id) setDropdownDirection(calculateDirection(objectiveRef));
                        setMovingTaskId(movingTaskId === task.id ? null : task.id);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)'}
                >
                    <Layers size={12} />
                    {task.objectiveTitle}
                    <ChevronDown size={10} style={{ opacity: 0.5 }} />

                    <AnimatePresence>
                        {movingTaskId === task.id && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 5 : -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 5 : -5 }}
                                style={{
                                    position: 'absolute',
                                    top: dropdownDirection === 'up' ? 'auto' : 'calc(100% + 5px)',
                                    bottom: dropdownDirection === 'up' ? 'calc(100% + 5px)' : 'auto',
                                    left: 0,
                                    background: '#18181b',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '10px',
                                    padding: '4px',
                                    zIndex: 1000,
                                    minWidth: '200px',
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}
                            >
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', padding: '6px 8px' }}>Mover a objetivo:</p>
                                {activeProject.objectives.map(obj => (
                                    <div
                                        key={obj.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            moveTask(task.id, obj.id);
                                            setMovingTaskId(null);
                                        }}
                                        style={{
                                            padding: '8px 10px',
                                            fontSize: '0.75rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: task.objectiveTitle === obj.title ? 'var(--accent-purple)' : 'var(--text-primary)',
                                            background: task.objectiveTitle === obj.title ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Layers size={12} />
                                        {obj.title}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}
                    ref={assignmentRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (assigningTaskId !== task.id) setDropdownDirection(calculateDirection(assignmentRef));
                        setAssigningTaskId(assigningTaskId === task.id ? null : task.id);
                    }}
                >
                    <Avatar userId={task.assignedTo} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        {users.find(u => u.id === task.assignedTo)?.name || 'Sin asignar'}
                    </span>

                    <AnimatePresence>
                        {assigningTaskId === task.id && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 10 : -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: dropdownDirection === 'up' ? 10 : -10 }}
                                style={{
                                    position: 'absolute',
                                    top: dropdownDirection === 'up' ? 'auto' : 'calc(100% + 5px)',
                                    bottom: dropdownDirection === 'up' ? 'calc(100% + 5px)' : 'auto',
                                    left: 0,
                                    background: '#18181b',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '0.5rem',
                                    zIndex: 1000,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    minWidth: '200px',
                                    maxHeight: '220px',
                                    overflowY: 'auto'
                                }}
                            >
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', padding: '0 0.5rem' }}>Asignar responsable:</p>
                                {users
                                    .filter(user => activeProject && (user.canViewAll || (user.assignedProjects || []).includes(activeProject.id)))
                                    .map(user => (
                                        <div
                                            key={user.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                assignTask(task.id, user.id);
                                                setAssigningTaskId(null);
                                            }}
                                            style={{
                                                padding: '8px 10px',
                                                fontSize: '0.8rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                color: task.assignedTo === user.id ? 'var(--accent-blue)' : '#a1a1aa',
                                                background: task.assignedTo === user.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: user.color }} />
                                            {user.name}
                                        </div>
                                    ))}
                                {users.filter(user => activeProject && (user.canViewAll || (user.assignedProjects || []).includes(activeProject.id))).length === 0 && (
                                    <p style={{ fontSize: '0.7rem', color: '#ef4444', padding: '0 0.5rem', fontStyle: 'italic' }}>
                                        No hay miembros asignados a este proyecto.
                                    </p>
                                )}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        assignTask(task.id, null);
                                        setAssigningTaskId(null);
                                    }}
                                    style={{
                                        padding: '8px 10px',
                                        fontSize: '0.8rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: '#ef4444',
                                        borderTop: '1px solid var(--border-color)',
                                        marginTop: '4px'
                                    }}
                                >
                                    Quitar asignación
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default TaskCard;
