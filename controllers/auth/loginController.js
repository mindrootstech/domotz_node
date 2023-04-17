import Joi from 'joi';
import bcrypt from 'bcrypt';
import { User, RefreshToken } from '../../models';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import JwtService from '../../services/JwtService';
import { REFRESH_SECRET, SITE_URL } from '../../config';
import ErrorLog from '../../services/ErrorLog';

const loginController = {
    async login(req, res, next) {
        // Validation
        const loginSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])')).required(),
        });
        const { error } = loginSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return next(CustomErrorHandler.wrongCredentials());
            }
            // compare the password
            const match = await bcrypt.compare(req.body.password, user.password);
            if (!match) {
                return next(CustomErrorHandler.wrongCredentials());
            }

            // Toekn
            const accessToken = JwtService.sign({ _id: user._id, role: user.role });
            const refreshToken = JwtService.sign({ _id: user._id, role: user.role }, '1y', REFRESH_SECRET);
            // database whitelist
            await RefreshToken.create({ token: refreshToken });
            res.json({ accessToken, refreshToken });
        } catch (err) {
            ErrorLog.createerrorlog(err);
            return next(err);
        }
    },
    async logout(req, res, next) {
        // validation
        const refreshSchema = Joi.object({
            refresh_token: Joi.string().required(),
        });
        const { error } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        try {
            await RefreshToken.deleteOne({ token: req.body.refresh_token });
        } catch (err) {
            return next(new Error('Something went wrong in the database'));
        }
        res.json({ status: 1 });
    },
    async forgetpassword(req, res, next) {
        // validation
        const forgetSchema = Joi.object({
            email: Joi.string().email().required(),
        });
        const { error } = forgetSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        try {
            const exist = await User.findOne({ email: req.body.email });
            if (!exist) {
                res.status(200).json({
                    status: false,
                    message: 'This email is not exist.',
                    type: 'error',
                });
            }
            const emailToken = JwtService.sign({ _id: exist._id, role: exist.role }, '10m', REFRESH_SECRET);
            const link = `${SITE_URL}/reset-password?token=${emailToken}`;
            const name = `${exist.firstname} ${exist.lastname}` || '';
            const messageLine = `Hi ${name}. Please check your register email. `;
            res.status(200).json({
                message: messageLine,
                link,
            });
        } catch (err) {
            return next(new Error('Something went wrong in the database'));
        }
    },
    async resetpassword(req, res, next) {
        // validation
        const { password, id } = req.body;
        const resetSchema = Joi.object({
            password: Joi.string().required(),
            confirm_password: Joi.string().required(),
            id: Joi.string().required(),
        });
        const { error } = resetSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            const filter = { _id: id };
            const update = { password: hashedPassword };
            // `doc` is the document _before_ `update` was applied
            const doc = await User.findOneAndUpdate(filter, update);
            if (doc) {
                res.status(200).json({
                    status: true,
                    message: 'Password update successfully.',
                });
            }
        } catch (err) {
            return next(new Error('Something went wrong in the database'));
        }
    },

};

export default loginController;
