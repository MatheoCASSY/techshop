import { Route, Routes } from 'react-router';
import { NotFoundPage } from '../NotFoundPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminLayout } from './AdminLayout';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminProductFormPage } from './AdminProductFormPage';
import { AdminProductsPage } from './AdminProductsPage';

/** Routes du back-office, chargées à la demande (seuls les admins téléchargent ce code). */
export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="produits" element={<AdminProductsPage />} />
        <Route path="produits/nouveau" element={<AdminProductFormPage />} />
        <Route path="produits/:id" element={<AdminProductFormPage />} />
        <Route path="commandes" element={<AdminOrdersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
