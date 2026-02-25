import React, { createContext, useContext, useState, useEffect } from 'react';

const PlannerContext = createContext();

const initialUsers = [
  { id: 'u1', name: 'Usuario Invitado', initials: 'UI', color: '#3b82f6' },
  { id: 'u2', name: 'Director de Proyecto', initials: 'DP', color: '#8b5cf6' },
  { id: 'u3', name: 'Analista Técnico', initials: 'AT', color: '#10b981' },
];

export const usePlanner = () => useContext(PlannerContext);

const initialData = [
  {
    id: 'p1',
    name: 'Plan de Desarrollo Institucional',
    objectives: [
      {
        id: 'o1',
        title: 'Mejorar la infraestructura digital',
        tasks: [
          { id: 't1', content: 'Migración de servidores BPUN', status: 'To Do', priority: 'Alta', assignedTo: 'u1' },
          { id: 't2', content: 'Implementación de API Horizon', status: 'Doing', priority: 'Media', assignedTo: 'u2' },
        ],
      },
      {
        id: 'o2',
        title: 'Optimización de procesos administrativos',
        tasks: [
          { id: 't3', content: 'Rediseño de flujos de aprobación', status: 'Done', priority: 'Baja', assignedTo: 'u3' },
        ],
      },
      {
        id: 'unassigned',
        title: 'Sin Objetivo',
        tasks: [],
      }
    ],
  },
];

export const PlannerProvider = ({ children }) => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('horizon_data');
    let data = saved ? JSON.parse(saved) : initialData;

    // Migración: Convertir "In Progress" a "Doing", asegurar "Sin Objetivo" y traducir prioridades
    data = data.map(p => {
      const objectives = p.objectives.map(o => ({
        ...o,
        tasks: o.tasks.map(t => {
          let updated = { ...t };
          if (updated.status === 'In Progress') updated.status = 'Doing';

          // Traducir prioridades si están en inglés
          const priorityMap = { 'High': 'Alta', 'Medium': 'Media', 'Low': 'Baja', 'Urgent': 'Urgente' };
          if (priorityMap[updated.priority]) {
            updated.priority = priorityMap[updated.priority];
          }

          return updated;
        })
      }));

      const hasUnassigned = objectives.some(o => o.id === 'unassigned');
      if (!hasUnassigned) {
        objectives.push({ id: 'unassigned', title: 'Sin Objetivo', tasks: [] });
      }

      return { ...p, objectives };
    });
    return data;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('horizon_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    const saved = localStorage.getItem('active_project_id');
    return saved || (projects.length > 0 ? projects[0].id : null);
  });

  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);

  useEffect(() => {
    localStorage.setItem('horizon_data', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('active_project_id', activeProjectId);
      const project = projects.find(p => p.id === activeProjectId);
      if (project && selectedObjectiveIds.length === 0) {
        setSelectedObjectiveIds(project.objectives.map(o => o.id));
      }
    }
  }, [activeProjectId, projects]);

  useEffect(() => {
    localStorage.setItem('horizon_users', JSON.stringify(users));
  }, [users]);

  // Derived values
  const activeProject = projects.find(p => p.id === activeProjectId);

  const toggleObjective = (objectiveId) => {
    setSelectedObjectiveIds(prev =>
      prev.includes(objectiveId)
        ? prev.filter(id => id !== objectiveId)
        : [...prev, objectiveId]
    );
  };

  const toggleAllObjectives = () => {
    if (!activeProject) return;
    const allIds = activeProject.objectives.map(o => o.id);
    if (selectedObjectiveIds.length === allIds.length) {
      setSelectedObjectiveIds([]);
    } else {
      setSelectedObjectiveIds(allIds);
    }
  };

  const addProject = (name) => {
    const newProject = {
      id: Date.now().toString(),
      name,
      objectives: [{ id: 'unassigned', title: 'Sin Objetivo', tasks: [] }]
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setSelectedObjectiveIds(['unassigned']);
  };

  const updateProject = (projectId, newName) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, name: newName } : p
    ));
  };

  const deleteProject = (projectId) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    if (activeProjectId === projectId) {
      setActiveProjectId(updatedProjects[0]?.id || null);
      setSelectedObjectiveIds(updatedProjects[0]?.objectives.map(o => o.id) || []);
    }
  };

  const addObjective = (projectId, title) => {
    const newObjective = { id: Date.now().toString(), title, tasks: [] };
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, objectives: [...p.objectives, newObjective] } : p
    ));
    setSelectedObjectiveIds(prev => [...prev, newObjective.id]); // Select new objective by default
  };

  const addUser = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const newUser = {
      id: Date.now().toString(),
      name,
      initials,
      color: colors[users.length % colors.length]
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (userId, newName) => {
    const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, name: newName, initials } : u
    ));
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    // Cleanup assignments
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o => ({
        ...o,
        tasks: o.tasks.map(t => t.assignedTo === userId ? { ...t, assignedTo: null } : t)
      }))
    })));
  };

  const updateObjective = (objectiveId, newTitle) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o =>
        o.id === objectiveId ? { ...o, title: newTitle } : o
      )
    })));
  };

  const deleteObjective = (objectiveId) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.filter(o => o.id !== objectiveId)
    })));
    setSelectedObjectiveIds(prev => prev.filter(id => id !== objectiveId));
  };

  const addTask = (objectiveId, content, priority = 'Media', assignedTo = null) => {
    const newTask = { id: Date.now().toString(), content, status: 'To Do', priority, assignedTo };
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o =>
        o.id === objectiveId ? { ...o, tasks: [...o.tasks, newTask] } : o
      )
    })));

    // Ensure the task is visible
    if (!selectedObjectiveIds.includes(objectiveId)) {
      setSelectedObjectiveIds(prev => [...prev, objectiveId]);
    }
    setActiveUserId(null); // Clear user filter to show the new unassigned task
  };

  const updateTaskStatus = (taskId, newStatus) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o => ({
        ...o,
        tasks: o.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      }))
    })));
  };

  const updateTaskPriority = (taskId, newPriority) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o => ({
        ...o,
        tasks: o.tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t)
      }))
    })));
  };

  const updateTask = (taskId, newContent) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o => ({
        ...o,
        tasks: o.tasks.map(t => t.id === taskId ? { ...t, content: newContent } : t)
      }))
    })));
  };

  const deleteTask = (taskId) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o => ({
        ...o,
        tasks: o.tasks.filter(t => t.id !== taskId)
      }))
    })));
  };

  const moveTask = (taskId, newObjectiveId) => {
    setProjects(prev => prev.map(project => {
      // Find the objective that contains the task
      let taskToMove = null;
      const updatedObjectives = project.objectives.map(obj => {
        const taskIdx = obj.tasks.findIndex(t => t.id === taskId);
        if (taskIdx > -1) {
          taskToMove = obj.tasks[taskIdx];
          const newTasks = [...obj.tasks];
          newTasks.splice(taskIdx, 1);
          return { ...obj, tasks: newTasks };
        }
        return obj;
      });

      if (taskToMove) {
        // Add the task to the new objective
        return {
          ...project,
          objectives: updatedObjectives.map(obj => {
            if (obj.id === newObjectiveId) {
              return { ...obj, tasks: [...obj.tasks, taskToMove] };
            }
            return obj;
          })
        };
      }
      return project;
    }));

    // Ensure the task remains visible in its new home
    if (!selectedObjectiveIds.includes(newObjectiveId)) {
      setSelectedObjectiveIds(prev => [...prev, newObjectiveId]);
    }
  };

  const reorderTask = (activeId, overId) => {
    setProjects(prev => prev.map(project => {
      let taskToMove = null;
      let targetObjectiveId = null;
      let targetIndex = -1;
      let targetStatus = null;
      let targetPriority = null;

      // 1. Find and Extract the task
      const tempObjectives = project.objectives.map(obj => {
        const idx = obj.tasks.findIndex(t => t.id === activeId);
        if (idx !== -1) {
          taskToMove = obj.tasks[idx];
          const newTasks = [...obj.tasks];
          newTasks.splice(idx, 1);
          return { ...obj, tasks: newTasks };
        }
        return obj;
      });

      if (!taskToMove) return project;

      // 2. Find target position based on overId
      tempObjectives.forEach(obj => {
        const idx = obj.tasks.findIndex(t => t.id === overId);
        if (idx !== -1) {
          targetObjectiveId = obj.id;
          targetIndex = idx;
          targetStatus = obj.tasks[idx].status;
          targetPriority = obj.tasks[idx].priority;
        }
      });

      if (targetObjectiveId !== null) {
        // 3. Insert into new position
        return {
          ...project,
          objectives: tempObjectives.map(obj => {
            if (obj.id === targetObjectiveId) {
              const newTasks = [...obj.tasks];
              // When reordering, we keep the original status/priority of the moved task 
              // UNLESS we are dropping into a specific column area. 
              // For simple reordering, we assume dropping on a task in the SAME group means keeping group property.
              newTasks.splice(targetIndex, 0, { ...taskToMove, status: targetStatus, priority: targetPriority });
              return { ...obj, tasks: newTasks };
            }
            return obj;
          })
        };
      }

      return project;
    }));
  };

  const reorderObjectives = (projectId, activeId, overId) => {
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project;

      const activeIndex = project.objectives.findIndex(o => o.id === activeId);
      const overIndex = project.objectives.findIndex(o => o.id === overId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newObjectives = [...project.objectives];
        const [removed] = newObjectives.splice(activeIndex, 1);
        newObjectives.splice(overIndex, 0, removed);
        return { ...project, objectives: newObjectives };
      }
      return project;
    }));
  };

  const assignTask = (taskId, userId) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      objectives: p.objectives.map(o => ({
        ...o,
        tasks: o.tasks.map(t => t.id === taskId ? { ...t, assignedTo: userId } : t)
      }))
    })));
  };

  return (
    <PlannerContext.Provider value={{
      projects,
      activeProject,
      activeProjectId,
      setActiveProjectId: (id) => {
        setActiveProjectId(id);
        const project = projects.find(p => p.id === id);
        if (project) setSelectedObjectiveIds(project.objectives.map(o => o.id));
      },
      selectedObjectiveIds,
      toggleObjective,
      toggleAllObjectives,
      addProject,
      updateProject,
      deleteProject,
      addObjective,
      updateObjective,
      deleteObjective,
      addTask,
      updateTask,
      deleteTask,
      updateTaskStatus,
      users,
      addUser,
      updateUser,
      deleteUser,
      activeUserId,
      setActiveUserId,
      assignTask,
      moveTask,
      reorderTask,
      reorderObjectives,
      updateTaskPriority
    }}>
      {children}
    </PlannerContext.Provider>
  );
};
