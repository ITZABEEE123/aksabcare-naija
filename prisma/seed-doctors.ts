import { PrismaClient, UserRole, Gender, FacilityLevel, OwnershipType, DrugCategory, ServiceCategory, AppointmentType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Function to generate random doctor images
const generateDoctorImage = () => {
  const randomId = Math.floor(Math.random() * 1000) + 1
  return `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face&auto=format&q=80&seed=${randomId}`
}

async function main() {
  console.log('🌱 Starting doctor database seeding...')

  // Skip admin user creation if running as part of comprehensive seed
  // (Admin user should already be created by main seed)
  
  // Create 50 International Doctors
  const doctors = [
    // 20 Nigerian Doctors
    {
      firstName: "Adebayo", lastName: "Ogundimu", email: "adebayo.ogundimu@aksabhealth.ng", country: "Nigeria",
      specialization: "Cardiology", experience: 15, fee: 25000, bio: "Leading cardiologist with expertise in interventional cardiology and heart failure management.", 
      education: { degree: "MBBS, MD Cardiology", university: "University of Lagos" },
      languages: ["English", "Yoruba"], rating: 4.8, consultations: 1250,
      subSpecializations: ["Interventional Cardiology", "Heart Failure", "Cardiac Imaging"],
      certifications: ["Nigerian Medical Association", "West African College of Physicians"]
    },
    {
      firstName: "Fatima", lastName: "Abdullahi", email: "fatima.abdullahi@aksabhealth.ng", country: "Nigeria",
      specialization: "Pediatrics", experience: 12, fee: 20000, bio: "Dedicated pediatrician specializing in child development and infectious diseases.",
      education: { degree: "MBBS, Fellowship in Pediatrics", university: "Ahmadu Bello University" },
      languages: ["English", "Hausa", "Arabic"], rating: 4.9, consultations: 2100,
      subSpecializations: ["Pediatric Infectious Diseases", "Child Development", "Neonatology"],
      certifications: ["Paediatric Association of Nigeria", "Royal College of Paediatrics"]
    },
    {
      firstName: "Chinedu", lastName: "Okwu", email: "chinedu.okwu@aksabhealth.ng", country: "Nigeria",
      specialization: "Neurology", experience: 18, fee: 30000, bio: "Renowned neurologist with extensive experience in stroke management and epilepsy treatment.",
      education: { degree: "MBBS, MD Neurology", university: "University of Nigeria, Nsukka" },
      languages: ["English", "Igbo"], rating: 4.7, consultations: 980,
      subSpecializations: ["Stroke Medicine", "Epilepsy", "Movement Disorders"],
      certifications: ["Nigerian Association of Neurological Sciences", "International Epilepsy Association"]
    },
    {
      firstName: "Aisha", lastName: "Mohammed", email: "aisha.mohammed@aksabhealth.ng", country: "Nigeria",
      specialization: "Obstetrics & Gynecology", experience: 14, fee: 22000, bio: "Experienced ObGyn specializing in high-risk pregnancies and minimally invasive surgery.",
      education: { degree: "MBBS, FWACS", university: "University of Maiduguri" },
      languages: ["English", "Hausa", "Fulfulde"], rating: 4.8, consultations: 1680,
      subSpecializations: ["Maternal-Fetal Medicine", "Laparoscopic Surgery", "Fertility Medicine"],
      certifications: ["Society of Gynecology and Obstetrics of Nigeria", "African Federation of Obstetricians"]
    },
    {
      firstName: "Olumide", lastName: "Adeyemi", email: "olumide.adeyemi@aksabhealth.ng", country: "Nigeria",
      specialization: "Orthopedics", experience: 16, fee: 28000, bio: "Orthopedic surgeon specializing in joint replacement and sports medicine.",
      education: { degree: "MBBS, FWACS Orthopedics", university: "University of Ibadan" },
      languages: ["English", "Yoruba"], rating: 4.6, consultations: 850,
      subSpecializations: ["Joint Replacement", "Sports Medicine", "Trauma Surgery"],
      certifications: ["Nigerian Orthopedic Association", "International Association of Orthopedic Surgeons"]
    },
    {
      firstName: "Ngozi", lastName: "Eke", email: "ngozi.eke@aksabhealth.ng", country: "Nigeria",
      specialization: "Dermatology", experience: 11, fee: 18000, bio: "Dermatologist with expertise in cosmetic procedures and skin cancer treatment.",
      education: { degree: "MBBS, Fellowship Dermatology", university: "University of Port Harcourt" },
      languages: ["English", "Igbo"], rating: 4.9, consultations: 1420,
      subSpecializations: ["Cosmetic Dermatology", "Dermatopathology", "Pediatric Dermatology"],
      certifications: ["Dermatological Society of Nigeria", "International Society of Dermatology"]
    },
    {
      firstName: "Tijani", lastName: "Lawal", email: "tijani.lawal@aksabhealth.ng", country: "Nigeria",
      specialization: "Urology", experience: 19, fee: 32000, bio: "Senior urologist with expertise in minimally invasive procedures and kidney transplants.",
      education: { degree: "MBBS, FWACS Urology", university: "University of Lagos" },
      languages: ["English", "Yoruba"], rating: 4.7, consultations: 720,
      subSpecializations: ["Minimally Invasive Surgery", "Kidney Transplant", "Urologic Oncology"],
      certifications: ["Urological Society of Nigeria", "European Association of Urology"]
    },
    {
      firstName: "Kemi", lastName: "Adebisi", email: "kemi.adebisi@aksabhealth.ng", country: "Nigeria",
      specialization: "Psychiatry", experience: 13, fee: 20000, bio: "Psychiatrist specializing in mood disorders and addiction medicine.",
      education: { degree: "MBBS, Residency Psychiatry", university: "University of Benin" },
      languages: ["English", "Yoruba", "Edo"], rating: 4.8, consultations: 1560,
      subSpecializations: ["Mood Disorders", "Addiction Medicine", "Child Psychiatry"],
      certifications: ["Association of Psychiatrists in Nigeria", "World Psychiatric Association"]
    },
    {
      firstName: "Ibrahim", lastName: "Musa", email: "ibrahim.musa@aksabhealth.ng", country: "Nigeria",
      specialization: "Endocrinology", experience: 15, fee: 26000, bio: "Endocrinologist with focus on diabetes management and thyroid disorders.",
      education: { degree: "MBBS, MD Endocrinology", university: "Bayero University" },
      languages: ["English", "Hausa", "Arabic"], rating: 4.6, consultations: 890,
      subSpecializations: ["Diabetes Management", "Thyroid Disorders", "Reproductive Endocrinology"],
      certifications: ["Endocrine and Metabolism Society of Nigeria", "International Diabetes Federation"]
    },
    {
      firstName: "Funmi", lastName: "Oladele", email: "funmi.oladele@aksabhealth.ng", country: "Nigeria",
      specialization: "Ophthalmology", experience: 17, fee: 24000, bio: "Eye specialist with expertise in cataract surgery and retinal diseases.",
      education: { degree: "MBBS, Fellowship Ophthalmology", university: "University of Ilorin" },
      languages: ["English", "Yoruba"], rating: 4.9, consultations: 1340,
      subSpecializations: ["Cataract Surgery", "Retinal Diseases", "Glaucoma Treatment"],
      certifications: ["Ophthalmological Society of Nigeria", "International Council of Ophthalmology"]
    },
    {
      firstName: "Emeka", lastName: "Nwosu", email: "emeka.nwosu@aksabhealth.ng", country: "Nigeria",
      specialization: "General Surgery", experience: 20, fee: 35000, bio: "Senior general surgeon with expertise in laparoscopic and trauma surgery.",
      education: { degree: "MBBS, FWACS General Surgery", university: "University of Nigeria" },
      languages: ["English", "Igbo"], rating: 4.7, consultations: 650,
      subSpecializations: ["Laparoscopic Surgery", "Trauma Surgery", "Hepatobiliary Surgery"],
      certifications: ["Nigerian Association of General Surgeons", "International Association of Surgeons"]
    },
    {
      firstName: "Hauwa", lastName: "Bello", email: "hauwa.bello@aksabhealth.ng", country: "Nigeria",
      specialization: "Anesthesiology", experience: 14, fee: 22000, bio: "Anesthesiologist specialized in cardiac and neurosurgical anesthesia.",
      education: { degree: "MBBS, Fellowship Anesthesia", university: "University of Jos" },
      languages: ["English", "Hausa"], rating: 4.8, consultations: 920,
      subSpecializations: ["Cardiac Anesthesia", "Neurosurgical Anesthesia", "Pain Management"],
      certifications: ["Society of Anesthesiologists of Nigeria", "World Federation of Anesthesiologists"]
    },
    {
      firstName: "Tunde", lastName: "Akinyemi", email: "tunde.akinyemi@aksabhealth.ng", country: "Nigeria",
      specialization: "Internal Medicine", experience: 16, fee: 20000, bio: "Internal medicine physician with focus on hypertension and diabetes care.",
      education: { degree: "MBBS, FWACP", university: "Obafemi Awolowo University" },
      languages: ["English", "Yoruba"], rating: 4.6, consultations: 1890,
      subSpecializations: ["Hypertension Management", "Diabetes Care", "Preventive Medicine"],
      certifications: ["Nigerian Association of Physicians", "West African College of Physicians"]
    },
    {
      firstName: "Blessing", lastName: "Okoro", email: "blessing.okoro@aksabhealth.ng", country: "Nigeria",
      specialization: "Family Medicine", experience: 10, fee: 15000, bio: "Family physician dedicated to comprehensive primary healthcare for all ages.",
      education: { degree: "MBBS, Residency Family Medicine", university: "University of Calabar" },
      languages: ["English", "Igbo", "Efik"], rating: 4.7, consultations: 2450,
      subSpecializations: ["Primary Care", "Preventive Medicine", "Geriatric Care"],
      certifications: ["Association of Family Physicians of Nigeria", "World Organization of Family Doctors"]
    },
    {
      firstName: "Yusuf", lastName: "Garba", email: "yusuf.garba@aksabhealth.ng", country: "Nigeria",
      specialization: "Radiology", experience: 12, fee: 18000, bio: "Radiologist with expertise in interventional radiology and medical imaging.",
      education: { degree: "MBBS, Fellowship Radiology", university: "University of Abuja" },
      languages: ["English", "Hausa"], rating: 4.5, consultations: 780,
      subSpecializations: ["Interventional Radiology", "CT/MRI Imaging", "Mammography"],
      certifications: ["Radiological Society of Nigeria", "African Society of Radiology"]
    },
    {
      firstName: "Adunni", lastName: "Ogunseye", email: "adunni.ogunseye@aksabhealth.ng", country: "Nigeria",
      specialization: "Pathology", experience: 18, fee: 25000, bio: "Pathologist specializing in surgical pathology and cytopathology.",
      education: { degree: "MBBS, FWACP Pathology", university: "University of Lagos" },
      languages: ["English", "Yoruba"], rating: 4.8, consultations: 450,
      subSpecializations: ["Surgical Pathology", "Cytopathology", "Autopsy Pathology"],
      certifications: ["Nigerian Association of Pathologists", "International Academy of Pathology"]
    },
    {
      firstName: "Aminu", lastName: "Suleiman", email: "aminu.suleiman@aksabhealth.ng", country: "Nigeria",
      specialization: "ENT", experience: 13, fee: 21000, bio: "ENT surgeon with expertise in head and neck surgery and hearing disorders.",
      education: { degree: "MBBS, FWACS ENT", university: "University of Sokoto" },
      languages: ["English", "Hausa"], rating: 4.7, consultations: 1120,
      subSpecializations: ["Head and Neck Surgery", "Hearing Disorders", "Rhinology"],
      certifications: ["Nigerian ENT Society", "International Federation of ENT Societies"]
    },
    {
      firstName: "Doyin", lastName: "Adesanya", email: "doyin.adesanya@aksabhealth.ng", country: "Nigeria",
      specialization: "Rheumatology", experience: 14, fee: 23000, bio: "Rheumatologist specializing in autoimmune diseases and arthritis management.",
      education: { degree: "MBBS, Fellowship Rheumatology", university: "University of Ibadan" },
      languages: ["English", "Yoruba"], rating: 4.6, consultations: 670,
      subSpecializations: ["Autoimmune Diseases", "Arthritis Management", "Osteoporosis"],
      certifications: ["Rheumatology Association of Nigeria", "International League of Rheumatology"]
    },
    {
      firstName: "Murtala", lastName: "Ahmad", email: "murtala.ahmad@aksabhealth.ng", country: "Nigeria",
      specialization: "Emergency Medicine", experience: 11, fee: 20000, bio: "Emergency physician with expertise in trauma care and critical care medicine.",
      education: { degree: "MBBS, Residency Emergency Medicine", university: "University of Kano" },
      languages: ["English", "Hausa"], rating: 4.8, consultations: 1950,
      subSpecializations: ["Trauma Care", "Critical Care", "Emergency Surgery"],
      certifications: ["Emergency Medicine Association of Nigeria", "International Association for Emergency Medicine"]
    },
    {
      firstName: "Omolola", lastName: "Adebayo", email: "omolola.adebayo@aksabhealth.ng", country: "Nigeria",
      specialization: "Hematology", experience: 16, fee: 27000, bio: "Hematologist with focus on blood disorders and bone marrow transplantation.",
      education: { degree: "MBBS, MD Hematology", university: "University of Lagos" },
      languages: ["English", "Yoruba"], rating: 4.7, consultations: 580,
      subSpecializations: ["Blood Disorders", "Bone Marrow Transplant", "Coagulation Disorders"],
      certifications: ["Hematology Society of Nigeria", "International Society of Hematology"]
    },

    // 10 Indian Doctors
    {
      firstName: "Rajesh", lastName: "Sharma", email: "rajesh.sharma@aksabhealth.ng", country: "India",
      specialization: "Cardiology", experience: 20, fee: 15000, bio: "Senior cardiologist from AIIMS New Delhi with expertise in cardiac catheterization.",
      education: { degree: "MBBS, MD, DM Cardiology", university: "All India Institute of Medical Sciences" },
      languages: ["English", "Hindi", "Punjabi"], rating: 4.9, consultations: 3500,
      subSpecializations: ["Cardiac Catheterization", "Heart Transplant", "Preventive Cardiology"],
      certifications: ["Cardiological Society of India", "American College of Cardiology"]
    },
    {
      firstName: "Priya", lastName: "Patel", email: "priya.patel@aksabhealth.ng", country: "India",
      specialization: "Pediatrics", experience: 15, fee: 12000, bio: "Pediatric specialist with focus on child nutrition and development disorders.",
      education: { degree: "MBBS, MD Pediatrics", university: "King George Medical University" },
      languages: ["English", "Hindi", "Gujarati"], rating: 4.8, consultations: 2800,
      subSpecializations: ["Child Nutrition", "Development Disorders", "Pediatric Cardiology"],
      certifications: ["Indian Academy of Pediatrics", "Royal College of Paediatrics and Child Health"]
    },
    {
      firstName: "Amit", lastName: "Singh", email: "amit.singh@aksabhealth.ng", country: "India",
      specialization: "Oncology", experience: 18, fee: 18000, bio: "Medical oncologist with extensive experience in cancer research and treatment.",
      education: { degree: "MBBS, MD, DM Oncology", university: "Post Graduate Institute of Medical Education" },
      languages: ["English", "Hindi"], rating: 4.9, consultations: 1850,
      subSpecializations: ["Breast Cancer", "Lung Cancer", "Immunotherapy"],
      certifications: ["Indian Society of Medical Oncology", "European Society for Medical Oncology"]
    },
    {
      firstName: "Sneha", lastName: "Gupta", email: "sneha.gupta@aksabhealth.ng", country: "India",
      specialization: "Dermatology", experience: 12, fee: 10000, bio: "Dermatologist specializing in cosmetic procedures and skin cancer screening.",
      education: { degree: "MBBS, MD Dermatology", university: "Grant Medical College" },
      languages: ["English", "Hindi", "Marathi"], rating: 4.7, consultations: 2200,
      subSpecializations: ["Cosmetic Dermatology", "Skin Cancer", "Hair Disorders"],
      certifications: ["Indian Association of Dermatologists", "International Society of Dermatology"]
    },
    {
      firstName: "Vivek", lastName: "Mehta", email: "vivek.mehta@aksabhealth.ng", country: "India",
      specialization: "Neurology", experience: 22, fee: 20000, bio: "Leading neurologist with expertise in stroke management and epilepsy surgery.",
      education: { degree: "MBBS, MD, DM Neurology", university: "Sanjay Gandhi Post Graduate Institute" },
      languages: ["English", "Hindi"], rating: 4.8, consultations: 1650,
      subSpecializations: ["Stroke Medicine", "Epilepsy Surgery", "Movement Disorders"],
      certifications: ["Neurological Society of India", "World Federation of Neurology"]
    },
    {
      firstName: "Kavita", lastName: "Reddy", email: "kavita.reddy@aksabhealth.ng", country: "India",
      specialization: "Obstetrics & Gynecology", experience: 16, fee: 14000, bio: "ObGyn with specialization in high-risk pregnancies and fertility treatments.",
      education: { degree: "MBBS, MS OBG", university: "Osmania Medical College" },
      languages: ["English", "Hindi", "Telugu"], rating: 4.9, consultations: 2500,
      subSpecializations: ["High-Risk Pregnancy", "IVF", "Gynecologic Oncology"],
      certifications: ["Federation of Obstetric & Gynaecological Societies of India", "Royal College of Obstetricians"]
    },
    {
      firstName: "Arjun", lastName: "Kumar", email: "arjun.kumar@aksabhealth.ng", country: "India",
      specialization: "Orthopedics", experience: 19, fee: 16000, bio: "Orthopedic surgeon specializing in joint replacement and spine surgery.",
      education: { degree: "MBBS, MS Orthopedics", university: "Maulana Azad Medical College" },
      languages: ["English", "Hindi"], rating: 4.6, consultations: 1400,
      subSpecializations: ["Joint Replacement", "Spine Surgery", "Arthroscopy"],
      certifications: ["Indian Orthopaedic Association", "AO Foundation"]
    },
    {
      firstName: "Meera", lastName: "Iyer", email: "meera.iyer@aksabhealth.ng", country: "India",
      specialization: "Psychiatry", experience: 14, fee: 11000, bio: "Psychiatrist with focus on depression, anxiety, and cognitive behavioral therapy.",
      education: { degree: "MBBS, MD Psychiatry", university: "National Institute of Mental Health" },
      languages: ["English", "Hindi", "Tamil"], rating: 4.8, consultations: 1900,
      subSpecializations: ["Depression", "Anxiety Disorders", "CBT"],
      certifications: ["Indian Psychiatric Society", "World Psychiatric Association"]
    },
    {
      firstName: "Sanjay", lastName: "Agarwal", email: "sanjay.agarwal@aksabhealth.ng", country: "India",
      specialization: "Gastroenterology", experience: 17, fee: 15000, bio: "Gastroenterologist with expertise in liver diseases and endoscopic procedures.",
      education: { degree: "MBBS, MD, DM Gastroenterology", university: "Institute of Medical Sciences" },
      languages: ["English", "Hindi"], rating: 4.7, consultations: 1300,
      subSpecializations: ["Liver Diseases", "Endoscopy", "IBD"],
      certifications: ["Indian Society of Gastroenterology", "Asian Pacific Association of Gastroenterology"]
    },
    {
      firstName: "Anita", lastName: "Nair", email: "anita.nair@aksabhealth.ng", country: "India",
      specialization: "Endocrinology", experience: 13, fee: 13000, bio: "Endocrinologist specializing in diabetes management and thyroid disorders.",
      education: { degree: "MBBS, MD, DM Endocrinology", university: "Christian Medical College" },
      languages: ["English", "Hindi", "Malayalam"], rating: 4.8, consultations: 1750,
      subSpecializations: ["Diabetes", "Thyroid Disorders", "PCOS"],
      certifications: ["Endocrine Society of India", "International Diabetes Federation"]
    },

    // 5 UK Doctors
    {
      firstName: "James", lastName: "Thompson", email: "james.thompson@aksabhealth.ng", country: "United Kingdom",
      specialization: "Cardiology", experience: 25, fee: 35000, bio: "Consultant cardiologist from London with expertise in complex cardiac interventions.",
      education: { degree: "MBBS, MD, FRCP", university: "Imperial College London" },
      languages: ["English"], rating: 4.9, consultations: 2100,
      subSpecializations: ["Complex PCI", "Structural Heart Disease", "Heart Failure"],
      certifications: ["Royal College of Physicians", "European Society of Cardiology"]
    },
    {
      firstName: "Sarah", lastName: "Williams", email: "sarah.williams@aksabhealth.ng", country: "United Kingdom",
      specialization: "Pediatrics", experience: 18, fee: 30000, bio: "Pediatric consultant from Great Ormond Street with expertise in rare diseases.",
      education: { degree: "MBBS, MRCPCH", university: "University of Cambridge" },
      languages: ["English", "French"], rating: 4.9, consultations: 1650,
      subSpecializations: ["Rare Diseases", "Pediatric Genetics", "Child Development"],
      certifications: ["Royal College of Paediatrics and Child Health", "European Society for Pediatric Research"]
    },
    {
      firstName: "David", lastName: "Miller", email: "david.miller@aksabhealth.ng", country: "United Kingdom",
      specialization: "Oncology", experience: 22, fee: 40000, bio: "Medical oncologist from Cancer Research UK with focus on precision medicine.",
      education: { degree: "MBBS, PhD, FRCP", university: "University of Oxford" },
      languages: ["English"], rating: 4.8, consultations: 980,
      subSpecializations: ["Precision Medicine", "Immunotherapy", "Clinical Trials"],
      certifications: ["Royal College of Physicians", "European Society for Medical Oncology"]
    },
    {
      firstName: "Emma", lastName: "Davis", email: "emma.davis@aksabhealth.ng", country: "United Kingdom",
      specialization: "Psychiatry", experience: 16, fee: 32000, bio: "Consultant psychiatrist specializing in mood disorders and psychotherapy.",
      education: { degree: "MBBS, MRCPsych", university: "University of Edinburgh" },
      languages: ["English"], rating: 4.7, consultations: 1420,
      subSpecializations: ["Mood Disorders", "Psychotherapy", "Addiction Medicine"],
      certifications: ["Royal College of Psychiatrists", "World Psychiatric Association"]
    },
    {
      firstName: "Robert", lastName: "Johnson", email: "robert.johnson@aksabhealth.ng", country: "United Kingdom",
      specialization: "Neurology", experience: 20, fee: 38000, bio: "Neurologist from National Hospital for Neurology with expertise in multiple sclerosis.",
      education: { degree: "MBBS, FRCP", university: "University College London" },
      languages: ["English"], rating: 4.8, consultations: 1150,
      subSpecializations: ["Multiple Sclerosis", "Neuroimaging", "Neuroimmunology"],
      certifications: ["Royal College of Physicians", "European Neurological Society"]
    },

    // 5 Ethiopian Doctors
    {
      firstName: "Desta", lastName: "Bekele", email: "desta.bekele@aksabhealth.ng", country: "Ethiopia",
      specialization: "Internal Medicine", experience: 14, fee: 8000, bio: "Internal medicine specialist with focus on tropical diseases and HIV care.",
      education: { degree: "MD", university: "Addis Ababa University" },
      languages: ["English", "Amharic", "Oromo"], rating: 4.6, consultations: 1800,
      subSpecializations: ["Tropical Medicine", "HIV Care", "Infectious Diseases"],
      certifications: ["Ethiopian Medical Association", "East African Medical Research Council"]
    },
    {
      firstName: "Hanan", lastName: "Ahmed", email: "hanan.ahmed@aksabhealth.ng", country: "Ethiopia",
      specialization: "Obstetrics & Gynecology", experience: 12, fee: 7000, bio: "ObGyn with expertise in maternal health and reproductive medicine.",
      education: { degree: "MD, Gynecology Residency", university: "Jimma University" },
      languages: ["English", "Amharic", "Arabic"], rating: 4.7, consultations: 1950,
      subSpecializations: ["Maternal Health", "Family Planning", "Emergency Obstetrics"],
      certifications: ["Ethiopian Society of Obstetricians", "African Federation of Obstetricians"]
    },
    {
      firstName: "Mulugeta", lastName: "Haile", email: "mulugeta.haile@aksabhealth.ng", country: "Ethiopia",
      specialization: "General Surgery", experience: 16, fee: 10000, bio: "General surgeon with focus on emergency surgery and surgical education.",
      education: { degree: "MD, General Surgery Residency", university: "Black Lion Hospital" },
      languages: ["English", "Amharic"], rating: 4.5, consultations: 950,
      subSpecializations: ["Emergency Surgery", "Trauma Surgery", "Surgical Education"],
      certifications: ["Ethiopian Surgical Society", "College of Surgeons of East Africa"]
    },
    {
      firstName: "Meron", lastName: "Tadesse", email: "meron.tadesse@aksabhealth.ng", country: "Ethiopia",
      specialization: "Pediatrics", experience: 10, fee: 6000, bio: "Pediatrician specializing in child nutrition and preventive healthcare.",
      education: { degree: "MD, Pediatrics Residency", university: "Hawassa University" },
      languages: ["English", "Amharic", "Sidamo"], rating: 4.8, consultations: 2200,
      subSpecializations: ["Child Nutrition", "Preventive Care", "Vaccination Programs"],
      certifications: ["Ethiopian Pediatric Society", "African Pediatric Fellowship"]
    },
    {
      firstName: "Yohannes", lastName: "Getachew", email: "yohannes.getachew@aksabhealth.ng", country: "Ethiopia",
      specialization: "Family Medicine", experience: 13, fee: 5000, bio: "Family physician dedicated to community health and primary care.",
      education: { degree: "MD, Family Medicine Residency", university: "Mekelle University" },
      languages: ["English", "Amharic", "Tigrinya"], rating: 4.6, consultations: 2800,
      subSpecializations: ["Community Health", "Chronic Disease Management", "Health Education"],
      certifications: ["Ethiopian Family Medicine Society", "World Organization of Family Doctors"]
    },

    // 10 Pakistani Doctors
    {
      firstName: "Ahmad", lastName: "Khan", email: "ahmad.khan@aksabhealth.ng", country: "Pakistan",
      specialization: "Cardiology", experience: 17, fee: 12000, bio: "Cardiologist from Karachi with expertise in non-invasive cardiology.",
      education: { degree: "MBBS, FCPS Cardiology", university: "Aga Khan University" },
      languages: ["English", "Urdu", "Sindhi"], rating: 4.7, consultations: 1650,
      subSpecializations: ["Non-invasive Cardiology", "Echocardiography", "Cardiac Rehabilitation"],
      certifications: ["Pakistan Cardiac Society", "Asian Pacific Society of Cardiology"]
    },
    {
      firstName: "Fatima", lastName: "Ali", email: "fatima.ali@aksabhealth.ng", country: "Pakistan",
      specialization: "Obstetrics & Gynecology", experience: 14, fee: 10000, bio: "ObGyn specialist with focus on women's health and minimally invasive surgery.",
      education: { degree: "MBBS, FCPS Gynecology", university: "King Edward Medical University" },
      languages: ["English", "Urdu", "Punjabi"], rating: 4.8, consultations: 2100,
      subSpecializations: ["Women's Health", "Laparoscopic Surgery", "Infertility"],
      certifications: ["Pakistan Society of Obstetricians", "International Federation of Gynecology"]
    },
    {
      firstName: "Hassan", lastName: "Sheikh", email: "hassan.sheikh@aksabhealth.ng", country: "Pakistan",
      specialization: "Gastroenterology", experience: 15, fee: 11000, bio: "Gastroenterologist with expertise in hepatology and endoscopic procedures.",
      education: { degree: "MBBS, FCPS Medicine, FCPS Gastroenterology", university: "Dow University" },
      languages: ["English", "Urdu"], rating: 4.6, consultations: 1200,
      subSpecializations: ["Hepatology", "Endoscopy", "Liver Transplant"],
      certifications: ["Pakistan Society of Gastroenterology", "Asian Pacific Association of Gastroenterology"]
    },
    {
      firstName: "Ayesha", lastName: "Malik", email: "ayesha.malik@aksabhealth.ng", country: "Pakistan",
      specialization: "Pediatrics", experience: 12, fee: 9000, bio: "Pediatrician with focus on neonatal care and pediatric emergencies.",
      education: { degree: "MBBS, FCPS Pediatrics", university: "Allama Iqbal Medical College" },
      languages: ["English", "Urdu", "Punjabi"], rating: 4.9, consultations: 2400,
      subSpecializations: ["Neonatal Care", "Pediatric Emergency", "Growth Disorders"],
      certifications: ["Pakistan Pediatric Association", "International Pediatric Association"]
    },
    {
      firstName: "Omar", lastName: "Butt", email: "omar.butt@aksabhealth.ng", country: "Pakistan",
      specialization: "Neurology", experience: 18, fee: 14000, bio: "Neurologist with expertise in stroke and movement disorders.",
      education: { degree: "MBBS, FCPS Neurology", university: "Lahore Medical College" },
      languages: ["English", "Urdu"], rating: 4.7, consultations: 980,
      subSpecializations: ["Stroke Medicine", "Movement Disorders", "Headache Medicine"],
      certifications: ["Pakistan Society of Neurology", "World Federation of Neurology"]
    },
    {
      firstName: "Sana", lastName: "Qureshi", email: "sana.qureshi@aksabhealth.ng", country: "Pakistan",
      specialization: "Dermatology", experience: 11, fee: 8000, bio: "Dermatologist specializing in medical dermatology and cosmetic procedures.",
      education: { degree: "MBBS, FCPS Dermatology", university: "Jinnah Medical College" },
      languages: ["English", "Urdu"], rating: 4.8, consultations: 1850,
      subSpecializations: ["Medical Dermatology", "Cosmetic Procedures", "Dermatosurgery"],
      certifications: ["Pakistan Association of Dermatologists", "International Society of Dermatology"]
    },
    {
      firstName: "Tariq", lastName: "Ahmed", email: "tariq.ahmed@aksabhealth.ng", country: "Pakistan",
      specialization: "Orthopedics", experience: 16, fee: 12000, bio: "Orthopedic surgeon with focus on trauma and sports medicine.",
      education: { degree: "MBBS, FCPS Orthopedics", university: "Peshawar Medical College" },
      languages: ["English", "Urdu", "Pashto"], rating: 4.6, consultations: 1100,
      subSpecializations: ["Trauma Surgery", "Sports Medicine", "Joint Reconstruction"],
      certifications: ["Pakistan Orthopedic Association", "International Association of Orthopedic Surgeons"]
    },
    {
      firstName: "Rubina", lastName: "Nasir", email: "rubina.nasir@aksabhealth.ng", country: "Pakistan",
      specialization: "Psychiatry", experience: 13, fee: 9000, bio: "Psychiatrist with expertise in child and adolescent mental health.",
      education: { degree: "MBBS, FCPS Psychiatry", university: "Ziauddin University" },
      languages: ["English", "Urdu"], rating: 4.8, consultations: 1450,
      subSpecializations: ["Child Psychiatry", "Adolescent Mental Health", "Family Therapy"],
      certifications: ["Pakistan Psychiatric Society", "World Association for Child and Adolescent Psychiatry"]
    },
    {
      firstName: "Imran", lastName: "Shah", email: "imran.shah@aksabhealth.ng", country: "Pakistan",
      specialization: "Urology", experience: 19, fee: 15000, bio: "Urologist with expertise in minimally invasive surgery and kidney stones.",
      education: { degree: "MBBS, FCPS Urology", university: "Sindh Medical College" },
      languages: ["English", "Urdu", "Sindhi"], rating: 4.7, consultations: 850,
      subSpecializations: ["Minimally Invasive Surgery", "Kidney Stones", "Prostate Surgery"],
      certifications: ["Pakistan Urological Association", "European Association of Urology"]
    },
    {
      firstName: "Nadia", lastName: "Iqbal", email: "nadia.iqbal@aksabhealth.ng", country: "Pakistan",
      specialization: "Endocrinology", experience: 14, fee: 10000, bio: "Endocrinologist with focus on diabetes and thyroid disorders.",
      education: { degree: "MBBS, FCPS Medicine, FCPS Endocrinology", university: "Fatima Jinnah Medical College" },
      languages: ["English", "Urdu"], rating: 4.6, consultations: 1300,
      subSpecializations: ["Diabetes Management", "Thyroid Disorders", "Metabolic Disorders"],
      certifications: ["Pakistan Endocrine Society", "International Diabetes Federation"]
    }
  ]

  // Create doctors
  for (let i = 0; i < doctors.length; i++) {
    const doctorData = doctors[i]
    
    try {
      const hashedDoctorPassword = await bcrypt.hash('doctor123!', 10)
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: doctorData.email },
        include: { doctor: true, profile: true }
      })

      if (existingUser) {
        console.log(`⚠️  User ${doctorData.firstName} ${doctorData.lastName} already exists, skipping...`)
        continue
      }
      
      const user = await prisma.user.create({
        data: {
          email: doctorData.email,
          password: hashedDoctorPassword,
          role: UserRole.DOCTOR,
          isVerified: true,
          profile: {
            create: {
              firstName: doctorData.firstName,
              lastName: doctorData.lastName,
              phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              gender: Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE,
              avatar: generateDoctorImage(),
            }
          },
          doctor: {
            create: {
              licenseNumber: `DOC-${doctorData.country.substring(0,3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
              specialization: doctorData.specialization,
              subSpecializations: doctorData.subSpecializations,
              experience: doctorData.experience,
              country: doctorData.country,
              consultationFee: doctorData.fee,
              languages: doctorData.languages,
              bio: doctorData.bio,
              education: doctorData.education,
              certifications: doctorData.certifications,
              rating: doctorData.rating,
              totalConsultations: doctorData.consultations,
              isAvailable: true,
              // Create availability - all doctors available Mon-Fri 9-17, Sat 9-13
              availability: {
                create: [
                  // Monday to Friday
                  ...Array.from({length: 5}, (_, dayIndex) => ({
                    dayOfWeek: dayIndex + 1, // 1 = Monday
                    startTime: '09:00',
                    endTime: '17:00',
                    timezone: 'Africa/Lagos',
                    isActive: true
                  })),
                  // Saturday
                  {
                    dayOfWeek: 6, // 6 = Saturday
                    startTime: '09:00',
                    endTime: '13:00',
                    timezone: 'Africa/Lagos',
                    isActive: true
                  }
                ]
              }
            }
          }
        },
        include: {
          profile: true,
          doctor: {
            include: {
              availability: true
            }
          }
        }
      })
      
      console.log(`✅ Created doctor: Dr. ${user.profile?.firstName} ${user.profile?.lastName} (${doctorData.country})`)
    } catch (error) {
      console.error(`❌ Failed to create doctor ${doctorData.firstName} ${doctorData.lastName}:`, error)
    }
  }

  console.log('🎉 Doctor seeding completed successfully!')

  // Create existing hospitals (keeping your current hospital seeding...)
  // [Hospital seeding code stays the same]
  
  console.log('🎉 Database seeding completed successfully!')
}

// Export main function for programmatic use
export { main }

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
