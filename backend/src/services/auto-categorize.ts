import { AppDataSource } from '../data-source';
import { Category } from '../models/Category';
import { Expense } from '../models/Expense';

// Pattern-based auto-categorization rules
// Matched against expense description (case-insensitive)
const CATEGORY_RULES: Array<{
    patterns: RegExp[];
    category: string;
    keywords: string;
}> = [
    // Food & Dining
    { patterns: [/pick.?n.?pay|pnp|checkers|woolworths?|food|grocery|supermarket|spar|shoprite|foodlover|fruit.?veg/i], category: 'Groceries', keywords: 'supermarket, grocery stores' },
    { patterns: [/mcdonald|kfc|nando|steers|debonair|burger|pizza|sushi|restaurant|cafe|dining|takeaway|uber.?eat|mrbones|taste|thirst/i], category: 'Dining Out', keywords: 'restaurants, fast food' },
    { patterns: [/coffee|cappuccino|latte|espresso|starbucks|vida/i], category: 'Coffee Shops', keywords: 'coffee shops' },

    // Transport
    { patterns: [/engen|shell|bp[^d]|sasol|totalenergies|caltex|fuel|petrol|diesel|garage/i], category: 'Fuel', keywords: 'petrol stations, fuel' },
    { patterns: [/uber|bolt|taxify|taxi|gautrain|metrorail|prasa|bus|shuttle|my.?citi/i], category: 'Transport', keywords: 'ride-hailing, public transport' },
    { patterns: [/e.?toll|sanral|via.?toll/i], category: 'Tolls', keywords: 'e-tolls, road tolls' },
    { patterns: [/parking|parkade/i], category: 'Parking', keywords: 'parking fees' },

    // Housing & Utilities
    { patterns: [/city.?of|municipal|rates|water|electricity|utility/i], category: 'Utilities', keywords: 'municipal bills, utilities' },
    { patterns: [/rent|lease|property|estate/i], category: 'Rent', keywords: 'rent, lease payments' },
    { patterns: [/dstv|showmax|netflix|spotify|apple.?music|disney\+|multichoice/i], category: 'Entertainment', keywords: 'streaming services' },

    // Communications
    { patterns: [/vodacom|mtn|cell.?c|telkom|rain|afrihost|web.?africa|isp/i], category: 'Phone & Internet', keywords: 'cellphone, internet providers' },

    // Insurance
    { patterns: [/outsurance|old.?mutual|sanlam|liberty|discovery|hollard|mirabilis|insurance/i], category: 'Insurance', keywords: 'insurance premiums' },

    // Health
    { patterns: [/discovery.?health|medic|hospital|clinic|doctor|pharmacy|dis.?chem|clicks|netcare/i], category: 'Health & Medical', keywords: 'medical, pharmacy, hospitals' },
    { patterns: [/gym|virgin.?active|planet.?fit|exercise/i], category: 'Fitness', keywords: 'gym memberships' },

    // Financial
    { patterns: [/fnb|absa|nedbank|standard.?bank|capitec|bank.?fee|service.?fee|monthly.?fee/i], category: 'Bank Charges', keywords: 'bank fees, service charges' },
    { patterns: [/sars|tax|it12|it3/i], category: 'Tax', keywords: 'SARS, tax payments' },
    { patterns: [/loan|bond|mortgage|credit.?card|payment|instalment/i], category: 'Loan Repayments', keywords: 'loan payments, credit card' },

    // Shopping
    { patterns: [/woolworths|mr.?price|tfg|foschini|edcon|jet|sportscene|totalsport|sport.?direct|drip|sneaker/i], category: 'Clothing', keywords: 'clothing stores' },
    { patterns: [/game|makro|builders|diy|lifestyle|home.?living/i], category: 'Home & DIY', keywords: 'hardware, home improvement' },
    { patterns: [/takealot|amazon|ebay|superbalist|zando|bash|everyshop|online/i], category: 'Online Shopping', keywords: 'online shopping' },
    { patterns: [/checkers.?sixty60|sixty.?60/i], category: 'Groceries', keywords: 'online grocery delivery' },

    // Education
    { patterns: [/univen|university|tut|vut|wits|uj|uct|stellenbosch|college|school|tuition|eduvos|skill/i], category: 'Education', keywords: 'tuition, education fees' },

    // Income
    { patterns: [/salary|wage|stipend|income|payroll/i], category: 'Income', keywords: 'salary deposits' },
    { patterns: [/dividend|interest|investment/i], category: 'Investment Income', keywords: 'investment returns' },
    { patterns: [/freelance|consulting|contract|invoice.?payment|client.?payment/i], category: 'Freelance Income', keywords: 'freelance payments' },

    // Kids
    { patterns: [/school.?fee|creche|day.?care|nursery|nanny|au.?pair/i], category: 'Childcare', keywords: 'school fees, childcare' },
    { patterns: [/toys|kids.?shop|cotton.?on.?kids|clicks.?baby/i], category: 'Kids', keywords: 'childrens items' },

    // Subscriptions
    { patterns: [/google.?one|icloud|dropbox|microsoft.?365|office.?365|subscription/i], category: 'Subscriptions', keywords: 'subscription services' },
];

/**
 * Auto-categorize an expense description into a category
 */
export function autoCategorize(description: string): string | null {
    if (!description) return null;

    for (const rule of CATEGORY_RULES) {
        for (const pattern of rule.patterns) {
            if (pattern.test(description)) {
                return rule.category;
            }
        }
    }
    return null;
}

/**
 * Get all detected categories from the rules
 */
export function getDetectedCategories(): string[] {
    return [...new Set(CATEGORY_RULES.map(r => r.category))];
}

/**
 * Auto-categorize existing expenses that don't have a category
 */
export async function batchAutoCategorize(userId?: number): Promise<{ processed: number; categorized: number }> {
    const expenseRepo = AppDataSource.getRepository(Expense);
    const categoryRepo = AppDataSource.getRepository(Category);

    const query = expenseRepo.createQueryBuilder('e')
        .where('(e.category IS NULL OR e.category = :empty)', { empty: '' });

    if (userId) {
        query.andWhere('e.userId = :userId', { userId });
    }

    const uncategorized = await query.getMany();
    let categorized = 0;

    for (const expense of uncategorized) {
        const matchedCategory = autoCategorize(expense.description || '');
        if (matchedCategory) {
            expense.category = matchedCategory;
            await expenseRepo.save(expense);
            categorized++;
        }
    }

    return { processed: uncategorized.length, categorized };
}
