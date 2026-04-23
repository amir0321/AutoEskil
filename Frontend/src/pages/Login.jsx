import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './Login.module.css';
import { apiFetch } from '../utils/api';
import content from '../content/siteContent.json';

export const route = {
    path: '/login'
};

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiFetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/admin');
            } else {
                setError(data.message || content.login.messages.failed);
            }
        } catch (err) {
            setError(content.login.messages.connection);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <Navbar />
            <div className={styles.bg} />
            <div className={styles.overlay} />

            <div className={`glass-card ${styles.card}`}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{content.login.title}</h2>
                    <p className={styles.cardSubtitle}>{content.login.subtitle}</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>{content.login.labels.username}</label>
                        <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={content.login.placeholders.username} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label>{content.login.labels.password}</label>
                        <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={content.login.placeholders.password} required />
                    </div>
                    <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
                        {loading ? content.login.button.loading : content.login.button.login}
                    </button>
                </form>
            </div>
        </div>
    );
}
