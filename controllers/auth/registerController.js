import Joi from 'joi';
import { User, RefreshToken } from '../../models';
import bcrypt from 'bcrypt';
import JwtService from '../../services/JwtService';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import { REFRESH_SECRET } from '../../config';
import ErrorLog from '../../services/ErrorLog';
const registerController = {
    async register(req, res, next) {
        // Validation
        const registerSchema = Joi.object({
            firstname: Joi.string().min(3).max(30).required(),
            email: Joi.string().email().required(),
            lastname:Joi.string(),
            phone_number: Joi.number(),
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
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
                    status:false,
                    message:'This email is already taken.',
                    type:'error'
                })
            }
        } catch (err) {
            return next(err);
        }
        const { firstname, lastname, phone_number, email, password } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // prepare the model

        const user = new User({
            firstname, lastname, phone_number, email,
            password: hashedPassword
        });

        try {
            const result = await user.save();
            res.status(201).json({
                status:true,
                type: 'success',
                message:'User saved successfully.'
            })

        } catch (err) {
            ErrorLog.createerrorlog(err)
            return next(err);
        }
    }
}


export default registerController;