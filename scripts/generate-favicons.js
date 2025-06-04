import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512,
    'og-image.png': { width: 1200, height: 630 },
    'twitter-image.png': { width: 1200, height: 600 }
};

async function generateImages() {
    const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/images/favicon.svg'));
    const outputDir = path.join(__dirname, '../public/images');

    // Asegurarse de que el directorio existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generar cada tamaño
    for (const [filename, size] of Object.entries(sizes)) {
        const outputPath = path.join(outputDir, filename);

        if (typeof size === 'number') {
            // Generar imágenes cuadradas
            await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toFile(outputPath);
        } else {
            // Generar imágenes rectangulares (og-image y twitter-image)
            await sharp(svgBuffer)
                .resize(size.width, size.height, {
                    fit: 'contain',
                    background: { r: 24, g: 24, b: 27, alpha: 1 } // #18181b
                })
                .png()
                .toFile(outputPath);
        }

        console.log(`Generated ${filename}`);
    }

    // Generar favicon.ico (combinación de 16x16 y 32x32)
    const favicon16 = await sharp(svgBuffer)
        .resize(16, 16)
        .toBuffer();

    const favicon32 = await sharp(svgBuffer)
        .resize(32, 32)
        .toBuffer();

    // Combinar en un solo ICO
    const icoPath = path.join(outputDir, 'favicon.ico');
    await sharp(favicon32)
        .joinChannel(favicon16)
        .toFile(icoPath);

    console.log('Generated favicon.ico');
}

generateImages().catch(console.error); 