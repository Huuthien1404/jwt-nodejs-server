const db = require("../query");

const userController = {
    getAllUsers: async (req, res) => {
        try {
            const users = await db.query('select * from public."Users"');
            return res.status(200).json(users.rows);
        } catch (error) {
            res.status(500).json(error);
        }
    },
    deleteUser: async (req, res) => {
        try {
            const deleteResult = await db.query('DELETE FROM public."Users" WHERE "username" = $1;', [`${req.params.username}`]);
            if (deleteResult.rowCount === 0) return res.status(404).json("Username not found");
            return res.status(200).json("Delete successfully");
        } catch (error) {
            res.status(500).json(error);
        }
    }
}

module.exports = userController;