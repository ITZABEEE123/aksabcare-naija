// 🏥 AKSABHEALTH NG - NEW DOCTORS SEED SCRIPT
// ===========================================
// This script replaces ALL existing doctors with the 23 new comprehensive doctor profiles
// Each doctor is configured with proper credentials and medical specialization data

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 🔐 STANDARDIZED PASSWORD FOR ALL DOCTORS
// ========================================
// All doctors will use "123456789" as their initial password
// They can change this after their first login through their profile settings
const DOCTOR_PASSWORD = "123456789"

// 👨‍⚕️👩‍⚕️ COMPREHENSIVE DOCTOR PROFILES
// ====================================
// 23 highly qualified medical specialists from various countries and specializations
const doctorsData = [
  {
    // Dr. Fatima H. Bello - Internal Medicine & Nephrology Specialist (Saudi Arabia)
    email: "fatibellow@gmail.com",
    firstName: "Fatima",
    lastName: "H. Bello", 
    specialization: "Internal Medicine & Nephrology",
    subSpecializations: ["Nephrology", "Kidney Diseases", "Dialysis Management"],
    experience: 5,
    country: "Saudi Arabia",
    consultationFee: 15000, // ₦15,000 for specialist consultation
    languages: ["English"],
    bio: "Dr. Fatima H. Bello is a highly qualified Internal Medicine and Nephrology specialist practicing in Saudi Arabia. With her dual fellowships from prestigious medical colleges and recognition as an ISN Scholar, she brings extensive expertise in kidney diseases and general internal medicine. Her international training and experience make her an excellent choice for complex nephrology consultations.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACP", "FMCP"],
      scholarships: ["ISN (International Society of Nephrology) Scholar"]
    },
    certifications: {
      primary: ["Fellow, West African College of Physicians (FWACP)", "Fellow, National College of Physicians (FMCP)"],
      specializations: ["ISN (International Society of Nephrology) Scholar"]
    },
    licenseNumber: "SAU-NP-001-2024"
  },
  {
    // Dr. Sururat Ibrahim - Old Age Psychiatry Specialist (UK)
    email: "joyprazole2@gmail.com",
    firstName: "Sururat",
    lastName: "Ibrahim",
    specialization: "Old Age Psychiatry", 
    subSpecializations: ["Geriatric Mental Health", "Dementia Care", "Elderly Depression"],
    experience: 15,
    country: "United Kingdom",
    consultationFee: 25000, // ₦25,000 for psychiatric consultation
    languages: ["English", "Yoruba"],
    bio: "Dr. Sururat Ibrahim is a seasoned Old Age Psychiatrist with 15 years of experience practicing in England. Her expertise in geriatric mental health disorders, combined with her MRCPsych qualification, makes her invaluable for treating elderly patients with complex psychiatric conditions. She offers culturally sensitive care for both English and Yoruba-speaking patients.",
    education: {
      degree: "MBBS",
      postgraduate: ["MRCPsych"],
      specializations: ["Geriatric Mental Health Training"]
    },
    certifications: {
      primary: ["Member of the Royal College of Psychiatrists (MRCPsych)"],
      specializations: ["Specialized training in Geriatric Mental Health"]
    },
    licenseNumber: "UK-PSY-002-2024"
  },
  {
    // Dr. Haruna Rasheed Muhammad - Radiology Specialist (Nigeria)
    email: "muhammadrasheed17@gmail.com",
    firstName: "Haruna",
    lastName: "Rasheed Muhammad",
    specialization: "Radiology",
    subSpecializations: ["Radiodiagnosis", "Medical Imaging", "CT Scan Interpretation"],
    experience: 6,
    country: "Nigeria",
    consultationFee: 12000, // ₦12,000 for radiology consultation
    languages: ["English", "Hausa", "Fulfulde", "Arabic"],
    bio: "Dr. Haruna Rasheed Muhammad is a skilled Radiologist specializing in radiodiagnosis with 6 years of experience. His multilingual abilities (English, Hausa, Fulfulde, Arabic) make him exceptionally valuable for diverse patient populations. With his FWACS fellowship, he provides expert interpretation of medical imaging for accurate diagnosis.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACS"],
      specializations: ["Advanced Imaging Techniques Certification"]
    },
    certifications: {
      primary: ["Fellow, West African College of Surgeons (FWACS)"],
      specializations: ["Advanced Imaging Techniques Certification"]
    },
    licenseNumber: "NG-RAD-003-2024"
  },
  {
    // Dr. Zainab - Dermatology Specialist (Nigeria)
    email: "zbabba1982@yahoo.com",
    firstName: "Zainab",
    lastName: "Babba",
    specialization: "Dermatology",
    subSpecializations: ["Skin Diseases", "Cosmetic Dermatology", "Pediatric Dermatology"],
    experience: 10,
    country: "Nigeria",
    consultationFee: 15000, // ₦15,000 for dermatology consultation
    languages: ["English", "Hausa"],
    bio: "Dr. Zainab is an experienced Consultant Dermatologist with a unique combination of clinical expertise and global health policy knowledge. Her 10 years of experience, enhanced by her MSc in Global Health & Policy, allows her to provide comprehensive dermatological care while understanding broader healthcare systems. She serves English and Hausa-speaking communities effectively.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACP"],
      postgraduate: ["MSc Global Health & Policy"]
    },
    certifications: {
      primary: ["Fellow, West African College of Physicians (FWACP)"],
      specializations: ["Master of Science in Global Health & Policy", "Specialized Dermatology Training"]
    },
    licenseNumber: "NG-DER-004-2024"
  },
  {
    // Dr. Naja'atu Hamza - Paediatrics Specialist (Nigeria)
    email: "hamzanajaatu@gmail.com",
    firstName: "Naja'atu",
    lastName: "Hamza",
    specialization: "Paediatrics",
    subSpecializations: ["Child Healthcare", "Neonatal Care", "Pediatric Emergency Medicine"],
    experience: 15,
    country: "Nigeria",
    consultationFee: 12000, // ₦12,000 for pediatric consultation
    languages: ["English", "Hausa"],
    bio: "Dr. Naja'atu Hamza is a highly experienced Paediatrician with 15 years of dedicated service in child healthcare. Her FWACP fellowship demonstrates her commitment to excellence in paediatric medicine. She provides comprehensive care for children from infancy through adolescence, with particular expertise in both English and Hausa-speaking communities.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACP"]
    },
    certifications: {
      primary: ["Fellow, West African College of Physicians (FWACP)"],
      specializations: ["Advanced Paediatric Life Support (APLS)", "Neonatal Care Certification"]
    },
    licenseNumber: "NG-PED-005-2024"
  },
  {
    // Dr. Zainab Iliyasu - Paediatrics Specialist (Nigeria)
    email: "iliyasu_zainab@yahoo.com",
    firstName: "Zainab",
    lastName: "Iliyasu",
    specialization: "Paediatrics",
    subSpecializations: ["Critical Pediatric Care", "Neonatal Medicine", "Emergency Pediatrics"],
    experience: 12,
    country: "Nigeria",
    consultationFee: 12000, // ₦12,000 for pediatric consultation
    languages: ["Hausa", "English"],
    bio: "Dr. Zainab Iliyasu is a dedicated Paediatrician with 12 years of experience and extensive specialized training in critical paediatric interventions. Her certifications in ACLS, BLS, NRP, and LISA demonstrate her expertise in emergency paediatric care and neonatal medicine. She is particularly skilled in managing critically ill children and newborns.",
    education: {
      degree: "MBBS",
      fellowships: ["FMCPaed"]
    },
    certifications: {
      primary: ["Fellow, Medical College of Paediatrics (FMCPaed)"],
      specializations: ["Advanced Cardiac Life Support (ACLS)", "Basic Life Support (BLS)", "Neonatal Resuscitation Program (NRP)", "Less Invasive Surfactant Administration (LISA)"]
    },
    licenseNumber: "NG-PED-006-2024"
  },
  {
    // Dr. Muhammad Manko - Gastroenterology Specialist (Nigeria)
    email: "mankomuhammad@yahoo.com",
    firstName: "Muhammad",
    lastName: "Manko",
    specialization: "Gastroenterology",
    subSpecializations: ["Digestive System Disorders", "Liver Diseases", "Endoscopy"],
    experience: 19,
    country: "Nigeria",
    consultationFee: 18000, // ₦18,000 for gastroenterology consultation
    languages: ["English", "Nupe", "Hausa", "Yoruba"],
    bio: "Dr. Muhammad Manko is a highly experienced Gastroenterologist with 19 years of practice, making him one of the most senior specialists in his field. His multilingual capabilities (English, Nupe, Hausa, Yoruba) allow him to serve diverse Nigerian populations. His extensive experience covers all aspects of digestive system disorders, liver diseases, and advanced endoscopic procedures.",
    education: {
      degree: "MBBS",
      fellowships: ["FMCP"]
    },
    certifications: {
      primary: ["Fellow, Medical College of Physicians (FMCP)"],
      specializations: ["Advanced Endoscopy Training", "Hepatology Subspecialty Certification"]
    },
    licenseNumber: "NG-GAS-007-2024"
  },
  {
    // Dr. Adaora Ogbuefi - Paediatrics Specialist (UK)
    email: "ada_akpulu@yahoo.com",
    firstName: "Adaora",
    lastName: "Ogbuefi",
    specialization: "Paediatrics",
    subSpecializations: ["International Pediatric Care", "European Pediatric Standards", "Advanced Life Support"],
    experience: 17,
    country: "United Kingdom",
    consultationFee: 22000, // ₦22,000 for international pediatric consultation
    languages: ["English", "Igbo"],
    bio: "Dr. Adaora Ogbuefi is a distinguished Paediatrician practicing in the UK with 17 years of experience and exceptional qualifications. Her dual certifications (MWACPaeds and FMCPaeds) combined with international health leadership training make her uniquely qualified for complex paediatric cases. Her expertise in European advanced life support protocols ensures the highest standard of emergency paediatric care.",
    education: {
      degree: "MBBS",
      fellowships: ["MWACPaeds", "FMCPaeds"],
      leadership: ["Leadership and Management in International Health (LMIH)"]
    },
    certifications: {
      primary: ["Master, West African College of Paediatrics (MWACPaeds)", "Fellow, Medical College of Paediatrics (FMCPaeds)"],
      specializations: ["European Paediatric Advanced Life Support (EPALS)", "Basic Life Support (BLS)", "Neonatal Life Support (NLS)"]
    },
    licenseNumber: "UK-PED-008-2024"
  },
  {
    // Dr. Abubakar Abdulhamid Mahmud - Anesthesiology (Russia)
    email: "abdulhamidabubakar9@gmail.com",
    firstName: "Abubakar",
    lastName: "Abdulhamid Mahmud",
    specialization: "Anesthesiology",
    subSpecializations: ["Intensive Care", "Critical Care Medicine", "Pain Management"],
    experience: 1,
    country: "Russia",
    consultationFee: 10000, // ₦10,000 for anesthesiology consultation
    languages: ["English", "Russian"],
    bio: "Dr. Abubakar Abdulhamid Mahmud is an emerging specialist in Anesthesiology and Intensive Care, trained in Russia's advanced medical system. Despite being early in his career, his comprehensive certifications in critical areas including difficult airway management and transfusiology demonstrate his commitment to excellence. His bilingual abilities (English and Russian) provide unique international perspective.",
    education: {
      degree: "Medical Doctor (MD)",
      specializations: ["Anesthesia and Intensive Care Accreditation"]
    },
    certifications: {
      primary: ["Russian General Medical License", "Accreditation in Anesthesia and Intensive Care"],
      specializations: ["National Advanced Cardiac Life Support (ACLS) Certification", "Difficult Airway Management Certificate", "Russian Diploma of Transfusiology"]
    },
    licenseNumber: "RU-ANE-009-2024"
  },
  {
    // Dr. Oiza Tessy Ahmadu - Radiation & Clinical Oncology (Nigeria)
    email: "tessyoiza@yahoo.com",
    firstName: "Oiza",
    lastName: "Tessy Ahmadu",
    specialization: "Radiation & Clinical Oncology",
    subSpecializations: ["Nuclear Medicine", "Cancer Treatment", "Radiation Therapy"],
    experience: 20,
    country: "Nigeria",
    consultationFee: 25000, // ₦25,000 for oncology consultation
    languages: ["English", "Hausa", "Yoruba", "Ebira"],
    bio: "Dr. Oiza Tessy Ahmadu is a highly distinguished Radiation and Clinical Oncologist with 20 years of experience and dual expertise in nuclear medicine. Her comprehensive qualifications (MBBS, MMED, FWACS, FCNP) make her one of the most qualified cancer specialists available. Her multilingual abilities allow her to serve diverse populations while providing cutting-edge cancer treatment and nuclear medicine services.",
    education: {
      degree: "MBBS",
      postgraduate: ["MMED"],
      fellowships: ["FWACS", "FCNP"]
    },
    certifications: {
      primary: ["Master of Medicine (MMED)", "Fellow, West African College of Surgeons (FWACS)", "Fellow, College of Nuclear Physicians (FCNP)"],
      specializations: ["Advanced Radiation Therapy Certification", "Nuclear Medicine Technology Certification"]
    },
    licenseNumber: "NG-ONC-010-2024"
  },
  {
    // Dr. Douglas Emeka - Neurosurgery (Nigeria)
    email: "drokor1976@gmail.com",
    firstName: "Douglas",
    lastName: "Emeka",
    specialization: "Neurosurgery",
    subSpecializations: ["Brain Surgery", "Spinal Surgery", "Neurological Disorders"],
    experience: 10,
    country: "Nigeria",
    consultationFee: 30000, // ₦30,000 for neurosurgery consultation
    languages: ["English"],
    bio: "Dr. Douglas Emeka is a highly qualified Neurosurgeon with prestigious Edinburgh Royal College certifications. His 10 years of experience combined with FRCSED qualification in Neurosurgery represents the highest level of training in brain and spinal surgery. He specializes in complex neurological procedures and provides expert surgical care for conditions affecting the nervous system.",
    education: {
      degree: "MBBS",
      fellowships: ["MRCSED", "FRCSED (Neurosurgery)"]
    },
    certifications: {
      primary: ["Member, Royal College of Surgeons of Edinburgh (MRCSED)", "Fellow, Royal College of Surgeons of Edinburgh in Neurosurgery (FRCSED)"],
      specializations: ["Advanced Neurological Surgery Certification"]
    },
    licenseNumber: "NG-NEU-011-2024"
  },
  {
    // Dr. Hauwa Sanusi Gumbi - Obstetrics and Gynecology (Nigeria)
    email: "bajogumbi@yahoo.com",
    firstName: "Hauwa",
    lastName: "Sanusi Gumbi",
    specialization: "Obstetrics and Gynecology",
    subSpecializations: ["Maternal-Fetal Medicine", "Gynecological Surgery", "Women's Health"],
    experience: 16,
    country: "Nigeria",
    consultationFee: 15000, // ₦15,000 for OB/GYN consultation
    languages: ["English", "Arabic", "French"],
    bio: "Dr. Hauwa Sanusi Gumbi is an experienced Obstetrician and Gynecologist with 16 years of practice and dual fellowship qualifications. Her international language skills (English, Arabic, French) make her uniquely positioned to serve diverse populations. Her expertise covers all aspects of women's reproductive health, from routine gynecological care to complex obstetric procedures and surgical interventions.",
    education: {
      degree: "MBBS",
      fellowships: ["FMCOG", "FWACS"]
    },
    certifications: {
      primary: ["Fellow, Medical College of Obstetrics and Gynecology (FMCOG)", "Fellow, West African College of Surgeons (FWACS)"],
      specializations: ["Advanced Maternal-Fetal Medicine Training", "Gynecological Laparoscopy Certification"]
    },
    licenseNumber: "NG-OBG-012-2024"
  },
  {
    // Dr. Nafisa Bello - Radiology (Nigeria)
    email: "nafbells@gmail.com",
    firstName: "Nafisa",
    lastName: "Bello",
    specialization: "Radiology",
    subSpecializations: ["Medical Imaging", "Cross-sectional Imaging", "Diagnostic Radiology"],
    experience: 17,
    country: "Nigeria",
    consultationFee: 12000, // ₦12,000 for radiology consultation
    languages: ["English", "Hausa", "Fulfulde"],
    bio: "Dr. Nafisa Bello is a seasoned Radiologist with 17 years of extensive experience in medical imaging. Her FWACS fellowship and multilingual abilities (English, Hausa, Fulfulde) make her an invaluable asset for diverse patient populations. She provides expert interpretation of all forms of medical imaging, from basic X-rays to advanced MRI and CT scans.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACS"]
    },
    certifications: {
      primary: ["Fellow, West African College of Surgeons (FWACS)"],
      specializations: ["Advanced Medical Imaging Certification", "Cross-sectional Imaging Specialization"]
    },
    licenseNumber: "NG-RAD-013-2024"
  },
  {
    // Dr. Ummukulthum Rabi'u - Ophthalmology (Nigeria)
    email: "kaltumeraz@gmail.com",
    firstName: "Ummukulthum",
    lastName: "Rabi'u",
    specialization: "Ophthalmology",
    subSpecializations: ["Eye Surgery", "Retinal Diseases", "Vision Care"],
    experience: 11,
    country: "Nigeria",
    consultationFee: 15000, // ₦15,000 for ophthalmology consultation
    languages: ["Hausa", "English"],
    bio: "Dr. Ummukulthum Rabi'u is a dedicated Ophthalmologist with 11 years of experience in comprehensive eye care. Currently pursuing her fellowship qualification, she demonstrates continuous commitment to professional development. Her expertise covers all aspects of eye diseases, from routine eye examinations to complex surgical procedures, serving both Hausa and English-speaking patients.",
    education: {
      degree: "MBBS",
      fellowships: ["Fellowship Part 1 (in progress)"]
    },
    certifications: {
      primary: ["Part 1 Fellowship in Ophthalmology (in progress)"],
      specializations: ["Advanced Eye Surgery Training", "Retinal Disease Management Certification"]
    },
    licenseNumber: "NG-OPH-014-2024"
  },
  {
    // Dr. Zainab Abubakar Mustapha - Chemical Pathology (Nigeria)
    email: "mustaphazainab084@gmail.com",
    firstName: "Zainab",
    lastName: "Abubakar Mustapha",
    specialization: "Chemical Pathology",
    subSpecializations: ["Clinical Biochemistry", "Laboratory Medicine", "Diagnostic Testing"],
    experience: 17,
    country: "Nigeria",
    consultationFee: 10000, // ₦10,000 for pathology consultation
    languages: ["Kanuri", "Hausa", "English"],
    bio: "Dr. Zainab Abubakar Mustapha is a highly experienced Chemical Pathologist with 17 years of expertise in laboratory medicine. Her FMCPath fellowship qualification demonstrates her mastery of clinical biochemistry and laboratory diagnostics. Her trilingual abilities (Kanuri, Hausa, English) allow her to serve diverse northeastern Nigerian populations while providing critical diagnostic services.",
    education: {
      degree: "MBBS",
      fellowships: ["FMCPath"]
    },
    certifications: {
      primary: ["Fellow, Medical College of Pathology (FMCPath)"],
      specializations: ["Clinical Biochemistry Specialization", "Laboratory Medicine Certification"]
    },
    licenseNumber: "NG-PAT-015-2024"
  },
  {
    // Dr. Sufyan Ibrahim - Cardiovascular and Thoracic Surgery (Nigeria)
    email: "sufyanctu@gmail.com",
    firstName: "Sufyan",
    lastName: "Ibrahim",
    specialization: "Cardiovascular and Thoracic Surgery",
    subSpecializations: ["Heart Surgery", "Lung Surgery", "Cardiac Procedures"],
    experience: 6,
    country: "Nigeria",
    consultationFee: 35000, // ₦35,000 for cardiac surgery consultation
    languages: ["English", "Hausa"],
    bio: "Dr. Sufyan Ibrahim is a specialized Cardiovascular and Thoracic Surgeon with 6 years of focused experience in heart and chest surgery. His FWACS-CThs certification represents the highest level of training in cardiothoracic surgery in West Africa. He performs complex heart operations, lung surgeries, and other thoracic procedures with expertise in both English and Hausa communication.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACS-CThs"]
    },
    certifications: {
      primary: ["Fellow, West African College of Surgeons - Cardiothoracic Surgery (FWACS-CThs)"],
      specializations: ["Advanced Cardiac Surgery Training", "Thoracic Surgery Specialization"]
    },
    licenseNumber: "NG-CTS-016-2024"
  },
  {
    // Dr. Abdullahi Nasiru - Clinical Microbiology (Nigeria)
    email: "annasuku2012@gmail.com",
    firstName: "Abdullahi",
    lastName: "Nasiru",
    specialization: "Clinical Microbiology",
    subSpecializations: ["Infectious Diseases", "Laboratory Management", "Antimicrobial Resistance"],
    experience: 18,
    country: "Nigeria",
    consultationFee: 12000, // ₦12,000 for microbiology consultation
    languages: ["English", "Ebira"],
    bio: "Dr. Abdullahi Nasiru is a Consultant Clinical Microbiologist with 18 years of experience and a unique combination of medical expertise and business management skills. His FWACP fellowship combined with an MBA makes him exceptionally qualified for laboratory management and infectious disease control. He provides critical diagnostic services while understanding healthcare business operations.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACP"],
      business: ["MBA"]
    },
    certifications: {
      primary: ["Fellow, West African College of Physicians (FWACP)", "Master of Business Administration (MBA)"],
      specializations: ["Advanced Microbiology Laboratory Management", "Infectious Disease Control Certification"]
    },
    licenseNumber: "NG-MIC-017-2024"
  },
  {
    // Dr. Ibrahim Aliyu - Radiology (Nigeria)
    email: "ibrahimaliyu555@gmail.com",
    firstName: "Ibrahim",
    lastName: "Aliyu",
    specialization: "Radiology",
    subSpecializations: ["Medical Imaging", "Interventional Radiology", "Diagnostic Imaging"],
    experience: 18,
    country: "Nigeria",
    consultationFee: 12000, // ₦12,000 for radiology consultation
    languages: ["English", "Hausa"],
    bio: "Dr. Ibrahim Aliyu is a highly experienced Radiologist with 18 years of practice and FWACS fellowship qualification. His extensive experience covers all aspects of medical imaging and diagnostic radiology. His bilingual abilities (English and Hausa) ensure effective communication with diverse patient populations while providing expert radiological interpretations and interventional procedures.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACS"]
    },
    certifications: {
      primary: ["Fellow, West African College of Surgeons (FWACS)"],
      specializations: ["Advanced Medical Imaging Certification", "Interventional Radiology Training"]
    },
    licenseNumber: "NG-RAD-018-2024"
  },
  {
    // Dr. Lubabatu AbdurRasheed - Obstetrics & Gynecology (Nigeria)
    email: "drlubabah@yahoo.com",
    firstName: "Lubabatu",
    lastName: "AbdurRasheed",
    specialization: "Obstetrics & Gynecology",
    subSpecializations: ["Public Health", "Maternal Health", "Women's Health Policy"],
    experience: 19,
    country: "Nigeria",
    consultationFee: 15000, // ₦15,000 for OB/GYN consultation
    languages: ["English", "Hausa"],
    bio: "Dr. Lubabatu AbdurRasheed is a distinguished Obstetrician and Gynecologist with 19 years of experience and a unique public health perspective. Her MPH qualification combined with FMCOG fellowship allows her to address both individual patient care and population-level women's health issues. She provides comprehensive reproductive healthcare with expertise in both English and Hausa languages.",
    education: {
      degree: "MBBS",
      postgraduate: ["MPH"],
      fellowships: ["FMCOG"],
      certifications: ["NPGMC"]
    },
    certifications: {
      primary: ["Master of Public Health (MPH)", "Fellow, Medical College of Obstetrics and Gynecology (FMCOG)", "Nigerian Postgraduate Medical Certification (NPGMC)"],
      specializations: ["Advanced Maternal Health Management"]
    },
    licenseNumber: "NG-OBG-019-2024"
  },
  {
    // Dr. Ifeanyi Obani - Obstetrics & Gynecology (UK)
    email: "obanihi@yahoo.com",
    firstName: "Ifeanyi",
    lastName: "Obani",
    specialization: "Obstetrics & Gynecology",
    subSpecializations: ["International Women's Health", "Advanced Gynecological Surgery", "UK Healthcare Standards"],
    experience: 18,
    country: "United Kingdom",
    consultationFee: 25000, // ₦25,000 for international OB/GYN consultation
    languages: ["Igbo", "Hausa", "English"],
    bio: "Dr. Ifeanyi Obani is an experienced Obstetrician and Gynecologist practicing in the UK with 18 years of international experience. His FWACS qualification combined with UK training provides him with both African expertise and international standards. His trilingual abilities (Igbo, Hausa, English) make him uniquely positioned to serve diverse populations with comprehensive women's healthcare services.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACS"],
      training: ["UK Healthcare System Training"]
    },
    certifications: {
      primary: ["Fellow, West African College of Surgeons (FWACS)"],
      specializations: ["UK Healthcare System Training", "Advanced Gynecological Surgery"]
    },
    licenseNumber: "UK-OBG-020-2024"
  },
  {
    // Dr. Hajaratu Umar Sulayman - Consultant Obstetrician & Gynaecologist (Nigeria)
    email: "hajaratuumar@gmail.com",
    firstName: "Hajaratu",
    lastName: "Umar Sulayman",
    specialization: "Obstetrics & Gynecology",
    subSpecializations: ["Maternal-Fetal Medicine", "High-Risk Pregnancy", "Advanced Obstetric Care"],
    experience: 25,
    country: "Nigeria",
    consultationFee: 20000, // ₦20,000 for senior consultant consultation
    languages: ["English", "Ebira", "Hausa", "Arabic"],
    bio: "Dr. Hajaratu Umar Sulayman is a highly distinguished Consultant Obstetrician and Gynaecologist with 25 years of extensive experience. Her dual fellowships (FWACS and FMCOG) represent the highest level of qualification in women's healthcare. Her multilingual capabilities (English, Ebira, Hausa, Arabic) and quarter-century of experience make her one of the most qualified specialists for complex gynecological and obstetric cases.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACS", "FMCOG"]
    },
    certifications: {
      primary: ["Fellow, West African College of Surgeons (FWACS)", "Fellow, Medical College of Obstetrics and Gynecology (FMCOG)"],
      specializations: ["Advanced Maternal-Fetal Medicine", "High-Risk Pregnancy Management"]
    },
    licenseNumber: "NG-OBG-021-2024"
  },
  {
    // Dr. Mercy Obanimoh - General Practice (UK)
    email: "dzungwemb@gmail.com",
    firstName: "Mercy",
    lastName: "Obanimoh",
    specialization: "General Practice",
    subSpecializations: ["Primary Care", "Family Medicine", "Preventive Care"],
    experience: 9,
    country: "United Kingdom",
    consultationFee: 8000, // ₦8,000 for general practice consultation
    languages: ["English", "Tiv"],
    bio: "Dr. Mercy Obanimoh is a dedicated General Practitioner with 9 years of experience in the UK healthcare system. Her training in British primary care standards combined with life support certifications makes her well-equipped for comprehensive family medicine. Her bilingual abilities (English and Tiv) allow her to serve diverse communities while providing holistic primary healthcare services.",
    education: {
      degree: "MB.BS",
      training: ["UK General Practice Training"]
    },
    certifications: {
      primary: ["Basic Life Support (BLS)", "Advanced Life Support (ALS)"],
      specializations: ["UK General Practice Training", "Primary Care Management"]
    },
    licenseNumber: "UK-GP-022-2024"
  },
  {
    // Dr. Benjamin Omoregbee - Cardiothoracic Surgery (Nigeria)
    email: "benjaminomoregbee@yahoo.com",
    firstName: "Benjamin",
    lastName: "Omoregbee",
    specialization: "Cardiothoracic Surgery",
    subSpecializations: ["Cardiac Surgery", "Thoracic Surgery", "Advanced Life Support"],
    experience: 18,
    country: "Nigeria",
    consultationFee: 35000, // ₦35,000 for cardiothoracic surgery consultation
    languages: ["English", "Bini"],
    bio: "Dr. Benjamin Omoregbee is a highly qualified Cardiothoracic Surgeon with 18 years of experience and prestigious international certifications. His dual fellowships (FWACS and FRCS) combined with specialized life support training (ATLS, CALS) demonstrate his expertise in complex heart and chest surgeries. He provides world-class surgical care for cardiac and thoracic conditions while serving English and Bini-speaking patients.",
    education: {
      degree: "MBBS",
      fellowships: ["FWACS", "FRCS"],
      postgraduate: ["PG Cert."]
    },
    certifications: {
      primary: ["Fellow, West African College of Surgeons (FWACS)", "Fellow, Royal College of Surgeons (FRCS)", "Postgraduate Certificate"],
      specializations: ["Advanced Trauma Life Support (ATLS)", "Cardiac Advanced Life Support (CALS)"]
    },
    licenseNumber: "NG-CTS-023-2024"
  }
]

async function main() {
  console.log('🏥 AKSABHEALTH NG - DOCTOR DATABASE REPLACEMENT')
  console.log('================================================')
  console.log('Starting comprehensive doctor database update...\n')

  try {
    // 🗑️ STEP 1: REMOVE ALL EXISTING DOCTORS
    // ====================================== 
    console.log('🗑️  Step 1: Clearing existing doctor records...')
    
    // First, delete all related records that reference doctors
    console.log('   ↳ Removing doctor availability schedules...')
    await prisma.doctorAvailability.deleteMany()
    
    console.log('   ↳ Removing doctor-hospital associations...')
    await prisma.doctorHospital.deleteMany()
    
    console.log('   ↳ Removing doctor reviews...')
    await prisma.doctorReview.deleteMany()
    
    console.log('   ↳ Removing consultation chats...')
    await prisma.consultationChat.deleteMany()
    
    console.log('   ↳ Removing medical records...')
    await prisma.medicalRecord.deleteMany()
    
    console.log('   ↳ Removing prescriptions...')
    await prisma.prescription.deleteMany()
    
    console.log('   ↳ Removing appointments...')
    await prisma.appointment.deleteMany()
    
    console.log('   ↳ Removing doctor profiles...')
    await prisma.doctor.deleteMany()
    
    // Remove user profiles and users with DOCTOR role
    console.log('   ↳ Removing user profiles for doctors...')
    const doctorUsers = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: { profile: true }
    })
    
    // Delete user profiles first
    for (const user of doctorUsers) {
      if (user.profile) {
        await prisma.userProfile.delete({
          where: { id: user.profile.id }
        })
      }
    }
    
    console.log('   ↳ Removing doctor user accounts...')
    await prisma.user.deleteMany({
      where: { role: 'DOCTOR' }
    })
    
    console.log('✅ Successfully cleared all existing doctor records!\n')

    // 🔐 STEP 2: HASH THE STANDARD PASSWORD
    // ====================================
    console.log('🔐 Step 2: Preparing secure password...')
    const hashedPassword = await bcrypt.hash(DOCTOR_PASSWORD, 12)
    console.log('✅ Password securely hashed for all doctors!\n')

    // 👨‍⚕️ STEP 3: CREATE NEW DOCTOR ACCOUNTS
    // ======================================
    console.log('👨‍⚕️ Step 3: Creating 23 new doctor accounts...')
    
    let createdCount = 0
    
    for (const doctorData of doctorsData) {
      console.log(`   ↳ Creating Dr. ${doctorData.firstName} ${doctorData.lastName} (${doctorData.specialization})...`)
      
      // Create user account
      const user = await prisma.user.create({
        data: {
          email: doctorData.email,
          password: hashedPassword,
          role: 'DOCTOR',
          isActive: true,      // ✅ Active - can login
          isVerified: true,    // ✅ Verified - can use all features
        }
      })

      // Create user profile
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          phone: null, // Will be updated by doctor after login
          avatar: null, // Will be uploaded by doctor after login
          dateOfBirth: null, // Optional for doctors
          gender: null, // Optional for doctors
        }
      })

      // Create doctor profile
      await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: doctorData.licenseNumber,
          specialization: doctorData.specialization,
          subSpecializations: doctorData.subSpecializations,
          experience: doctorData.experience,
          country: doctorData.country,
          consultationFee: doctorData.consultationFee,
          currency: "NGN",
          isAvailable: true,    // ✅ Available - appears in doctor list
          languages: doctorData.languages,
          bio: doctorData.bio,
          education: doctorData.education,
          certifications: doctorData.certifications,
          rating: 0,           // Will be updated as reviews come in
          totalConsultations: 0, // Will be updated as consultations happen
        }
      })

      createdCount++
      console.log(`      ✅ Dr. ${doctorData.firstName} ${doctorData.lastName} created successfully!`)
    }

    console.log(`\n🎉 SUCCESS: Created ${createdCount} new doctor accounts!`)
    
    // 📊 STEP 4: PROVIDE SUMMARY STATISTICS
    // ====================================
    console.log('\n📊 DOCTOR DATABASE SUMMARY:')
    console.log('============================')
    
    const totalDoctors = await prisma.doctor.count()
    console.log(`📋 Total Doctors: ${totalDoctors}`)
    
    const availableDoctors = await prisma.doctor.count({
      where: { isAvailable: true }
    })
    console.log(`✅ Available Doctors: ${availableDoctors}`)
    
    const countryCounts = await prisma.doctor.groupBy({
      by: ['country'],
      _count: { country: true }
    })
    
    console.log('\n🌍 Geographic Distribution:')
    countryCounts.forEach(country => {
      console.log(`   • ${country.country}: ${country._count.country} doctors`)
    })
    
    const specializationCounts = await prisma.doctor.groupBy({
      by: ['specialization'],
      _count: { specialization: true }
    })
    
    console.log('\n🏥 Specialization Distribution:')
    specializationCounts.forEach(spec => {
      console.log(`   • ${spec.specialization}: ${spec._count.specialization} doctor(s)`)
    })

    console.log('\n🔑 LOGIN CREDENTIALS:')
    console.log('=====================')
    console.log('📧 Email: Use each doctor\'s respective email address')
    console.log('🔒 Password: 123456789 (for all doctors)')
    console.log('💡 Note: Doctors can change their password after first login')

    console.log('\n🎯 NEXT STEPS:')
    console.log('==============')
    console.log('1. ✅ All doctors are now visible on the patient doctors page')
    console.log('2. ✅ All doctors can login with email + password: 123456789')
    console.log('3. ✅ Patients can book consultations with any doctor')
    console.log('4. ✅ Chat system ready for post-consultation communication')
    console.log('5. 🔄 Doctors should update their profiles after first login')

    console.log('\n🏥 AKSABHEALTH NG DOCTOR DATABASE UPDATE COMPLETE!')
    console.log('===================================================')

  } catch (error) {
    console.error('❌ Error during doctor database update:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('💥 Fatal error:', e)
    process.exit(1)
  })