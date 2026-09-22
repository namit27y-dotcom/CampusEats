import dotenv from 'dotenv';
dotenv.config();

import { getAiRecommendations } from '../src/controllers/aiController.js';

async function runTests() {
    console.log('Testing CampusEats Gemini AI Integration...');

    const testCases = [
        {
            name: 'Test 1: Meal Recommender (Veg Only, Budget 100, Lunch, Prompt: spicy and healthy)',
            body: { prompt: 'Suggest a vegetarian meal for lunch under ₹100 (spicy and healthy)', budget: 100, dietary: 'veg' }
        },
        {
            name: 'Test 2: Menu Q&A (What can I eat under ₹100?)',
            body: { prompt: 'What can I eat under ₹100?', budget: 100, dietary: 'veg' }
        },
        {
            name: 'Test 3: Menu Q&A (Which items are vegetarian?)',
            body: { prompt: 'Which items are vegetarian?', budget: 150, dietary: 'all' }
        }
    ];

    for (const tc of testCases) {
        console.log('\n========================================');
        console.log('RUNNING: ' + tc.name);
        console.log('========================================');
        let captured = {};
        const req = { user: { id: 1 }, body: tc.body };
        const res = {
            status(c) { this.statusCode = c; return this; },
            json(d) { captured = d; }
        };
        await getAiRecommendations(req, res);
        console.log('Success:', captured.success);
        console.log('Summary:', captured.data?.summary);
        console.log('Recommendations count:', captured.data?.recommendations?.length);
        if (captured.data?.recommendations?.length > 0) {
            for (const item of captured.data.recommendations) {
                console.log(` - ${item.name} (₹${item.price}): ${item.reason}`);
            }
        }
    }

    console.log('\n========================================');
    console.log('Testing Offline Heuristic Fallback (Empty API Key simulation)');
    console.log('========================================');
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
    
    let fallbackCaptured = {};
    const fallbackReq = { user: { id: 1 }, body: { prompt: 'spicy and healthy under ₹100', budget: 100, dietary: 'veg' } };
    const fallbackRes = {
        status(c) { this.statusCode = c; return this; },
        json(d) { fallbackCaptured = d; }
    };
    await getAiRecommendations(fallbackReq, fallbackRes);
    console.log('Fallback Success:', fallbackCaptured.success);
    console.log('Fallback Summary:', fallbackCaptured.data?.summary);
    console.log('Fallback Recommendations count:', fallbackCaptured.data?.recommendations?.length);
    for (const item of (fallbackCaptured.data?.recommendations || [])) {
        console.log(` - [Fallback] ${item.name} (₹${item.price}): ${item.reason}`);
    }

    process.env.GEMINI_API_KEY = originalKey;
    process.exit(0);
}

runTests().catch(err => {
    console.error('Error running test script:', err);
    process.exit(1);
});
