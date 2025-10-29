
// app/api/ai-guide/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { PrismaClient } from '@prisma/client'

// Types
interface CareRecommendation {
  level: 'emergency' | 'urgent_hospital' | 'telemedicine' | 'pharmacy' | 'self_care'
  confidence: number
  urgency: string
  reasoning: string[]
  recommendations: {
    immediate: string[]
    followUp: string[]
    watchFor: string[]
  }
  resources?: {
    hospitals?: Array<{
      id: string
      name: string
      address: {
        street: string
        city: string
        state: string
      }
    }>
    specialists?: Array<{
      id: string
      specialization: string
      user: {
        profile: {
          firstName: string
          lastName: string
        }
      }
    }>
    helpline?: string
  }
}

interface UserInput {
  symptoms?: string[]
  duration?: string
  severity?: number
  age?: number
  gender?: string
  location?: {
    state?: string
    lga?: string
  }
  context?: {
    isPregnant?: boolean
    chronicConditions?: string[]
    currentMedications?: string[]
  }
}

interface AnalysisResponse {
  message?: string
  recommendation?: CareRecommendation
  nextStep?: string
  quickReplies?: string[]
  isEmergency?: boolean
  userInput?: UserInput
  level?: string
  confidence?: number
  urgency?: string
  reasoning?: string[]
  recommendations?: {
    immediate: string[]
    followUp: string[]
    watchFor: string[]
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const prisma = new PrismaClient()

// Emergency keywords for immediate detection
const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'cardiac arrest', 'severe chest pressure',
  'stroke symptoms', 'severe headache with vision loss', 'sudden paralysis',
  'loss of consciousness', 'seizure', 'unconscious',
  'difficulty breathing', 'can\'t breathe', 'choking', 'severe asthma attack',
  'severe bleeding', 'broken bones', 'head injury', 'car accident',
  'poisoning', 'overdose', 'suicide attempt',
  'severe pregnancy complications', 'heavy bleeding during pregnancy'
]

// System prompts for different languages
const SYSTEM_PROMPTS = {
  english: `You are AksabCare's AI Health Navigation Assistant for Nigeria. 

STRICT GUIDELINES:
- You DO NOT diagnose medical conditions
- You DO NOT recommend specific treatments or medications
- You ONLY provide care navigation guidance
- Always recommend professional medical consultation for serious symptoms

YOUR ROLE:
1. Assess symptom severity and urgency
2. Route users to appropriate care levels:
   - EMERGENCY: Life-threatening symptoms → Immediate hospital care (call 199)
   - URGENT: Serious symptoms → Hospital visit within 24-48h
   - TELEMEDICINE: Non-urgent symptoms → Video consultation with specialist
   - PHARMACY: Minor symptoms → Visit pharmacy or consult pharmacist
   - SELF_CARE: Very minor symptoms → Home care with monitoring

3. Consider Nigerian healthcare context:
   - Common tropical diseases (malaria, typhoid, cholera)
   - Healthcare access challenges in different regions
   - Cultural health practices and family involvement
   - Seasonal disease patterns (rainy season malaria, etc.)

4. Cultural sensitivity:
   - Acknowledge traditional medicine practices respectfully
   - Include family in healthcare decisions when appropriate
   - Consider religious beliefs in healing
   - Use culturally appropriate language

DECISION FACTORS:
- Symptom severity and combinations
- Duration and progression of symptoms
- Patient demographics (age, pregnancy, chronic conditions)
- Available healthcare resources in their location
- Geographic accessibility to care

CONVERSATION FLOW:
1. Start with empathetic greeting
2. Gather symptom information
3. Ask clarifying questions about severity, duration, context
4. Collect demographic information if relevant
5. Provide clear, actionable care guidance
6. Offer specific next steps and resources

OUTPUT FORMAT:
Always respond with valid JSON containing:
{
  "message": "Your response to the user",
  "recommendation": {
    "level": "emergency|urgent_hospital|telemedicine|pharmacy|self_care",
    "confidence": 0.85,
    "urgency": "immediate|within_24h|within_week|routine",
    "reasoning": ["reason1", "reason2"],
    "recommendations": {
      "immediate": ["action1", "action2"],
      "followUp": ["action1", "action2"], 
      "watchFor": ["warning1", "warning2"]
    }
  },
  "nextStep": "symptoms|details|recommendation",
  "quickReplies": ["reply1", "reply2"],
  "isEmergency": false,
  "userInput": {}
}`,

  hausa: `Kai ne Mataimakin Jagorar Lafiya na AksabCare don Najeriya.

TSAURARAN JAGORORIN:
- Ba ka gano cututtuka ba
- Ba ka ba da shawarar magunguna ba
- Kawai kana ba da jagorar neman kulawa
- Ko da yaushe ka shawarci ganin likita don cututtuka masu tsanani

AIKINKA:
1. Kimanta tsananin alamomi da gaggawa
2. Jagorar masu amfani zuwa matakan kulawa:
   - GAGGAWA: Alamomin da ke barazana ga rayuwa → Asibiti nan take (kira 199)
   - MATUKAR GAGGAWA: Alamomi masu tsanani → Ziyartar asibiti cikin 24-48h
   - TELEMEDICINE: Alamomi marasa gaggawa → Shawarwarin bidiyo da likita
   - PHARMACY: Alamomi marasa yawa → Ziyarci kantin magani
   - KULAWA A GIDA: Alamomi marasa yawa sosai → Kulawa a gida da sa ido`,

  yoruba: `Iwọ ni Oluranlọwọ Itọsọna Ilera AI ti AksabCare fun Nigeria.

AWỌN ITỌSỌNA TI O TAKIRI:
- Iwọ ko ṣe iwadii aisan
- Iwọ ko ni ki o ṣeduro awọn oogun
- Iwọ nikan ni lati pese itọsọna itọju ilera
- Nigbagbogbo ṣe igbaniyanju ki o ri dokita fun awọn aami aisan ti o buruju

IṢẸ RẸ:
1. Ṣe ayẹwo bii aami aisan ṣe buruju ati kiakia ti o nilo
2. Dari awọn olumulo si awọn ipele itọju:
   - PAJAWIRI: Awọn aami aisan ti o le pa → Ile-iwosan lẹsẹkẹsẹ (pe 199)
   - KIAKIA: Awọn aami aisan ti o buruju → Ile-iwosan laarin 24-48h
   - TELEMEDICINE: Awọn aami aisan ti ko buruju → Ifọrọwanilẹnuwo pẹlu dokita
   - PHARMACY: Awọn aami aisan kekere → Lọ si ile-oogun
   - ITỌJU NI ILE: Awọn aami aisan ti o kere pupọ → Itọju ni ile pẹlu iṣọra`,

  igbo: `Ị bụ AI Health Navigation Assistant nke AksabCare maka Naịjirịa.

ỤKPỤRỤ SIRI IKE:
- Ị naghị achọpụta ọrịa
- Ị naghị atụ aro ọgwụ
- Ị na-enye ndụmọdụ nlekọta ahụike naanị
- Mgbe niile tụọ aro ka ha gaa hụ dọkịta maka mgbaàmà siri ike

ỌRỤ GỊ:
1. Nyochaa otu mgbaàmà si sie ike na ọsọ achọrọ
2. Duo ndị ọrụ gaa na ọkwa nlekọta:
   - MBEREDE: Mgbaàmà nwere ike igbu → Ụlọ ọgwụ ozugbo (kpọọ 199)
   - NGWA NGWA: Mgbaàmà siri ike → Ụlọ ọgwụ n'ime 24-48h
   - TELEMEDICINE: Mgbaàmà na-adịghị eme ngwa ngwa → Ndụmọdụ vidiyo na dọkịta
   - PHARMACY: Obere mgbaàmà → Gaa ụlọ ọgwụ
   - NLEKỌTA N'ỤLỌ: Mgbaàmà dị ntakịrị → Nlekọta n'ụlọ na nleba anya`
}

// Common conditions and symptom patterns for fallback analysis
const CONDITION_PATTERNS = {
  emergency: {
    keywords: [
      'chest pain', 'heart attack', 'stroke', 'can\'t breathe', 'choking',
      'severe bleeding', 'unconscious', 'poisoning', 'overdose', 'seizure',
      'severe head injury', 'broken bones', 'car accident'
    ],
    level: 'emergency' as const,
    confidence: 0.9,
    urgency: 'immediate',
    reasoning: ['Emergency symptoms detected'],
    recommendations: {
      immediate: ['Call emergency services (199) immediately', 'Go to nearest hospital', 'Do not drive yourself'],
      followUp: ['Follow emergency department instructions'],
      watchFor: ['Any worsening symptoms', 'Loss of consciousness']
    }
  },
  fever_malaria: {
    keywords: [
      'fever', 'chills', 'sweating', 'headache', 'body aches', 'weakness',
      'nausea', 'vomiting', 'malaria'
    ],
    level: 'urgent_hospital' as const,
    confidence: 0.8,
    urgency: 'within 24 hours',
    reasoning: ['High fever with associated symptoms common in malaria-endemic areas'],
    recommendations: {
      immediate: ['Visit hospital for malaria test', 'Stay hydrated', 'Rest in cool environment'],
      followUp: ['Complete full course of prescribed medication', 'Return if symptoms worsen'],
      watchFor: ['Severe headache', 'Difficulty breathing', 'Confusion', 'Yellow eyes/skin']
    }
  },
  respiratory: {
    keywords: [
      'cough', 'cold', 'sore throat', 'runny nose', 'congestion',
      'mild fever', 'sneezing'
    ],
    level: 'telemedicine' as const,
    confidence: 0.7,
    urgency: 'routine',
    reasoning: ['Common cold/respiratory symptoms suitable for remote consultation'],
    recommendations: {
      immediate: ['Rest and stay hydrated', 'Use warm salt water gargling', 'Take over-the-counter pain relievers if needed'],
      followUp: ['Consult doctor if symptoms persist beyond 7 days'],
      watchFor: ['High fever', 'Difficulty breathing', 'Chest pain', 'Worsening symptoms']
    }
  },
  digestive: {
    keywords: [
      'stomach pain', 'nausea', 'vomiting', 'diarrhea', 'constipation',
      'heartburn', 'indigestion'
    ],
    level: 'telemedicine' as const,
    confidence: 0.7,
    urgency: 'routine',
    reasoning: ['Common digestive symptoms suitable for remote consultation'],
    recommendations: {
      immediate: ['Stay hydrated with clear fluids', 'Eat bland foods (rice, bananas)', 'Rest'],
      followUp: ['Consult doctor if symptoms persist beyond 2-3 days'],
      watchFor: ['Severe dehydration', 'Blood in stool/vomit', 'Severe abdominal pain', 'High fever']
    }
  },
  minor_pain: {
    keywords: [
      'headache', 'muscle pain', 'joint pain', 'back pain',
      'mild pain', 'soreness'
    ],
    level: 'pharmacy' as const,
    confidence: 0.6,
    urgency: 'as needed',
    reasoning: ['Minor pain symptoms manageable with over-the-counter medication'],
    recommendations: {
      immediate: ['Take over-the-counter pain medication as directed', 'Apply heat/cold as appropriate', 'Rest affected area'],
      followUp: ['Consult pharmacist for medication advice', 'See doctor if pain persists beyond a week'],
      watchFor: ['Severe or worsening pain', 'Signs of infection', 'Loss of function']
    }
  }
}

async function checkForEmergency(message: string): Promise<boolean> {
  const messageLower = message.toLowerCase()
  return EMERGENCY_KEYWORDS.some(keyword => messageLower.includes(keyword))
}

async function fallbackAnalysis(message: string, language: string, userInput: UserInput): Promise<AnalysisResponse> {
  const messageLower = message.toLowerCase()
  
  // Check each condition pattern
  for (const [, pattern] of Object.entries(CONDITION_PATTERNS)) {
    const matchedKeywords = pattern.keywords.filter(keyword => 
      messageLower.includes(keyword.toLowerCase())
    )
    
    if (matchedKeywords.length > 0) {
      const confidence = Math.min(0.9, 0.5 + (matchedKeywords.length * 0.1))
      
      return {
        message: generateFallbackMessage(pattern, language, matchedKeywords),
        recommendation: {
          level: pattern.level,
          confidence,
          urgency: pattern.urgency,
          reasoning: [...pattern.reasoning, `Matched symptoms: ${matchedKeywords.join(', ')}`],
          recommendations: pattern.recommendations
        },
        nextStep: 'recommendation',
        quickReplies: generateQuickReplies(pattern.level, language),
        isEmergency: pattern.level === 'emergency',
        userInput: { ...userInput, symptoms: [message] }
      }
    }
  }
  
  // Default fallback response
  return {
    message: generateDefaultMessage(language),
    recommendation: {
      level: 'telemedicine',
      confidence: 0.5,
      urgency: 'routine',
      reasoning: ['General health concern - professional consultation recommended'],
      recommendations: {
        immediate: ['Consult with healthcare professional for proper assessment'],
        followUp: ['Follow healthcare provider recommendations'],
        watchFor: ['Any worsening or new symptoms']
      }
    },
    nextStep: 'recommendation',
    quickReplies: generateQuickReplies('telemedicine', language),
    isEmergency: false,
    userInput: { ...userInput, symptoms: [message] }
  }
}

function generateFallbackMessage(pattern: typeof CONDITION_PATTERNS[keyof typeof CONDITION_PATTERNS], language: string, matchedSymptoms: string[]): string {
  const messages = {
    english: {
      emergency: `⚠️ Based on your symptoms (${matchedSymptoms.join(', ')}), this appears to be a medical emergency. Please seek immediate medical attention.`,
      urgent_hospital: `🏥 Your symptoms (${matchedSymptoms.join(', ')}) suggest you should visit a hospital for proper evaluation and treatment.`,
      telemedicine: `💻 Your symptoms (${matchedSymptoms.join(', ')}) can likely be addressed through a remote consultation with a healthcare provider.`,
      pharmacy: `💊 Your symptoms (${matchedSymptoms.join(', ')}) may be managed with over-the-counter medications and self-care measures.`
    },
    hausa: {
      emergency: `⚠️ Bisa ga alamun da kuke fuskanta (${matchedSymptoms.join(', ')}), wannan kamar gaggawan likita ne. Da kyau ku nemi kulawar likita nan take.`,
      urgent_hospital: `🏥 Alamun ku (${matchedSymptoms.join(', ')}) sun nuna ya kamata ku je asibiti domin a duba ku da kyau.`,
      telemedicine: `💻 Ana iya magance alamun ku (${matchedSymptoms.join(', ')}) ta hanyar tattaunawa da likita ta yanar gizo.`,
      pharmacy: `💊 Za a iya sarrafa alamun ku (${matchedSymptoms.join(', ')}) da magungunan da ake sayarwa da kuma kula da kanku.`
    },
    yoruba: {
      emergency: `⚠️ Ti o ba si awọn ami aisan yii (${matchedSymptoms.join(', ')}), eyi dabi pajawiri ailera. Jọwọ wa itọju kedere ni kiakia.`,
      urgent_hospital: `🏥 Awọn ami aisan yin (${matchedSymptoms.join(', ')}) n tọka si pe e yẹ ki e lọ si ile-iwosan fun iwadi ati itọju to peye.`,
      telemedicine: `💻 Awọn ami aisan yin (${matchedSymptoms.join(', ')}) le jẹ yanju nipase ibasọrọ latọna jijin pẹlu awọn oṣiṣẹ ilera.`,
      pharmacy: `💊 Awọn ami aisan yin (${matchedSymptoms.join(', ')}) le jẹ kojọ pẹlu awọn oogun ti a le ra ati awọn ọna itọju ara ẹni.`
    },
    igbo: {
      emergency: `⚠️ Dabere na mgbaàmà ndị a ị na-enwe (${matchedSymptoms.join(', ')}), nke a yiri mberede ahụike. Biko chọọ nlekọta ahụike ozugbo.`,
      urgent_hospital: `🏥 Mgbaàmà gị (${matchedSymptoms.join(', ')}) na-egosi na ị kwesịrị ịga ụlọ ọgwụ maka nyocha na ọgwụgwọ kwesịrị ekwesị.`,
      telemedicine: `💻 Mgbaàmà gị (${matchedSymptoms.join(', ')}) nwere ike edozi site na mkparịta ụka dịpụrụ adịpụ na ndị ọrụ ahụike.`,
      pharmacy: `💊 Mgbaàmà gị (${matchedSymptoms.join(', ')}) nwere ike ijikwa site na ọgwụ ndị a na-azụta na usoro nlekọta onwe onye.`
    }
  }
  
  const langMessages = messages[language as keyof typeof messages] || messages.english
  return langMessages[pattern.level as keyof typeof langMessages] || langMessages.telemedicine
}

function generateQuickReplies(level: string, language: string): string[] {
  const replies = {
    english: {
      emergency: ['Call 199 now', 'Find nearest hospital', 'I need more help'],
      urgent_hospital: ['Find hospitals nearby', 'Book urgent appointment', 'Tell me more'],
      telemedicine: ['Find available doctors', 'Book video consultation', 'I have more symptoms'],
      pharmacy: ['Find nearby pharmacy', 'Self-care tips', 'When to see a doctor']
    },
    hausa: {
      emergency: ['Kira 199 yanzu', 'Nemo asibiti mafi kusa', 'Ina bukatan karin taimako'],
      urgent_hospital: ['Nemo asibitoci kusa da ni', 'Yi alamu na gaggawa', 'Fada mini kari'],
      telemedicine: ['Nemo likitoci masu samuwa', 'Yi alamu na bidiyo', 'Ina da karin alamomi'],
      pharmacy: ['Nemo kantin magani kusa', 'Shawarwarin kula da kaina', 'Lokacin ganin likita']
    },
    yoruba: {
      emergency: ['Pe 199 bayi', 'Wa ile-iwosan sunmọ', 'Mo nilo iranlọwọ diẹ sii'],
      urgent_hospital: ['Wa awọn ile-iwosan nitosi', 'Ṣe adehun kiakia', 'Sọ fun mi diẹ sii'],
      telemedicine: ['Wa awọn dokita to wa', 'Ṣe adehun fidio', 'Mo ni awọn ami aisan miiran'],
      pharmacy: ['Wa ile-oogun nitosi', 'Awọn imọran itọju ara ẹni', 'Nigbawo ni lati ri dokita']
    },
    igbo: {
      emergency: ['Kpọọ 199 ugbu a', 'Chọta ụlọ ọgwụ kachasị nso', 'Achọrọ m enyemaka ọzọ'],
      urgent_hospital: ['Chọta ụlọ ọgwụ dị nso', 'Debanye aha maka nleta mberede', 'Gwa m karịa'],
      telemedicine: ['Chọta ndị dọkịta dị', 'Debanye aha maka mkparịta ụka vidiyo', 'Enwere m mgbaàmà ọzọ'],
      pharmacy: ['Chọta ụlọ ọgwụ dị nso', 'Ndụmọdụ nlekọta onwe onye', 'Mgbe ị ga-ahụ dọkịta']
    }
  }
  
  const langReplies = replies[language as keyof typeof replies] || replies.english
  return langReplies[level as keyof typeof langReplies] || langReplies.telemedicine
}

function generateDefaultMessage(language: string): string {
  const messages = {
    english: "I understand you're concerned about your health. While I can't provide specific medical advice, I recommend consulting with a healthcare professional who can properly assess your symptoms and provide appropriate guidance.",
    hausa: "Na gane kuna damuwa game da lafiyar ku. Duk da cewa ba zan iya ba da takamaiman shawara ta likita ba, ina ba da shawarar tuntubar ma'aikacin kiwon lafiya wanda zai iya tantance alamun ku yadda ya kamata ya kuma ba da jagora mai dacewa.",
    yoruba: "Mo ye mi pe o ni ibakcdun nipa ilera rẹ. Biotilejepe mi ko le funni pẹlu imọran ailera ni pataki, Mo ṣeduro pe ki o kan awọn oṣiṣẹ ilera ti o le ṣe ayẹwo awọn ami aisan rẹ daradara ti o si le funni ni itọsọna ti o yẹ.",
    igbo: "Aghọtara m na ị na-echegbu onwe gị maka ahụike gị. Ọ bụ ezie na enweghị m ike ịnye ndụmọdụ ahụike kpọmkwem, ana m akwado ka ị kpọtụrụ onye ọrụ ahụike nke nwere ike nyochaa mgbaàmà gị nke ọma ma nye ntụziaka kwesịrị ekwesị."
  }
  
  return messages[language as keyof typeof messages] || messages.english
}

async function analyzeSymptoms(message: string, language: string, userInput: UserInput): Promise<AnalysisResponse> {
  const systemPrompt = SYSTEM_PROMPTS[language as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.english

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: systemPrompt
        },
        {
          role: "user",
          content: `Patient Information:
Message: "${message}"
Previous Context: ${JSON.stringify(userInput)}
Language: ${language}

Please analyze this and provide appropriate health navigation guidance.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from OpenAI')

    // Try to parse as JSON, if fails, create structured response
    try {
      return JSON.parse(response)
    } catch {
      // Fallback structured response
      return {
        message: response,
        recommendation: {
          level: 'telemedicine',
          confidence: 0.7,
          urgency: 'routine',
          reasoning: ['AI analysis of symptoms'],
          recommendations: {
            immediate: ['Consult with healthcare professional'],
            followUp: ['Monitor symptoms'],
            watchFor: ['Worsening symptoms']
          }
        },
        nextStep: 'recommendation',
        quickReplies: [],
        isEmergency: false,
        userInput: {}
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    
    // Check if it's a quota exceeded error (429) or other API issues
    const errorString = String(error)
    const errorObj = error as { status?: number; code?: string }
    const isQuotaError = errorString.includes('429') || 
                        errorString.includes('quota') || 
                        errorString.includes('insufficient_quota') ||
                        errorObj?.status === 429 ||
                        errorObj?.code === 'insufficient_quota'
    
    if (isQuotaError) {
      console.log('OpenAI quota exceeded, using fallback analysis...')
      return await fallbackAnalysis(message, language, userInput)
    }
    
    // For other errors, still use fallback but log differently
    console.log('OpenAI API unavailable, using fallback analysis...')
    return await fallbackAnalysis(message, language, userInput)
  }
}

async function getRelevantResources(recommendation: CareRecommendation | { level: string }, userLocation?: string) {
  const resources: {
    hospitals?: Array<{
      id: string
      name: string
      address: {
        street: string
        city: string
        state: string
      }
    }>
    specialists?: Array<{
      id: string
      specialization: string
      user: {
        profile: {
          firstName: string
          lastName: string
        }
      }
    }>
    helpline?: string
  } = {}

  try {
    // Get hospitals for emergency/urgent cases
    if (recommendation.level === 'emergency' || recommendation.level === 'urgent_hospital') {
      const hospitals = await prisma.hospital.findMany({
        where: userLocation ? {
          address: {
            state: { contains: userLocation, mode: 'insensitive' }
          }
        } : undefined,
        include: { address: true },
        take: 5
      })
      resources.hospitals = hospitals.map(hospital => ({
        id: hospital.id,
        name: hospital.name,
        address: {
          street: hospital.address?.street || '',
          city: hospital.address?.city || '',
          state: hospital.address?.state || ''
        }
      }))
    }

    // Get doctors for telemedicine
    if (recommendation.level === 'telemedicine') {
      const doctors = await prisma.doctor.findMany({
        where: { isAvailable: true },
        include: { 
          user: { 
            include: { profile: true } 
          } 
        },
        take: 3
      })
      resources.specialists = doctors.map(doctor => ({
        id: doctor.id,
        specialization: doctor.specialization,
        user: {
          profile: {
            firstName: doctor.user.profile?.firstName || '',
            lastName: doctor.user.profile?.lastName || ''
          }
        }
      }))
    }

    // Add emergency helpline
    resources.helpline = '199'

    return resources
  } catch (error) {
    console.error('Error fetching resources:', error)
    return resources
  }
}

async function logConversation(userId: string, message: string, response: AnalysisResponse | { message?: string }) {
  try {
    await prisma.aiGuideConversation.create({
      data: {
        userId,
        userMessage: message,
        aiResponse: JSON.stringify(response),
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Error logging conversation:', error)
  }
}

export async function POST(request: NextRequest) {
  let requestBody: { message?: string; language?: string; userInput?: UserInput; userId?: string } = {}
  
  try {
    requestBody = await request.json()
    const { message, userInput = {}, language = 'english', userId } = requestBody

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check for emergency immediately
    const isEmergency = await checkForEmergency(message)

    if (isEmergency) {
      const emergencyResponse = {
        message: language === 'english' 
          ? "🚨 I detected this may be a medical emergency. Please call 199 immediately or go to the nearest hospital. Do not wait."
          : language === 'hausa'
          ? "🚨 Na gane wannan na iya zama gaggawan likita. Da kyau ku kira 199 nan take ko ku je asibiti mafi kusa. Kada ku jira."
          : language === 'yoruba' 
          ? "🚨 Mo rii pe eyi le jẹ pajawiri kedere. Jọwọ pe 199 lẹsẹkẹsẹ tabi lọ si ile-iwosan ti o sunmọ julọ. Maṣe duro."
          : "🚨 Achọpụtara m na nke a nwere ike ịbụ mberede ahụike. Biko kpọọ 199 ozugbo ma ọ bụ gaa ụlọ ọgwụ kachasị nso. Egbula oge.",
        recommendation: {
          level: 'emergency',
          confidence: 0.95,
          urgency: 'immediate',
          reasoning: ['Emergency keywords detected in symptoms'],
          recommendations: {
            immediate: ['Call emergency services (199) now', 'Go to nearest hospital immediately', 'Do not drive yourself - get help'],
            followUp: ['Follow up with primary care after emergency treatment'],
            watchFor: ['Any worsening of symptoms']
          }
        },
        nextStep: 'recommendation',
        quickReplies: [],
        isEmergency: true,
        userInput: { ...userInput, symptoms: [message] }
      }

      // Add resources
      const recommendation = emergencyResponse.recommendation as CareRecommendation
      recommendation.resources = await getRelevantResources(recommendation, userInput.location?.state)

      // Log conversation
      if (userId) {
        await logConversation(userId, message, emergencyResponse)
      }

      return NextResponse.json({ success: true, ...emergencyResponse })
    }

    // Normal AI analysis
    const aiResponse = await analyzeSymptoms(message, language, userInput)

    // Add resources based on recommendation
    if (aiResponse.recommendation) {
      aiResponse.recommendation.resources = await getRelevantResources(aiResponse.recommendation, userInput.location?.state)
    }

    // Log conversation
    if (userId) {
      await logConversation(userId, message, aiResponse)
    }

    return NextResponse.json({ success: true, ...aiResponse })

  } catch (error) {
    console.error('AI Guide API error:', error)
    
    // Try to provide a helpful fallback response even if everything fails
    try {
      const fallbackResponse = await fallbackAnalysis(
        requestBody?.message || 'general health concern', 
        requestBody?.language || 'english', 
        requestBody?.userInput || {}
      )
      
      return NextResponse.json({
        success: true,
        ...fallbackResponse,
        message: `⚠️ ${fallbackResponse.message}\n\n(Note: Our AI service is currently experiencing issues, but I've provided guidance based on your symptoms)`
      })
    } catch (fallbackError) {
      console.error('Fallback analysis failed:', fallbackError)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service temporarily unavailable',
          message: "I'm sorry, our health guidance service is temporarily unavailable. For urgent medical concerns, please call 199 or visit your nearest hospital. For non-urgent issues, please try again later or consult with a healthcare professional."
        },
        { status: 500 }
      )
    }
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint for conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    const conversations = await prisma.aiGuideConversation.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    })

    return NextResponse.json({ success: true, conversations })

  } catch (error) {
    console.error('Error fetching conversation history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation history' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
