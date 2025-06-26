import express from 'express'
import { registerUser, loginUser, getProfile, updateProfile, uploadProfileImage, bookAppointment, listAppointment, cancelAppointment, completeAppointment } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.get('/get-profile',authUser,getProfile)
userRouter.post('/update-profile', authUser, updateProfile);
userRouter.post('/upload-profile-image', upload.single('image'), authUser, uploadProfileImage)

userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)
userRouter.post('/complete-appointment', authUser, completeAppointment)

export default userRouter
