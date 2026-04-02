require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 Testing Gemini API Key...\n');

// Check if API key exists
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in .env');
    process.exit(1);
}

console.log('✅ API Key found (length:', apiKey.length, 'chars)');
console.log('   Key starts with:', apiKey.substring(0, 20) + '...');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Test API call
async function testGemini() {
    try {
        console.log('\n🚀 Sending test request to Gemini...\n');
        
        const result = await model.generateContent('Hãy nói "Gemini API đang hoạt động!" bằng tiếng Việt');
        const response = await result.response;
        const text = response.text();

        console.log('✅ SUCCESS! Gemini API is working!\n');
        console.log('📝 Response:');
        console.log('   ', text);
        console.log('\n✨ API Key is valid and working!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR: Gemini API call failed\n');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        
        console.log('\n📋 Possible Solutions:');
        
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
            console.log('   ❌ Invalid or expired API key');
            console.log('   → Go to https://aistudio.google.com/app/apikeys');
            console.log('   → Delete old key and create a new one');
            console.log('   → Update .env file with new key');
        } else if (error.message.includes('quota')) {
            console.log('   ❌ Quota exceeded');
            console.log('   → Check your Gemini API quota');
            console.log('   → Wait a moment and try again');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.log('   ❌ Network connection issue');
            console.log('   → Check internet connection');
        } else {
            console.log('   ❌ Unknown error');
            console.log('   → Full error:', error.message);
        }
        
        console.log('\n');
        process.exit(1);
    }
}

testGemini();
