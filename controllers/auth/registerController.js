import Joi from 'joi';
import bcrypt from 'bcrypt';
import { User } from '../../models';
import ErrorLog from '../../services/ErrorLog';

const registerController = {
    async register(req, res, next) {
        // Validation
        const registerSchema = Joi.object({
            firstname: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            lastname: Joi.string(),
            phonenumber: Joi.number(),
            password: Joi.string().pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            ).required(),
        });
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return next(error);
        }
        // check if user is in the database already
        try {
            const exist = await User.exists({ email: req.body.email });
            if (exist) {
                res.status(200).json({
                    status: false,
                    message: 'This email is already taken.',
                    type: 'error',
                });
            }
        } catch (err) {
            return next(err);
        }
        const {
            firstname, lastname, phonenumber, email, password,
        } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // prepare the model

        const user = new User({
            firstname,
            lastname,
            phonenumber,
            email,
            password: hashedPassword,
        });

        try {
            await user.save();
            res.status(201).json({
                status: true,
                type: 'success',
                message: 'User saved successfully.',
            });
        } catch (err) {
            ErrorLog.createerrorlog(err);
            return next(err);
        }
    },
};

export default registerController;
