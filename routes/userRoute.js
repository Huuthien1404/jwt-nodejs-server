const router = require("express").Router();
const userController = require("../controllers/userController");
const middlewareController = require("../controllers/middlewareController");

router.get("/", middlewareController.verifyToken, userController.getAllUsers);
router.delete("/:username", middlewareController.verifyTokenForDeleteUser, userController.deleteUser);

module.exports = router;