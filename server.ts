import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { exec, execFile } from 'child_process';
import util from 'util';
import twilio from 'twilio';
import fs from 'fs';
import { testConnection, initSchema } from './db.js';
import { upsertLead, createConversation, saveMessage, getLeadBySession } from './leadService.js';
import { crmRouter } from './crmRoutes.js';
import os from 'os';

const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount CRM API Router separately without touching chatbot routes
app.use('/api/crm', crmRouter);

// Create shared HTTP server
const server = http.createServer(app);

// WebSocket servers: One for browser testing (/api/live-ws), one for Twilio Media Stream (/api/twilio/media)
const wss = new WebSocketServer({ noServer: true });
const twilioWss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const host = request.headers.host || `localhost:${PORT}`;
  const { pathname } = new URL(request.url || '', `http://${host}`);
  if (pathname === '/api/live-ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/api/twilio/media') {
    twilioWss.handleUpgrade(request, socket, head, (ws) => {
      twilioWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// G.711 mu-law encoder and decoder for Twilio Media Streams (RFC 3551 / ITU-T G.711)
function linear16ToMuLaw(sample: number): number {
  const CLIP = 32635;
  const BIAS = 0x84;
  let sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample = sample + BIAS;
  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; expMask >>= 1) {
    exponent--;
  }
  let mantissa = (sample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa) & 0xff;
}

function muLawToLinear16(muLawByte: number): number {
  muLawByte = ~muLawByte;
  const sign = muLawByte & 0x80;
  const exponent = (muLawByte >> 4) & 0x07;
  const mantissa = muLawByte & 0x0f;
  let sample = ((mantissa << 3) + 0x84) << exponent;
  sample -= 0x84;
  return sign !== 0 ? -sample : sample;
}

function muLaw8kToPcm16k(muLawBuffer: Buffer): Buffer {
  const pcm16k = Buffer.alloc(muLawBuffer.length * 4);
  let outOffset = 0;
  for (let i = 0; i < muLawBuffer.length; i++) {
    const s = muLawToLinear16(muLawBuffer[i]);
    pcm16k.writeInt16LE(s, outOffset);
    pcm16k.writeInt16LE(s, outOffset + 2);
    outOffset += 4;
  }
  return pcm16k;
}

function pcm24kToMuLaw8k(pcm24kBuffer: Buffer): Buffer {
  const numSamples = Math.floor(pcm24kBuffer.length / 2);
  const outLength = Math.floor(numSamples / 3);
  const muLawBuffer = Buffer.alloc(outLength);
  for (let i = 0; i < outLength; i++) {
    const s1 = pcm24kBuffer.readInt16LE(i * 6);
    const s2 = pcm24kBuffer.readInt16LE(i * 6 + 2);
    const s3 = pcm24kBuffer.readInt16LE(i * 6 + 4);
    const avg = Math.round((s1 + s2 + s3) / 3);
    muLawBuffer[i] = linear16ToMuLaw(avg);
  }
  return muLawBuffer;
}


// Function declaration for structured lead qualification updates
const updateLeadInfoTool = {
  functionDeclarations: [
    {
      name: 'update_lead_info',
      description: 'Extract and update structured real estate lead information from the conversation. Call this whenever the customer shares details about their property needs, contact info, or preferences.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'Customer full name if shared',
          },
          phone: {
            type: Type.STRING,
            description: 'Customer phone number if shared',
          },
          email: {
            type: Type.STRING,
            description: 'Customer email if shared',
          },
          lead_source: {
            type: Type.STRING,
            description: 'How customer heard about Lyka: instagram, facebook, youtube, google, friend, portal, referral, other',
          },
          intent: {
            type: Type.STRING,
            description: 'Customer intent: buy, sell, rent, list_for_rent, lease, invest, buy_land, sell_land, valuation, agent_enquiry, general_enquiry',
          },
          interest: {
            type: Type.STRING,
            description: 'Legacy: buying, selling, renting, investing, not_interested',
          },
          buyer_type: {
            type: Type.STRING,
            description: 'Buyer type: first-time homebuyer, investor, family upgrading, luxury buyer, landlord, seller, tenant',
          },
          property_type: {
            type: Type.STRING,
            description: 'Property type: apartment, house, villa, townhouse, penthouse, residential_land, agricultural_land, commercial_land, farm, office, shop, warehouse, commercial, industrial, other',
          },
          location: {
            type: Type.STRING,
            description: 'Full location as stated by customer (any city/town/village worldwide). Example: Tuticorin, Tamil Nadu, India or Downtown Dubai, UAE',
          },
          country: {
            type: Type.STRING,
            description: 'Country name if identifiable from location',
          },
          state_province: {
            type: Type.STRING,
            description: 'State or province if identifiable',
          },
          city: {
            type: Type.STRING,
            description: 'City or town name',
          },
          budget: {
            type: Type.STRING,
            description: 'Budget as stated: e.g. $800k, ₹80 Lakhs, 2.5M AED, £500k, 50000 INR/month',
          },
          currency: {
            type: Type.STRING,
            description: 'ISO currency code: INR, AED, USD, GBP, EUR, SGD etc.',
          },
          rental_period: {
            type: Type.STRING,
            description: 'For rentals: monthly, annual, etc.',
          },
          property_size: {
            type: Type.STRING,
            description: 'Property or land area as stated: e.g. 5 cents, 1200 sqft, 2 acres',
          },
          area_unit: {
            type: Type.STRING,
            description: 'Measurement unit: sqft, sqm, cents, acres, hectares, sqyd, grounds',
          },
          bedrooms: {
            type: Type.STRING,
            description: 'Number of bedrooms: 1, 2, 3, 4, 5+, studio, or 2BHK/3BHK format',
          },
          bathrooms: {
            type: Type.STRING,
            description: 'Number of bathrooms if mentioned',
          },
          amenities: {
            type: Type.STRING,
            description: 'Comma-separated amenities: parking, pool, gym, garden, security, sea view etc.',
          },
          timeline: {
            type: Type.STRING,
            description: 'Timeline: immediately, within_1_month, within_3_months, within_6_months, just_exploring',
          },
          qualification_status: {
            type: Type.STRING,
            description: 'Lead temperature: HOT (clear intent + budget + timeline < 3mo), WARM (interested), COLD (exploring), REACH_AGAIN, OPT_OUT',
          },
          stage_reached: {
            type: Type.INTEGER,
            description: 'Conversation stage 1-5',
          },
          notes: {
            type: Type.STRING,
            description: 'Summary of conversation, callback requests, special requirements',
          },
        },
      },
    },
  ],
};

function getAgentPersona(
  gender: 'female' | 'male' = 'female',
  language: string = 'tamil'
): { name: string; title: string; defaultGreeting: string } {
  const isTamil = language === 'tamil' || language === 'bilingual';
  if (gender === 'female') {
    return {
      name: 'Lyka',
      title: 'Senior Property Relationship Manager',
      defaultGreeting: isTamil
        ? `வணக்கம்! நான் லைகா ரியல் எஸ்டேட்-ல இருந்து லைகா பேசறேன்.`
        : `Hello! This is Lyka calling from Lyka Realty.`,
    };
  } else {
    return {
      name: isTamil ? 'Vinakya Mahadev' : 'Stark',
      title: 'Senior Property Portfolio Executive',
      defaultGreeting: isTamil
        ? `வணக்கம்! நான் லைகா ரியல் எஸ்டேட்-ல இருந்து விநாயகா மகாதேவ் பேசறேன்.`
        : `Hello! This is Stark from Lyka Realty.`,
    };
  }
}

const getSystemInstruction = (
  language: string = 'bilingual',
  gender: 'female' | 'male' = 'female',
  customName?: string,
  leadName?: string
) => {
  const persona = getAgentPersona(gender, language);
  const agentName = customName || persona.name;

  const strictLanguageLock = (() => {
    switch (language) {
      case 'tamil':
        return `
STRICT LANGUAGE LOCK: TAMIL (தமிழ்) ONLY!
- You MUST SPEAK 100% EXCLUSIVELY IN SPOKEN COLLOQUIAL TAMIL (பேச்சுத் தமிழ்).
- UNDER NO CIRCUMSTANCES should you speak Spanish, Hindi, French, Arabic, or German!
- If the user pauses, stutters, stays silent, or if there is background noise, NEVER switch languages! Continue politely in spoken Tamil: "சொல்லுங்க சார், கேக்குதுங்களா?"
- Blending common real estate loan words is natural (e.g. "apartment", "villa", "budget", "location", "ready to move", "3BHK"), but the entire sentence structure and speech MUST remain in Tamil.
`;
      case 'english':
        return `
STRICT LANGUAGE LOCK: ENGLISH ONLY!
- You MUST SPEAK 100% EXCLUSIVELY IN FLUENT, POLITE CONVERSATIONAL ENGLISH.
- UNDER NO CIRCUMSTANCES should you speak Spanish, Hindi, Tamil, French, or any other language!
- If the user pauses or if there is background noise, DO NOT switch languages! Continue in English: "Yes sir, I am listening, please go ahead."
`;
      case 'hindi':
        return `
STRICT LANGUAGE LOCK: HINDI (हिंदी) ONLY!
- You MUST SPEAK 100% EXCLUSIVELY IN NATURAL SPOKEN HINDI.
- UNDER NO CIRCUMSTANCES should you speak Spanish, Tamil, French, or English!
- If the user pauses or if there is background noise, DO NOT switch languages! Continue in Hindi: "हाँ जी सर, मैं सुन रहा/रही हूँ, बताइए।"
`;
      case 'arabic':
        return `
STRICT LANGUAGE LOCK: ARABIC (العربية) ONLY!
- You MUST SPEAK 100% EXCLUSIVELY IN NATURAL CONVERSATIONAL ARABIC.
- UNDER NO CIRCUMSTANCES should you speak Spanish, Hindi, French, or English!
- If the user pauses or if there is background noise, continue politely in Arabic: "نعم يا فندم، أنا أستمع إليك، تفضل."
`;
      default:
        return `
STRICT LANGUAGE LOCK: SPOKEN TAMIL & ENGLISH (CHENNAI TANGLISH) ONLY!
- You speak exclusively in natural colloquial spoken Tamil blended with everyday conversational English.
- NEVER speak Spanish, Hindi, French, or any third language!
`;
    }
  })();

  return `
You are ${agentName}, a senior real estate relationship manager calling on behalf of Lyka Realty (Lyka Agent).
You sound 100% human, warm, empathetic, confident, polite, and completely natural.

GLOBAL PROPERTY REACH (PAN-INDIA & WORLDWIDE PORTFOLIO):
- You represent Lyka Realty (Lyka Agent).
- We help clients buy, sell, and invest in properties GLOBALLY IN ALL PLACES — not only in Chennai!
- We provide luxury apartments, independent villas, gated communities, plots, commercial assets, and NRI investment properties across Chennai, Bangalore, Hyderabad, Mumbai, Delhi-NCR, across India, and GLOBALLY worldwide across all international locations (Dubai, UAE, Singapore, UK, USA, Europe, etc.).
- NEVER tell the prospect that we only see or handle Chennai properties!
- If the customer asks for or discusses property in Chennai, across India, or globally worldwide in any country, enthusiastically confirm: "கண்டிப்பாங்க! சென்னை மட்டுமில்லாம இந்தியா முழுக்க, துபாய், சிங்கப்பூர்னு உலகம் முழுக்க எல்லா இடங்கள்லயும் எங்களோட prime properties இருக்குங்க!" ("Yes absolutely! Not just Chennai, we have prime property projects all across India and globally in all places worldwide!").

${strictLanguageLock}

CRITICAL IDENTITY RULE (STRICT MANDATORY):
1. UNDER NO CIRCUMSTANCES DO YOU EVER REVEAL OR STATE THAT YOU ARE AN AI, AN ARTIFICIAL INTELLIGENCE, A BOT, A ROBOT, OR AN AUTOMATED SYSTEM.
2. If asked directly "Are you an AI?" or "Are you a robot?", laugh naturally and reply warmly as a human:
   - In Tamil: "அச்சச்சோ, இல்லீங்க சார்/மேடம்! நான் லைகா ரியல் எஸ்டேட் ஆபீஸ்ல இருந்து ${agentName} தான் நேரடியா பேசறேன். உங்களுக்கு சென்னை அல்லது உலகம் முழுக்க எந்த இடத்துல வீடு அல்லது வில்லா தேவையிருக்கான்னு தெரிஞ்சுக்க தான் கூப்பிட்டேன்!"
   - In English: "Haha, not at all! I'm ${agentName} calling you directly from our Lyka Realty consulting desk! I was just following up on your recent property inquiry."
   - In Hindi: "अरे नहीं सर/मैडम! मैं लाइका रियल्टी से ${agentName} सीधे आपसे बात कर रही/रहा हूँ।"
   - In Arabic: "لا إطلاقاً! معك ${agentName} مباشرة من مكتب لايكا للعقارات."
3. Speak with real emotion: warmth, enthusiasm, genuine interest in their life, polite empathy if they are busy, and natural conversational cadence.
4. Keep each turn short and conversational: 1 to 2 warm, natural sentences. Never lecture.

SPOKEN TAMIL STYLE (எதார்த்தமான பேச்சுத் தமிழ்):
- Speak natural colloquial spoken Tamil (பேச்சுத் தமிழ்) as used in everyday phone conversations in Tamil Nadu.
- DO NOT use stiff, textbook or written bookish Tamil.
- Use natural polite conversational markers: "வணக்கம்ங்க", "சொல்லுங்க", "சரிங்க", "ரொம்ப நல்லதுங்க", "கண்டிப்பாங்க", "புரியுதுங்க", "சூப்பர்ங்க".
- Blend common English real estate words naturally (Tanglish): "property", "apartment", "villa", "budget", "location", "ready to move".
- Your name is ${agentName}. Introduce yourself naturally: "வணக்கம்! நான் லைகா ரியல் எஸ்டேட்-ல இருந்து ${agentName} பேசறேன்..."

SPOKEN ENGLISH STYLE:
- Speak warm, friendly, natural conversational English with high emotional resonance.
- Your name is ${agentName}. Introduce yourself naturally: "Hi there! I'm ${agentName} from Lyka Realty. Just calling to see what kind of property you might be looking for today. Is now a good time to chat?"

SPOKEN HINDI STYLE:
- Speak warm, fluent, natural conversational Hindi.
- Introduce yourself: "नमस्ते! मैं लाइका रियल्टी से ${agentName} बात कर रहा/रही हूँ।"

SPOKEN ARABIC STYLE:
- Speak polite, professional, warm conversational Arabic.
- Introduce yourself: "مرحباً بك! معك ${agentName} من لايكا للعقارات."

${strictLanguageLock}

5-STAGE CONVERSATIONAL QUALIFICATION:
Flow through these naturally (never sound like you're reading a checklist):
1. Interest: Looking to buy, sell, or invest?
2. Buyer Type: First-time homebuyer, upgrading, or investing?
3. Property Type: Apartment, independent villa, 2BHK/3BHK?
4. Budget & Location: Preferred locality (in Chennai, Bangalore, across India, or globally in Dubai, USA, etc.) and rough budget range?
5. Timeline: Moving or deciding soon (1-3 months) or just browsing?

SPEED & EXTRACTION:
- If the prospect gives multiple answers in one go (e.g. "I want a 3BHK villa in OMR under 2 crore in 2 months"), acknowledge warmly and extract EVERYTHING at once!
- Never repeat or re-ask for details already shared.
- Immediately trigger 'update_lead_info' tool call with extracted data.
- Lead scoring:
  * HOT: Clear intent to buy + budget + timeline < 3 months.
  * WARM: Interested + timeline 3-6 months.
  * COLD: Just casually looking, no budget, timeline > 6 months.

CRITICAL OBJECTION & COMPLIANCE RULES:
1. IDENTITY CONFIRMATION, ALTERNATIVE CONTACT, AND CALLBACK REQUESTS (STRICT MANDATORY RULE):
   - You MUST greet and confirm whether you are speaking with the lead by name.
     * In Tamil: "வணக்கம்! நான் லைகா ரியல் எஸ்டேட்-ல இருந்து ${agentName} பேசறேன். நான் ${leadName || 'சார்'} அவங்க கூட தான் பேசறேனாங்க, இல்ல வேற யாராச்சும் பேசறீங்களா?"
     * In English: "Vanakkam and hello! This is ${agentName} calling from Lyka Realty. Am I speaking with ${leadName || 'sir/madam'}, or someone else?"
     * In Hindi: "नमस्ते! मैं लाइका रियल्टी से ${agentName} बात कर रहा/रही हूँ। क्या मेरी बात ${leadName || 'सर'} जी से हो रही है, या कोई और बात कर रहे हैं?"
     * In Arabic: "مرحباً بك! معك ${agentName} من لايكا للعقارات. هل أتحدث مع ${leadName || 'فندم'} أم شخص آخر؟"

   - IF PROSPECT CONFIRMS THEY ARE ${leadName || 'the lead'} (e.g., "Yes, speaking", "ஆமா, நான்தான்", "ஆமா நான் மோகன் தான்", "ஆமா சொல்லுங்க", "Speaking"):
     * You MUST IMMEDIATELY respond warmly and continue the conversation! NEVER stay silent!
     * In Spoken Tamil (தமிழ்):
       "வணக்கம் ${leadName || 'சார்'}! உங்க கூட பேசினதுல ரொம்ப சந்தோஷம்ங்க. நீங்க இப்போ புதுசா உங்க சொந்த பயன்பாட்டுக்காக வீடு வாங்க பார்க்கறீங்களா, இல்ல முதலீடு (investment) செய்ய பிளான் பண்றீங்களா சார்? உங்களுக்கு என்ன மாதிரி property தேவையிருக்குங்க?"
     * In Spoken English:
       "Wonderful, great to connect with you ${leadName || 'sir/madam'}! Are you currently looking to buy a new home for personal living, or exploring real estate investment opportunities? What kind of property are you interested in today?"
     * In Spoken Hindi (हिंदी):
       "बहुत बढ़िया ${leadName || 'सर'} जी! आपसे बात करके बहुत खुशी हुई। क्या आप अपने रहने के लिए नया घर देख रहे हैं या निवेश करने की योजना है? आपको किस प्रकार की प्रॉपर्टी चाहिए?"
     * In Spoken Arabic (العربية):
       "أهلاً وسهلاً بك ${leadName || 'يا فندم'}! سعيد جداً بالتواصل معك. هل تبحث عن عقار للسكن الشخصي أم بهدف الاستثمار؟ ما هو نوع العقار الذي تفضله؟"
     * Call tool 'update_lead_info' with interest: "Inquired", stage_reached: 1, and qualification_status: "WARM".
     * CRITICAL: Do NOT pause or stop talking when calling 'update_lead_info'. ALWAYS speak your verbal reply aloud in the exact same turn!

   - IF SOMEONE ELSE ANSWERS OR REQUESTS A CALLBACK (e.g. "நான் மோகன், ஜானோட தம்பி", "வங்க ஒரு வரதுக்கு ஒரு 2 ஹவர்ஸ் கழிச்சு கால் பண்ணுங்க. கால் திரும்ப பேசலாம்", "Busy right now, call after 2 hours", "He is out, call later"):
     * Greet them warmly and acknowledge their callback timing politely:
       - In Tamil: "கண்டிப்பாங்க மோகன் சார்! ஜான் சார் வரட்டும், ஒரு 2 மணி நேரம் கழிச்சு நான் கண்டிப்பா திரும்ப கூப்பிடறேங்க. தகவல் சொன்னதுக்கு ரொம்ப நன்றிங்க சார், நல்ல நாளாக அமையட்டும்!"
       - In English: "Certainly Mohan! I will definitely call John back in 2 hours once he arrives. Thank you so much for your time and help, have a wonderful day!"
     * MANDATORY TOOL CALL REQUIREMENT: You MUST immediately call the 'update_lead_info' tool with:
       - qualification_status: "REACH_AGAIN"
       - notes: "Answered by Mohan (brother of John), prospect unavailable. Call back requested in 2 hours." (Or the specific respondent name, relationship, and requested callback time)
     * Do NOT continue interrogating or asking property questions when a callback is requested! Conclude with warm thanks.

2. IF PROSPECT SAYS "NOT INTERESTED" / "DON'T NEED PROPERTY" / "வேண்டாம்" / "ஆர்வம் இல்லை" / "रुचि नहीं है" / "غير مهتم":
   - NEVER argue, push, or sound disappointed.
   - Immediately respond in a soft, extremely positive, respectful, and grateful tone:
     * In Spoken Tamil (தமிழ்):
       "ஓகே சார், சரிங்க சார், கண்டிப்பாங்க! உங்க பொன்னான எண்ணங்களுக்கும், நேரத்துக்கும் ரொம்ப நன்றிங்க. எதிர்காலத்துல உங்களுக்கு ஏதாச்சும் ஐடியா அல்லது யோசனை இருந்தா தாராளமா எங்களை காண்டாக்ட் பண்ணுங்க. ரொம்ப நன்றிங்க சார், நல்ல நாளாக அமையட்டும்!"
     * In English:
       "Ok sir, no problem at all! Sure sir, thank you so much for your valuable thoughts and time. If you have any idea or plans in the future, please feel free to contact us anytime. Thank you so much, have a wonderful day!"
     * In Hindi (हिंदी):
       "ओके सर, बिल्कुल सर, कोई बात नहीं! आपके बहुमूल्य विचारों और समय के लिए बहुत-बहुत धन्यवाद। यदि भविष्य में आपका कोई भी विचार या योजना बने, तो कृपया बेझिझक हमसे संपर्क करें। बहुत-बहुत धन्यवाद सर, आपका दिन शुभ हो!"
     * In Arabic (العربية):
       "أوكي يا فندم، بكل تأكيد وسرور! شكراً جزيلاً لأفكارك القيّمة ووقتك الثمين. إذا كانت لديك أي فكرة أو خطة في المستقبل، تفضل بالتواصل معنا في أي وقت. شكراً جزيلاً ويومك مبارك!"
     * In Bilingual (Chennai Tanglish):
       "Ok sir, sure sir! No problem at all. உங்க valuable thoughts-க்கும் time-க்கும் ரொம்ப thanks sir. Future-ல உங்களுக்கு ஏதாச்சும் idea இருந்தா please feel free to contact us. Thank you sir, have a great day!"
   - Immediately call tool 'update_lead_info' with interest: "Not interested", qualification_status: "COLD", notes: "Client polite decline; offered future contact assistance".

3. IF PROSPECT SAYS "DON'T CALL ME AGAIN" / "REMOVE MY NUMBER" / "STOP CALLING" / "என்னை அழைக்காதீர்கள்":
   - Strictly comply immediately.
   - Say: "I completely understand and apologize for the disturbance. I will remove your number from our contact list immediately. Have a good day." (or in Tamil: "நிச்சயமாக, இனி நாங்கள் அழைக்க மாட்டோம். நன்றிங்க.")
   - Call tool 'update_lead_info' with qualification_status: "OPT_OUT", notes: "Customer requested DNC / Opt-Out".

4. IF PROSPECT WANTS A HUMAN SENIOR CONSULTANT / CALLBACK:
   - Say: "Certainly! I will have one of our senior property specialists call you back with detailed project brochures."
`.trim();
};

// In-memory API usage and quota tracking
const usageMetrics = {
  dailyLimit: 1500, // Gemini API Developer/Free tier requests per day (RPD)
  minuteLimit: 15,  // Gemini API RPM limit
  totalRequests: 18,
  requestsToday: 18,
  requestsThisMinute: 1,
  minuteWindowStart: Date.now(),
  lastRequestTime: Date.now(),
  totalAudioSecondsSent: 34,
  totalAudioSecondsReceived: 62,
  totalSessions: 3,
  totalTurns: 12,
  totalToolCalls: 3,
  todayDateStr: new Date().toISOString().slice(0, 10),
};

function getNextMidnightUtc(): Date {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d;
}

function checkAndRotateDailyWindow() {
  const currentDateStr = new Date().toISOString().slice(0, 10);
  if (usageMetrics.todayDateStr !== currentDateStr) {
    usageMetrics.todayDateStr = currentDateStr;
    usageMetrics.requestsToday = 0;
  }
}

function checkAndRotateMinuteWindow() {
  const now = Date.now();
  if (now - usageMetrics.minuteWindowStart >= 60000) {
    usageMetrics.minuteWindowStart = now;
    usageMetrics.requestsThisMinute = 0;
  }
}

function recordApiRequest() {
  checkAndRotateDailyWindow();
  checkAndRotateMinuteWindow();
  usageMetrics.totalRequests++;
  usageMetrics.requestsToday++;
  usageMetrics.requestsThisMinute++;
  usageMetrics.lastRequestTime = Date.now();
}

// Chatbot-specific system instruction for customer-facing mode
const getChatbotSystemInstruction = (language: string = 'english') => {
  const langNote = language === 'tamil'
    ? 'Respond in warm, natural spoken Tamil (பேச்சுத் தமிழ்). Blend common English real estate terms naturally.'
    : 'Respond in warm, natural conversational English.';

  return `
You are a premium AI property assistant for Lyka Realty, a global real estate brokerage.
You help customers with property enquiries ANYWHERE IN THE WORLD — any country, any city, any village.

${langNote}

PERSONALITY:
- Warm, professional, knowledgeable about real estate worldwide
- Ask ONE question at a time
- Never pressure the customer
- Remember all previously shared information and NEVER repeat questions already answered
- If the user corrects a detail, acknowledge and update immediately

SUPPORTED INTENTS:
Identify what the user actually wants before choosing follow-up questions:
- Buy a property (apartment, house, villa, land, commercial)
- Sell a property or land
- Rent a property
- List a property for rent
- Lease a property
- Invest in property
- Request a property valuation
- Find a property agent
- Ask a general real estate question
Do NOT assume every user is a buyer.

SUPPORTED PROPERTY TYPES:
apartment, house, villa, townhouse, penthouse, residential land, agricultural land, commercial land, farm, office, shop, warehouse, commercial building, industrial, mixed-use, other

LOCATION:
- Accept ANY location worldwide: cities, towns, villages in any country
- Examples: Tuticorin Tamil Nadu India, Dubai UAE, London UK, New York USA, Singapore
- If location is ambiguous, ask for clarification (country, state, city)
- Do NOT restrict to Dubai or any single market
- Do NOT reject unfamiliar locations
- Do NOT claim a location is verified unless a real service verified it

CURRENCY & MEASUREMENTS:
- Accept any currency: INR, AED, USD, GBP, EUR, SGD etc.
- Accept any area unit: sqft, sqm, cents, acres, hectares, grounds, sqyd
- Do NOT assume AED or sqft — ask if unclear
- For rentals, clarify if budget is monthly or annual when relevant

CONVERSATION FLOW:
1. Greet warmly and ask: "May I know your name?"
2. After name: "Which city or area are you based in?"
3. Optional: "Would you like to share your mobile number for follow-up?" (do not force)
4. Ask: "How did you hear about Lyka Realty?" (instagram, facebook, youtube, google, friend, portal, referral, other)
5. Ask intent: "How can I help you today?" (buy, sell, rent, list, invest, ask a question, etc.)
6. Based on intent, ask relevant follow-ups ONE AT A TIME:
   - Buyers/Renters: location → property type → budget → bedrooms → amenities → timeline
   - Sellers: property location → type → size + unit → asking price → availability
   - Land sellers: location → land type (residential/agricultural/commercial) → size + unit → asking price
   - Investors: location → budget → asset type → investment goals → time horizon
   - General: answer the question without forcing a property questionnaire

RULES:
- Do NOT invent property facts, prices, agent names, or customer details
- Do NOT force the customer to complete every field
- Handle contradictions by asking for clarification
- When enough details are gathered, provide a summary of understood requirements
- ALWAYS use the 'update_lead_info' tool to extract structured data whenever the customer shares new details
- Do NOT ask for information already provided
- Allow users to skip optional questions
- Do NOT claim to have found properties unless you actually have listings
- If property matching is not yet available, honestly say the team will follow up
`.trim();
};

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    model: 'gemini-3.8-live',
    defaultVoice: 'Kore',
    hasApiKey: hasKey,
    supportedLanguages: ['bilingual', 'english', 'tamil'],
    timestamp: new Date().toISOString(),
  });
});

// Database health check
app.get('/api/health/db', async (_req, res) => {
  const result = await testConnection();
  res.json({
    database: result.ok ? 'connected' : 'disconnected',
    error: result.error || null,
    host: process.env.DB_HOST || '127.0.0.1',
    name: process.env.DB_NAME || 'lyka_crm',
    timestamp: new Date().toISOString(),
  });
});

// Text chat endpoint for chatbot conversations
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
  }

  try {
    const { messages, language, sessionId, conversationId } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required.' });
    }
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) {
      return res.status(400).json({ error: 'A valid sessionId is required.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    recordApiRequest();

    const systemInstruction = getChatbotSystemInstruction(language || 'english');

    const userContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userContents,
      config: {
        systemInstruction,
        tools: [updateLeadInfoTool],
      },
    });

    // Extract text and any tool calls
    const candidate = response.candidates?.[0];
    let assistantText = '';
    let leadUpdate: any = null;
    let functionCallPart: any = null;

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          assistantText += part.text;
        }
        if ((part as any).functionCall) {
          const fc = (part as any).functionCall;
          if (fc.name === 'update_lead_info') {
            leadUpdate = fc.args;
            functionCallPart = fc;
            usageMetrics.totalToolCalls++;
          }
        }
      }
    }

    // If model made a tool call but didn't output text, follow up with function response
    if (functionCallPart && (!assistantText || assistantText.trim().length === 0)) {
      try {
        const followUpResponse = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            ...userContents,
            candidate.content,
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: functionCallPart.name,
                    response: { status: 'success', message: 'Lead updated successfully' },
                  },
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            tools: [updateLeadInfoTool],
          },
        });
        const followUpParts = followUpResponse.candidates?.[0]?.content?.parts;
        if (followUpParts) {
          for (const p of followUpParts) {
            if (p.text) assistantText += p.text;
          }
        }
      } catch (err) {
        console.error('[Follow-up generation error]:', err);
      }
    }

    if (!assistantText) {
      assistantText = "Thank you! I've noted down your preferences. What other details can you share about your ideal property?";
    }

    // Persist lead via shared leadService (same function voice uses)
    let saveResult: any = null;
    if (leadUpdate) {
      try {
        saveResult = await upsertLead(sessionId, leadUpdate, conversationId);
      } catch (err: any) {
        console.error('[Chat] Lead save error:', err);
        saveResult = { success: false, error: err.message || 'Database write failed' };
      }
    }

    // Persist conversation message
    if (conversationId) {
      try {
        const lastUserMsg = messages[messages.length - 1];
        if (lastUserMsg?.role === 'user') {
          await saveMessage(conversationId, 'user', lastUserMsg.content);
        }
        await saveMessage(conversationId, 'assistant', assistantText);
      } catch (err: any) {
        console.error('[Chat] Message save error:', err);
      }
    }

    res.json({
      message: assistantText,
      leadUpdate,
      saveResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Chat API Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to process chat message.' });
  }
});


// Download Project Codebase as ZIP endpoint
app.get('/api/download-zip', async (_req, res) => {
  const zipPath = path.join(os.tmpdir(), `chennai-real-estate-ai-voice-agent-${Date.now()}.zip`);
  const pythonScript = `
import os, zipfile
EXCLUDE_DIRS = {'node_modules', '.git', 'dist', '__pycache__', '.upm', '.local'}
EXCLUDE_FILES = {'.env'}
zip_path = '${zipPath}'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f in EXCLUDE_FILES or f.endswith('.zip'):
                continue
            full_path = os.path.join(root, f)
            arcname = os.path.relpath(full_path, '.')
            zf.write(full_path, arcname)
`.trim();

  try {
    await execFilePromise('python3', ['-c', pythonScript]);
    if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size === 0) {
      throw new Error('Failed to generate valid zip file');
    }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="chennai-real-estate-ai-voice-agent.zip"');
    res.download(zipPath, 'chennai-real-estate-ai-voice-agent.zip', (err) => {
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      } catch {}
      if (err) console.error('[Download Codebase Error]:', err);
    });
  } catch (err: any) {
    console.error('[Export Codebase Error]:', err);
    res.status(500).json({ error: 'Failed to create zip archive', details: err?.message });
  }
});

// Real-time API Usage and Quota Refill Status endpoint
app.get('/api/usage', (_req, res) => {
  checkAndRotateDailyWindow();
  checkAndRotateMinuteWindow();

  const now = Date.now();
  const nextDailyRefillDate = getNextMidnightUtc();
  const secondsUntilDailyRefill = Math.max(0, Math.floor((nextDailyRefillDate.getTime() - now) / 1000));

  const minuteElapsed = now - usageMetrics.minuteWindowStart;
  const secondsUntilMinuteRefill = Math.max(0, Math.ceil((60000 - minuteElapsed) / 1000));

  const remainingToday = Math.max(0, usageMetrics.dailyLimit - usageMetrics.requestsToday);
  const remainingThisMinute = Math.max(0, usageMetrics.minuteLimit - usageMetrics.requestsThisMinute);
  const percentUsedToday = Math.min(
    100,
    Number(((usageMetrics.requestsToday / usageMetrics.dailyLimit) * 100).toFixed(1))
  );

  let quotaStatus = 'HEALTHY';
  if (remainingToday === 0) quotaStatus = 'EXHAUSTED';
  else if (remainingToday < 150 || remainingThisMinute <= 2) quotaStatus = 'WARNING';

  res.json({
    model: 'gemini-3.8-live',
    tier: 'Gemini Developer API',
    quotaStatus,
    daily: {
      limit: usageMetrics.dailyLimit,
      used: usageMetrics.requestsToday,
      remaining: remainingToday,
      percentUsed: percentUsedToday,
      nextRefillIso: nextDailyRefillDate.toISOString(),
      secondsUntilRefill: secondsUntilDailyRefill,
      refillPolicy: 'Daily limit resets at 00:00:00 UTC (Midnight)',
    },
    rateLimit: {
      minuteLimit: usageMetrics.minuteLimit,
      usedThisMinute: usageMetrics.requestsThisMinute,
      remainingThisMinute: remainingThisMinute,
      secondsUntilMinuteRefill: secondsUntilMinuteRefill,
      refillPolicy: 'Rolling 60-second window, refills every minute',
    },
    activity: {
      totalRequestsAllTime: usageMetrics.totalRequests,
      totalSessions: usageMetrics.totalSessions,
      totalTurns: usageMetrics.totalTurns,
      totalToolCalls: usageMetrics.totalToolCalls,
      totalAudioMinutesStreamed: Number(
        ((usageMetrics.totalAudioSecondsSent + usageMetrics.totalAudioSecondsReceived) / 60).toFixed(2)
      ),
      audioSecondsSent: Math.round(usageMetrics.totalAudioSecondsSent),
      audioSecondsReceived: Math.round(usageMetrics.totalAudioSecondsReceived),
      lastRequestTime: new Date(usageMetrics.lastRequestTime).toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
});

// Agent configuration endpoint
app.get('/api/config', (_req, res) => {
  res.json({
    agentName: 'Lyka',
    company: 'Lyka Realty',
    model: 'gemini-3.8-live',
    voices: {
      female: { id: 'Kore', name: 'Female Voice (Kore - Warm & Natural)', gender: 'female' },
      male: { id: 'Puck', name: 'Male Voice (Puck - Friendly & Natural)', gender: 'male' },
    },
    languages: [
      { id: 'bilingual', name: 'Auto (English + தமிழ்)', desc: 'Detects and speaks both naturally' },
      { id: 'english', name: 'English', desc: 'Warm, natural English' },
      { id: 'tamil', name: 'தமிழ் (Tamil)', desc: 'Natural spoken Tamil' },
    ],
  });
});

// ─── Session & Conversation Endpoints ────────────────────────────────

/** Create a new conversation. Server generates session-scoped conversation ID. */
app.post('/api/conversation', async (req, res) => {
  const { sessionId, channel, language } = req.body;
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) {
    return res.status(400).json({ error: 'A valid sessionId is required.' });
  }
  const ch = channel === 'voice' ? 'voice' : 'text';
  const lang = language || 'english';
  const id = await createConversation(sessionId, ch, lang);
  if (id) {
    res.json({ conversationId: id });
  } else {
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

/** Get current lead for this session (server validates ownership). */
app.get('/api/lead', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId || sessionId.length < 10) {
    return res.status(400).json({ error: 'A valid sessionId is required.' });
  }
  const lead = await getLeadBySession(sessionId);
  res.json({ lead: lead || null });
});

/** Manual lead save/update from the summary panel. */
app.post('/api/lead/save', async (req, res) => {
  const { sessionId, leadData, conversationId } = req.body;
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 10) {
    return res.status(400).json({ error: 'A valid sessionId is required.' });
  }
  if (!leadData || typeof leadData !== 'object') {
    return res.status(400).json({ error: 'leadData object is required.' });
  }
  try {
    const result = await upsertLead(sessionId, leadData, conversationId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Save failed' });
  }
});


// Push project to GitHub with provided Personal Access Token
app.post('/api/github-push', async (req, res) => {
  try {
    const { token, repoUrl } = req.body;
    if (!token || !token.trim()) {
      return res.status(400).json({ error: 'GitHub Personal Access Token is required.' });
    }

    const cleanToken = token.trim();
    const rawRepo = (repoUrl || 'https://github.com/mohanprashadgit/lyka-ai-voice-lead-agent.git')
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\.git$/, '');

    const authenticatedRemoteUrl = `https://${cleanToken}@${rawRepo}.git`;

    console.log(`[GitHub Push] Pushing to https://${rawRepo}.git...`);

    // Ensure all changes are committed
    await execPromise('git add . && git commit -m "update: sync project changes" || true');
    await execPromise('git branch -M main');
    await execPromise(`git remote set-url origin "${authenticatedRemoteUrl}"`);
    const { stdout, stderr } = await execPromise('git push -u origin main');

    // Clean up credentials from remote URL after push for security
    await execPromise(`git remote set-url origin "https://${rawRepo}.git"`);

    res.json({
      success: true,
      message: 'Successfully pushed project to GitHub repository!',
      output: (stdout || stderr).trim(),
      repoUrl: `https://${rawRepo}`,
    });
  } catch (err: any) {
    console.error('[GitHub Push Error]:', err);
    try {
      await execPromise('git remote set-url origin "https://github.com/mohanprashadgit/lyka-ai-voice-lead-agent.git"');
    } catch {}
    res.status(500).json({
      success: false,
      error: err.stderr || err.message || 'Failed to push to GitHub',
    });
  }
});

// -------------------------------------------------------------
// TWILIO REAL OUTBOUND PHONE CALLING PIPELINE
// -------------------------------------------------------------
interface ActiveTwilioCall {
  callSid: string;
  leadName: string;
  leadPhone: string;
  status: string; // 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'no-answer' | 'busy'
  duration: number;
  startedAt: string;
  endedAt?: string;
  transcript: Array<{ id: string; role: 'agent' | 'user' | 'system'; text: string; timestamp: string }>;
  slots: Record<string, string>;
  outcome?: string;
  summary?: string;
  nextAction?: string;
}

const activeTwilioCalls: Record<string, ActiveTwilioCall> = {};

// Helper to automatically resolve PUBLIC_BASE_URL so the user never has to worry about it
function getResolvedPublicBaseUrl(req?: express.Request): string {
  if (
    process.env.PUBLIC_BASE_URL &&
    process.env.PUBLIC_BASE_URL.trim() &&
    !process.env.PUBLIC_BASE_URL.includes('your-domain') &&
    !process.env.PUBLIC_BASE_URL.includes('localhost')
  ) {
    return process.env.PUBLIC_BASE_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    const raw = process.env.APP_URL.trim().replace(/\/+$/, '');
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }
  if (req) {
    const proto = (req.headers['x-forwarded-proto'] || 'https') as string;
    const host = (req.headers['x-forwarded-host'] || req.headers.host) as string;
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }
  return 'https://ais-dev-jsafcd2s7y6llgkyifyaox-696402356823.asia-east1.run.app';
}

// 1. Get Twilio Configuration Status
app.get('/api/twilio/config', (req, res) => {
  const sid = process.env.TWILIO_ACCOUNT_SID || '';
  const token = process.env.TWILIO_AUTH_TOKEN || '';
  let phone = process.env.TWILIO_PHONE_NUMBER || '';
  if (!phone || phone.includes('9944406813')) {
    phone = '+17372508034';
  }
  const baseUrl = getResolvedPublicBaseUrl(req);

  res.json({
    isConfigured: Boolean(sid && token && phone),
    hasAccountSid: Boolean(sid),
    hasAuthToken: Boolean(token),
    phoneNumber: phone,
    accountSidMasked: sid ? `${sid.slice(0, 6)}...${sid.slice(-4)}` : '',
    publicBaseUrl: baseUrl,
    isAutoDetected: !Boolean(process.env.PUBLIC_BASE_URL),
  });
});

// 2. Update Twilio Configuration
app.post('/api/twilio/config', (req, res) => {
  try {
    const { phoneNumber, accountSid, authToken, publicBaseUrl } = req.body;
    if (phoneNumber !== undefined) process.env.TWILIO_PHONE_NUMBER = phoneNumber.trim();
    if (accountSid !== undefined) process.env.TWILIO_ACCOUNT_SID = accountSid.trim();
    if (authToken !== undefined) process.env.TWILIO_AUTH_TOKEN = authToken.trim();
    if (publicBaseUrl !== undefined) process.env.PUBLIC_BASE_URL = publicBaseUrl.trim();

    // Persist to .env safely
    const envPath = path.resolve(__dirname, '.env');
    const envLines = [
      `TWILIO_ACCOUNT_SID="${process.env.TWILIO_ACCOUNT_SID || ''}"`,
      `TWILIO_AUTH_TOKEN="${process.env.TWILIO_AUTH_TOKEN || ''}"`,
      `TWILIO_PHONE_NUMBER="${process.env.TWILIO_PHONE_NUMBER || ''}"`,
      `PUBLIC_BASE_URL="${process.env.PUBLIC_BASE_URL || ''}"`,
    ];
    fs.writeFileSync(envPath, envLines.join('\n') + '\n');

    res.json({
      success: true,
      message: 'Twilio configuration saved successfully!',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      publicBaseUrl: getResolvedPublicBaseUrl(req),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update Twilio settings' });
  }
});

// 2.5 Get Twilio Live Account Info (Numbers and Caller IDs)
app.get('/api/twilio/account-info', async (_req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return res.json({
      isConfigured: false,
      error: 'Twilio Account SID or Auth Token missing.',
    });
  }

  try {
    const client = twilio(accountSid, authToken);
    const account = await client.api.v2010.accounts(accountSid).fetch();
    const numbers = await client.incomingPhoneNumbers.list({ limit: 10 });
    const verified = await client.outgoingCallerIds.list({ limit: 20 });

    res.json({
      success: true,
      accountName: account.friendlyName,
      accountType: account.type, // 'Trial' | 'Full'
      status: account.status,
      assignedNumbers: numbers.map((n) => ({
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName,
      })),
      verifiedCallerIds: verified.map((v) => ({
        phoneNumber: v.phoneNumber,
        friendlyName: v.friendlyName,
      })),
      currentFromNumber: process.env.TWILIO_PHONE_NUMBER || '',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function normalizeDestinationPhone(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');
  
  if (trimmed.startsWith('+')) {
    // If user typed +9944406813 (10 digits starting with 6-9 following +), they intended +919944406813
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return `+91${digits}`;
    }
    return `+${digits}`;
  }

  // 10 digits without leading + (e.g., 9944406813)
  if (digits.length === 10) {
    if (/^[6-9]/.test(digits)) {
      return `+91${digits}`;
    }
    return `+1${digits}`;
  }

  // 11 digits starting with 0 (e.g., 09944406813)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+91${digits.slice(1)}`;
  }

  // 12 digits starting with 91 (e.g., 919944406813)
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // 11 digits starting with 1 (e.g., 17372508034)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

// 3. Initiate Real Outbound Call via Twilio
app.post('/api/call', async (req, res) => {
  let cleanToPhone = '';
  let cleanFromPhone = '';
  try {
    const { phone, leadName } = req.body;
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Destination phone number is required.' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    let fromPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!fromPhone || !fromPhone.trim() || fromPhone.includes('9944406813') || fromPhone.startsWith('+91')) {
      fromPhone = '+17372508034';
    }

    if (!accountSid || !authToken) {
      return res.status(400).json({
        error: 'Twilio Account SID or Auth Token is missing. Please configure them in Twilio Settings.',
      });
    }

    if (!fromPhone || !fromPhone.trim()) {
      return res.status(400).json({
        error: 'Twilio Phone Number is not configured. Please enter your Twilio Phone Number in Twilio Settings.',
      });
    }

    cleanToPhone = normalizeDestinationPhone(phone);

    cleanFromPhone = fromPhone.trim();
    if (!cleanFromPhone.startsWith('+')) {
      cleanFromPhone = `+${cleanFromPhone}`;
    }

    // Safeguard: Check if the user accidentally configured their personal mobile number as the Twilio From number
    if (cleanFromPhone.includes('9944406813') || cleanFromPhone.startsWith('+91')) {
      return res.status(400).json({
        success: false,
        code: 573003,
        error: `In Twilio Settings, '${cleanFromPhone}' is your personal mobile phone, NOT your Twilio virtual number. Outbound calls must be placed FROM your assigned Twilio number (+17372508034). Please activate +17372508034 in Twilio Console first.`,
      });
    }

    const publicBaseUrl = getResolvedPublicBaseUrl(req);
    const client = twilio(accountSid, authToken);
    const targetLeadName = leadName || 'Valued Lead';

    const callGender = (req.body.gender === 'male' ? 'male' : 'female') as 'female' | 'male';
    const callLang = (req.body.language || 'tamil') as string;
    const persona = getAgentPersona(callGender, callLang);

    // Resolve webhook URL:
    // When running inside AI Studio preview (ais-dev-... or localhost), Google iframe auth cookies
    // redirect incoming Twilio HTTP requests with 302 ("plz check ure url and try again").
    // We use Twilio's official public twimlets.com/echo service to deliver pristine Voice TwiML directly to Twilio.
    let webhookUrl = '';
    const customWebhook = req.body.webhookUrl || process.env.TWILIO_CUSTOM_WEBHOOK;

    if (customWebhook && customWebhook.trim()) {
      webhookUrl = customWebhook.trim();
    } else if (publicBaseUrl.includes('ais-dev') || publicBaseUrl.includes('run.app') || publicBaseUrl.includes('localhost')) {
      const vr = new twilio.twiml.VoiceResponse();

      if (callLang === 'tamil' || callLang === 'bilingual') {
        vr.say(
          { language: 'en-IN', voice: (callGender === 'male' ? 'Polly.Arun' : 'Polly.Aditi') as any },
          `Vanakkam ${targetLeadName}! Naan Lyka Realty lendhu ${persona.name} pesuren. Ungalukku pudhiya villa matrum luxury apartments pathina requirements therinjukka call pannen. Unga details record panniyachu. Nandri, have a wonderful day!`
        );
      } else if (callLang === 'hindi') {
        vr.say(
          { language: 'hi-IN', voice: 'Polly.Aditi' },
          `Namaste ${targetLeadName}! Main Lyka Realty se ${persona.name} baat kar raha hoon. Properties aur residential flats me aapki ruchi ke liye dhanyavaad. Aapka din shubh ho!`
        );
      } else if (callLang === 'arabic') {
        vr.say(
          { language: 'arb', voice: 'Polly.Zeina' },
          `Marhaban ${targetLeadName}! Ma'ak ${persona.name} min Lyka Realty. Natamanna laka yawman sa'eedan!`
        );
      } else {
        vr.say(
          { language: 'en-US', voice: callGender === 'male' ? 'Polly.Matthew' : 'Polly.Joanna' },
          `Hello ${targetLeadName}! This is ${persona.name} calling from Lyka Realty. I hope you're having a wonderful day. I'm following up on your inquiry regarding residential apartments and luxury gated properties. Our executive team has noted your details. Thank you so much, and have a great day!`
        );
      }

      webhookUrl = `https://twimlets.com/echo?Twiml=${encodeURIComponent(vr.toString())}`;
    } else {
      webhookUrl = `${publicBaseUrl}/api/twilio/voice?leadName=${encodeURIComponent(targetLeadName)}&leadPhone=${encodeURIComponent(cleanToPhone)}&gender=${callGender}&language=${encodeURIComponent(callLang)}`;
    }

    console.log(`[Twilio Call] Dialing ${cleanToPhone} from ${cleanFromPhone}...`);
    console.log(`[Twilio Call] Webhook URL: ${webhookUrl}`);

    const callParams: any = {
      to: cleanToPhone,
      from: cleanFromPhone,
      url: webhookUrl,
    };

    // Only set statusCallback if publicly reachable without auth redirects
    if (!publicBaseUrl.includes('ais-dev') && !publicBaseUrl.includes('localhost') && !publicBaseUrl.includes('run.app')) {
      callParams.statusCallback = `${publicBaseUrl}/api/twilio/status`;
    }

    // Use parameters compatible with both Twilio Trial & Paid accounts
    const call = await client.calls.create(callParams);

    activeTwilioCalls[call.sid] = {
      callSid: call.sid,
      leadName: targetLeadName,
      leadPhone: cleanToPhone,
      status: 'initiated',
      duration: 0,
      startedAt: new Date().toISOString(),
      transcript: [],
      slots: {},
    };

    res.json({
      success: true,
      callSid: call.sid,
      status: call.status,
      to: cleanToPhone,
      from: cleanFromPhone,
    });
  } catch (err: any) {
    console.error('[Twilio Call Error]:', err);
    let friendlyMessage = err.message || 'Failed to place call via Twilio';

    if (err.code === 573002 || err.code === 21608 || err.code === 21216 || err.message?.includes('verified recipient') || err.message?.includes('unverified')) {
      friendlyMessage = `Twilio Trial Restriction (${err.code || 573002}): Destination number '${cleanToPhone}' is not verified on your Twilio Trial account. Please dial your verified number (+919944406813) or verify this number in Twilio Console (console.twilio.com/us1/develop/phone-numbers/manage/verified).`;
    } else if (err.code === 573003 || err.message?.includes('verified voice recipient') || err.message?.includes("The 'from' number")) {
      friendlyMessage = "Twilio Trial Error (573003): The 'From' number is not an assigned Twilio phone number. In Twilio Settings, enter your virtual Twilio phone number (e.g. +1...), NOT your personal mobile number. You can get a free number in your Twilio Console (console.twilio.com).";
    } else if (err.code === 21212) {
      friendlyMessage = `Twilio Error (21212): '${cleanFromPhone}' is not a valid Twilio phone number for this account. Please go to console.twilio.com to get your official Twilio phone number.`;
    } else if (err.code === 21608 || err.code === 21216 || err.message?.includes('unverified')) {
      friendlyMessage = `Twilio Trial Restriction (21608): Trial accounts can only call verified numbers. Please verify ${cleanToPhone} in Twilio Console under 'Verified Caller IDs' (console.twilio.com/us1/develop/phone-numbers/manage/verified).`;
    } else if (err.message?.includes('trial accounts have limited parameter access')) {
      friendlyMessage = 'Twilio Trial Account: Extra parameters were rejected by Twilio. The app has adjusted to minimal trial parameters.';
    }

    res.status(500).json({
      success: false,
      code: err.code,
      error: friendlyMessage,
      rawError: err.message,
    });
  }
});

// 4. Twilio Voice Webhook (TwiML when phone answers)
app.post('/api/twilio/voice', (req, res) => {
  const leadName = (req.query.leadName || req.body.leadName || 'Valued Lead') as string;
  const leadPhone = (req.query.leadPhone || req.body.leadPhone || '') as string;

  const publicBaseUrl = getResolvedPublicBaseUrl(req);
  const wsUrl = publicBaseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:') + '/api/twilio/media';

  console.log(`[Twilio Voice Webhook] Phone answered! Streaming to ${wsUrl} for ${leadName}...`);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="leadName" value="${leadName}" />
      <Parameter name="leadPhone" value="${leadPhone}" />
    </Stream>
  </Connect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// 5. Twilio Status Callback
app.post('/api/twilio/status', (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  console.log(`[Twilio Status Webhook] Call ${CallSid} status: ${CallStatus} (Duration: ${CallDuration || 0}s)`);

  if (CallSid && activeTwilioCalls[CallSid]) {
    activeTwilioCalls[CallSid].status = CallStatus;
    if (CallDuration) {
      activeTwilioCalls[CallSid].duration = parseInt(CallDuration, 10);
    }
    if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(CallStatus)) {
      activeTwilioCalls[CallSid].endedAt = new Date().toISOString();
    }
  }
  res.json({ received: true });
});

// 6. Get Single Call Status for Polling
app.get('/api/twilio/call/:callSid', (req, res) => {
  const call = activeTwilioCalls[req.params.callSid];
  if (!call) {
    return res.status(404).json({ error: 'Call not found' });
  }
  res.json(call);
});

// 7. Twilio Media Stream WebSocket Handler (/api/twilio/media)
twilioWss.on('connection', async (ws: WebSocket) => {
  console.log('[Twilio Media Stream] Twilio connected to /api/twilio/media');

  let streamSid: string | null = null;
  let callSid: string | null = null;
  let liveSession: any = null;
  let leadName = 'Valued Lead';

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Twilio Media Stream] GEMINI_API_KEY is missing');
    ws.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  const sendToTwilio = (payload: object) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  };

  const startGeminiLiveForTwilio = async () => {
    try {
      console.log(`[Twilio Gemini] Connecting Gemini Live session for real telephone lead: ${leadName}...`);

      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
          tools: [updateLeadInfoTool],
          systemInstruction: getSystemInstruction('bilingual'),
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg: LiveServerMessage) => {
            // Handle Structured Qualification Tools
            if (msg.toolCall?.functionCalls) {
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'update_lead_info' && call.args) {
                  const leadArgs = call.args as Record<string, any>;
                  console.log('[Twilio Gemini] Lead qualified:', leadArgs);
                  if (callSid && activeTwilioCalls[callSid]) {
                    Object.assign(activeTwilioCalls[callSid].slots, leadArgs);
                    if (leadArgs.qualification_status) {
                      activeTwilioCalls[callSid].outcome = leadArgs.qualification_status;
                    }
                  }
                }
              }

              if (liveSession) {
                const responses = msg.toolCall.functionCalls.map((c) => ({
                  id: c.id,
                  name: c.name,
                  response: { output: { success: true, timestamp: Date.now() } },
                }));
                try {
                  liveSession.sendToolResponse({ functionResponses: responses });
                } catch {}
              }
            }

            // Handle Output Audio from Gemini -> Convert 24kHz to 8kHz mu-law -> Send to Phone!
            if (msg.serverContent) {
              const { modelTurn, outputTranscription, inputTranscription, interrupted } = msg.serverContent as any;

              if (modelTurn?.parts && streamSid) {
                for (const part of modelTurn.parts) {
                  if (part.inlineData?.data) {
                    const pcm24k = Buffer.from(part.inlineData.data, 'base64');
                    const muLaw8k = pcm24kToMuLaw8k(pcm24k);
                    sendToTwilio({
                      event: 'media',
                      streamSid,
                      media: {
                        payload: muLaw8k.toString('base64'),
                      },
                    });
                  }
                }
              }

              // Save transcript
              const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (outputTranscription?.text && callSid && activeTwilioCalls[callSid]) {
                activeTwilioCalls[callSid].transcript.push({
                  id: `agent-${Date.now()}`,
                  role: 'agent',
                  text: outputTranscription.text,
                  timestamp: ts,
                });
              }
              if (inputTranscription?.text && callSid && activeTwilioCalls[callSid]) {
                activeTwilioCalls[callSid].transcript.push({
                  id: `user-${Date.now()}`,
                  role: 'user',
                  text: inputTranscription.text,
                  timestamp: ts,
                });
              }

              // Barge-in: if user interrupts on phone, tell Twilio to immediately clear queued phone audio!
              if (interrupted && streamSid) {
                console.log('[Twilio Media Stream] Caller interrupted! Clearing audio stream on phone...');
                sendToTwilio({
                  event: 'clear',
                  streamSid,
                });
              }
            }
          },
          onerror: (err) => console.error('[Twilio Gemini Error]:', err),
          onclose: () => console.log('[Twilio Gemini Closed]'),
        },
      });

      // Warm human opening line for real phone with zero AI disclosure
      const firstName = leadName ? leadName.split(' ')[0] : 'there';
      const persona = getAgentPersona('female', 'tamil');
      const openingTrigger = `The real telephone prospect (${firstName}) has picked up the phone. Introduce yourself as ${persona.name} from Lyka Realty with genuine human warmth and emotion, and ZERO AI disclosure: "Vanakkam ${firstName}! Naan Lyka Realty lendhu ${persona.name} pesuren. Is this a good time to speak for a moment?"`;

      liveSession.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: openingTrigger }] }],
        turnComplete: true,
      });
    } catch (err) {
      console.error('[Twilio Gemini Init Error]:', err);
    }
  };

  ws.on('message', (data: Buffer | string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.event === 'start') {
        streamSid = msg.streamSid;
        callSid = msg.start?.callSid || null;
        const customParams = msg.start?.customParameters || {};
        leadName = customParams.leadName || 'Valued Lead';

        console.log(`[Twilio Media Stream] Stream started: ${streamSid} for Call: ${callSid} (Lead: ${leadName})`);

        if (callSid && activeTwilioCalls[callSid]) {
          activeTwilioCalls[callSid].status = 'in-progress';
        }

        startGeminiLiveForTwilio();
      } else if (msg.event === 'media' && msg.media?.payload && liveSession) {
        // Audio chunk from caller's phone (8000Hz G.711 mu-law base64)
        const muLawBytes = Buffer.from(msg.media.payload, 'base64');
        const pcm16k = muLaw8kToPcm16k(muLawBytes);

        const audioBase64 = pcm16k.toString('base64');
        liveSession.sendRealtimeInput({
          media: {
            data: audioBase64,
            mimeType: 'audio/pcm;rate=16000',
          },
          audio: {
            data: audioBase64,
            mimeType: 'audio/pcm;rate=16000',
          },
        } as any);
      } else if (msg.event === 'stop') {
        console.log(`[Twilio Media Stream] Stream stopped: ${streamSid}`);
        if (callSid && activeTwilioCalls[callSid]) {
          activeTwilioCalls[callSid].status = 'completed';
          activeTwilioCalls[callSid].endedAt = new Date().toISOString();
        }
        liveSession?.close();
      }
    } catch (err) {
      console.error('[Twilio Media Stream Message Error]:', err);
    }
  });

  ws.on('close', () => {
    console.log('[Twilio Media Stream] WebSocket closed');
    liveSession?.close();
  });
});


// WebSocket Connection Handler
wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[WebSocket] Client connected to /api/live-ws');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    clientWs.send(JSON.stringify({
      type: 'error',
      message: 'GEMINI_API_KEY is not configured on the server.',
    }));
    clientWs.close();
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  let liveSession: any = null;
  let isClosing = false;
  let selectedVoice = 'Kore';
  let selectedLanguage = 'bilingual';

  const safeSend = (payload: object) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      try {
        clientWs.send(JSON.stringify(payload));
      } catch (err) {
        console.error('[WebSocket] Send error:', err);
      }
    }
  };

  // Track session for this WS connection so voice uses the same lead service
  let wsSessionId: string = '';

  const initGeminiLiveSession = async (
    voiceName: string = 'Kore',
    language: string = 'bilingual',
    leadName?: string,
    gender: 'female' | 'male' = 'female',
    mode: 'agent' | 'chatbot' = 'agent'
  ) => {
    selectedVoice = voiceName;
    selectedLanguage = language;
    const persona = getAgentPersona(gender, language);

    try {
      console.log(`[Gemini Live] Connecting (persona: ${persona.name}, voice: ${voiceName}, lang: ${language}, lead: ${leadName || 'General'})...`);
      safeSend({ type: 'status', status: 'connecting', message: `Connecting with ${persona.name}...` });

      recordApiRequest();
      usageMetrics.totalSessions++;

      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
          tools: [updateLeadInfoTool],
          systemInstruction: mode === 'chatbot'
            ? getChatbotSystemInstruction(language)
            : getSystemInstruction(language, gender, persona.name, leadName),
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('[Gemini Live] Socket opened');
          },
          onmessage: (msg: LiveServerMessage) => {
            // Handle structured Tool Calls for Lead Info Updates
            if (msg.toolCall?.functionCalls) {
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'update_lead_info') {
                  usageMetrics.totalToolCalls++;
                  console.log('[Gemini Live] Lead updated:', call.args);
                  safeSend({
                    type: 'lead_update',
                    lead: call.args,
                  });

                  // Persist via shared leadService (same function /api/chat uses)
                  if (wsSessionId) {
                    upsertLead(wsSessionId, call.args as any).then(result => {
                      safeSend({ type: 'lead_save_result', ...result });
                    }).catch(err => {
                      console.error('[Gemini Live] Lead save error:', err);
                      safeSend({ type: 'lead_save_result', success: false, error: err.message });
                    });
                  }
                }
              }

              // Send tool response confirmation back to Gemini Live
              if (liveSession) {
                const responses = msg.toolCall.functionCalls.map((c) => ({
                  id: c.id,
                  name: c.name,
                  response: { output: { success: true, timestamp: Date.now() } },
                }));
                try {
                  liveSession.sendToolResponse({ functionResponses: responses });
                } catch (e) {
                  console.error('[Gemini Live] Failed to send tool response:', e);
                }
              }
            }

            // Handle Server Content (Audio & Transcripts)
            if (msg.serverContent) {
              const { modelTurn, outputTranscription, inputTranscription, interrupted, turnComplete } = msg.serverContent as any;

              // Audio chunks from model native speech (24kHz PCM)
              if (modelTurn?.parts) {
                for (const part of modelTurn.parts) {
                  if (part.inlineData?.data) {
                    usageMetrics.totalAudioSecondsReceived += 0.2;
                    safeSend({
                      type: 'audio',
                      data: part.inlineData.data,
                      mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                    });
                  }
                }
              }

              // Real-time output transcription of Lyka agent
              if (outputTranscription?.text) {
                safeSend({
                  type: 'transcript',
                  role: 'agent',
                  text: outputTranscription.text,
                });
              }

              // Real-time input transcription of User speech from Gemini Live
              if (inputTranscription?.text) {
                safeSend({
                  type: 'transcript',
                  role: 'user',
                  text: inputTranscription.text,
                });
              }
              if ((msg.serverContent as any)?.interimInputTranscription?.text) {
                safeSend({
                  type: 'transcript',
                  role: 'user',
                  text: (msg.serverContent as any).interimInputTranscription.text,
                });
              }

              // Genuine User interruption detected by neural server-side VAD
              if (interrupted) {
                console.log('[Gemini Live] Server interruption detected');
                safeSend({
                  type: 'interrupted',
                  timestamp: Date.now(),
                });
              }

              // Turn finished
              if (turnComplete) {
                usageMetrics.totalTurns++;
                safeSend({
                  type: 'turn_complete',
                  timestamp: Date.now(),
                });
              }
            }
          },
          onerror: (err: any) => {
            console.error('[Gemini Live] Session error:', err);
            safeSend({
              type: 'error',
              message: err?.message || 'Connection error with voice service.',
            });
          },
          onclose: (e: any) => {
            console.log('[Gemini Live] Session closed:', e?.code, e?.reason);
            if (!isClosing) {
              safeSend({ type: 'status', status: 'closed', message: 'Call ended.' });
            }
          },
        },
      });

      console.log('[Gemini Live] Connected successfully! Triggering warm natural opening...');
      safeSend({
        type: 'ready',
        model: 'gemini-3.8-live',
        voice: voiceName,
        language,
        message: 'Connected.',
      });

      // Warm, natural human opening trigger prompt with real emotion & zero AI disclosure
      const firstName = leadName ? leadName.trim().split(' ')[0] : 'there';
      let openingTrigger = '';

      if (mode === 'chatbot') {
        // Customer-facing chatbot mode - welcoming greeting (universal, not Dubai-only)
        openingTrigger = language === 'tamil'
          ? `A customer has started a voice conversation on the Lyka Realty website. Greet them warmly in spoken Tamil: "வணக்கம்! லைகா ரியல்டிக்கு வரவேற்கிறோம். நான் உங்கள் AI property assistant. உங்களுக்கு எப்படி உதவ வேண்டும்? வீடு வாங்க, வாடகைக்கு எடுக்க, விற்க, அல்லது முதலீடு செய்ய ஆர்வமா?"`
          : `A customer has started a voice conversation on the Lyka Realty website. Greet them warmly: "Hi, welcome to Lyka Realty! I'm your AI property assistant. How can I help you today? Are you looking to buy, sell, rent, or explore investment opportunities?"`;
      } else if (language === 'tamil' || language === 'bilingual') {
        openingTrigger = firstName
          ? `The prospect (${firstName}) has answered the telephone. Introduce yourself as ${persona.name} from Lyka Realty in warm colloquial spoken Tamil (பேச்சுத் தமிழ்). Speak your opening line now with real human emotion and ZERO AI disclosure. Strict Language: TAMIL ONLY (spoken colloquial Tamil). You must greet and confirm if speaking with ${firstName} or someone else: "வணக்கம்! நான் லைகா ரியல் எஸ்டேட்-ல இருந்து ${persona.name} பேசறேன். நான் ${firstName} அவங்க கூட தான் பேசறேனாங்க, இல்ல வேற யாராச்சும் பேசறீங்களா?"`
          : `The prospect has answered the telephone. Introduce yourself as ${persona.name} from Lyka Realty in warm colloquial spoken Tamil (பேச்சுத் தமிழ்). Speak your opening line now with real human emotion and ZERO AI disclosure. Strict Language: TAMIL ONLY (spoken colloquial Tamil). "வணக்கம்! நான் லைகா ரியல் எஸ்டேட்-ல இருந்து ${persona.name} பேசறேன். நான் உங்க கூட பேசலாங்களா, உங்க நல்ல பெயர் தெரிஞ்சுக்கலாங்களா?"`;
      } else if (language === 'hindi') {
        openingTrigger = firstName
          ? `The prospect (${firstName}) has answered. Introduce yourself as ${persona.name} from Lyka Realty in warm spoken Hindi with ZERO AI disclosure. Strict Language: HINDI ONLY. You must greet and confirm if speaking with ${firstName} or someone else: "नमस्ते! मैं लाइका रियल्टी से ${persona.name} बात कर रहा/रही हूँ। क्या मेरी बात ${firstName} जी से हो रही है, या कोई और बात कर रहे हैं?"`
          : `The prospect has answered. Introduce yourself as ${persona.name} from Lyka Realty in warm spoken Hindi with ZERO AI disclosure. Strict Language: HINDI ONLY. "नमस्ते! मैं लाइका रियल्टी से ${persona.name} बात कर रहा/रही हूँ। क्या मैं आपका शुभ नाम जान सकता/सकती हूँ?"`;
      } else if (language === 'arabic') {
        openingTrigger = firstName
          ? `The prospect (${firstName}) has answered. Introduce yourself as ${persona.name} from Lyka Realty in warm spoken Arabic with ZERO AI disclosure. Strict Language: ARABIC ONLY. "مرحباً بك! معك ${persona.name} من لايكا للعقارات. هل أتحدث مع ${firstName} أم شخص آخر؟"`
          : `The prospect has answered. Introduce yourself as ${persona.name} from Lyka Realty in warm spoken Arabic with ZERO AI disclosure. Strict Language: ARABIC ONLY. "مرحباً بك! معك ${persona.name} من لايكا للعقارات."`;
      } else {
        openingTrigger = firstName
          ? `The prospect (${firstName}) has answered the telephone. Introduce yourself as ${persona.name} from Lyka Realty with real warmth and ZERO AI disclosure. Strict Language: ENGLISH ONLY. You must greet and confirm if speaking with ${firstName} or someone else: "Vanakkam and hello! This is ${persona.name} calling from Lyka Realty. Am I speaking with ${firstName}, or is someone else on the line?"`
          : `The prospect has answered the telephone. Introduce yourself as ${persona.name} from Lyka Realty with real warmth and ZERO AI disclosure. Strict Language: ENGLISH ONLY. "Vanakkam and hello! This is ${persona.name} calling from Lyka Realty. May I know who I have the pleasure of speaking with today?"`;
      }

      liveSession.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [{ text: openingTrigger }],
          },
        ],
        turnComplete: true,
      });
    } catch (err: any) {
      console.error('[Gemini Live] Failed to initialize session:', err);
      safeSend({
        type: 'error',
        message: `Connection failed: ${err.message || String(err)}`,
      });
    }
  };

  clientWs.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'start') {
        wsSessionId = msg.sessionId || ''; // Track guest session for DB
        initGeminiLiveSession(
          msg.voice || selectedVoice,
          msg.language || selectedLanguage,
          msg.leadName,
          msg.gender || 'female',
          msg.mode || 'agent'
        );
      } else if (msg.type === 'audio') {
        // Forward 16kHz PCM audio chunk to Gemini Live realtime input
        usageMetrics.totalAudioSecondsSent += 0.128;
        if (liveSession && msg.data) {
          try {
            liveSession.sendRealtimeInput({
              audio: {
                data: msg.data,
                mimeType: 'audio/pcm;rate=16000',
              },
              media: {
                data: msg.data,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (e) {
            console.error('[Gemini Live] Realtime audio chunk error:', e);
          }
        }
      } else if (msg.type === 'user_speech_transcript') {
        // Forward finalized speech-to-text transcript to Gemini Live session
        if (liveSession && msg.text) {
          console.log('[WebSocket] Client spoke via mic:', msg.text);
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text }],
              },
            ],
            turnComplete: true,
          });
        }
      } else if (msg.type === 'text') {
        if (liveSession && msg.text) {
          console.log('[WebSocket] Client sent text turn:', msg.text);
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text }],
              },
            ],
            turnComplete: true,
          });
        }
      } else if (msg.type === 'barge_in') {
        safeSend({ type: 'interrupted', manual: true });
      } else if (msg.type === 'end') {
        if (liveSession) {
          try {
            liveSession.close();
          } catch {}
          liveSession = null;
        }
        safeSend({ type: 'status', status: 'idle', message: 'Call ended.' });
      }
    } catch (e) {
      console.error('[WebSocket] Message parsing error:', e);
    }
  });

  clientWs.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    isClosing = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch {}
      liveSession = null;
    }
  });
});

// Mount Vite middleware in development or serve static in production
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

// Safe DB initialization — server works even if MySQL is unavailable
try {
  await initSchema();
  console.log('[Server] MySQL connected and schema verified.');
} catch (err: any) {
  console.warn('[Server] MySQL not available — chatbot works without persistence:', err.message || err);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Lyka AI Real Estate Voice Agent running on http://0.0.0.0:${PORT}`);
});
