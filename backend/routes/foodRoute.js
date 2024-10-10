import express from "express";
import { addToCart, removeFromCart, getCart } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const foodRouter = express.Router();

// Image Storage Engine

const storage= multer.diskStorage({
    destination:"uploads",
    filename:(req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

const upload= multer({storage:storage})

foodRouter.post("/add",upload.single("image"),authMiddleware,addToCart);
foodRouter.get("/list",getCart);
foodRouter.post("/remove",authMiddleware,removeFromCart);

export default foodRouter;