import { GoogleGenAI } from "@google/genai";
import pool from "../config/db.js";

/**
 * Safely infer vegetarian status from item attributes without querying non-existent columns.
 */
function inferIsVeg(item) {
    const text = `${item.name || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
    const nonVegKeywords = ['chicken', 'egg', 'fish', 'mutton', 'meat', 'prawn', 'pork', 'beef', 'non-veg', 'nonveg'];
    return !nonVegKeywords.some(kw => text.includes(kw));
}

/**
 * Safely infer prep time in minutes based on category without querying non-existent columns.
 */
function inferPrepTime(item) {
    const category = (item.category || '').toLowerCase();
    if (category.includes('beverage') || category.includes('drink') || category.includes('tea') || category.includes('coffee')) {
        return 3;
    }
    if (category.includes('snack') || category.includes('breakfast')) {
        return 5;
    }
    if (category.includes('meal') || category.includes('combo') || category.includes('lunch') || category.includes('thali')) {
        return 10;
    }
    return 8;
}

/**
 * POST /api/ai/recommend
 * Secure backend-driven AI meal recommendations using Gemini API
 */
export const getAiRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, budget, dietary, canteenId } = req.body;

        // 1. Input Validation
        if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "A prompt is required for AI recommendations"
            });
        }

        const trimmedPrompt = prompt.trim();
        if (trimmedPrompt.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Prompt is too long. Maximum allowed length is 500 characters."
            });
        }

        // 2. Fetch real menu items from Database (Source of Truth)
        let menuQuery = `
            SELECT 
                id, 
                canteen_id,
                name, 
                description, 
                price, 
                category, 
                COALESCE(stock_quantity, 100) AS stock_quantity
            FROM menu_items 
            WHERE is_available = 1`;
        const queryParams = [];

        if (canteenId) {
            menuQuery += " AND canteen_id = ?";
            queryParams.push(Number(canteenId));
        }

        const [availableMenuItems] = await pool.query(menuQuery, queryParams);

        if (availableMenuItems.length === 0) {
            return res.json({
                success: true,
                data: {
                    recommendations: [],
                    summary: "No active menu items are currently available in the cafeteria."
                }
            });
        }

        // 3. Fetch student's recent completed order history (Personalization)
        let orderHistoryNames = "";
        try {
            const [recentHistory] = await pool.query(
                `SELECT m.name, oi.quantity
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 JOIN menu_items m ON oi.menu_item_id = m.id
                 WHERE o.user_id = ? AND o.status = 'completed'
                 ORDER BY o.created_at DESC
                 LIMIT 5`,
                [userId]
            );
            orderHistoryNames = (recentHistory || []).map(h => h.name).join(", ");
        } catch (historyErr) {
            // Non-critical, continue without history if orders table is empty or error occurs
            orderHistoryNames = "";
        }

        // Build simplified catalog for LLM (safe from any database secrets)
        const catalogForLlm = availableMenuItems.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description || "",
            price: Number(m.price),
            category: m.category || "general",
            isVeg: inferIsVeg(m),
            prepTimeMinutes: inferPrepTime(m)
        }));

        const apiKey = process.env.GEMINI_API_KEY;
        let aiResult = null;

        if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "YOUR_GEMINI_API_KEY") {
            try {
                const ai = new GoogleGenAI({ apiKey });
                const systemInstruction = `You are CampusEats AI Cafeteria Assistant. 
Analyze the user's request and recommend meals strictly from the provided Menu Catalog.

RULES:
1. ONLY recommend items that exist in the Menu Catalog. Use their exact numeric "id".
2. NEVER hallucinate food items or invent new item IDs.
3. NEVER invent specific calorie, fat, or carb gram numbers since nutrition data is not in the database.
4. If the user asks general questions about the menu, vegetarian options, items under a budget, combos, or tastes, select relevant items from the catalog and explain clearly in the summary and item reasons.
5. Output MUST be valid JSON matching this schema:
{
  "recommendations": [
    {
      "menuItemId": <number>,
      "name": "<string>",
      "reason": "<short explanation why this fits budget/diet/speed/preference>",
      "estimatedWaitMinutes": <number>
    }
  ],
  "summary": "<one or two sentence helpful and friendly response answering the student's question>"
}`;

                const userContent = `User Request: "${trimmedPrompt}"
User Filters: Budget = ${budget ? '₹' + budget : 'Any'}, Diet = ${dietary || 'Any'}
Recent Student Favorites: ${orderHistoryNames || 'None'}

Available Menu Catalog:
${JSON.stringify(catalogForLlm, null, 2)}

Provide your response strictly in the JSON format requested.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [
                        { role: "user", parts: [{ text: userContent }] }
                    ],
                    config: {
                        systemInstruction,
                        responseMimeType: "application/json"
                    }
                });

                let responseText = response.text?.trim() || "";
                if (responseText) {
                    // Clean markdown fences or surrounding text if present
                    responseText = responseText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
                    const firstBrace = responseText.indexOf('{');
                    const lastBrace = responseText.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        responseText = responseText.substring(firstBrace, lastBrace + 1);
                    }
                    aiResult = JSON.parse(responseText);
                }
            } catch (geminiErr) {
                console.warn("Gemini API call notice, using database heuristic matcher:", geminiErr.message);
            }
        }

        // Heuristic Database Matcher (used as deterministic fallback or when API key is offline)
        if (!aiResult || !Array.isArray(aiResult.recommendations)) {
            aiResult = generateDatabaseHeuristicRecommendations(
                trimmedPrompt,
                catalogForLlm,
                budget,
                dietary
            );
        }

        // 4. Strict Server-Side Validation: Filter out any non-existent menu IDs
        const validItemMap = new Map(availableMenuItems.map(m => [Number(m.id), m]));
        const validatedRecommendations = [];

        for (const rec of (aiResult.recommendations || [])) {
            const matchedDbItem = validItemMap.get(Number(rec.menuItemId));
            if (matchedDbItem) {
                validatedRecommendations.push({
                    menuItemId: matchedDbItem.id,
                    name: matchedDbItem.name,
                    price: Number(matchedDbItem.price),
                    isVeg: inferIsVeg(matchedDbItem),
                    reason: String(rec.reason || `Fits your preferences at ₹${matchedDbItem.price}`),
                    estimatedWaitMinutes: Number(rec.estimatedWaitMinutes || inferPrepTime(matchedDbItem))
                });
            }
        }

        res.json({
            success: true,
            data: {
                recommendations: validatedRecommendations,
                summary: validatedRecommendations.length > 0 
                    ? (aiResult.summary || `Found ${validatedRecommendations.length} matching meal options.`)
                    : (aiResult.summary || "No matching menu items found for your specific criteria.")
            }
        });

    } catch (error) {
        console.error("AI recommendation error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate AI recommendations"
        });
    }
};

/**
 * Deterministic database recommendation engine based on real menu attributes
 */
function generateDatabaseHeuristicRecommendations(prompt, catalog, budget, dietary) {
    const lower = (prompt || "").toLowerCase();
    let filtered = [...catalog];

    // Budget filter
    const maxBudget = budget || (lower.match(/under\s*₹?(\d+)/) ? Number(lower.match(/under\s*₹?(\d+)/)[1]) : null);
    if (maxBudget) {
        filtered = filtered.filter(item => item.price <= maxBudget);
    }

    // Dietary filter
    const isVegQuery = dietary === "veg" || lower.includes("veg") || lower.includes("vegetarian");
    if (isVegQuery) {
        filtered = filtered.filter(item => item.isVeg);
    }

    // Fast / Rush filter
    const isFastQuery = lower.includes("fast") || lower.includes("quick") || lower.includes("rush") || lower.includes("hurry");
    if (isFastQuery) {
        filtered.sort((a, b) => a.prepTimeMinutes - b.prepTimeMinutes);
    } else {
        // Keyword match scoring
        const stopWords = ['and', 'for', 'the', 'what', 'can', 'eat', 'under', 'which', 'items', 'are', 'you', 'have', 'show', 'suggest', 'food'];
        const keywords = lower.split(/[\s,?.!]+/).filter(w => w.length > 2 && !stopWords.includes(w));
        if (keywords.length > 0) {
            filtered.sort((a, b) => {
                const aText = `${a.name} ${a.description} ${a.category}`.toLowerCase();
                const bText = `${b.name} ${b.description} ${b.category}`.toLowerCase();
                const aMatches = keywords.filter(kw => aText.includes(kw)).length;
                const bMatches = keywords.filter(kw => bText.includes(kw)).length;
                return bMatches - aMatches;
            });
        } else {
            filtered.sort((a, b) => a.price - b.price);
        }
    }

    const topItems = filtered.slice(0, 4);
    const recommendations = topItems.map(item => ({
        menuItemId: item.id,
        name: item.name,
        reason: maxBudget 
            ? `Priced at ₹${item.price}, well within your ₹${maxBudget} budget`
            : isFastQuery 
            ? `Ready in ~${item.prepTimeMinutes} mins for a quick break`
            : `Freshly prepared and available at the cafeteria`,
        estimatedWaitMinutes: item.prepTimeMinutes
    }));

    let summaryText = "";
    if (recommendations.length > 0) {
        if (maxBudget) {
            summaryText = `Found ${recommendations.length} great option${recommendations.length > 1 ? 's' : ''} under ₹${maxBudget}.`;
        } else if (isVegQuery) {
            summaryText = `Found ${recommendations.length} delicious vegetarian option${recommendations.length > 1 ? 's' : ''}.`;
        } else {
            summaryText = `Here are ${recommendations.length} top recommendations matching "${prompt}".`;
        }
    } else {
        summaryText = "No matching menu items found for your specific criteria.";
    }

    return {
        recommendations,
        summary: summaryText
    };
}
