import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'tp-management',
        resource_type: 'auto',
        allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
    } as any, // Type assertion due to some loose typing in the library
});

export const upload = multer({ storage: storage });
export { cloudinary };
