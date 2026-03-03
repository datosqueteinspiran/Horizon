import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, LogIn, UserPlus, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const AuthView = () => {
    const { login, register } = usePlanner();
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (message.text) setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (isLogin) {
                const result = login(formData.username, formData.password);
                if (!result.success) {
                    setMessage({ type: 'error', text: result.message });
                }
            } else {
                if (!formData.name || !formData.email || !formData.username || !formData.password) {
                    setMessage({ type: 'error', text: 'Todos los campos son obligatorios' });
                    setIsLoading(false);
                    return;
                }
                const result = await register(formData);
                if (!result.success) {
                    setMessage({ type: 'error', text: result.message });
                } else {
                    setMessage({ type: 'success', text: 'Registro exitoso! Iniciando sesión...' });
                }
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Ocurrió un error inesperado' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 0% 0%, #1a1c2c 0%, #0d0e14 100%)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Decorative background elements */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                width: '400px',
                height: '400px',
                background: 'rgba(59, 130, 246, 0.1)',
                filter: 'blur(100px)',
                borderRadius: '50%',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '10%',
                width: '400px',
                height: '400px',
                background: 'rgba(139, 92, 246, 0.1)',
                filter: 'blur(100px)',
                borderRadius: '50%',
                zIndex: 0
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    padding: '2.5rem',
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    zIndex: 1,
                    margin: '0 1.5rem'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'var(--accent-blue)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
                    }}>
                        <Layout size={32} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                        {isLogin ? 'Bienvenido a Horizon' : 'Crea tu cuenta'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {isLogin ? 'Ingresa para gestionar tus proyectos' : 'Empieza a planificar hoy mismo'}
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '4px',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <button
                        onClick={() => { setIsLogin(true); setMessage({ type: '', text: '' }); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '10px',
                            border: 'none',
                            background: isLogin ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            color: isLogin ? '#fff' : 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <LogIn size={16} />
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setMessage({ type: '', text: '' }); }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '10px',
                            border: 'none',
                            background: !isLogin ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                            color: !isLogin ? '#fff' : 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <UserPlus size={16} />
                        Registro
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                key="register-fields"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'hidden' }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Nombre completo"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required={!isLogin}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px 12px 42px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required={!isLogin}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px 12px 42px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '0.95rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="text"
                            name="username"
                            placeholder="Nombre de usuario"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 14px 12px 42px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 14px 12px 42px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                        />
                    </div>

                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                padding: '10px 14px',
                                borderRadius: '10px',
                                background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                color: message.type === 'error' ? '#f87171' : '#34d399',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                            {message.text}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--accent-blue)',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.3s',
                            opacity: isLoading ? 0.7 : 1,
                            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
                        }}
                        onMouseEnter={(e) => { if (!isLoading) e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 20px rgba(59, 130, 246, 0.3)'; }}
                        onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)'; }}
                    >
                        {isLoading ? 'Espera...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                        <ArrowRight size={18} />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AuthView;
