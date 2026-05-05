import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Konfigurera Cloudinary med miljövariabler
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Laddar upp en fil till Cloudinary och returnerar webblänken.
 * Tar sedan bort den lokala filen från servern.
 * 
 * @param {string} filePath - Sökvägen till den lokala filen
 * @returns {Promise<string>} - En säker URL (https) till bilden på Cloudinary
 */
export const uploadImage = async (filePath) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new Error("Cloudinary är inte konfigurerat. Saknar miljövariabler i .env!");
        }

        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'autoeskil_cars', // Samlar alla bilar i denna mapp på Cloudinary
            quality: 'auto', // Optimerar kvalitet automatiskt
            fetch_format: 'auto' // Levererar modernaste formatet automatiskt (ex. webp)
        });
        
        // Radera filen från vår lokala uploads-mapp efter att den laddats upp till molnet
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        // Radera filen även om det blev ett fel
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
}
