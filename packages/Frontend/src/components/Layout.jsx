import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
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

