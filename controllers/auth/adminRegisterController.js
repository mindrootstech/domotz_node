import Joi from 'joi';
import { Admin, RefreshToken } from '../../models';
import bcrypt from 'bcrypt';
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
            password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            repeat_password: Joi.ref('password')
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
    } catch(err) {
        ErrorLog.createerrorlog(err)
        return next(err);
    }
    const { firstname,lasttname,username, email, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // prepare the model

    const admin = new Admin({
        firstname,
        lasttname,
        username,
        email,
        password: hashedPassword
    });

    let access_token;
    let refresh_token;
    try {
        const result = await admin.save();
        // Token
        access_token = JwtService.sign({ _id: result._id, role: result.role });
        refresh_token = JwtService.sign({ _id: result._id, role: result.role }, '1y', REFRESH_SECRET);
        // database whitelist
        await RefreshToken.create({ token: refresh_token });
    } catch(err) {
        ErrorLog.createerrorlog(err)
        return next(err);
    }

        res.json({ access_token, refresh_token });
    }
}


export default adminRegisterController;