
import { Request, Response } from 'express';
import { PrismaClient, DocumentType } from '@prisma/client';
import { asyncHandler } from '../middleware/error.middleware';
import { upload } from '../config/cloudinary';

const prisma = new PrismaClient();

class DocumentController {

    // Middleware for upload (single file)
    uploadMiddleware = upload.single('file');

    // Handle Upload
    uploadDocument = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { projectId, documentName, documentType, description } = req.body;
        const organizationId = req.user!.organizationId;

        // Verify Project Ownership
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.organizationId !== organizationId) {
            // Should we delete the uploaded file from Cloudinary? Ideally yes.
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        // Create Document Logic
        const doc = await prisma.document.create({
            data: {
                organizationId,
                projectId,
                name: documentName || req.file.originalname,
                documentType: documentType as DocumentType || 'other',
                fileUrl: req.file.path,
                publicId: req.file.filename,
                mimeType: req.file.mimetype,
                fileSize: req.file.size,
                uploadedBy: req.user!.id,
                description
            }
        });

        res.status(201).json({ success: true, data: doc });
    });

    // Get Project Documents
    getProjectDocuments = asyncHandler(async (req: Request, res: Response) => {
        const { projectId } = req.params;
        const organizationId = req.user!.organizationId;

        const docs = await prisma.document.findMany({
            where: { projectId, organizationId },
            orderBy: { createdAt: 'desc' },
            include: { uploader: { select: { firstName: true, lastName: true } } }
        });

        res.json({ success: true, data: docs });
    });
}

export const documentController = new DocumentController();
