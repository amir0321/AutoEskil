import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './Admin.module.css';
import { Plus, Edit, ChevronDown, Users } from 'lucide-react';
import AddCarTab from '../components/admin/AddCarTab';
import ManageCarsTab from '../components/admin/ManageCarsTab';
import LeadsTab from '../components/admin/LeadsTab';
import DealersTab from '../components/admin/DealersTab';
import { adminFetch, hasAdminSession } from '../utils/api';
import content from '../content/siteContent.json';

export const route = {
    path: '/admin'
};

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
export default function Admin() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('add');
    const [dealers, setDealers] = useState([]);
    const [authorized, setAuthorized] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);

    const fetchDealers = useCallback(async () => {
        try {
            const response = await adminFetch('/dealers');
            if (response.status === 401 || response.status === 403) {
                setAuthorized(false);
                navigate('/login');
                return;
            }
            const data = response.ok ? await response.json() : [];
            setDealers(data);
        } catch (error) {
            console.error(error);
        }
    }, [navigate]);

    useEffect(() => {
        let isMounted = true;

        const validateSession = async () => {
            setAuthChecking(true);
            const authenticated = await hasAdminSession();

            if (!isMounted) {
                return;
            }

            if (!authenticated) {
                setAuthorized(false);
                navigate('/login');
                return;
            }

            setAuthorized(true);
            await fetchDealers();
            if (isMounted) {
                setAuthChecking(false);
            }
        };

        validateSession();

        return () => {
            isMounted = false;
        };
    }, [fetchDealers, navigate]);

    if (authChecking) {
        return (
            <div className={styles.page}>
                <Navbar />
                <div className={styles.content}>
                    <div className={styles.loadingText}>{content.admin.checkingSession}</div>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    const tabIcons = {
        add: <Plus size={16} />,
        cars: <Edit size={16} />,
        leads: <ChevronDown size={16} />,
        dealers: <Users size={16} />
    };

    return (
        <div className={styles.page}>
            <Navbar />
            <div className={styles.content}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>{content.admin.titleLead} <span className="text-accent">{content.admin.titleAccent}</span></h1>
                    <p className={styles.pageSubtitle}>{content.admin.subtitle}</p>
                </div>

                <div className={styles.tabBar}>
                    {content.admin.tabs.map(t => (
                        <button
                            key={t.id}
                            className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            {tabIcons[t.id]}
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.tabContent}>
                    {tab === 'add' && <AddCarTab dealers={dealers} />}
                    {tab === 'cars' && <ManageCarsTab />}
                    {tab === 'leads' && <LeadsTab />}
                    {tab === 'dealers' && <DealersTab onDealerAdded={fetchDealers} onDealerDeleted={fetchDealers} />}
                </div>
            </div>
        </div>
    );
}
