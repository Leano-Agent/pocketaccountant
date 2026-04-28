import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { autoCategorize, batchAutoCategorize, getDetectedCategories } from '../services/auto-categorize';

export class AutoCategoryController {
    // Suggest a category for a single expense
    async suggest(req: AuthRequest, res: Response) {
        try {
            const { description } = req.body;

            if (!description) {
                return res.status(400).json({ error: 'Description is required' });
            }

            const suggestion = autoCategorize(description);

            res.json({
                data: {
                    description,
                    suggestedCategory: suggestion,
                    confidence: suggestion ? 'high' : 'low',
                },
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Batch auto-categorize all uncategorized expenses
    async batchCategorize(req: AuthRequest, res: Response) {
        try {
            const userId = req.user!.id as any;
            const result = await batchAutoCategorize(userId);

            res.json({
                data: result,
                message: `Processed ${result.processed} expenses, categorized ${result.categorized}`,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get all detected categories (for reference)
    async categories(req: AuthRequest, res: Response) {
        res.json({
            data: getDetectedCategories(),
        });
    }
}
