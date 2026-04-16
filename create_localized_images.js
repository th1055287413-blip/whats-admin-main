const fs = require('fs');
const path = require('path');

// Load translations from 1.json
const translationsData = JSON.parse(fs.readFileSync('src/utils/1.json', 'utf8'));
const translations = translationsData.translations;

// Languages to create (excluding 'tw' as requested)
const languages = ['en', 'zh', 'de', 'ja', 'ko', 'fr', 'es', 'ru', 'it', 'pt', 'ar', 'th', 'vi'];

const languageNames = {
    'en': 'English',
    'zh': 'Simplified Chinese', 
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean',
    'fr': 'French',
    'es': 'Spanish',
    'ru': 'Russian',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'th': 'Thai',
    'vi': 'Vietnamese'
};

console.log('Creating localized instruction images...');
console.log('Note: This script creates the directory structure and files.');
console.log('You will need to manually create the actual PNG images using image editing software.');
console.log('');

languages.forEach(langCode => {
    const langName = languageNames[langCode] || langCode;
    
    if (!translations[langCode]) {
        console.log(`Warning: No translations found for ${langCode}`);
        return;
    }
    
    const langData = translations[langCode];
    
    // Create directory structure
    const outputDir = `src/assets/instructions/${langCode}`;
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create a text file with the translations for reference
    const textContent = `WhatsApp Instruction Image - ${langName} (${langCode})
================================================

Menu Items:
1. ${langData['1'] || 'New group'}
2. ${langData['2'] || 'New broadcast'}
3. ${langData['3'] || 'Linked devices'}
4. ${langData['4'] || 'Starred messages'}
5. ${langData['5'] || 'Mark read'}
6. ${langData['6'] || 'Settings'}

Main Content:
- Title: ${langData['7'] || 'Linked devices'}
- Subtitle: ${langData['8'] || 'Use WhatsApp on other devices'}
- Description: ${langData['9'] || 'You can link other devices to your account, including Windows, Mac, and web.'}
- Learn More: ${langData['9_link'] || 'Learn more'}
- Button: ${langData['10'] || 'Link a device'}
- Encryption Note: ${langData['11'] || 'Your personal messages are end-to-end encrypted on all your devices.'}

Image Specifications:
- Size: 1200x1200 pixels
- Format: PNG
- Background: White
- Text Color: Black
- Accent Color: WhatsApp Green (#25D366)

Instructions:
1. Create a 1200x1200 PNG image
2. Use the text content above
3. Follow WhatsApp's design guidelines
4. Save as: ${outputDir}/1.png
`;
    
    fs.writeFileSync(`${outputDir}/instructions.txt`, textContent);
    
    console.log(`✓ Created directory and instructions for ${langName} (${langCode})`);
    console.log(`  Directory: ${outputDir}`);
    console.log(`  Instructions file: ${outputDir}/instructions.txt`);
    console.log('');
});

console.log('All localized instruction directories created!');
console.log('');
console.log('Next steps:');
console.log('1. Use the instructions.txt files in each directory as reference');
console.log('2. Create the actual PNG images using image editing software');
console.log('3. Save each image as "1.png" in its respective language directory');
console.log('4. Ensure all images are 1200x1200 pixels to match the original');
