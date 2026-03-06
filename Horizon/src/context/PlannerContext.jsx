import React, { createContext, useContext, useState, useEffect } from 'react';

const PlannerContext = createContext();

const initialUsers = [
  { id: 'u1', name: 'Larry Aguirre', initials: 'LA', color: '#10b981', email: 'larry.aguirre@softia.com', username: 'larry', password: '123', canEdit: true, canViewAll: true, assignedProjects: ['p1'] },
  { id: 'u2', name: 'Usuario Invitado', initials: 'UI', color: '#3b82f6', email: 'invitado@softia.com', username: 'invitado', password: '123', canEdit: true, canViewAll: false, assignedProjects: [] },
  { id: 'u3', name: 'Director de Proyecto', initials: 'DP', color: '#8b5cf6', email: 'director@softia.com', username: 'director', password: '123', canEdit: true, canViewAll: false, assignedProjects: [] },
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

const API_BASE_URL = 'http://localhost:5000/api';

export const PlannerProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('horizon_current_user');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      console.error("Error loading current user:", e);
      return null;
    }
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem('active_project_id');
  });

  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/full-data`),
          fetch(`${API_BASE_URL}/users`)
        ]);

        const projectsData = await projectsRes.json();
        const usersData = await usersRes.json();

        const mapTask = (t) => ({
          ...t,
          assignedTo: t.assigned_to,
          startDate: t.start_date,
          endDate: t.end_date
        });

        const projectsWithMappedTasks = projectsData.map(p => ({
          ...p,
          objectives: (p.objectives || []).map(o => ({
            ...o,
            tasks: (o.tasks || []).map(mapTask)
          }))
        }));

        setProjects(projectsWithMappedTasks);
        setUsers(usersData.map(u => ({
          ...u,
          canEdit: !!u.can_edit,
          canViewAll: !!u.can_view_all
        })));

        if (!activeProjectId && projectsData.length > 0) {
          setActiveProjectId(projectsData[0].id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    if (currentUser) {
      localStorage.setItem('horizon_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('horizon_current_user');
    }
  }, [currentUser]);

  // Derived values
  const activeProject = projects.find(p => {
    if (p.id !== activeProjectId) return false;
    if (currentUser?.canViewAll) return true;
    return (currentUser?.assignedProjects || []).includes(p.id);
  });

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

  const addProject = async (name) => {
    const projectId = Date.now().toString();
    const newProject = {
      id: projectId,
      name,
      objectives: [{ id: `unassigned-${projectId}`, title: 'Sin Objetivo', tasks: [] }]
    };

    try {
      // 1. Create project
      await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, name })
      });

      // 2. Create default objective
      await fetch(`${API_BASE_URL}/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: `unassigned-${projectId}`, project_id: projectId, title: 'Sin Objetivo' })
      });

      setProjects(prev => [...prev, newProject]);

      // Auto-assign project to creator (Optional: handle this via API too if users table is ready)
      if (currentUser) {
        const updatedProjects = [...(currentUser.assignedProjects || []), newProject.id];
        const updatedUser = { ...currentUser, assignedProjects: updatedProjects };
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
      }

      setActiveProjectId(newProject.id);
      setSelectedObjectiveIds([`unassigned-${projectId}`]);
    } catch (err) {
      console.error("Error adding project:", err);
    }
  };

  const updateProject = async (projectId, newName) => {
    try {
      await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, name: newName } : p
      ));
    } catch (err) {
      console.error("Error updating project:", err);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await fetch(`${API_BASE_URL}/projects/${projectId}`, { method: 'DELETE' });
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      if (activeProjectId === projectId) {
        setActiveProjectId(updatedProjects[0]?.id || null);
        setSelectedObjectiveIds(updatedProjects[0]?.objectives.map(o => o.id) || []);
      }
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  const addObjective = async (projectId, title) => {
    const newObjective = { id: Date.now().toString(), title, tasks: [] };
    try {
      await fetch(`${API_BASE_URL}/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newObjective.id, project_id: projectId, title })
      });
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, objectives: [...p.objectives, newObjective] } : p
      ));
      setSelectedObjectiveIds(prev => [...prev, newObjective.id]);
    } catch (err) {
      console.error("Error adding objective:", err);
    }
  };

  const addUser = async (userData) => {
    const { name, email, username, password, canEdit, canViewAll, assignedProjects } =
      typeof userData === 'string' ? { name: userData } : userData;

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
    const newUser = {
      id: Date.now().toString(),
      name,
      email: email || '',
      username: username || name.toLowerCase().replace(/\s+/g, '.'),
      password: password || '123',
      can_edit: canEdit || false,
      can_view_all: canViewAll || false,
      initials,
      color: colors[users.length % colors.length]
    };

    try {
      await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const frontendUser = {
        ...newUser,
        canEdit: newUser.can_edit,
        canViewAll: newUser.can_view_all,
        assignedProjects: assignedProjects || []
      };

      setUsers(prev => [...prev, frontendUser]);
      return frontendUser;
    } catch (err) {
      console.error("Error adding user:", err);
      return null;
    }
  };

  const login = (username, password) => {
    const loginUsername = username.toLowerCase().trim();
    const user = users.find(u => u.username.toLowerCase() === loginUsername && u.password === password);
    if (user) {
      setCurrentUser(user);
      return { success: true };
    }
    return { success: false, message: 'Usuario o contraseña incorrectos' };
  };

  const register = async (userData) => {
    const existing = users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
    if (existing) return { success: false, message: 'El nombre de usuario ya existe' };

    const newUser = await addUser(userData);
    if (newUser) {
      setCurrentUser(newUser);
      return { success: true };
    }
    return { success: false, message: 'Error al registrar usuario' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const changePassword = async (userId, newPassword) => {
    try {
      await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, password: newPassword } : u
      ));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(prev => ({ ...prev, password: newPassword }));
      }
      return { success: true };
    } catch (err) {
      console.error("Error changing password:", err);
      return { success: false, message: 'Error al cambiar contraseña' };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      // Map camelCase to snake_case for API
      const apiUpdates = { ...updates };
      if (updates.canEdit !== undefined) {
        apiUpdates.can_edit = updates.canEdit;
        delete apiUpdates.canEdit;
      }
      if (updates.canViewAll !== undefined) {
        apiUpdates.can_view_all = updates.canViewAll;
        delete apiUpdates.canViewAll;
      }

      await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiUpdates)
      });

      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          const updatedUser = { ...u, ...updates };
          if (updates.name) {
            updatedUser.initials = updates.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          }
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      }));
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE'
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
      // Cleanup assignments
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.map(o => ({
          ...o,
          tasks: o.tasks.map(t => t.assignedTo === userId ? { ...t, assignedTo: null } : t)
        }))
      })));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const updateObjective = async (objectiveId, newTitle) => {
    try {
      await fetch(`${API_BASE_URL}/objectives/${objectiveId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.map(o =>
          o.id === objectiveId ? { ...o, title: newTitle } : o
        )
      })));
    } catch (err) {
      console.error("Error updating objective:", err);
    }
  };

  const deleteObjective = async (objectiveId) => {
    try {
      await fetch(`${API_BASE_URL}/objectives/${objectiveId}`, { method: 'DELETE' });
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.filter(o => o.id !== objectiveId)
      })));
      setSelectedObjectiveIds(prev => prev.filter(id => id !== objectiveId));
    } catch (err) {
      console.error("Error deleting objective:", err);
    }
  };

  const addTask = async (objectiveId, content, priority = 'Media', assignedTo = null, startDate = null, endDate = null) => {
    if (!activeProjectId) return;
    const newTask = { id: Date.now().toString(), content, status: 'To Do', priority, assignedTo, startDate, endDate };

    try {
      await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newTask.id,
          objective_id: objectiveId,
          content,
          priority,
          assigned_to: assignedTo,
          start_date: startDate,
          end_date: endDate
        })
      });

      setProjects(prev => prev.map(p => {
        if (p.id !== activeProjectId) return p;
        return {
          ...p,
          objectives: p.objectives.map(o =>
            o.id === objectiveId ? { ...o, tasks: [...o.tasks, newTask] } : o
          )
        };
      }));

      if (!selectedObjectiveIds.includes(objectiveId)) {
        setSelectedObjectiveIds(prev => [...prev, objectiveId]);
      }
      setActiveUserId(null);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.map(o => ({
          ...o,
          tasks: o.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        }))
      })));
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  const updateTaskPriority = async (taskId, newPriority) => {
    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority })
      });
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.map(o => ({
          ...o,
          tasks: o.tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t)
        }))
      })));
    } catch (err) {
      console.error("Error updating task priority:", err);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const apiUpdates = { ...updates };
      if (updates.startDate !== undefined) { apiUpdates.start_date = updates.startDate; delete apiUpdates.startDate; }
      if (updates.endDate !== undefined) { apiUpdates.end_date = updates.endDate; delete apiUpdates.endDate; }
      if (updates.assignedTo !== undefined) { apiUpdates.assigned_to = updates.assignedTo; delete apiUpdates.assignedTo; }

      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiUpdates)
      });
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.map(o => ({
          ...o,
          tasks: o.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        }))
      })));
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.map(o => ({
          ...o,
          tasks: o.tasks.filter(t => t.id !== taskId)
        }))
      })));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const exportProjectToCSV = (project) => {
    if (!project) return;

    // Headers
    let csvContent = "\ufeffObjetivo,Tarea,Asignado,Estado,Prioridad\n";

    project.objectives.forEach(objective => {
      objective.tasks.forEach(task => {
        const assignedUser = users.find(u => u.id === task.userId)?.name || "-";
        const priorityLabel = task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja';
        const statusLabel = task.status === 'completed' ? 'Completado' : task.status === 'in-progress' ? 'En Progreso' : 'Pendiente';

        // Escape commas and quotes if necessary
        const escape = (str) => `"${(str || "").replace(/"/g, '""')}"`;

        csvContent += `${escape(objective.title)},${escape(task.content)},${escape(assignedUser)},${escape(statusLabel)},${escape(priorityLabel)}\n`;
      });
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${project.name.replace(/\s+/g, '_')}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const moveTask = async (taskId, newObjectiveId) => {
    if (!activeProjectId) return;
    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective_id: newObjectiveId })
      });

      setProjects(prev => prev.map(project => {
        if (project.id !== activeProjectId) return project;

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
    } catch (err) {
      console.error("Error moving task:", err);
    }

    if (!selectedObjectiveIds.includes(newObjectiveId)) {
      setSelectedObjectiveIds(prev => [...prev, newObjectiveId]);
    }
  };

  const reorderTask = (activeId, overId) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(project => {
      if (project.id !== activeProjectId) return project;

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

  const assignTask = async (taskId, userId) => {
    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: userId })
      });
      setProjects(prev => prev.map(p => ({
        ...p,
        objectives: p.objectives.map(o => ({
          ...o,
          tasks: o.tasks.map(t => t.id === taskId ? { ...t, assignedTo: userId } : t)
        }))
      })));
    } catch (err) {
      console.error("Error assigning task:", err);
    }
  };

  const migrateLocalData = async () => {
    const saved = localStorage.getItem('horizon_data');
    if (!saved) return { success: false, message: 'No hay datos locales para migrar' };

    try {
      const data = JSON.parse(saved);
      if (!Array.isArray(data)) return { success: false, message: 'Formato de datos inválido' };

      for (const project of data) {
        // 1. Create project
        await fetch(`${API_BASE_URL}/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: project.id, name: project.name })
        });

        for (const objective of project.objectives) {
          // 2. Create objective
          await fetch(`${API_BASE_URL}/objectives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: objective.id, project_id: project.id, title: objective.title })
          });

          for (const task of objective.tasks) {
            // 3. Create task
            await fetch(`${API_BASE_URL}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: task.id,
                objective_id: objective.id,
                content: task.content,
                priority: task.priority || 'Media',
                assigned_to: task.assignedTo || null,
                start_date: task.startDate || null,
                end_date: task.endDate || null
              })
            });
          }
        }
      }

      // Refresh data
      const projectsRes = await fetch(`${API_BASE_URL}/full-data`);
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      localStorage.removeItem('horizon_data');
      return { success: true, message: 'Migración completada con éxito' };
    } catch (err) {
      console.error("Error during migration:", err);
      return { success: false, message: 'Error durante la migración: ' + err.message };
    }
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
      exportProjectToCSV,
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
      updateTaskPriority,
      currentUser,
      login,
      register,
      logout,
      changePassword,
      migrateLocalData,
      loading
    }}>
      {children}
    </PlannerContext.Provider>
  );
};
