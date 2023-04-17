import Joi from 'joi';
import bcrypt from 'bcrypt';
import { Admin, RefreshToken } from '../../models';
import JwtService from '../../services/JwtService';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import { REFRESH_SECRET } from '../../config';
import ErrorLog from '../../services/ErrorLog';

const adminRegisterController = {
    async register(req, res, next) {
        // Validation
        const registerSchema = Joi.object({
            firstname: Joi.string(),
            lasttname: Joi.string(),
            username: Joi.string(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            ).required(),
            repeat_password: Joi.ref('password'),
        });
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return next(error);
        }
        // check if user is in the database already
        try {
            const exist = await Admin.findOne({ email: req.body.email });
            if (exist) {
                return next(CustomErrorHandler.alreadyExist('This email is already taken.'));
            }
        } catch (err) {
            ErrorLog.createerrorlog(err);
            return next(err);
        }
        const {
            firstname, lasttname, username, email, password,
        } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // prepare the model

        const admin = new Admin({
            firstname,
            lasttname,
            username,
            email,
            password: hashedPassword,
        });

        let accessToken;
        let refreshToken;
        try {
            const result = await admin.save();
            // Token
            accessToken = JwtService.sign({ _id: result._id, role: result.role });
            refreshToken = JwtService.sign({ _id: result._id, role: result.role }, '1y', REFRESH_SECRET);
            // database whitelist
            await RefreshToken.create({ token: refreshToken });
        } catch (err) {
            ErrorLog.createerrorlog(err);
            return next(err);
        }

        res.json({ accessToken, refreshToken });
    },
};

export default adminRegisterController;
