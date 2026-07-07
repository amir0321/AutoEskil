import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);

    return (
        <>
            <Navbar />
            <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}
