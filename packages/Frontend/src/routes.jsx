import { createElement } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";

const pages = import.meta.glob('./pages/*.jsx', { eager: true });

const pageRoutes = Object.values(pages)
    .filter(x => x.route && x.default !== Home)
    .map(x => ({ ...x.route, element: createElement(x.default) }));

// Manuell hantering för CarDetails för att säkerställa att den är med
import CarDetails from "./pages/CarDetails";
pageRoutes.push({ path: '/bilar/:id', element: <CarDetails /> });


const routes = [
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            ...pageRoutes
        ]
    }
];

export default routes;
