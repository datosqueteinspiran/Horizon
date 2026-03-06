import React, { useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { differenceInDays, addDays, subDays, startOfDay, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Layers } from 'lucide-react';

const GanttChart = ({ tasks }) => {
    const { users, activeProject } = usePlanner();

    const ganttData = useMemo(() => {
        const tasksWithDates = tasks.filter(t => t.startDate && t.endDate);

        if (tasksWithDates.length === 0) {
            return null;
        }

        let minDate = new Date(tasksWithDates[0].startDate);
        let maxDate = new Date(tasksWithDates[0].endDate);

        tasksWithDates.forEach(t => {
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
        });

        // Add buffer
        const chartStart = startOfDay(subDays(minDate, 5));
        const chartEnd = startOfDay(addDays(maxDate, 10));

        const totalDays = differenceInDays(chartEnd, chartStart) + 1;

        const days = Array.from({ length: totalDays }, (_, i) => addDays(chartStart, i));

        return {
            tasksWithDates,
            chartStart,
            chartEnd,
            totalDays,
            days
        };
    }, [tasks]);

    if (!ganttData) {
        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <Layers size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No hay actividades con fechas definidas para mostrar en el diagrama de Gantt.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.6 }}>Asigna fechas de inicio y fin a tus actividades para verlas aquí.</p>
            </div>
        );
    }

    const { tasksWithDates, chartStart, totalDays, days } = ganttData;

    // Group days by month for the header
    const months = [];
    let currentMonth = null;
    let currentMonthSpan = 0;

    days.forEach((day, index) => {
        const monthName = format(day, 'MMMM yyyy', { locale: es });
        if (monthName !== currentMonth) {
            if (currentMonth) {
                months.push({ name: currentMonth, span: currentMonthSpan });
            }
            currentMonth = monthName;
            currentMonthSpan = 1;
        } else {
            currentMonthSpan++;
        }
        if (index === days.length - 1) {
            months.push({ name: currentMonth, span: currentMonthSpan });
        }
    });

    const getUserColor = (userId) => {
        return users.find(u => u.id === userId)?.color || 'var(--accent-blue)';
    };

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            margin: '0 2rem 2rem 2rem'
        }}>
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'auto',
                position: 'relative'
            }}>
                {/* Left Sidebar (Task Names) */}
                <div style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 20,
                    backgroundColor: 'var(--bg-card)',
                    borderRight: '1px solid var(--border-color)',
                    minWidth: '250px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        height: '60px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '0.5rem 1rem',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase'
                    }}>
                        Actividad
                    </div>
                    <div style={{ flex: 1 }}>
                        {tasksWithDates.map((task, index) => (
                            <div key={task.id} style={{
                                height: '40px',
                                padding: '0 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: getUserColor(task.assignedTo),
                                    marginRight: '8px',
                                    flexShrink: 0
                                }} />
                                {task.content}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: `${totalDays * 40}px` }}>
                    {/* Header: Months & Days */}
                    <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-card)' }}>
                        {/* Months */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', height: '30px' }}>
                            {months.map((m, i) => (
                                <div key={i} style={{
                                    width: `${m.span * 40}px`,
                                    padding: '4px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'var(--text-secondary)',
                                    textTransform: 'capitalize',
                                    borderRight: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {m.name}
                                </div>
                            ))}
                        </div>
                        {/* Days */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', height: '30px' }}>
                            {days.map((day, i) => {
                                const isToday = isSameDay(day, new Date());
                                return (
                                    <div key={i} style={{
                                        width: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.7rem',
                                        color: isToday ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                        fontWeight: isToday ? 800 : 500,
                                        borderRight: '1px dashed rgba(255,255,255,0.05)',
                                        backgroundColor: isToday ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                    }}>
                                        {format(day, 'd')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Task Rows */}
                    <div style={{ position: 'relative', flex: 1 }}>
                        {/* Vertical day lines */}
                        <div style={{ display: 'flex', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                            {days.map((day, i) => (
                                <div key={i} style={{
                                    width: '40px',
                                    height: '100%',
                                    borderRight: '1px dashed rgba(255,255,255,0.05)',
                                    backgroundColor: isSameDay(day, new Date()) ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                                }} />
                            ))}
                        </div>

                        {/* Task Bars */}
                        {tasksWithDates.map((task, index) => {
                            const taskStart = new Date(task.startDate);
                            const taskEnd = new Date(task.endDate);

                            const offsetDays = differenceInDays(taskStart, chartStart);
                            const durationDays = differenceInDays(taskEnd, taskStart) + 1; // +1 to include both start and end dates

                            const left = offsetDays * 40;
                            const width = durationDays * 40;
                            const color = getUserColor(task.assignedTo);

                            return (
                                <div key={task.id} style={{
                                    height: '40px',
                                    position: 'relative',
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: `${left}px`,
                                        width: `${width}px`,
                                        top: '8px',
                                        height: '24px',
                                        backgroundColor: color,
                                        borderRadius: '6px',
                                        opacity: 0.8,
                                        boxShadow: `0 4px 12px ${color}33`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 8px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        color: '#fff',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        transition: 'var(--transition-smooth)',
                                        cursor: 'pointer'
                                    }}
                                        title={`${task.content} (${task.startDate} a ${task.endDate})`}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = '0.8';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {task.content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
