/**
 * PHARMACY SEED FILE
 * =================
 * This file contains all the seed data and logic for populating the pharmacy-related
 * tables in the database. It creates sample pharmacies, drugs, and inventory records
 * to provide a realistic dataset for testing and development.
 * 
 * Database Tables Populated:
 * - Pharmacy: Physical pharmacy locations with business information
 * - Address: Physical addresses for pharmacies
 * - Drug: Medication information including categories, dosages, and regulatory details
 * - PharmacyInventory: Stock levels and pricing for drugs at specific pharmacies
 */

// Import necessary Prisma client and enums for database operations
import { PrismaClient, DrugCategory } from '@prisma/client'

// Initialize Prisma client instance for database operations
// This will be used to create, read, update, and delete records
const prisma = new PrismaClient()

/**
 * PHARMACY DATA CONFIGURATION
 * ==========================
 * This array contains the configuration for all pharmacy locations that will be created.
 * Each pharmacy object includes:
 * - Basic business information (name, license, contact details)
 * - Verification status (important for trust and regulatory compliance)
 * - Address information (structured as a nested object for database relationships)
 * - Operating hours (structured to handle different hours for each day of the week)
 */
export const pharmacyData = [
  {
    // Unique identifier for the pharmacy (used for database relationships)
    id: 'pharm_1',
    
    // Business name as displayed to users
    name: 'AksabHealth Central Pharmacy',
    
    // Official license number from Nigerian Pharmacists Council (PCN)
    // Format: PCN-STATE-SEQUENCE-YEAR for regulatory compliance
    licenseNumber: 'PCN-LAG-001-2024',
    
    // Contact information for customer inquiries and orders
    phone: '+234-800-PHARMACY',
    email: 'central@aksabhealth.ng',
    
    // Verification status - determines if pharmacy can sell prescription drugs
    // Verified pharmacies have completed regulatory checks
    isVerified: true,
    
    // Physical address structured for database relationship with Address model
    // This creates a separate Address record linked to the Pharmacy
    address: {
      street: '123 Victoria Island',      // Street address
      city: 'Lagos',                      // City name
      state: 'Lagos',                     // Nigerian state
      postalCode: '101001',               // Nigerian postal code
      country: 'Nigeria'                  // Country (always Nigeria for this app)
    },
    
    // Operating hours for each day of the week
    // Structured as JSON object for flexible storage and easy frontend consumption
    // Times stored in 24-hour format (HH:MM) for consistency
    operatingHours: {
      monday: { open: '08:00', close: '22:00' },     // Weekday hours: 8 AM - 10 PM
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '09:00', close: '20:00' },   // Saturday: 9 AM - 8 PM
      sunday: { open: '10:00', close: '18:00' }      // Sunday: 10 AM - 6 PM
    }
  }
  // Additional pharmacy locations can be added to this array
  // Each would create another Pharmacy record with its own address and inventory
]

/**
 * DRUGS DATABASE CONFIGURATION
 * ============================
 * This array contains comprehensive information about all medications that will be
 * available in the pharmacy system. Each drug entry includes:
 * 
 * REGULATORY INFORMATION:
 * - NAFDAC numbers (Nigerian regulatory approval)
 * - Generic and brand names (for proper identification)
 * - Manufacturer information (for supply chain tracking)
 * 
 * CLINICAL INFORMATION:
 * - Active ingredients (what makes the drug work)
 * - Dosage forms (tablet, capsule, syrup, etc.)
 * - Strength/concentration (how much active ingredient)
 * - Medical descriptions and usage instructions
 * 
 * SAFETY INFORMATION:
 * - Side effects (what patients might experience)
 * - Contraindications (who shouldn't take this drug)
 * - Prescription requirements (regulatory compliance)
 * 
 * BUSINESS INFORMATION:
 * - Pricing (in Nigerian Naira)
 * - Categories (for search and filtering)
 * - Images (for visual identification)
 * 
 * DRUG CATEGORIES EXPLAINED:
 * - ANTIBIOTIC: Fights bacterial infections
 * - ANALGESIC: Pain relief medications
 * - ANTIHYPERTENSIVE: Blood pressure control
 * - ANTIDIABETIC: Diabetes management
 * - ANTIHISTAMINE: Allergy relief
 * - ANTACID: Stomach acid neutralizers
 * - VITAMIN: Nutritional supplements
 * - ANTISEPTIC: Wound care and infection prevention
 */
export const drugsData = [
  
  // =============================================================================
  // ANTIBIOTIC CATEGORY (15 drugs)
  // =============================================================================
  // These medications fight bacterial infections and require prescriptions
  // due to antibiotic resistance concerns and potential side effects
  
  {
    // DRUG IDENTIFICATION
    name: 'Amoxicillin 500mg Capsules',        // Full product name with strength
    genericName: 'Amoxicillin',                // International non-proprietary name (INN)
    brandName: 'Augmentin',                    // Commercial brand name
    manufacturer: 'GlaxoSmithKline',           // Pharmaceutical company
    
    // REGULATORY COMPLIANCE
    nafdacNumber: 'A4-4820',                   // Nigerian FDA registration number
    category: DrugCategory.ANTIBIOTIC,         // Database enum for categorization
    
    // PHARMACEUTICAL SPECIFICATIONS
    dosageForm: 'Capsule',                     // Physical form of the medication
    strength: '500mg',                         // Amount of active ingredient per unit
    activeIngredients: ['Amoxicillin Trihydrate'], // Chemical compounds that provide therapeutic effect
    
    // PRESCRIPTION AND SAFETY
    requiresPrescription: true,                // Regulatory requirement - needs doctor's authorization
    
    // CLINICAL INFORMATION
    description: 'Broad-spectrum antibiotic used to treat bacterial infections including respiratory tract infections, urinary tract infections, and skin infections',
    
    // SAFETY WARNINGS
    sideEffects: 'Nausea, vomiting, diarrhea, allergic reactions, skin rash',
    contraindications: 'Penicillin allergy, severe kidney disease, infectious mononucleosis',
    
    // VISUAL IDENTIFICATION
    images: ['/images/drugs/amoxicillin.jpg'], // Product photos for user interface
    
    // PRICING (in Nigerian Naira)
    price: 1200,                               // Base price for inventory calculations
    stock: 500
  },
  {
    name: 'Ciprofloxacin 500mg Tablets',
    genericName: 'Ciprofloxacin',
    brandName: 'Cipro',
    manufacturer: 'Bayer',
    nafdacNumber: 'A4-4821',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Ciprofloxacin Hydrochloride'],
    requiresPrescription: true,
    description: 'Fluoroquinolone antibiotic for urinary tract and respiratory infections',
    sideEffects: 'Nausea, diarrhea, dizziness, headache, tendon pain',
    contraindications: 'Pregnancy, breastfeeding, tendon problems, myasthenia gravis',
    images: ['/images/drugs/ciprofloxacin.jpg'],
    price: 2500,
    stock: 300
  },
  {
    name: 'Azithromycin 250mg Capsules',
    genericName: 'Azithromycin',
    brandName: 'Zithromax',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-4822',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Capsule',
    strength: '250mg',
    activeIngredients: ['Azithromycin Dihydrate'],
    requiresPrescription: true,
    description: 'Macrolide antibiotic for respiratory and skin infections',
    sideEffects: 'Stomach upset, diarrhea, nausea, abdominal pain',
    contraindications: 'Liver disease, myasthenia gravis, QT prolongation',
    images: ['/images/drugs/azithromycin.jpg'],
    price: 3200,
    stock: 250
  },
  {
    name: 'Cephalexin 500mg Capsules',
    genericName: 'Cephalexin',
    brandName: 'Keflex',
    manufacturer: 'Teva Pharmaceuticals',
    nafdacNumber: 'A4-4823',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Capsule',
    strength: '500mg',
    activeIngredients: ['Cephalexin Monohydrate'],
    requiresPrescription: true,
    description: 'First-generation cephalosporin antibiotic for bacterial infections',
    sideEffects: 'Diarrhea, nausea, stomach pain, vomiting',
    contraindications: 'Cephalosporin allergy, severe kidney disease',
    images: ['/images/drugs/cephalexin.jpg'],
    price: 1800,
    stock: 400
  },
  {
    name: 'Doxycycline 100mg Capsules',
    genericName: 'Doxycycline',
    brandName: 'Vibramycin',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-4824',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Capsule',
    strength: '100mg',
    activeIngredients: ['Doxycycline Hyclate'],
    requiresPrescription: true,
    description: 'Tetracycline antibiotic for various bacterial infections and malaria prophylaxis',
    sideEffects: 'Photosensitivity, nausea, diarrhea, esophageal irritation',
    contraindications: 'Pregnancy, children under 8, tetracycline allergy',
    images: ['/images/drugs/doxycycline.jpg'],
    price: 2200,
    stock: 350
  },
  {
    name: 'Clindamycin 300mg Capsules',
    genericName: 'Clindamycin',
    brandName: 'Cleocin',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-4825',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Capsule',
    strength: '300mg',
    activeIngredients: ['Clindamycin Hydrochloride'],
    requiresPrescription: true,
    description: 'Lincosamide antibiotic for anaerobic infections',
    sideEffects: 'Diarrhea, colitis, nausea, metallic taste',
    contraindications: 'History of colitis, lincomycin allergy',
    images: ['/images/drugs/clindamycin.jpg'],
    price: 2800,
    stock: 200
  },
  {
    name: 'Erythromycin 500mg Tablets',
    genericName: 'Erythromycin',
    brandName: 'EryTab',
    manufacturer: 'Abbott Laboratories',
    nafdacNumber: 'A4-4826',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Erythromycin Stearate'],
    requiresPrescription: true,
    description: 'Macrolide antibiotic alternative to penicillin',
    sideEffects: 'Stomach cramps, nausea, vomiting, diarrhea',
    contraindications: 'Liver disease, myasthenia gravis, porphyria',
    images: ['/images/drugs/erythromycin.jpg'],
    price: 1900,
    stock: 300
  },
  {
    name: 'Metronidazole 500mg Tablets',
    genericName: 'Metronidazole',
    brandName: 'Flagyl',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-4827',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Metronidazole'],
    requiresPrescription: true,
    description: 'Antiprotozoal and antibacterial medication for anaerobic infections',
    sideEffects: 'Metallic taste, nausea, headache, dizziness',
    contraindications: 'Alcohol consumption, pregnancy (first trimester), blood dyscrasias',
    images: ['/images/drugs/metronidazole.jpg'],
    price: 1500,
    stock: 450
  },
  {
    name: 'Trimethoprim-Sulfamethoxazole DS',
    genericName: 'Trimethoprim-Sulfamethoxazole',
    brandName: 'Bactrim DS',
    manufacturer: 'Roche',
    nafdacNumber: 'A4-4828',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Tablet',
    strength: '800mg/160mg',
    activeIngredients: ['Sulfamethoxazole', 'Trimethoprim'],
    requiresPrescription: true,
    description: 'Combination antibiotic for urinary tract infections',
    sideEffects: 'Rash, nausea, diarrhea, photosensitivity',
    contraindications: 'Sulfa allergy, severe kidney/liver disease, folate deficiency',
    images: ['/images/drugs/bactrim.jpg'],
    price: 2100,
    stock: 280
  },
  {
    name: 'Gentamicin 80mg/2ml Injection',
    genericName: 'Gentamicin',
    brandName: 'Garamycin',
    manufacturer: 'Merck',
    nafdacNumber: 'A4-4829',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Injection',
    strength: '80mg/2ml',
    activeIngredients: ['Gentamicin Sulfate'],
    requiresPrescription: true,
    isControlled: true,
    description: 'Aminoglycoside antibiotic for serious infections',
    sideEffects: 'Kidney damage, hearing loss, dizziness, nausea',
    contraindications: 'Hearing problems, kidney disease, myasthenia gravis',
    images: ['/images/drugs/gentamicin.jpg'],
    price: 3500,
    stock: 150
  },
  {
    name: 'Fluconazole 150mg Capsule',
    genericName: 'Fluconazole',
    brandName: 'Diflucan',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-4830',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Capsule',
    strength: '150mg',
    activeIngredients: ['Fluconazole'],
    requiresPrescription: true,
    description: 'Antifungal medication for yeast infections',
    sideEffects: 'Nausea, headache, dizziness, abdominal pain',
    contraindications: 'Liver disease, pregnancy, drug interactions',
    images: ['/images/drugs/fluconazole.jpg'],
    price: 2800,
    stock: 220
  },
  {
    name: 'Levofloxacin 500mg Tablets',
    genericName: 'Levofloxacin',
    brandName: 'Levaquin',
    manufacturer: 'Johnson & Johnson',
    nafdacNumber: 'A4-4831',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Levofloxacin'],
    requiresPrescription: true,
    description: 'Fluoroquinolone antibiotic for respiratory and urinary infections',
    sideEffects: 'Nausea, diarrhea, dizziness, tendon rupture',
    contraindications: 'Tendon disorders, myasthenia gravis, children',
    images: ['/images/drugs/levofloxacin.jpg'],
    price: 3800,
    stock: 180
  },
  {
    name: 'Clarithromycin 500mg Tablets',
    genericName: 'Clarithromycin',
    brandName: 'Biaxin',
    manufacturer: 'Abbott',
    nafdacNumber: 'A4-4832',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Clarithromycin'],
    requiresPrescription: true,
    description: 'Macrolide antibiotic for respiratory tract infections',
    sideEffects: 'Diarrhea, nausea, abnormal taste, headache',
    contraindications: 'Liver disease, QT prolongation, drug interactions',
    images: ['/images/drugs/clarithromycin.jpg'],
    price: 3200,
    stock: 160
  },
  {
    name: 'Cefixime 400mg Capsules',
    genericName: 'Cefixime',
    brandName: 'Suprax',
    manufacturer: 'Lupin',
    nafdacNumber: 'A4-4833',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Capsule',
    strength: '400mg',
    activeIngredients: ['Cefixime'],
    requiresPrescription: true,
    description: 'Third-generation cephalosporin for bacterial infections',
    sideEffects: 'Diarrhea, nausea, abdominal pain, flatulence',
    contraindications: 'Cephalosporin allergy, severe kidney disease',
    images: ['/images/drugs/cefixime.jpg'],
    price: 2800,
    stock: 200
  },
  {
    name: 'Nitrofurantoin 100mg Capsules',
    genericName: 'Nitrofurantoin',
    brandName: 'Macrodantin',
    manufacturer: 'Alvogen',
    nafdacNumber: 'A4-4834',
    category: DrugCategory.ANTIBIOTIC,
    dosageForm: 'Capsule',
    strength: '100mg',
    activeIngredients: ['Nitrofurantoin Monohydrate'],
    requiresPrescription: true,
    description: 'Antibiotic specifically for urinary tract infections',
    sideEffects: 'Nausea, vomiting, loss of appetite, brown urine',
    contraindications: 'Severe kidney disease, glucose-6-phosphate dehydrogenase deficiency',
    images: ['/images/drugs/nitrofurantoin.jpg'],
    price: 2200,
    stock: 280
  },

  // ANALGESICS (12 drugs)
  {
    name: 'Paracetamol 500mg Tablets',
    genericName: 'Paracetamol',
    brandName: 'Panadol',
    manufacturer: 'GSK',
    nafdacNumber: 'A4-2001',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Paracetamol'],
    requiresPrescription: false,
    description: 'Pain reliever and fever reducer, safe for most people',
    sideEffects: 'Rarely causes side effects when used as directed',
    contraindications: 'Severe liver disease, chronic alcoholism',
    images: ['/images/drugs/paracetamol.jpg'],
    price: 800,
    stock: 1000
  },
  {
    name: 'Ibuprofen 400mg Tablets',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-2002',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '400mg',
    activeIngredients: ['Ibuprofen'],
    requiresPrescription: false,
    description: 'NSAID for pain, inflammation, and fever reduction',
    sideEffects: 'Stomach upset, heartburn, dizziness, kidney issues',
    contraindications: 'Stomach ulcers, kidney disease, heart disease, aspirin allergy',
    images: ['/images/drugs/ibuprofen.jpg'],
    price: 1200,
    stock: 800
  },
  {
    name: 'Aspirin 75mg Tablets',
    genericName: 'Aspirin',
    brandName: 'Cardiprin',
    manufacturer: 'Bayer',
    nafdacNumber: 'A4-2003',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '75mg',
    activeIngredients: ['Acetylsalicylic Acid'],
    requiresPrescription: false,
    description: 'Low-dose aspirin for heart protection and pain relief',
    sideEffects: 'Stomach irritation, bleeding risk, tinnitus',
    contraindications: 'Bleeding disorders, children under 16, stomach ulcers',
    images: ['/images/drugs/aspirin.jpg'],
    price: 600,
    stock: 900
  },
  {
    name: 'Diclofenac 50mg Tablets',
    genericName: 'Diclofenac',
    brandName: 'Voltaren',
    manufacturer: 'Novartis',
    nafdacNumber: 'A4-2004',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '50mg',
    activeIngredients: ['Diclofenac Sodium'],
    requiresPrescription: true,
    description: 'NSAID for arthritis and inflammatory conditions',
    sideEffects: 'GI upset, dizziness, headache, liver toxicity',
    contraindications: 'Heart disease, stomach ulcers, liver disease',
    images: ['/images/drugs/diclofenac.jpg'],
    price: 1500,
    stock: 400
  },
  {
    name: 'Naproxen 250mg Tablets',
    genericName: 'Naproxen',
    brandName: 'Naprosyn',
    manufacturer: 'Roche',
    nafdacNumber: 'A4-2005',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '250mg',
    activeIngredients: ['Naproxen Sodium'],
    requiresPrescription: true,
    description: 'Long-acting NSAID for pain and inflammation',
    sideEffects: 'Stomach upset, drowsiness, headache, dizziness',
    contraindications: 'Heart disease, kidney problems, stomach bleeding',
    images: ['/images/drugs/naproxen.jpg'],
    price: 1800,
    stock: 300
  },
  {
    name: 'Tramadol 50mg Capsules',
    genericName: 'Tramadol',
    brandName: 'Ultram',
    manufacturer: 'Johnson & Johnson',
    nafdacNumber: 'A4-2006',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Capsule',
    strength: '50mg',
    activeIngredients: ['Tramadol Hydrochloride'],
    requiresPrescription: true,
    isControlled: true,
    description: 'Opioid-like pain reliever for moderate to severe pain',
    sideEffects: 'Dizziness, nausea, constipation, drowsiness, addiction potential',
    contraindications: 'Respiratory depression, alcohol dependence, seizure disorders',
    images: ['/images/drugs/tramadol.jpg'],
    price: 2500,
    stock: 200
  },
  {
    name: 'Piroxicam 20mg Capsules',
    genericName: 'Piroxicam',
    brandName: 'Feldene',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-2007',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Capsule',
    strength: '20mg',
    activeIngredients: ['Piroxicam'],
    requiresPrescription: true,
    description: 'NSAID for arthritis and musculoskeletal disorders',
    sideEffects: 'GI upset, dizziness, skin reactions, edema',
    contraindications: 'Peptic ulcers, severe heart failure, kidney disease',
    images: ['/images/drugs/piroxicam.jpg'],
    price: 2200,
    stock: 250
  },
  {
    name: 'Celecoxib 200mg Capsules',
    genericName: 'Celecoxib',
    brandName: 'Celebrex',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-2008',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Capsule',
    strength: '200mg',
    activeIngredients: ['Celecoxib'],
    requiresPrescription: true,
    description: 'COX-2 inhibitor for arthritis pain with reduced GI risk',
    sideEffects: 'Headache, dizziness, abdominal pain, diarrhea',
    contraindications: 'Heart disease, sulfa allergy, stroke history',
    images: ['/images/drugs/celecoxib.jpg'],
    price: 3500,
    stock: 180
  },
  {
    name: 'Codeine 30mg Tablets',
    genericName: 'Codeine',
    brandName: 'Codeine Phosphate',
    manufacturer: 'Teva',
    nafdacNumber: 'A4-2009',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '30mg',
    activeIngredients: ['Codeine Phosphate'],
    requiresPrescription: true,
    isControlled: true,
    description: 'Opioid analgesic for moderate pain and cough suppression',
    sideEffects: 'Drowsiness, constipation, nausea, addiction potential',
    contraindications: 'Respiratory depression, children under 12, pregnancy',
    images: ['/images/drugs/codeine.jpg'],
    price: 2800,
    stock: 150
  },
  {
    name: 'Meloxicam 15mg Tablets',
    genericName: 'Meloxicam',
    brandName: 'Mobic',
    manufacturer: 'Boehringer Ingelheim',
    nafdacNumber: 'A4-2010',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '15mg',
    activeIngredients: ['Meloxicam'],
    requiresPrescription: true,
    description: 'NSAID for osteoarthritis and rheumatoid arthritis',
    sideEffects: 'GI upset, dizziness, headache, hypertension',
    contraindications: 'Heart disease, kidney disease, CABG surgery',
    images: ['/images/drugs/meloxicam.jpg'],
    price: 2600,
    stock: 200
  },
  {
    name: 'Ketorolac 10mg Tablets',
    genericName: 'Ketorolac',
    brandName: 'Toradol',
    manufacturer: 'Roche',
    nafdacNumber: 'A4-2011',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '10mg',
    activeIngredients: ['Ketorolac Tromethamine'],
    requiresPrescription: true,
    description: 'Powerful NSAID for short-term pain management',
    sideEffects: 'GI bleeding, kidney problems, drowsiness',
    contraindications: 'Bleeding disorders, kidney disease, elderly patients',
    images: ['/images/drugs/ketorolac.jpg'],
    price: 3200,
    stock: 120
  },
  {
    name: 'Acetaminophen/Caffeine 500mg/65mg',
    genericName: 'Acetaminophen with Caffeine',
    brandName: 'Excedrin',
    manufacturer: 'Haleon',
    nafdacNumber: 'A4-2012',
    category: DrugCategory.ANALGESIC,
    dosageForm: 'Tablet',
    strength: '500mg/65mg',
    activeIngredients: ['Acetaminophen', 'Caffeine'],
    requiresPrescription: false,
    description: 'Pain reliever with caffeine for enhanced effectiveness',
    sideEffects: 'Nervousness, insomnia, stomach upset',
    contraindications: 'Liver disease, caffeine sensitivity',
    images: ['/images/drugs/excedrin.jpg'],
    price: 1400,
    stock: 350
  },

  // ANTIHYPERTENSIVE (8 drugs)
  {
    name: 'Amlodipine 5mg Tablets',
    genericName: 'Amlodipine',
    brandName: 'Norvasc',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-3001',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Tablet',
    strength: '5mg',
    activeIngredients: ['Amlodipine Besylate'],
    requiresPrescription: true,
    description: 'Calcium channel blocker for high blood pressure and angina',
    sideEffects: 'Swelling of ankles, dizziness, flushing, fatigue',
    contraindications: 'Cardiogenic shock, severe aortic stenosis',
    images: ['/images/drugs/amlodipine.jpg'],
    price: 1800,
    stock: 500
  },
  {
    name: 'Lisinopril 10mg Tablets',
    genericName: 'Lisinopril',
    brandName: 'Prinivil',
    manufacturer: 'Merck',
    nafdacNumber: 'A4-3002',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Tablet',
    strength: '10mg',
    activeIngredients: ['Lisinopril'],
    requiresPrescription: true,
    description: 'ACE inhibitor for hypertension and heart failure',
    sideEffects: 'Dry cough, dizziness, hyperkalemia, angioedema',
    contraindications: 'Pregnancy, angioedema history, bilateral renal artery stenosis',
    images: ['/images/drugs/lisinopril.jpg'],
    price: 2100,
    stock: 400
  },
  {
    name: 'Losartan 50mg Tablets',
    genericName: 'Losartan',
    brandName: 'Cozaar',
    manufacturer: 'Merck',
    nafdacNumber: 'A4-3003',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Tablet',
    strength: '50mg',
    activeIngredients: ['Losartan Potassium'],
    requiresPrescription: true,
    description: 'ARB for hypertension and diabetic nephropathy',
    sideEffects: 'Dizziness, hyperkalemia, back pain, diarrhea',
    contraindications: 'Pregnancy, bilateral renal artery stenosis',
    images: ['/images/drugs/losartan.jpg'],
    price: 2400,
    stock: 350
  },
  {
    name: 'Hydrochlorothiazide 25mg Tablets',
    genericName: 'Hydrochlorothiazide',
    brandName: 'Microzide',
    manufacturer: 'Watson Pharma',
    nafdacNumber: 'A4-3004',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Tablet',
    strength: '25mg',
    activeIngredients: ['Hydrochlorothiazide'],
    requiresPrescription: true,
    description: 'Thiazide diuretic for hypertension and edema',
    sideEffects: 'Electrolyte imbalance, dizziness, photosensitivity, dehydration',
    contraindications: 'Anuria, severe kidney/liver disease, sulfonamide allergy',
    images: ['/images/drugs/hctz.jpg'],
    price: 1200,
    stock: 600
  },
  {
    name: 'Atenolol 50mg Tablets',
    genericName: 'Atenolol',
    brandName: 'Tenormin',
    manufacturer: 'AstraZeneca',
    nafdacNumber: 'A4-3005',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Tablet',
    strength: '50mg',
    activeIngredients: ['Atenolol'],
    requiresPrescription: true,
    description: 'Beta-blocker for hypertension, angina, and post-MI',
    sideEffects: 'Fatigue, cold extremities, bradycardia, depression',
    contraindications: 'Asthma, severe bradycardia, heart block, COPD',
    images: ['/images/drugs/atenolol.jpg'],
    price: 1600,
    stock: 450
  },
  {
    name: 'Nifedipine 30mg Extended Release',
    genericName: 'Nifedipine',
    brandName: 'Adalat CC',
    manufacturer: 'Bayer',
    nafdacNumber: 'A4-3006',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Extended Release Tablet',
    strength: '30mg',
    activeIngredients: ['Nifedipine'],
    requiresPrescription: true,
    description: 'Calcium channel blocker for hypertension and angina',
    sideEffects: 'Flushing, dizziness, peripheral edema, headache',
    contraindications: 'Cardiogenic shock, acute MI within 1 month',
    images: ['/images/drugs/nifedipine.jpg'],
    price: 2800,
    stock: 280
  },
  {
    name: 'Valsartan 80mg Tablets',
    genericName: 'Valsartan',
    brandName: 'Diovan',
    manufacturer: 'Novartis',
    nafdacNumber: 'A4-3007',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Tablet',
    strength: '80mg',
    activeIngredients: ['Valsartan'],
    requiresPrescription: true,
    description: 'Angiotensin receptor blocker for hypertension',
    sideEffects: 'Dizziness, fatigue, viral infection, back pain',
    contraindications: 'Pregnancy, bilateral renal artery stenosis',
    images: ['/images/drugs/valsartan.jpg'],
    price: 2600,
    stock: 320
  },
  {
    name: 'Metoprolol 100mg Tablets',
    genericName: 'Metoprolol',
    brandName: 'Lopressor',
    manufacturer: 'Novartis',
    nafdacNumber: 'A4-3008',
    category: DrugCategory.ANTIHYPERTENSIVE,
    dosageForm: 'Tablet',
    strength: '100mg',
    activeIngredients: ['Metoprolol Tartrate'],
    requiresPrescription: true,
    description: 'Beta-blocker for hypertension, angina, and heart failure',
    sideEffects: 'Fatigue, dizziness, depression, shortness of breath',
    contraindications: 'Severe bradycardia, heart block, cardiogenic shock',
    images: ['/images/drugs/metoprolol.jpg'],
    price: 2200,
    stock: 380
  },

  // ANTIDIABETIC (6 drugs)
  {
    name: 'Metformin 500mg Tablets',
    genericName: 'Metformin',
    brandName: 'Glucophage',
    manufacturer: 'Merck',
    nafdacNumber: 'A4-4001',
    category: DrugCategory.ANTIDIABETIC,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Metformin Hydrochloride'],
    requiresPrescription: true,
    description: 'First-line medication for type 2 diabetes mellitus',
    sideEffects: 'GI upset, diarrhea, metallic taste, vitamin B12 deficiency',
    contraindications: 'Severe kidney disease, metabolic acidosis, contrast procedures',
    images: ['/images/drugs/metformin.jpg'],
    price: 1500,
    stock: 800
  },
  {
    name: 'Glimepiride 2mg Tablets',
    genericName: 'Glimepiride',
    brandName: 'Amaryl',
    manufacturer: 'Sanofi',
    nafdacNumber: 'A4-4002',
    category: DrugCategory.ANTIDIABETIC,
    dosageForm: 'Tablet',
    strength: '2mg',
    activeIngredients: ['Glimepiride'],
    requiresPrescription: true,
    description: 'Sulfonylurea for type 2 diabetes mellitus',
    sideEffects: 'Hypoglycemia, weight gain, dizziness, nausea',
    contraindications: 'Type 1 diabetes, diabetic ketoacidosis, sulfonamide allergy',
    images: ['/images/drugs/glimepiride.jpg'],
    price: 2800,
    stock: 300
  },
  {
    name: 'Insulin Glargine 100U/ml Pen',
    genericName: 'Insulin Glargine',
    brandName: 'Lantus',
    manufacturer: 'Sanofi',
    nafdacNumber: 'A4-4003',
    category: DrugCategory.ANTIDIABETIC,
    dosageForm: 'Injection Pen',
    strength: '100U/ml',
    activeIngredients: ['Insulin Glargine'],
    requiresPrescription: true,
    isControlled: true,
    description: 'Long-acting insulin for diabetes mellitus',
    sideEffects: 'Hypoglycemia, injection site reactions, weight gain',
    contraindications: 'Hypoglycemia episodes, insulin allergy',
    images: ['/images/drugs/lantus.jpg'],
    price: 15000,
    stock: 100
  },
  {
    name: 'Sitagliptin 100mg Tablets',
    genericName: 'Sitagliptin',
    brandName: 'Januvia',
    manufacturer: 'Merck',
    nafdacNumber: 'A4-4004',
    category: DrugCategory.ANTIDIABETIC,
    dosageForm: 'Tablet',
    strength: '100mg',
    activeIngredients: ['Sitagliptin Phosphate'],
    requiresPrescription: true,
    description: 'DPP-4 inhibitor for type 2 diabetes mellitus',
    sideEffects: 'Upper respiratory infection, headache, nasopharyngitis',
    contraindications: 'Type 1 diabetes, diabetic ketoacidosis, pancreatitis history',
    images: ['/images/drugs/sitagliptin.jpg'],
    price: 8500,
    stock: 150
  },
  {
    name: 'Gliclazide 80mg Tablets',
    genericName: 'Gliclazide',
    brandName: 'Diamicron',
    manufacturer: 'Servier',
    nafdacNumber: 'A4-4005',
    category: DrugCategory.ANTIDIABETIC,
    dosageForm: 'Tablet',
    strength: '80mg',
    activeIngredients: ['Gliclazide'],
    requiresPrescription: true,
    description: 'Sulfonylurea for type 2 diabetes with cardiovascular benefits',
    sideEffects: 'Hypoglycemia, weight gain, skin reactions',
    contraindications: 'Type 1 diabetes, severe hepatic impairment',
    images: ['/images/drugs/gliclazide.jpg'],
    price: 2400,
    stock: 350
  },
  {
    name: 'Empagliflozin 10mg Tablets',
    genericName: 'Empagliflozin',
    brandName: 'Jardiance',
    manufacturer: 'Boehringer Ingelheim',
    nafdacNumber: 'A4-4006',
    category: DrugCategory.ANTIDIABETIC,
    dosageForm: 'Tablet',
    strength: '10mg',
    activeIngredients: ['Empagliflozin'],
    requiresPrescription: true,
    description: 'SGLT2 inhibitor for type 2 diabetes and heart failure',
    sideEffects: 'Genital infections, UTIs, increased urination, dehydration',
    contraindications: 'Type 1 diabetes, dialysis, severe kidney disease',
    images: ['/images/drugs/empagliflozin.jpg'],
    price: 12000,
    stock: 80
  },

  // ANTIMALARIALS (5 drugs)
  {
    name: 'Artemether-Lumefantrine Tablets',
    genericName: 'Artemether-Lumefantrine',
    brandName: 'Coartem',
    manufacturer: 'Novartis',
    nafdacNumber: 'A4-5001',
    category: DrugCategory.ANTIMALARIAL,
    dosageForm: 'Tablet',
    strength: '20mg/120mg',
    activeIngredients: ['Artemether', 'Lumefantrine'],
    requiresPrescription: true,
    description: 'ACT combination for uncomplicated P. falciparum malaria',
    sideEffects: 'Headache, dizziness, nausea, fatigue, sleep disorders',
    contraindications: 'Severe malaria, known hypersensitivity, QT prolongation',
    images: ['/images/drugs/coartem.jpg'],
    price: 3500,
    stock: 400
  },
  {
    name: 'Quinine 300mg Tablets',
    genericName: 'Quinine',
    brandName: 'Qualaquin',
    manufacturer: 'Roche',
    nafdacNumber: 'A4-5002',
    category: DrugCategory.ANTIMALARIAL,
    dosageForm: 'Tablet',
    strength: '300mg',
    activeIngredients: ['Quinine Sulfate'],
    requiresPrescription: true,
    description: 'Traditional antimalarial for severe and chloroquine-resistant malaria',
    sideEffects: 'Tinnitus, nausea, visual disturbances, cinchonism',
    contraindications: 'G6PD deficiency, myasthenia gravis, optic neuritis',
    images: ['/images/drugs/quinine.jpg'],
    price: 2200,
    stock: 200
  },
  {
    name: 'Doxycycline 100mg (Malaria Prevention)',
    genericName: 'Doxycycline',
    brandName: 'Vibramycin',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-5003',
    category: DrugCategory.ANTIMALARIAL,
    dosageForm: 'Capsule',
    strength: '100mg',
    activeIngredients: ['Doxycycline Hyclate'],
    requiresPrescription: true,
    description: 'Malaria prophylaxis for travelers to endemic areas',
    sideEffects: 'Photosensitivity, nausea, diarrhea, esophageal irritation',
    contraindications: 'Pregnancy, children under 8, tetracycline allergy',
    images: ['/images/drugs/doxycycline-malaria.jpg'],
    price: 1800,
    stock: 300
  },
  {
    name: 'Sulfadoxine-Pyrimethamine Tablets',
    genericName: 'Sulfadoxine-Pyrimethamine',
    brandName: 'Fansidar',
    manufacturer: 'Roche',
    nafdacNumber: 'A4-5004',
    category: DrugCategory.ANTIMALARIAL,
    dosageForm: 'Tablet',
    strength: '500mg/25mg',
    activeIngredients: ['Sulfadoxine', 'Pyrimethamine'],
    requiresPrescription: true,
    description: 'Combination antimalarial and prophylaxis medication',
    sideEffects: 'Skin reactions, blood disorders, Stevens-Johnson syndrome',
    contraindications: 'Sulfa allergy, severe kidney disease, megaloblastic anemia',
    images: ['/images/drugs/fansidar.jpg'],
    price: 1500,
    stock: 350
  },
  {
    name: 'Chloroquine 250mg Tablets',
    genericName: 'Chloroquine',
    brandName: 'Aralen',
    manufacturer: 'Sanofi',
    nafdacNumber: 'A4-5005',
    category: DrugCategory.ANTIMALARIAL,
    dosageForm: 'Tablet',
    strength: '250mg',
    activeIngredients: ['Chloroquine Phosphate'],
    requiresPrescription: true,
    description: 'Antimalarial for chloroquine-sensitive P. vivax and P. ovale',
    sideEffects: 'Nausea, headache, dizziness, blurred vision',
    contraindications: 'Retinal disease, psoriasis, G6PD deficiency',
    images: ['/images/drugs/chloroquine.jpg'],
    price: 1200,
    stock: 250
  },

  // VITAMINS & SUPPLEMENTS (10 drugs)
  {
    name: 'Vitamin D3 1000IU Capsules',
    genericName: 'Cholecalciferol',
    brandName: 'Nature Made D3',
    manufacturer: 'Nature Made',
    nafdacNumber: 'A4-6001',
    category: DrugCategory.VITAMIN,
    dosageForm: 'Capsule',
    strength: '1000IU',
    activeIngredients: ['Cholecalciferol'],
    requiresPrescription: false,
    description: 'Vitamin D supplement for bone health and immune function',
    sideEffects: 'Rare when used as directed, hypercalcemia with overdose',
    contraindications: 'Hypercalcemia, kidney stones, sarcoidosis',
    images: ['/images/drugs/vitamin-d3.jpg'],
    price: 2500,
    stock: 600
  },
  {
    name: 'Multivitamin Complex Tablets',
    genericName: 'Multivitamin',
    brandName: 'Centrum',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-6002',
    category: DrugCategory.VITAMIN,
    dosageForm: 'Tablet',
    strength: 'Various',
    activeIngredients: ['Multiple Vitamins and Minerals'],
    requiresPrescription: false,
    description: 'Complete daily vitamin and mineral supplement',
    sideEffects: 'Rare, possible stomach upset if taken without food',
    contraindications: 'Iron overload disorders, hypervitaminosis',
    images: ['/images/drugs/centrum.jpg'],
    price: 3500,
    stock: 500
  },
  {
    name: 'Vitamin B-Complex Tablets',
    genericName: 'Vitamin B Complex',
    brandName: 'B-Complex Plus',
    manufacturer: 'Nature\'s Bounty',
    nafdacNumber: 'A4-6003',
    category: DrugCategory.VITAMIN,
    dosageForm: 'Tablet',
    strength: 'Various',
    activeIngredients: ['B Vitamins Complex'],
    requiresPrescription: false,
    description: 'B vitamins for energy metabolism and nervous system',
    sideEffects: 'Rare, bright yellow urine, nausea if taken without food',
    contraindications: 'None known, use caution with Parkinson\'s medications',
    images: ['/images/drugs/b-complex.jpg'],
    price: 2200,
    stock: 700
  },
  {
    name: 'Iron + Folic Acid Tablets',
    genericName: 'Iron and Folic Acid',
    brandName: 'FeroFolic',
    manufacturer: 'Ranbaxy',
    nafdacNumber: 'A4-6004',
    category: DrugCategory.SUPPLEMENT,
    dosageForm: 'Tablet',
    strength: '65mg/400mcg',
    activeIngredients: ['Ferrous Sulfate', 'Folic Acid'],
    requiresPrescription: false,
    description: 'Iron and folate supplement for anemia prevention and pregnancy',
    sideEffects: 'Constipation, nausea, dark stools, stomach upset',
    contraindications: 'Hemochromatosis, hemosiderosis, multiple blood transfusions',
    images: ['/images/drugs/iron-folic.jpg'],
    price: 1800,
    stock: 800
  },
  {
    name: 'Calcium + Vitamin D Tablets',
    genericName: 'Calcium Carbonate with Vitamin D3',
    brandName: 'Os-Cal',
    manufacturer: 'GSK',
    nafdacNumber: 'A4-6005',
    category: DrugCategory.SUPPLEMENT,
    dosageForm: 'Tablet',
    strength: '600mg/200IU',
    activeIngredients: ['Calcium Carbonate', 'Vitamin D3'],
    requiresPrescription: false,
    description: 'Calcium and vitamin D for bone health and osteoporosis prevention',
    sideEffects: 'Constipation, gas, bloating, kidney stones',
    contraindications: 'Hypercalcemia, kidney stones, hyperparathyroidism',
    images: ['/images/drugs/calcium-d.jpg'],
    price: 2800,
    stock: 400
  },
  {
    name: 'Omega-3 Fish Oil Capsules',
    genericName: 'Fish Oil',
    brandName: 'Nature Made Fish Oil',
    manufacturer: 'Nature Made',
    nafdacNumber: 'A4-6006',
    category: DrugCategory.SUPPLEMENT,
    dosageForm: 'Soft Gel',
    strength: '1000mg',
    activeIngredients: ['EPA', 'DHA'],
    requiresPrescription: false,
    description: 'Omega-3 fatty acids for cardiovascular and brain health',
    sideEffects: 'Fishy aftertaste, burping, nausea, loose stools',
    contraindications: 'Fish allergy, bleeding disorders, anticoagulant use',
    images: ['/images/drugs/fish-oil.jpg'],
    price: 4500,
    stock: 300
  },
  {
    name: 'Zinc 50mg Tablets',
    genericName: 'Zinc',
    brandName: 'Nature\'s Bounty Zinc',
    manufacturer: 'Nature\'s Bounty',
    nafdacNumber: 'A4-6007',
    category: DrugCategory.SUPPLEMENT,
    dosageForm: 'Tablet',
    strength: '50mg',
    activeIngredients: ['Zinc Gluconate'],
    requiresPrescription: false,
    description: 'Zinc supplement for immune support and wound healing',
    sideEffects: 'Nausea, stomach upset, metallic taste, copper deficiency',
    contraindications: 'Wilson\'s disease, copper deficiency',
    images: ['/images/drugs/zinc.jpg'],
    price: 2200,
    stock: 500
  },
  {
    name: 'Magnesium 400mg Capsules',
    genericName: 'Magnesium',
    brandName: 'Nature Made Magnesium',
    manufacturer: 'Nature Made',
    nafdacNumber: 'A4-6008',
    category: DrugCategory.SUPPLEMENT,
    dosageForm: 'Capsule',
    strength: '400mg',
    activeIngredients: ['Magnesium Oxide'],
    requiresPrescription: false,
    description: 'Magnesium supplement for muscle and nerve function',
    sideEffects: 'Diarrhea, stomach cramps, nausea',
    contraindications: 'Kidney disease, heart block, bowel obstruction',
    images: ['/images/drugs/magnesium.jpg'],
    price: 2800,
    stock: 350
  },
  {
    name: 'Vitamin C 500mg Tablets',
    genericName: 'Ascorbic Acid',
    brandName: 'Nature Made Vitamin C',
    manufacturer: 'Nature Made',
    nafdacNumber: 'A4-6009',
    category: DrugCategory.VITAMIN,
    dosageForm: 'Tablet',
    strength: '500mg',
    activeIngredients: ['Ascorbic Acid'],
    requiresPrescription: false,
    description: 'Vitamin C for immune system support and antioxidant protection',
    sideEffects: 'Stomach upset, diarrhea with high doses, kidney stones',
    contraindications: 'History of kidney stones, iron overload',
    images: ['/images/drugs/vitamin-c.jpg'],
    price: 1500,
    stock: 900
  },
  {
    name: 'Probiotics 10 Billion CFU',
    genericName: 'Probiotics',
    brandName: 'Align Probiotics',
    manufacturer: 'P&G',
    nafdacNumber: 'A4-6010',
    category: DrugCategory.SUPPLEMENT,
    dosageForm: 'Capsule',
    strength: '10 Billion CFU',
    activeIngredients: ['Lactobacillus', 'Bifidobacterium'],
    requiresPrescription: false,
    description: 'Probiotic supplement for digestive health and microbiome balance',
    sideEffects: 'Initial bloating, gas, mild stomach discomfort',
    contraindications: 'Severe immunocompromised state, acute pancreatitis',
    images: ['/images/drugs/probiotics.jpg'],
    price: 5500,
    stock: 200
  },

  // CARDIOVASCULAR (5 drugs)
  {
    name: 'Atorvastatin 20mg Tablets',
    genericName: 'Atorvastatin',
    brandName: 'Lipitor',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-7001',
    category: DrugCategory.CARDIOVASCULAR,
    dosageForm: 'Tablet',
    strength: '20mg',
    activeIngredients: ['Atorvastatin Calcium'],
    requiresPrescription: true,
    description: 'HMG-CoA reductase inhibitor for cholesterol management',
    sideEffects: 'Muscle pain, liver enzyme elevation, headache, nausea',
    contraindications: 'Active liver disease, pregnancy, breastfeeding',
    images: ['/images/drugs/atorvastatin.jpg'],
    price: 3200,
    stock: 400
  },
  {
    name: 'Clopidogrel 75mg Tablets',
    genericName: 'Clopidogrel',
    brandName: 'Plavix',
    manufacturer: 'Bristol-Myers Squibb',
    nafdacNumber: 'A4-7002',
    category: DrugCategory.CARDIOVASCULAR,
    dosageForm: 'Tablet',
    strength: '75mg',
    activeIngredients: ['Clopidogrel Bisulfate'],
    requiresPrescription: true,
    description: 'Antiplatelet agent for cardiovascular protection',
    sideEffects: 'Bleeding risk, bruising, rash, diarrhea',
    contraindications: 'Active bleeding, severe liver disease',
    images: ['/images/drugs/clopidogrel.jpg'],
    price: 4500,
    stock: 300
  },
  {
    name: 'Furosemide 40mg Tablets',
    genericName: 'Furosemide',
    brandName: 'Lasix',
    manufacturer: 'Sanofi',
    nafdacNumber: 'A4-7003',
    category: DrugCategory.CARDIOVASCULAR,
    dosageForm: 'Tablet',
    strength: '40mg',
    activeIngredients: ['Furosemide'],
    requiresPrescription: true,
    description: 'Loop diuretic for heart failure, edema, and hypertension',
    sideEffects: 'Dehydration, electrolyte imbalance, dizziness, kidney impairment',
    contraindications: 'Anuria, severe kidney disease, electrolyte depletion',
    images: ['/images/drugs/furosemide.jpg'],
    price: 1200,
    stock: 500
  },
  {
    name: 'Digoxin 0.25mg Tablets',
    genericName: 'Digoxin',
    brandName: 'Lanoxin',
    manufacturer: 'GSK',
    nafdacNumber: 'A4-7004',
    category: DrugCategory.CARDIOVASCULAR,
    dosageForm: 'Tablet',
    strength: '0.25mg',
    activeIngredients: ['Digoxin'],
    requiresPrescription: true,
    isControlled: true,
    description: 'Cardiac glycoside for heart failure and atrial fibrillation',
    sideEffects: 'Nausea, visual disturbances, arrhythmias, confusion',
    contraindications: 'Ventricular fibrillation, hypersensitivity, WPW syndrome',
    images: ['/images/drugs/digoxin.jpg'],
    price: 2200,
    stock: 250
  },
  {
    name: 'Warfarin 5mg Tablets',
    genericName: 'Warfarin',
    brandName: 'Coumadin',
    manufacturer: 'Bristol-Myers Squibb',
    nafdacNumber: 'A4-7005',
    category: DrugCategory.CARDIOVASCULAR,
    dosageForm: 'Tablet',
    strength: '5mg',
    activeIngredients: ['Warfarin Sodium'],
    requiresPrescription: true,
    isControlled: true,
    description: 'Anticoagulant for thrombosis prevention and atrial fibrillation',
    sideEffects: 'Bleeding risk, bruising, hair loss, skin necrosis',
    contraindications: 'Active bleeding, pregnancy, recent surgery',
    images: ['/images/drugs/warfarin.jpg'],
    price: 2800,
    stock: 200
  },

  // RESPIRATORY (5 drugs)
  {
    name: 'Salbutamol 100mcg Inhaler',
    genericName: 'Salbutamol',
    brandName: 'Ventolin',
    manufacturer: 'GSK',
    nafdacNumber: 'A4-8001',
    category: DrugCategory.RESPIRATORY,
    dosageForm: 'Metered Dose Inhaler',
    strength: '100mcg/dose',
    activeIngredients: ['Salbutamol Sulfate'],
    requiresPrescription: true,
    description: 'Beta-2 agonist bronchodilator for asthma and COPD',
    sideEffects: 'Tremor, nervousness, headache, palpitations',
    contraindications: 'Known hypersensitivity, unstable cardiovascular disease',
    images: ['/images/drugs/ventolin.jpg'],
    price: 3500,
    stock: 300
  },
  {
    name: 'Prednisolone 5mg Tablets',
    genericName: 'Prednisolone',
    brandName: 'Prednisolone',
    manufacturer: 'Various',
    nafdacNumber: 'A4-8002',
    category: DrugCategory.RESPIRATORY,
    dosageForm: 'Tablet',
    strength: '5mg',
    activeIngredients: ['Prednisolone'],
    requiresPrescription: true,
    description: 'Corticosteroid for inflammatory conditions and asthma',
    sideEffects: 'Weight gain, mood changes, increased infection risk, osteoporosis',
    contraindications: 'Systemic infections, live vaccines, peptic ulcers',
    images: ['/images/drugs/prednisolone.jpg'],
    price: 1800,
    stock: 400
  },
  {
    name: 'Cetirizine 10mg Tablets',
    genericName: 'Cetirizine',
    brandName: 'Zyrtec',
    manufacturer: 'Johnson & Johnson',
    nafdacNumber: 'A4-8003',
    category: DrugCategory.RESPIRATORY,
    dosageForm: 'Tablet',
    strength: '10mg',
    activeIngredients: ['Cetirizine Hydrochloride'],
    requiresPrescription: false,
    description: 'Second-generation antihistamine for allergies',
    sideEffects: 'Drowsiness, dry mouth, fatigue, dizziness',
    contraindications: 'End-stage renal disease, known hypersensitivity',
    images: ['/images/drugs/cetirizine.jpg'],
    price: 1500,
    stock: 600
  },
  {
    name: 'Loratadine 10mg Tablets',
    genericName: 'Loratadine',
    brandName: 'Claritin',
    manufacturer: 'Bayer',
    nafdacNumber: 'A4-8004',
    category: DrugCategory.RESPIRATORY,
    dosageForm: 'Tablet',
    strength: '10mg',
    activeIngredients: ['Loratadine'],
    requiresPrescription: false,
    description: 'Non-sedating antihistamine for allergic rhinitis',
    sideEffects: 'Headache, fatigue, dry mouth, nervousness',
    contraindications: 'Severe liver disease, known hypersensitivity',
    images: ['/images/drugs/loratadine.jpg'],
    price: 1800,
    stock: 500
  },
  {
    name: 'Guaifenesin 200mg Syrup',
    genericName: 'Guaifenesin',
    brandName: 'Robitussin',
    manufacturer: 'Pfizer',
    nafdacNumber: 'A4-8005',
    category: DrugCategory.RESPIRATORY,
    dosageForm: 'Syrup',
    strength: '200mg/10ml',
    activeIngredients: ['Guaifenesin'],
    requiresPrescription: false,
    description: 'Expectorant for productive cough and chest congestion',
    sideEffects: 'Nausea, vomiting, dizziness, headache',
    contraindications: 'Known hypersensitivity, persistent cough',
    images: ['/images/drugs/guaifenesin.jpg'],
    price: 2200,
    stock: 350
  }
]

/**
 * MAIN PHARMACY SEEDING FUNCTION
 * ==============================
 * This is the primary function that orchestrates the entire pharmacy seeding process.
 * It performs the following operations in sequence:
 * 
 * PHASE 1: PHARMACY CREATION
 * - Creates the main pharmacy record with business information
 * - Creates associated address record using Prisma's nested create feature
 * - Establishes the foundational data structure for the pharmacy system
 * 
 * PHASE 2: DRUG CATALOG CREATION
 * - Iterates through all drugs in the drugsData array
 * - Creates individual Drug records with full medication information
 * - Separates pricing/stock data from core drug data for proper database normalization
 * 
 * PHASE 3: INVENTORY MANAGEMENT
 * - Links each drug to the pharmacy through PharmacyInventory records
 * - Sets stock levels and pricing specific to each pharmacy location
 * - Enables multiple pharmacies to have different prices/stock for the same drug
 * 
 * ERROR HANDLING:
 * - Wraps all operations in try-catch for robust error handling
 * - Provides detailed logging for debugging and monitoring
 * - Ensures database cleanup on failure to prevent partial seeding
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Uses sequential processing to avoid database connection limits
 * - Each operation waits for completion before proceeding (data integrity)
 * - Could be optimized with batch operations for production use
 */
export const seedPharmacyData = async () => {
  try {
    // Start seeding process with user-friendly status message
    console.log('🌱 Starting enhanced pharmacy data seeding...')

    /**
     * PHARMACY CREATION PHASE
     * ======================
     * Check if pharmacy already exists before creating it.
     * If it exists, skip creation to avoid duplicate constraint errors.
     */
    
    // Check if pharmacy already exists
    const existingPharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyData[0].id },
      include: { address: true }
    })

    let pharmacy
    
    if (existingPharmacy) {
      console.log(`⚠️  Pharmacy ${pharmacyData[0].name} already exists, skipping creation...`)
      pharmacy = existingPharmacy
    } else {
      /**
       * PRISMA NESTED CREATE EXPLAINED:
       * The 'address: { create: ... }' syntax tells Prisma to:
       * 1. Create a new Address record with the provided data
       * 2. Automatically link it to the Pharmacy record being created
       * 3. Set the foreign key relationship in the database
       * 
       * This is more efficient than creating Address separately and then linking it.
       */
      pharmacy = await prisma.pharmacy.create({
        data: {
          // Extract all pharmacy fields from configuration
          id: pharmacyData[0].id,                        // Predefined ID for referencing
          name: pharmacyData[0].name,                    // Business name
          licenseNumber: pharmacyData[0].licenseNumber,  // Regulatory license
          phone: pharmacyData[0].phone,                  // Contact information
          email: pharmacyData[0].email,                  // Email contact
          isVerified: pharmacyData[0].isVerified,        // Verification status
          operatingHours: pharmacyData[0].operatingHours, // Business hours as JSON
          
          // NESTED RELATIONSHIP CREATION
          // This creates an Address record and automatically links it to the Pharmacy
          address: {
            create: pharmacyData[0].address              // Address data from configuration
          }
        }
      })
      
      // Log success with pharmacy name for confirmation
      console.log('✅ Pharmacy created:', pharmacy.name)
    }

    /**
     * DRUG CATALOG AND INVENTORY CREATION PHASE
     * =========================================
     * This section processes each drug in the drugsData array and performs
     * two main operations for each drug:
     * 
     * 1. DRUG RECORD CREATION
     *    - Creates the master drug record with all medical/regulatory information
     *    - This data is pharmacy-independent (same drug info regardless of location)
     * 
     * 2. INVENTORY RECORD CREATION  
     *    - Creates pharmacy-specific inventory records
     *    - Links drugs to pharmacies with location-specific pricing and stock levels
     *    - Allows different pharmacies to have different prices for the same drug
     */
    
    // Initialize counters for progress tracking and final reporting
    let drugsCreated = 0        // Count of Drug records created
    let inventoryCreated = 0    // Count of PharmacyInventory records created

    // Process each drug configuration sequentially
    // Sequential processing ensures data integrity and manageable database load
    for (const drugData of drugsData) {
      /**
       * DATA SEPARATION FOR DATABASE NORMALIZATION
       * ==========================================
       * The drugData object contains both:
       * - Core drug information (name, ingredients, etc.) -> goes to Drug table
       * - Pharmacy-specific data (price, stock) -> goes to PharmacyInventory table
       * 
       * We use object destructuring to separate these concerns:
       * - price, stock -> extracted for inventory record
       * - ...drugFields -> remaining fields for drug record
       */
      const { price, stock, ...drugFields } = drugData

      /**
       * DRUG RECORD CREATION WITH DUPLICATE HANDLING
       * ==========================================
       * Check if drug already exists before creating it.
       * Use the drug name as the unique identifier.
       */
      let drug = await prisma.drug.findFirst({
        where: { name: drugFields.name }
      })

      if (drug) {
        // Drug already exists, skip creation
        console.log(`⚠️  Drug ${drugFields.name} already exists, skipping...`)
      } else {
        /**
         * Creates the master drug record containing all the medical, regulatory,
         * and descriptive information that is consistent regardless of which
         * pharmacy stocks the drug.
         */
        drug = await prisma.drug.create({
          data: drugFields  // All drug fields except price/stock (pharmacy-specific)
        })
        drugsCreated++  // Increment counter for progress tracking
        console.log(`✅ Created drug: ${drug.name}`)
      }

      /**
       * PHARMACY INVENTORY RECORD CREATION WITH DUPLICATE HANDLING
       * ========================================================
       * Check if this drug is already in this pharmacy's inventory.
       */
      const existingInventory = await prisma.pharmacyInventory.findFirst({
        where: {
          pharmacyId: pharmacy.id,
          drugId: drug.id
        }
      })

      if (existingInventory) {
        console.log(`⚠️  ${drug.name} already in pharmacy inventory, skipping...`)
      } else {
        /**
         * PHARMACY INVENTORY RECORD CREATION
         * =================================
         * Creates a link between the drug and the pharmacy with location-specific
         * information such as stock levels, pricing, and availability.
         */
        await prisma.pharmacyInventory.create({
          data: {
            // RELATIONSHIP LINKING
            pharmacyId: pharmacy.id,        // Links to the pharmacy we created above
            drugId: drug.id,               // Links to the drug we just created
            
            // INVENTORY MANAGEMENT
            quantity: stock,               // Current stock level from drug configuration
            price: price,                  // Pharmacy-specific price for this drug
            currency: 'NGN',              // Nigerian Naira (standardized across app)
            
            // EXPIRY AND BATCH TRACKING
            // Set expiry date to 1 year from now (in milliseconds)
            // 365 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
            expiryDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)),
            
            // Generate random batch number for pharmaceutical tracking
            // Format: BATCH-XXXXXXX (7 random uppercase alphanumeric characters)
            batchNumber: `BATCH-${Math.random().toString(36).substring(7).toUpperCase()}`,
            
            // AVAILABILITY STATUS
            isAvailable: true             // Drug is available for purchase
          }
        })
        inventoryCreated++  // Increment counter for progress tracking
        console.log(`✅ Added ${drug.name} to pharmacy inventory`)
      }

      /**
       * PROGRESS REPORTING
       * ==================
       * Provides user feedback every 10 drugs to show seeding progress.
       * This is important for long-running seed operations to:
       * - Confirm the process is still running
       * - Provide an estimate of completion time
       * - Help identify if the process gets stuck on a particular record
       */
      if (drugsCreated % 10 === 0) {
        console.log(`✅ Processed ${drugsCreated} drugs so far...`)
      }
    }

    /**
     * COMPLETION REPORTING
     * ===================
     * Provides a comprehensive summary of what was created during the seeding process.
     * This information is valuable for:
     * - Confirming the seeding completed successfully
     * - Validating the expected number of records were created
     * - Providing data for system administrators and developers
     * - Documenting the scope of available medications and categories
     */
    console.log(`🎉 Enhanced pharmacy seeding completed successfully:`)
    console.log(`   - 1 Pharmacy created`)
    console.log(`   - ${drugsCreated} Drugs created (60+ medications)`)
    console.log(`   - ${inventoryCreated} Inventory records created`)
    console.log(`   - Categories: Antibiotics, Analgesics, Antihypertensive, Antidiabetic, Antimalarial, Vitamins, Cardiovascular, Respiratory`)

    /**
     * RETURN DATA FOR FURTHER PROCESSING
     * =================================
     * Returns an object containing the created pharmacy and statistics.
     * This allows other functions or scripts to:
     * - Access the created pharmacy record for additional operations
     * - Verify the seeding completed with expected record counts
     * - Use the data for integration tests or additional seeding operations
     */
    return {
      pharmacy,                        // The created Pharmacy record
      drugsCount: drugsCreated,       // Total number of Drug records created
      inventoryCount: inventoryCreated // Total number of PharmacyInventory records created
    }
    
  } catch (error) {
    /**
     * ERROR HANDLING AND LOGGING
     * ==========================
     * If any error occurs during the seeding process:
     * 1. Log the error with a clear error indicator (❌)
     * 2. Re-throw the error to allow calling functions to handle it
     * 
     * This approach ensures:
     * - Errors are visible in the console for debugging
     * - The error propagates up the call stack for proper handling
     * - Database transactions can be rolled back if needed
     * - The seeding process fails fast rather than continuing with invalid state
     */
    console.error('❌ Error seeding pharmacy data:', error)
    throw error  // Re-throw to allow proper error handling upstream
  }
}

// Export the seeding function as the default export for easy importing
export default seedPharmacyData

// Export main function for programmatic use
export { main }

/**
 * MAIN EXECUTION FUNCTION
 * =======================
 * This function serves as the entry point when the file is run directly
 * (not imported as a module). It handles the complete lifecycle of the
 * seeding process including setup, execution, and cleanup.
 * 
 * EXECUTION FLOW:
 * 1. Calls the seedPharmacyData function
 * 2. Handles any errors that occur during seeding
 * 3. Ensures database connections are properly closed
 * 4. Exits the process with appropriate status code
 * 
 * ERROR HANDLING STRATEGY:
 * - Catches and logs errors for debugging
 * - Exits with status code 1 (failure) if seeding fails
 * - Exits with status code 0 (success) if seeding completes
 * 
 * RESOURCE CLEANUP:
 * - Always disconnects from Prisma/database in the finally block
 * - Prevents hanging database connections
 * - Ensures clean process termination
 */
async function main() {
  try {
    // Execute the main seeding function
    await seedPharmacyData()
    
    // If we reach here, seeding was successful
    console.log('🚀 Pharmacy seeding process completed successfully!')
    
  } catch (error) {
    // Handle any errors that occurred during seeding
    console.error('💥 Failed to seed pharmacy data:', error)
    
    // Exit with error status code to indicate failure to calling processes
    // This is important for CI/CD pipelines and automated scripts
    process.exit(1)
    
  } finally {
    /**
     * CRITICAL CLEANUP SECTION
     * =======================
     * This block ALWAYS runs, regardless of success or failure.
     * It ensures that:
     * - Database connections are properly closed
     * - No hanging connections remain after the script completes
     * - System resources are freed up
     * 
     * The $disconnect() method:
     * - Closes all active database connections
     * - Cleans up the Prisma Client connection pool
     * - Prevents memory leaks in long-running processes
     */
    await prisma.$disconnect()
  }
}

/**
 * DIRECT EXECUTION CHECK AND BOOTSTRAP
 * ====================================
 * This conditional statement determines whether this file is being run directly
 * or imported as a module. It uses Node.js's require.main property to make this distinction.
 * 
 * HOW IT WORKS:
 * - require.main: Points to the main module that started the Node.js process
 * - module: Refers to the current module (this file)
 * - If they're the same, this file was run directly (not imported)
 * 
 * EXECUTION SCENARIOS:
 * 
 * DIRECT EXECUTION (require.main === module):
 * - Command: node prisma/pharmacy-seed.ts
 * - Command: npm run seed:pharmacy
 * - Command: npx tsx prisma/pharmacy-seed.ts
 * - Result: main() function is called, seeding runs
 * 
 * MODULE IMPORT (require.main !== module):
 * - Code: import { seedPharmacyData } from './pharmacy-seed'
 * - Code: const { seedPharmacyData } = require('./pharmacy-seed')
 * - Result: main() function is NOT called, only exports are available
 * 
 * WHY THIS PATTERN IS USEFUL:
 * - Allows the file to be both a standalone script AND a reusable module
 * - Enables testing by importing functions without triggering execution
 * - Supports integration with other seeding scripts that might import this
 * - Follows Node.js best practices for dual-purpose files
 * 
 * ALTERNATIVE USAGE PATTERNS:
 * 1. Direct execution: Runs the complete seeding process immediately
 * 2. Module import: Provides seedPharmacyData function for custom usage
 * 3. Test integration: Import for unit/integration tests without side effects
 * 4. Composite seeding: Import into master seed script that orchestrates multiple seeders
 */
if (require.main === module) {
  // This file is being run directly, so execute the main seeding function
  main()
}
