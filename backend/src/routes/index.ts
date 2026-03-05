import { Router } from 'express';
import addressRoutes from './address.routes.js';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import chatRoutes from './chat.routes.js';
import complaintRoutes from './complaint.routes.js';
import courierRoutes from './courier.routes.js';
import menuRoutes from './menu.routes.js';
import merchantRoutes from './merchant.routes.js';
import orderRoutes from './order.routes.js';
import reviewRoutes from './review.routes.js';
import userRoutes from './user.routes.js';

const router: Router = Router();

// Mount all routes
router.use('/chat', chatRoutes);
router.use('/users/me', userRoutes);
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use(categoryRoutes); // /categories
router.use(merchantRoutes); // Contains both /merchants and /merchant paths
router.use(menuRoutes); // Contains both /merchants/:id/menu and /merchant/menu paths
router.use(orderRoutes); // Contains both /orders and /merchant/orders paths
router.use(addressRoutes);
router.use(reviewRoutes);
router.use('/complaints', complaintRoutes);
router.use(courierRoutes);

export default router;
