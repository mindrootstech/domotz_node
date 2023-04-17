import Joi from 'joi';
import { REFRESH_SECRET } from '../../config';
import { RefreshToken, User } from '../../models';
import CustomErrorHandler from '../../services/CustomErrorHandler';
import JwtService from '../../services/JwtService';
import ErrorLog from '../../services/ErrorLog';

const refreshController = {
    async refresh(req, res, next) {
        // validation
        const refreshSchema = Joi.object({
            refresh_token: Joi.string().required(),
        });
        const { error } = refreshSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        // database
        let userToken;
        try {
            userToken = await RefreshToken.findOne({ token: req.body.refresh_token });
            if (!userToken) {
                return next(CustomErrorHandler.unAuthorized('Invalid refresh token'));
            }

            let userId;
            try {
                const { _id } = await JwtService.verify(userToken.token, REFRESH_SECRET);
                userId = _id;
            } catch (err) {
                return next(CustomErrorHandler.unAuthorized('Invalid refresh token'));
            }

            const user = await User.findOne({ _id: userId });
            if (!user) {
                return next(CustomErrorHandler.unAuthorized('No user found!'));
            }

            // tokens
            // Toekn
            const accessToken = JwtService.sign({ _id: user._id, role: user.role });
            const refreshToken = JwtService.sign({ _id: user._id, role: user.role }, '1y', REFRESH_SECRET);
            // database whitelist
            await RefreshToken.create({ token: refreshToken });
            res.json({ accessToken, refreshToken });
        } catch (err) {
            ErrorLog.createerrorlog(err);
            return next(new Error(`Something went wrong ${err.message}`));
        }
    },
};

export default refreshController;
