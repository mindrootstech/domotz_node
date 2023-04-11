import express from 'express';
const router = express.Router();
import { registerController, loginController, userController, refreshController, adminRegisterController,adminLoginController } from '../controllers';
import auth from '../middlewares/auth';
import admin from '../middlewares/admin';

//user

router.post('/register', registerController.register);
router.post('/login', loginController.login);
router.get('/me', auth, userController.me);
router.get('/all', [auth, admin], userController.all);
router.post('/refresh', refreshController.refresh);
router.post('/logout', auth, loginController.logout);

//admin

router.post('/admin/register', adminRegisterController.register);
router.post('/admin/login', adminLoginController.login);
router.post('/admin/logout', auth, adminLoginController.logout);


export default router;