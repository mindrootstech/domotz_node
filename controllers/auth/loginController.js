import Joi from 'joi';
import { User, RefreshToken } from '../../models';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import bcrypt from 'bcrypt';
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
            const access_token = JwtService.sign({ _id: user._id, role: user.role });
            const refresh_token = JwtService.sign({ _id: user._id, role: user.role }, '1y', REFRESH_SECRET);
            // database whitelist
            await RefreshToken.create({ token: refresh_token });
            res.json({ access_token, refresh_token });

        } catch (err) {
            ErrorLog.createerrorlog(err)
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
            let exist = await User.findOne({ email: req.body.email });
            if (!exist) {
                res.status(200).json({
                    status: false,
                    message: 'This email is not exist.',
                    type: 'error'
                })
            }
            const email_token = JwtService.sign({ _id: exist._id, role: exist.role }, '10m', REFRESH_SECRET);
            let link = SITE_URL + '/reset-password?token=' + email_token
            let name = exist.firstname + ' ' + exist.lastname || ''
            let messageLine = `Hi ${name}. Please check your register email. `
            res.status(200).json({
                message: messageLine,
                link
            })
        } catch (err) {
            return next(new Error('Something went wrong in the database'));
        }
    },
    async resetpassword(req, res, next) {
        // validation
        const {password, confirm_password, id} = req.body
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
            console.log(req.body)
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log(hashedPassword, 'hashedPassword')
            const filter = { _id:id };
            const update = { password: hashedPassword };
            // `doc` is the document _before_ `update` was applied
            let doc = await User.findOneAndUpdate(filter, update);
            if (doc) {
                res.status(200).json({
                    status: true,
                    message: 'Password update successfully.',
                })
            }

        } catch (err) {
            return next(new Error('Something went wrong in the database'));
        }
    }

};


export default loginController;