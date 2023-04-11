import { User } from "../../models";
import CustomErrorHandler from "../../services/CustomErrorHandler";
import ErrorLog from '../../services/ErrorLog';
const userController = {
    async me(req, res, next) {
        try {
            const user = await User.findOne({ _id: req.user._id }).select('-password -updatedAt -__v');
            if (!user) {
                return next(CustomErrorHandler.notFound());
            }
            res.status(200).json({
                status:true,
                data: user,
            })
        } catch(err) {
            ErrorLog.createerrorlog(err)
           return next(err);
        }
    },
    async all(req, res, next) {
        try {
            const user = await User.find().select('-password -updatedAt -__v');
            if (!user) {
                return next(CustomErrorHandler.notFound());
            }
            res.status(200).json({
                status:true,
                data: user,
                total:user.length
            })
        } catch(err) {
            ErrorLog.createerrorlog(err)
           return next(err);
        }
    }
};

export default userController;