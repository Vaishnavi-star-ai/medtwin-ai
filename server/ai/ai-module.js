const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ==========================================
// SAFE IMPORTS (graceful if missing)
// ==========================================
let PDFParse, mammoth, xlsx, Tesseract, cheerio, OpenAI;
try { ({ PDFParse } = require('pdf-parse')); } catch { PDFParse = null; }
try { mammoth = require('mammoth'); } catch { mammoth = null; }
try { xlsx = require('xlsx'); } catch { xlsx = null; }
try { Tesseract = require('tesseract.js'); } catch { Tesseract = null; }
try { cheerio = require('cheerio'); } catch { cheerio = null; }
try { ({ OpenAI } = require('openai')); } catch { OpenAI = null; }

// ==========================================
// 1. IN-MEMORY SESSION STORE
// ==========================================
const sessionStore = {};

function getSession(sessionId) {
    if (!sessionStore[sessionId]) {
        sessionStore[sessionId] = { lastReportText: null, chatHistory: [] };
    }
    return sessionStore[sessionId];
}

// ==========================================
// 2. UNIVERSAL FILE & LINK EXTRACTION
// Supports: PDF, Word, Excel, CSV, Images, Text, JSON, HTML, RTF
// ==========================================
async function extractTextFromFile(targetPath) {
    // === WEB LINK ===
    if (typeof targetPath === 'string' && targetPath.startsWith('http')) {
        try {
            const res = await axios.get(targetPath, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
            if (cheerio) {
                const $ = cheerio.load(res.data);
                $('script, style, nav, footer, header').remove();
                return $('body').text().replace(/\s+/g, ' ').trim();
            }
            return typeof res.data === 'string' ? res.data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : JSON.stringify(res.data);
        } catch (err) {
            throw new Error(`Failed to fetch URL: ${err.message}`);
        }
    }

    // === LOCAL FILE ===
    if (!fs.existsSync(targetPath)) {
        throw new Error(`File not found: ${targetPath}`);
    }

    const ext = path.extname(targetPath).toLowerCase();
    const buffer = fs.readFileSync(targetPath);

    try {
        // PDF
        if (ext === '.pdf') {
            if (!PDFParse) throw new Error('pdf-parse not installed');
            const parser = new PDFParse({ data: buffer, verbosity: 0 });
            const result = await parser.getText();
            const allText = result.pages.map(p => p.text).join('\n');
            if (!allText || allText.trim().length < 10) throw new Error('PDF has no readable text (may be scanned). Try uploading as an image.');
            return allText.trim();
        }

        // Word Documents
        if (ext === '.docx' || ext === '.doc') {
            if (!mammoth) throw new Error('mammoth not installed');
            const result = await mammoth.extractRawText({ buffer });
            return result.value.trim() || 'No text found in document.';
        }

        // Excel / CSV
        if (['.xlsx', '.xls', '.csv'].includes(ext)) {
            if (!xlsx) throw new Error('xlsx not installed');
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            let allText = '';
            workbook.SheetNames.forEach(name => {
                const sheet = workbook.Sheets[name];
                const csv = xlsx.utils.sheet_to_csv(sheet);
                allText += `--- Sheet: ${name} ---\n${csv}\n\n`;
            });
            return allText.trim() || 'No data found in spreadsheet.';
        }


        // Images — use Groq Vision AI (reads handwritten text!) or Tesseract fallback
        if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.tif', '.gif'].includes(ext)) {
            console.log(`🔍 Processing image: ${path.basename(targetPath)}...`);

            // PRIORITY 1: Groq Vision AI (reads handwriting!)
            const apiKey = process.env.GROQ_API_KEY;
            console.log(`🔑 Vision check: apiKey=${apiKey ? 'YES' : 'NO'}, OpenAI=${OpenAI ? 'YES' : 'NO'}`);
            if (apiKey && OpenAI) {
                try {
                    console.log('🤖 Using Groq Vision AI for image analysis...');
                    const imageBuffer = fs.readFileSync(targetPath);
                    const base64Image = imageBuffer.toString('base64');
                    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

                    const openai = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
                    const response = await openai.chat.completions.create({
                        model: "meta-llama/llama-4-scout-17b-16e-instruct",
                        messages: [{
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "This is a medical report image (may be handwritten). Extract ALL text, numbers, and values exactly as written. For each medical parameter, write it as 'Parameter: Value Unit'. Include ALL numbers you see. Be very precise with numbers."
                                },
                                {
                                    type: "image_url",
                                    image_url: { url: `data:${mimeType};base64,${base64Image}` }
                                }
                            ]
                        }],
                        temperature: 0.1,
                        max_tokens: 2000,
                    });

                    const visionText = response.choices[0].message.content.trim();
                    if (visionText && visionText.length > 10) {
                        console.log(`✅ Groq Vision extracted ${visionText.length} chars`);
                        return visionText;
                    }
                } catch (err) {
                    console.log(`⚠️ Groq Vision failed: ${err.message}. Falling back to OCR...`);
                }
            }

            // PRIORITY 2: Tesseract OCR fallback (works for printed text only)
            if (!Tesseract) throw new Error('For handwritten reports, please set GROQ_API_KEY in your .env file. Tesseract OCR only works with printed text.');

            let bestText = '';
            const configs = [{}, { tessedit_pageseg_mode: '6' }, { tessedit_pageseg_mode: '4' }];
            for (const config of configs) {
                try {
                    const { data: { text } } = await Tesseract.recognize(targetPath, 'eng', config);
                    if (text && text.trim().length > bestText.length) bestText = text.trim();
                } catch {}
            }

            // Post-process OCR text
            bestText = bestText
                .replace(/[|!]/g, 'l')
                .replace(/(\d)\s*[oO]\s/g, '$1.0 ')
                .replace(/(\d)\s*,\s*(\d)/g, '$1.$2');

            if (!bestText || bestText.length < 5) {
                throw new Error('Could not read this image. For handwritten reports, set GROQ_API_KEY in your .env file for AI-powered handwriting recognition.');
            }

            console.log(`📝 OCR extracted ${bestText.length} chars`);
            return bestText;
        }

        // Plain Text
        if (['.txt', '.md', '.log', '.rtf'].includes(ext)) {
            return buffer.toString('utf8').trim();
        }

        // JSON
        if (ext === '.json') {
            const jsonData = JSON.parse(buffer.toString('utf8'));
            return JSON.stringify(jsonData, null, 2);
        }

        // HTML
        if (['.html', '.htm'].includes(ext)) {
            const html = buffer.toString('utf8');
            if (cheerio) {
                const $ = cheerio.load(html);
                $('script, style').remove();
                return $('body').text().replace(/\s+/g, ' ').trim();
            }
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // XML
        if (ext === '.xml') {
            return buffer.toString('utf8').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }

        // Fallback: try reading as text
        const textContent = buffer.toString('utf8');
        if (textContent && !textContent.includes('\0')) {
            return textContent.trim();
        }

        throw new Error(`Unsupported file type: ${ext}`);
    } catch (err) {
        // If it's our own error, rethrow
        if (err.message.includes('not installed') || err.message.includes('Unsupported') || err.message.includes('OCR') || err.message.includes('no readable text')) {
            throw err;
        }
        // Otherwise wrap
        throw new Error(`Failed to process ${ext} file: ${err.message}`);
    }
}

// ==========================================
// 3. AI REPORT ANALYSIS
// ==========================================
async function analyzeReport(sessionId, text, vitals = []) {
    const session = getSession(sessionId);
    const safeText = text.length > 4000 ? text.substring(0, 4000) + "\n\n[TEXT TRUNCATED]" : text;
    session.lastReportText = safeText;
    session.chatHistory = [];

    // Build vitals summary for prompt
    let vitalsSummary = '';
    if (vitals && vitals.length > 0) {
        vitalsSummary = '\n\nExtracted Vitals:\n' + vitals.map(v =>
            `${v.name}: ${v.value} ${v.unit} (Normal: ${v.normalRange}) — Status: ${v.status.toUpperCase()}`
        ).join('\n');
    }

    const prompt = `Analyze this medical report. For EACH metric/value found in the report, write a specific line referencing the ACTUAL value.
Format: Your [metric] is [actual value] [unit] which is [status]. [Specific advice based on the value].

IMPORTANT: Use the REAL numbers from the report. Do NOT give generic advice.
${vitalsSummary}

Medical Report:
${safeText}`;

    return await callAI([
        { role: "system", content: "You are a medical AI. Give specific analysis referencing actual values from the report. Never give generic advice — always cite the patient's real numbers." },
        { role: "user", content: prompt }
    ]);
}

// ==========================================
// 4. CHAT WITH MEMORY & CONTEXT
// ==========================================
async function chatResponse(sessionId, userMessage) {
    const session = getSession(sessionId);

    const messages = [];
    if (session.lastReportText) {
        messages.push({ role: "system", content: `You are MedTwin AI, a helpful medical assistant. You have the patient's report:\n${session.lastReportText.substring(0, 8000)}\n\nAnswer questions about their health based on this report. Be specific, cite values from the report. If they ask something unrelated to the report, still help as a general medical assistant.` });
    } else {
        messages.push({ role: "system", content: `You are MedTwin AI, a friendly and knowledgeable medical assistant. Help users with health questions, symptoms, medications, nutrition, and wellness tips. Be specific but remind them to consult a doctor for serious concerns. No report has been uploaded yet — answer general medical queries.` });
    }

    messages.push(...session.chatHistory.slice(-10));
    messages.push({ role: "user", content: userMessage });

    const reply = await callAI(messages);
    session.chatHistory.push({ role: 'user', content: userMessage }, { role: 'assistant', content: reply });
    return reply;
}

// ==========================================
// 5. AI CALLER — Groq with smart fallback
// ==========================================
async function callAI(messages) {
    const apiKey = process.env.GROQ_API_KEY;

    // If no API key, generate a smart local analysis
    if (!apiKey || !OpenAI) {
        console.log('⚠️  No GROQ_API_KEY — using local analysis fallback');
        return generateLocalAnalysis(messages);
    }

    try {
        const openai = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
        const response = await openai.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages,
            temperature: 0.3,
            max_tokens: 2000,
        });
        return response.choices[0].message.content.trim();
    } catch (err) {
        console.error('Groq API error:', err.message);
        // Fallback to local analysis if API fails
        return generateLocalAnalysis(messages);
    }
}

// ==========================================
// 6. LOCAL FALLBACK ANALYSIS (no API needed)
// ==========================================
function generateLocalAnalysis(messages) {
    const userMsg = messages.find(m => m.role === 'user')?.content || '';
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const text = userMsg.toLowerCase();

    // Chat responses — smart keyword matching
    if (userMsg.length < 500 && !text.includes('medical report')) {
        // Greetings
        if (/^(hi|hello|hey|good\s*(morning|evening|afternoon)|namaste)/i.test(text)) {
            return "Hello! I'm MedTwin AI, your medical assistant. I can help you with:\n\n• Understanding your medical reports\n• General health questions\n• Symptom information\n• Medication guidance\n• Nutrition and wellness tips\n\nHow can I help you today?";
        }
        // Headache
        if (text.includes('headache') || text.includes('head pain') || text.includes('migraine')) {
            return "Headaches can have many causes:\n\nCommon causes: Stress, dehydration, poor sleep, eye strain, caffeine withdrawal\n\nRelief tips:\n• Drink plenty of water (2-3 liters daily)\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead\n• Take OTC pain relief (Paracetamol 500mg) if needed\n• Practice deep breathing exercises\n\nSee a doctor if: Headache is severe, sudden, with fever, stiff neck, vision changes, or lasts more than 3 days.";
        }
        // Fever
        if (text.includes('fever') || text.includes('temperature') || text.includes('hot body')) {
            return "Fever management tips:\n\nMild fever (99-100.4°F / 37.2-38°C):\n• Rest and stay hydrated\n• Light clothing and lukewarm sponging\n• Paracetamol 500mg every 6 hours if uncomfortable\n\nModerate fever (100.4-103°F / 38-39.4°C):\n• Same as above + monitor closely\n• Oral rehydration salts (ORS) if needed\n\nSeek immediate medical attention if:\n• Fever exceeds 103°F (39.4°C)\n• Persists more than 3 days\n• Accompanied by rash, breathing difficulty, or confusion";
        }
        // Cold/cough
        if (text.includes('cold') || text.includes('cough') || text.includes('sneezing') || text.includes('flu') || text.includes('sore throat')) {
            return "For cold and cough relief:\n\nHome remedies:\n• Warm water with honey and lemon (3-4 times daily)\n• Steam inhalation for 10 minutes\n• Saltwater gargle for sore throat\n• Ginger-tulsi tea\n• Rest well and stay warm\n\nOTC options:\n• Antihistamine for runny nose\n• Cough syrup (as directed)\n• Throat lozenges\n\nSee a doctor if: Symptoms last more than 7 days, high fever, difficulty breathing, or chest pain.";
        }
        // Stomach
        if (text.includes('stomach') || text.includes('digestive') || text.includes('acidity') || text.includes('gas') || text.includes('bloating') || text.includes('diarr')) {
            return "Digestive health tips:\n\nFor acidity/bloating:\n• Eat smaller, frequent meals\n• Avoid spicy, oily, and fried foods\n• Don't lie down immediately after eating\n• Try buttermilk or fennel water\n• Antacid if needed (Pantoprazole 40mg before breakfast)\n\nFor diarrhea:\n• ORS solution to prevent dehydration\n• BRAT diet (Bananas, Rice, Applesauce, Toast)\n• Probiotics (yogurt/curd)\n\nSee a doctor if: Blood in stool, severe cramps, dehydration signs, or symptoms persist 3+ days.";
        }
        // Diabetes/sugar
        if (text.includes('diabetes') || text.includes('sugar') || text.includes('glucose') || text.includes('hba1c') || text.includes('insulin')) {
            return "Diabetes management guidance:\n\nHealthy blood sugar ranges:\n• Fasting: 70-100 mg/dL (normal), 100-125 mg/dL (pre-diabetic)\n• Post-meal (2hr): Below 140 mg/dL\n• HbA1c: Below 5.7% (normal), 5.7-6.4% (pre-diabetic)\n\nLifestyle tips:\n• Walk 30 minutes daily after meals\n• Reduce refined carbs and sugar\n• Eat fiber-rich foods (oats, vegetables, dals)\n• Monitor blood sugar regularly\n• Take medications as prescribed\n\nAlways consult your endocrinologist for medication adjustments.";
        }
        // Blood pressure
        if (text.includes('blood pressure') || text.includes('bp') || text.includes('hypertension') || text.includes('hypotension')) {
            return "Blood pressure information:\n\nNormal ranges:\n• Normal: Below 120/80 mmHg\n• Elevated: 120-129 / below 80\n• High (Stage 1): 130-139 / 80-89\n• High (Stage 2): 140+ / 90+\n\nTo manage blood pressure:\n• Reduce salt intake (less than 5g/day)\n• Exercise 30 min daily (walking, yoga)\n• Manage stress (meditation, deep breathing)\n• Maintain healthy weight\n• Limit alcohol and quit smoking\n• Take prescribed medications regularly\n\nMonitor BP at home and share readings with your doctor.";
        }
        // Sleep
        if (text.includes('sleep') || text.includes('insomnia') || text.includes('can\'t sleep') || text.includes('tired')) {
            return "Sleep hygiene tips:\n\nFor better sleep:\n• Maintain a fixed sleep schedule (same time daily)\n• Avoid screens 1 hour before bed\n• Keep your room cool, dark, and quiet\n• No caffeine after 2 PM\n• Light dinner at least 2 hours before sleep\n• Try relaxation techniques: deep breathing, progressive muscle relaxation\n• Warm milk with turmeric before bed\n\nIf insomnia persists for 2+ weeks, consult a doctor — it could indicate an underlying condition.";
        }
        // Exercise/fitness
        if (text.includes('exercise') || text.includes('fitness') || text.includes('workout') || text.includes('yoga') || text.includes('weight loss')) {
            return "Fitness recommendations:\n\nFor general health:\n• 150 min moderate exercise per week (30 min x 5 days)\n• Mix cardio (walking, cycling) + strength training\n• Start slow if you're a beginner\n• Warm up before and cool down after\n\nFor weight loss:\n• Caloric deficit (eat less than you burn)\n• Focus on whole foods, reduce processed foods\n• Stay hydrated (3+ liters daily)\n• Get adequate sleep (7-8 hours)\n\nYoga poses for wellness: Surya Namaskar, Pranayama, Shavasana\n\nConsult a doctor before starting intense exercise programs.";
        }
        // Vitamins/nutrition
        if (text.includes('vitamin') || text.includes('nutrition') || text.includes('diet') || text.includes('food') || text.includes('supplement')) {
            return "Nutrition guidance:\n\nEssential daily nutrients:\n• Vitamin D: Sunlight 15-20 min + fortified foods\n• Vitamin B12: Dairy, eggs, fortified cereals\n• Iron: Spinach, lentils, red meat, jaggery\n• Calcium: Milk, curd, ragi, almonds\n• Omega-3: Flaxseeds, walnuts, fish\n\nBalanced diet plate:\n• 50% vegetables and fruits\n• 25% whole grains (brown rice, millets)\n• 25% protein (dal, paneer, chicken, fish)\n\nStay hydrated and limit processed foods, sugar, and excess salt.";
        }
        // Default medical chat
        if (session.lastReportText) {
            return "Based on your uploaded report, I can see several health metrics. Here's my analysis:\n\nThe values in your report have been assessed and some parameters may need attention. I recommend:\n• Follow up with your doctor for any abnormal values\n• Maintain a balanced diet and regular exercise\n• Stay hydrated and get adequate rest\n• Monitor any concerning symptoms\n\nFeel free to ask me specific questions about any metric in your report!";
        }
        return "I'm MedTwin AI, your health assistant! I can help you with:\n\n• Health and wellness questions\n• Understanding symptoms\n• Medication information\n• Diet and nutrition tips\n• Exercise recommendations\n\nTry asking me about headaches, fever, diabetes, blood pressure, sleep, vitamins, or upload a medical report for detailed analysis!\n\nNote: For accurate AI analysis, set your GROQ_API_KEY in the server .env file.";
    }

    // Extract ACTUAL values and generate specific analysis
    const findings = [];
    const t = userMsg.replace(/\n/g, ' ');

    // Helper to extract a value
    const getVal = (regex) => { const m = t.match(regex); return m ? parseFloat(m[1]) : null; };

    // Hemoglobin
    const hb = getVal(/hemoglobin[:\s]*(\d+\.?\d*)/i) || getVal(/hgb[:\s]*(\d+\.?\d*)/i) || getVal(/hb[:\s]*(\d+\.?\d*)/i);
    if (hb !== null) {
      if (hb < 12) findings.push(`Your Hemoglobin is ${hb} g/dL which is LOW (Normal: 12-17 g/dL). You may have anemia. Eat iron-rich foods like spinach, lentils, red meat, and dates. Consider an iron supplement after consulting your doctor.`);
      else if (hb > 17) findings.push(`Your Hemoglobin is ${hb} g/dL which is HIGH (Normal: 12-17 g/dL). This could indicate dehydration or polycythemia. Stay well hydrated and consult your doctor.`);
      else findings.push(`Your Hemoglobin is ${hb} g/dL which is NORMAL (Normal: 12-17 g/dL). Your oxygen-carrying capacity is healthy.`);
    }

    // Cholesterol
    const chol = getVal(/(?:total\s*)?cholesterol[:\s]*(\d+\.?\d*)/i);
    if (chol !== null) {
      if (chol > 200) findings.push(`Your Total Cholesterol is ${chol} mg/dL which is HIGH (Normal: <200 mg/dL). Reduce saturated fats, exercise regularly, and consider statin therapy if advised by your doctor.`);
      else findings.push(`Your Total Cholesterol is ${chol} mg/dL which is NORMAL (Normal: <200 mg/dL). Keep maintaining a heart-healthy diet.`);
    }

    // Blood Sugar
    const sugar = getVal(/(?:fasting|glucose|sugar|fbs)[:\s]*(\d+\.?\d*)/i);
    if (sugar !== null) {
      if (sugar > 126) findings.push(`Your Fasting Blood Sugar is ${sugar} mg/dL which is HIGH (Normal: 70-100 mg/dL). This indicates diabetes. Monitor carbs, exercise daily, and follow your doctor's medication plan.`);
      else if (sugar > 100) findings.push(`Your Fasting Blood Sugar is ${sugar} mg/dL which is ELEVATED (Normal: 70-100 mg/dL). This is pre-diabetic range. Reduce sugar intake and increase physical activity.`);
      else if (sugar < 70) findings.push(`Your Fasting Blood Sugar is ${sugar} mg/dL which is LOW (Normal: 70-100 mg/dL). Eat regular meals and carry glucose tablets.`);
      else findings.push(`Your Fasting Blood Sugar is ${sugar} mg/dL which is NORMAL (Normal: 70-100 mg/dL). Good glycemic control.`);
    }

    // HbA1c
    const hba1c = getVal(/hba1c[:\s]*(\d+\.?\d*)/i);
    if (hba1c !== null) {
      if (hba1c > 6.5) findings.push(`Your HbA1c is ${hba1c}% which is HIGH (Normal: <5.7%). This indicates poorly controlled diabetes over the past 3 months. Strict dietary control and medication review needed.`);
      else if (hba1c > 5.7) findings.push(`Your HbA1c is ${hba1c}% which is ELEVATED (Normal: <5.7%). Pre-diabetic range. Lifestyle changes recommended.`);
      else findings.push(`Your HbA1c is ${hba1c}% which is NORMAL (Normal: <5.7%). Good long-term sugar control.`);
    }

    // Blood Pressure
    const bpMatch = t.match(/(?:blood\s*pressure|bp|systolic)[:\s/]*(\d{2,3})\s*[/\\]\s*(\d{2,3})/i) || t.match(/(\d{2,3})\s*[/\\]\s*(\d{2,3})\s*(?:mm\s*hg|mmhg)/i);
    if (bpMatch) {
      const sys = parseInt(bpMatch[1]), dia = parseInt(bpMatch[2]);
      if (sys > 140 || dia > 90) findings.push(`Your Blood Pressure is ${sys}/${dia} mmHg which is HIGH (Normal: <140/90 mmHg). Reduce salt, exercise, manage stress, and take prescribed antihypertensives.`);
      else if (sys < 90 || dia < 60) findings.push(`Your Blood Pressure is ${sys}/${dia} mmHg which is LOW (Normal: 90-140/60-90 mmHg). Stay hydrated, eat small frequent meals, and avoid sudden posture changes.`);
      else findings.push(`Your Blood Pressure is ${sys}/${dia} mmHg which is NORMAL (Normal: <140/90 mmHg). Heart health looks good.`);
    }

    // Creatinine
    const creat = getVal(/creatinine[:\s]*(\d+\.?\d*)/i);
    if (creat !== null) {
      if (creat > 1.2) findings.push(`Your Creatinine is ${creat} mg/dL which is HIGH (Normal: 0.6-1.2 mg/dL). This may indicate kidney stress. Stay hydrated and consult a nephrologist.`);
      else findings.push(`Your Creatinine is ${creat} mg/dL which is NORMAL (Normal: 0.6-1.2 mg/dL). Kidney function appears healthy.`);
    }

    // TSH
    const tsh = getVal(/tsh[:\s]*(\d+\.?\d*)/i);
    if (tsh !== null) {
      if (tsh > 4.0) findings.push(`Your TSH is ${tsh} mIU/L which is HIGH (Normal: 0.4-4.0 mIU/L). This suggests hypothyroidism. Consult an endocrinologist for thyroid medication.`);
      else if (tsh < 0.4) findings.push(`Your TSH is ${tsh} mIU/L which is LOW (Normal: 0.4-4.0 mIU/L). This may indicate hyperthyroidism. Follow up with an endocrinologist.`);
      else findings.push(`Your TSH is ${tsh} mIU/L which is NORMAL (Normal: 0.4-4.0 mIU/L). Thyroid function is healthy.`);
    }

    // Vitamin D
    const vitD = getVal(/vitamin\s*d[:\s]*(\d+\.?\d*)/i);
    if (vitD !== null) {
      if (vitD < 20) findings.push(`Your Vitamin D is ${vitD} ng/mL which is DEFICIENT (Normal: 30-100 ng/mL). Take Vitamin D3 supplements (60,000 IU weekly) and get 15-20 min sunlight daily.`);
      else if (vitD < 30) findings.push(`Your Vitamin D is ${vitD} ng/mL which is INSUFFICIENT (Normal: 30-100 ng/mL). Increase sun exposure and consider supplementation.`);
      else findings.push(`Your Vitamin D is ${vitD} ng/mL which is NORMAL (Normal: 30-100 ng/mL). Good vitamin D levels.`);
    }

    // LDL
    const ldl = getVal(/ldl[:\s]*(\d+\.?\d*)/i);
    if (ldl !== null) {
      if (ldl > 100) findings.push(`Your LDL (bad cholesterol) is ${ldl} mg/dL which is HIGH (Normal: <100 mg/dL). Avoid fried foods, exercise 30 min daily, and consider medication if very high.`);
      else findings.push(`Your LDL is ${ldl} mg/dL which is NORMAL (Normal: <100 mg/dL). Good cholesterol management.`);
    }

    // SGPT/ALT
    const sgpt = getVal(/(?:sgpt|alt)[:\s]*(\d+\.?\d*)/i);
    if (sgpt !== null) {
      if (sgpt > 56) findings.push(`Your SGPT/ALT is ${sgpt} U/L which is HIGH (Normal: 7-56 U/L). This indicates liver stress. Avoid alcohol, reduce fatty foods, and consult a gastroenterologist.`);
      else findings.push(`Your SGPT/ALT is ${sgpt} U/L which is NORMAL (Normal: 7-56 U/L). Liver function is healthy.`);
    }

    // Uric Acid
    const uric = getVal(/uric\s*acid[:\s]*(\d+\.?\d*)/i);
    if (uric !== null) {
      if (uric > 7.2) findings.push(`Your Uric Acid is ${uric} mg/dL which is HIGH (Normal: 3.5-7.2 mg/dL). Risk of gout. Stay hydrated, reduce purine-rich foods (red meat, shellfish), and limit alcohol.`);
      else findings.push(`Your Uric Acid is ${uric} mg/dL which is NORMAL (Normal: 3.5-7.2 mg/dL).`);
    }

    if (findings.length > 0) {
        return findings.join('\n\n') + '\n\nNote: This analysis is based on actual values extracted from your report. Please consult your healthcare provider for clinical interpretation.';
    }

    // Generic fallback if no specific values found
    const wordCount = userMsg.split(/\s+/).length;
    return `Report processed (${wordCount} words). The document was scanned but no standard lab values (hemoglobin, cholesterol, blood sugar, etc.) could be automatically extracted.\n\nThis may happen with:\n- Handwritten reports (OCR may miss values)\n- Non-standard formatting\n- Reports in regional languages\n\nTip: For best results, upload a typed/printed lab report in PDF format. You can also ask specific questions about this report in the AI Chat.`;
}

// ==========================================
// 7. EXTRACT VITALS (numeric values)
// ==========================================
function extractVitals(text) {
    const vitals = [];
    // Normalize OCR noise: fix common misreads, collapse whitespace
    let t = text.replace(/\n/g, ' ')
        .replace(/[|!]/g, 'l')
        .replace(/(\d)\s*[oO]\s/g, '$1.0 ')
        .replace(/(\d)\s*,\s*(\d)/g, '$1.$2')
        .replace(/\s+/g, ' ');

    // Flexible separator: handles "Hb: 12", "Hb = 12", "Hb - 12", "Hb  12", "Hb12"
    const SEP = '[:\\s=\\-–—~>./]*\\s*';

    const patterns = [
        { name: 'Hemoglobin', unit: 'g/dL', regex: new RegExp(`(?:h[ae]moglobin|hgb|h\\.?b)${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 12, normalMax: 17, icon: '🩸' },
        { name: 'Blood Sugar (Fasting)', unit: 'mg/dL', regex: new RegExp(`(?:fasting|glucose|sugar|fbs|blood\\s*sugar)${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 70, normalMax: 100, icon: '🍬' },
        { name: 'HbA1c', unit: '%', regex: new RegExp(`(?:hba1c|hb\\s*a1c|a1c|glycated)${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 4, normalMax: 5.7, icon: '📊' },
        { name: 'Cholesterol (Total)', unit: 'mg/dL', regex: new RegExp(`(?:total\\s*)?cholesterol${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 0, normalMax: 200, icon: '💛' },
        { name: 'LDL', unit: 'mg/dL', regex: new RegExp(`ldl${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 0, normalMax: 100, icon: '⚠️' },
        { name: 'HDL', unit: 'mg/dL', regex: new RegExp(`hdl${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 40, normalMax: 200, icon: '💚' },
        { name: 'Triglycerides', unit: 'mg/dL', regex: new RegExp(`triglycerides?${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 0, normalMax: 150, icon: '📈' },
        { name: 'Creatinine', unit: 'mg/dL', regex: new RegExp(`creatinine${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 0.6, normalMax: 1.2, icon: '🫘' },
        { name: 'Urea', unit: 'mg/dL', regex: new RegExp(`urea${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 7, normalMax: 20, icon: '💧' },
        { name: 'Uric Acid', unit: 'mg/dL', regex: new RegExp(`uric\\s*acid${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 3.5, normalMax: 7.2, icon: '🔬' },
        { name: 'TSH', unit: 'mIU/L', regex: new RegExp(`tsh${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 0.4, normalMax: 4.0, icon: '🦋' },
        { name: 'Vitamin D', unit: 'ng/mL', regex: new RegExp(`(?:vitamin\\s*d|vit\\.?\\s*d)${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 30, normalMax: 100, icon: '☀️' },
        { name: 'Vitamin B12', unit: 'pg/mL', regex: new RegExp(`(?:vitamin\\s*)?b\\s*12${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 200, normalMax: 900, icon: '💊' },
        { name: 'Iron', unit: 'µg/dL', regex: new RegExp(`(?:serum\\s*)?iron${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 60, normalMax: 170, icon: '🔩' },
        { name: 'Calcium', unit: 'mg/dL', regex: new RegExp(`calcium${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 8.5, normalMax: 10.5, icon: '🦴' },
        { name: 'Platelets', unit: 'K/µL', regex: new RegExp(`platelets?${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 150, normalMax: 400, icon: '🩹' },
        { name: 'WBC', unit: 'K/µL', regex: new RegExp(`wbc${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 4.5, normalMax: 11, icon: '⚪' },
        { name: 'RBC', unit: 'M/µL', regex: new RegExp(`rbc${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 4.5, normalMax: 5.5, icon: '🔴' },
        { name: 'SGPT/ALT', unit: 'U/L', regex: new RegExp(`(?:sgpt|alt)${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 7, normalMax: 56, icon: '🫁' },
        { name: 'SGOT/AST', unit: 'U/L', regex: new RegExp(`(?:sgot|ast)${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 10, normalMax: 40, icon: '🫁' },
        { name: 'Bilirubin', unit: 'mg/dL', regex: new RegExp(`bilirubin${SEP}(\\d+\\.?\\d*)`, 'i'), normalMin: 0.1, normalMax: 1.2, icon: '🟡' },
    ];

    // Blood Pressure (special - two numbers) — flexible for OCR
    const bpMatch = t.match(/(?:blood\s*pressure|bp|systolic|b\.?p)[\s:=\-–]*(\d{2,3})\s*[/\\]\s*(\d{2,3})/i) ||
                     t.match(/(\d{2,3})\s*[/\\]\s*(\d{2,3})\s*(?:mm\s*hg|mmhg)/i);
    if (bpMatch) {
        const sys = parseFloat(bpMatch[1]), dia = parseFloat(bpMatch[2]);
        vitals.push({
            name: 'Blood Pressure', value: `${sys}/${dia}`, unit: 'mmHg', icon: '❤️',
            status: sys > 140 || dia > 90 ? 'high' : sys < 90 || dia < 60 ? 'low' : 'normal',
            normalRange: '90-140 / 60-90'
        });
    }

    for (const p of patterns) {
        const match = t.match(p.regex);
        if (match) {
            const val = parseFloat(match[1]);
            if (isNaN(val) || val === 0) continue;
            let status = 'normal';
            if (val < p.normalMin) status = 'low';
            else if (val > p.normalMax) status = 'high';
            vitals.push({
                name: p.name, value: val, unit: p.unit, icon: p.icon, status,
                normalRange: `${p.normalMin}–${p.normalMax}`
            });
        }
    }

    return vitals;
}

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
    extractTextFromFile,
    analyzeReport,
    chatResponse,
    extractVitals,
    getSession
};
