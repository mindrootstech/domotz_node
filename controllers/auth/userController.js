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
                status: true,
                data: user,
            })
        } catch (err) {
            ErrorLog.createerrorlog(err)
            return next(err);
        }
    },
    async all(req, res, next) {
        let documents;
        const sort = {}
        let setlimit = 10;
        if (req.query.perPage)
            setlimit = req.query.perPage;
        let page = 1;
        if (req.query.page)
            page = req.query.page;
        const offsetval = (parseInt(page) - 1) * parseInt(setlimit);
        if (req.query.sortBy) {
            const str = req.query.sortBy.split(':')
            sort[str[0]] = str[1] === 'desc' ? -1 : 1
        }
        let key = '';
        if (req.query.key) {
            key = req.query.key
        }
        console.log(key)
        try {
            documents = await User.find(
                {
                    "$or": [
                        { email: { $regex: key, $options: "i" } },
                        { phone_number: { $regex: key, $options: "i" } },
                        { firstname: { $regex: key, $options: "i" } },
                        { lastname: { $regex: key, $options: "i" } },

                    ]
                }
            ).limit(parseInt(setlimit)).skip(offsetval).sort(sort);
            res.status(200).json({
                status: true,
                data: documents,
                total: documents.length
            })

        } catch (err) {
            ErrorLog.createerrorlog(err)
            return next(err);
        }

        // const user = await User.find().select('-password -updatedAt -__v');
    }
};

export default userController;