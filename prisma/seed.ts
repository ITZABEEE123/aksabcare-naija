import { PrismaClient, UserRole, Gender, FacilityLevel, OwnershipType, DrugCategory, ServiceCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // 1. Create Super Admin User
  const hashedPassword = await bcrypt.hash('admin123!', 10)
  
  await prisma.user.upsert({
    where: { email: 'itzofficialabeee@gmail.com' },
    update: {},
    create: {
      email: 'itzofficialabeee@gmail.com',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      isVerified: true,
      profile: {
        create: {
          firstName: 'Abdallah',
          lastName: 'Muhammad',
          phone: '+2347033591713',
          gender: Gender.PREFER_NOT_TO_SAY,
        }
      },
    },
    include: { profile: true }
  })
  
  console.log('✅ Created super admin user')

  // 2. Create 32 Comprehensive Hospitals in Abuja
  const hospitals = [
    // Major Teaching Hospitals
    {
      licenseNumber: "NHA-FCT-001",
      name: "National Hospital Abuja",
      description: "Premier federal tertiary healthcare center offering comprehensive medical services with state-of-the-art facilities and world-class specialists.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-9-4616011",
      email: "info@nationalhospital.gov.ng",
      website: "https://nationalhospital.gov.ng",
      specializations: ["Cardiology", "Neurology", "Oncology", "Emergency Medicine", "Surgery", "Internal Medicine", "Pediatrics", "Obstetrics & Gynecology"],
      address: {
        street: "Plot 132, Central Business District",
        city: "Garki",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0533,
        longitude: 7.4898
      },
      rating: 4.5,
      establishedYear: 1987,
      services: [
        { name: "Emergency Care", description: "24/7 emergency medical services", category: ServiceCategory.EMERGENCY, price: 0 },
        { name: "ICU", description: "Intensive care unit services", category: ServiceCategory.EMERGENCY, price: 50000 },
        { name: "Laboratory", description: "Comprehensive laboratory testing", category: ServiceCategory.DIAGNOSTIC, price: 5000 },
        { name: "Radiology", description: "X-ray, CT scan, MRI services", category: ServiceCategory.DIAGNOSTIC, price: 15000 },
        { name: "IVF", description: "In-vitro fertilization services", category: ServiceCategory.CONSULTATION, price: 800000 },
        { name: "Heart Surgery", description: "Cardiac surgical procedures", category: ServiceCategory.SURGERY, price: 2000000 },
        { name: "Nuclear Medicine", description: "Nuclear imaging and therapy", category: ServiceCategory.DIAGNOSTIC, price: 100000 }
      ]
    },
    {
      licenseNumber: "UATH-FCT-002",
      name: "University of Abuja Teaching Hospital (UATH)",
      description: "Leading teaching hospital with 520-bed capacity, providing excellent patient care, training, and research in medical fields.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-9-8821228",
      email: "info@uath.gov.ng",
      website: "https://uathospital.ng",
      specializations: ["Surgery", "Internal Medicine", "Pediatrics", "Obstetrics & Gynecology", "Orthopedics", "Mental Health", "Family Medicine"],
      address: {
        street: "Gwagwalada-Dukwa Road",
        city: "Gwagwalada",
        state: "FCT",
        postalCode: "901001",
        latitude: 8.9467,
        longitude: 7.0833
      },
      rating: 4.3,
      establishedYear: 1997,
      services: [
        { name: "Emergency Care", description: "24/7 emergency services", category: ServiceCategory.EMERGENCY, price: 0 },
        { name: "Teaching Hospital", description: "Medical education and training", category: ServiceCategory.CONSULTATION, price: 0 },
        { name: "Research", description: "Medical research services", category: ServiceCategory.CONSULTATION, price: 0 },
        { name: "Dialysis", description: "Kidney dialysis services", category: ServiceCategory.CONSULTATION, price: 25000 }
      ]
    },
    {
      licenseNumber: "BAZE-FCT-003",
      name: "Baze University Teaching Hospital",
      description: "Modern private teaching hospital affiliated with Baze University, offering world-class medical education and patient care with cutting-edge technology.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8051234567",
      email: "info@bazeteachinghospital.edu.ng",
      website: "https://bazeteachinghospital.edu.ng",
      specializations: ["Family Medicine", "Internal Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynecology", "Radiology", "Pathology"],
      address: {
        street: "Plot 686, Cadastral Zone C00, Research & Institution Area",
        city: "Jabi",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0821,
        longitude: 7.4378
      },
      rating: 4.4,
      establishedYear: 2011,
      services: [
        { name: "Medical Education", description: "Undergraduate and postgraduate medical training", category: ServiceCategory.CONSULTATION, price: 0 },
        { name: "Specialist Clinic", description: "Multi-specialty outpatient services", category: ServiceCategory.CONSULTATION, price: 20000 },
        { name: "Advanced Diagnostics", description: "State-of-the-art diagnostic services", category: ServiceCategory.DIAGNOSTIC, price: 18000 }
      ]
    },
    {
      licenseNumber: "NILE-FCT-004",
      name: "Nile University Teaching Hospital",
      description: "Private teaching hospital providing quality healthcare and medical education with focus on innovation and research in medical practice.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8098765432",
      email: "hospital@nileuniversity.edu.ng",
      website: "https://nileuniversity.edu.ng/hospital",
      specializations: ["General Surgery", "Internal Medicine", "Pediatrics", "Obstetrics & Gynecology", "Emergency Medicine", "Anesthesiology"],
      address: {
        street: "Plot 681, Research & Institution Area",
        city: "Jabi",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0833,
        longitude: 7.4400
      },
      rating: 4.2,
      establishedYear: 2009,
      services: [
        { name: "Teaching Services", description: "Medical education and clinical training", category: ServiceCategory.CONSULTATION, price: 0 },
        { name: "General Surgery", description: "Various surgical procedures", category: ServiceCategory.SURGERY, price: 150000 },
        { name: "Maternity Services", description: "Obstetric and gynecological care", category: ServiceCategory.MATERNITY, price: 80000 }
      ]
    },
    {
      licenseNumber: "IBRAHIM-FCT-005",
      name: "Ibrahim Badamasi Babangida University Teaching Hospital",
      description: "Teaching hospital providing comprehensive healthcare services while training the next generation of medical professionals with modern facilities.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-8055667788",
      email: "info@ibbuth.edu.ng",
      website: "https://ibbuth.edu.ng",
      specializations: ["Family Medicine", "Internal Medicine", "Surgery", "Pediatrics", "Community Medicine", "Pathology"],
      address: {
        street: "Lapai-Minna Road",
        city: "Lapai",
        state: "FCT",
        postalCode: "911101",
        latitude: 9.0500,
        longitude: 6.5667
      },
      rating: 4.0,
      establishedYear: 2005,
      services: [
        { name: "Community Health", description: "Community-based healthcare services", category: ServiceCategory.CONSULTATION, price: 8000 },
        { name: "Medical Training", description: "Clinical education and training", category: ServiceCategory.CONSULTATION, price: 0 },
        { name: "Rural Healthcare", description: "Healthcare services for rural communities", category: ServiceCategory.CONSULTATION, price: 5000 }
      ]
    },
    {
      licenseNumber: "FMC-FCT-006",
      name: "Federal Medical Centre Abuja",
      description: "Federal government medical center providing comprehensive healthcare services with modern medical facilities and expert medical professionals.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-9-4616022",
      email: "info@fmcabuja.gov.ng",
      website: "https://fmcabuja.gov.ng",
      specializations: ["Internal Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynecology", "Emergency Medicine", "Radiology"],
      address: {
        street: "Airport Road",
        city: "Jabi",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0833,
        longitude: 7.4500
      },
      rating: 4.2,
      establishedYear: 1999,
      services: [
        { name: "Federal Healthcare", description: "Government-subsidized healthcare", category: ServiceCategory.CONSULTATION, price: 3000 },
        { name: "Dialysis Center", description: "Kidney dialysis services", category: ServiceCategory.CONSULTATION, price: 20000 }
      ]
    },
    {
      licenseNumber: "GARKI-FCT-007",
      name: "Garki Hospital Abuja",
      description: "Modern 100-bed hospital known for specialized surgeries including open heart surgery, kidney transplant, and IVF services.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-8090204653",
      email: "info@garkihospital.com",
      website: "https://garkihospital.com",
      specializations: ["Cardiology", "Urology", "Obstetrics & Gynecology", "Pediatrics", "Family Medicine", "General Surgery"],
      address: {
        street: "Tafawa Balewa Way, Area 8",
        city: "Garki",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0333,
        longitude: 7.4889
      },
      rating: 4.4,
      establishedYear: 1984,
      services: [
        { name: "Open Heart Surgery", description: "Cardiac surgical procedures", category: ServiceCategory.SURGERY, price: 2500000 },
        { name: "Kidney Transplant", description: "Renal transplant services", category: ServiceCategory.SURGERY, price: 5000000 },
        { name: "IVF Services", description: "Fertility treatment", category: ServiceCategory.CONSULTATION, price: 500000 }
      ]
    },
    {
      licenseNumber: "CEDARCREST-FCT-008",
      name: "Cedarcrest Hospital Abuja",
      description: "Premium private hospital offering world-class healthcare with state-of-the-art medical equipment and internationally trained specialists.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-9-2915000",
      email: "info@cedarcresthospital.com",
      website: "https://cedarcresthospital.com",
      specializations: ["Cardiology", "Oncology", "Neurology", "Orthopedics", "IVF", "Plastic Surgery", "Emergency Medicine"],
      address: {
        street: "Diplomatic Drive, Central Business District",
        city: "Garki",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0465,
        longitude: 7.4956
      },
      rating: 4.6,
      establishedYear: 2012,
      services: [
        { name: "Cardiac Catheterization", description: "Advanced cardiac procedures", category: ServiceCategory.SURGERY, price: 1200000 },
        { name: "Cancer Treatment", description: "Comprehensive oncology care", category: ServiceCategory.CONSULTATION, price: 300000 },
        { name: "Fertility Clinic", description: "Advanced reproductive medicine", category: ServiceCategory.CONSULTATION, price: 600000 },
        { name: "Neurosurgery", description: "Brain and spine surgery", category: ServiceCategory.SURGERY, price: 3000000 }
      ]
    },
    {
      licenseNumber: "NIZAMIYE-FCT-009",
      name: "Nizamiye Turkish Hospital",
      description: "World-class Turkish hospital providing exceptional healthcare with advanced medical technology and international standards of care.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-7006497264",
      email: "info@nizamiyehospital.com",
      website: "https://nizamiyehospital.com",
      specializations: ["Cardiology", "Neurosurgery", "Organ Transplant", "Oncology", "Pediatric Surgery", "Robotic Surgery"],
      address: {
        street: "Airport Road, Idu Industrial District",
        city: "Idu",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.1833,
        longitude: 7.4333
      },
      rating: 4.7,
      establishedYear: 2014,
      services: [
        { name: "Robotic Surgery", description: "Da Vinci robotic surgical procedures", category: ServiceCategory.SURGERY, price: 4000000 },
        { name: "Organ Transplant", description: "Liver and kidney transplantation", category: ServiceCategory.SURGERY, price: 8000000 },
        { name: "International Standards", description: "JCI accredited healthcare", category: ServiceCategory.CONSULTATION, price: 50000 }
      ]
    },
    {
      licenseNumber: "MAITAMA-FCT-010",
      name: "Maitama District Hospital",
      description: "Modern government hospital serving the upscale Maitama district with comprehensive medical services and emergency care.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-9-4137000",
      email: "info@maitamahospital.gov.ng",
      website: "https://maitamahospital.gov.ng",
      specializations: ["Family Medicine", "Internal Medicine", "Pediatrics", "Emergency Medicine", "General Surgery", "Obstetrics & Gynecology"],
      address: {
        street: "Aguiyi Ironsi Street",
        city: "Maitama",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0833,
        longitude: 7.5000
      },
      rating: 4.1,
      establishedYear: 1995,
      services: [
        { name: "Diplomatic Healthcare", description: "Healthcare for diplomatic community", category: ServiceCategory.CONSULTATION, price: 15000 },
        { name: "Executive Health Screening", description: "Comprehensive health checkups", category: ServiceCategory.DIAGNOSTIC, price: 35000 }
      ]
    },
    {
      licenseNumber: "ASOKORO-FCT-011",
      name: "Asokoro District Hospital",
      description: "Government hospital providing quality healthcare services to residents of Asokoro and surrounding areas with modern facilities.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-9-3145000",
      email: "info@asokorohospital.gov.ng",
      website: "https://asokorohospital.gov.ng",
      specializations: ["Internal Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynecology", "Radiology", "Laboratory Medicine"],
      address: {
        street: "Shehu Shagari Way",
        city: "Asokoro",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0500,
        longitude: 7.5167
      },
      rating: 3.9,
      establishedYear: 1992,
      services: [
        { name: "Government Healthcare", description: "Subsidized healthcare services", category: ServiceCategory.CONSULTATION, price: 2000 },
        { name: "Maternity Ward", description: "Obstetric and newborn care", category: ServiceCategory.MATERNITY, price: 25000 }
      ]
    },
    {
      licenseNumber: "WUSE-FCT-012",
      name: "Wuse General Hospital",
      description: "Major public hospital serving Wuse district with comprehensive medical services, emergency care, and specialized treatments.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-9-5234000",
      email: "info@wusehospital.gov.ng",
      website: "https://wusehospital.gov.ng",
      specializations: ["Emergency Medicine", "Internal Medicine", "Surgery", "Pediatrics", "Orthopedics", "Ophthalmology"],
      address: {
        street: "Adetokunbo Ademola Crescent",
        city: "Wuse II",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0667,
        longitude: 7.4833
      },
      rating: 3.8,
      establishedYear: 1988,
      services: [
        { name: "Trauma Center", description: "Emergency trauma care", category: ServiceCategory.EMERGENCY, price: 0 },
        { name: "Orthopedic Surgery", description: "Bone and joint surgery", category: ServiceCategory.SURGERY, price: 200000 }
      ]
    },
    {
      licenseNumber: "GWARINPA-FCT-013",
      name: "Gwarinpa General Hospital",
      description: "Community hospital serving Gwarinpa estate and environs with quality healthcare, maternal services, and preventive care.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-8033445566",
      email: "info@gwarinpahospital.gov.ng",
      website: "https://gwarinpahospital.gov.ng",
      specializations: ["Family Medicine", "Pediatrics", "Obstetrics & Gynecology", "Internal Medicine", "General Surgery"],
      address: {
        street: "1st Avenue, Gwarinpa Estate",
        city: "Gwarinpa",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.1167,
        longitude: 7.4167
      },
      rating: 3.7,
      establishedYear: 2001,
      services: [
        { name: "Community Health", description: "Primary healthcare services", category: ServiceCategory.CONSULTATION, price: 1500 },
        { name: "Maternal Health", description: "Antenatal and delivery services", category: ServiceCategory.MATERNITY, price: 15000 }
      ]
    },
    {
      licenseNumber: "KUJE-FCT-014",
      name: "Kuje General Hospital",
      description: "Rural hospital serving Kuje area council with essential healthcare services, emergency care, and community health programs.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-8055778899",
      email: "info@kujehospital.gov.ng",
      website: "https://kujehospital.gov.ng",
      specializations: ["Family Medicine", "Internal Medicine", "Surgery", "Pediatrics", "Community Medicine"],
      address: {
        street: "Kuje-Gwagwalada Road",
        city: "Kuje",
        state: "FCT",
        postalCode: "902101",
        latitude: 8.8833,
        longitude: 7.2333
      },
      rating: 3.5,
      establishedYear: 1985,
      services: [
        { name: "Rural Healthcare", description: "Basic healthcare for rural communities", category: ServiceCategory.CONSULTATION, price: 1000 },
        { name: "Emergency Services", description: "Basic emergency care", category: ServiceCategory.EMERGENCY, price: 0 }
      ]
    },
    {
      licenseNumber: "KUBWA-FCT-015",
      name: "Kubwa General Hospital",
      description: "Major satellite town hospital providing comprehensive healthcare to Kubwa residents with modern facilities and qualified staff.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PUBLIC,
      phone: "+234-8066889900",
      email: "info@kubwahospital.gov.ng",
      website: "https://kubwahospital.gov.ng",
      specializations: ["Internal Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynecology", "Emergency Medicine"],
      address: {
        street: "Kubwa Expressway",
        city: "Kubwa",
        state: "FCT",
        postalCode: "901101",
        latitude: 9.1833,
        longitude: 7.3500
      },
      rating: 3.9,
      establishedYear: 1998,
      services: [
        { name: "Satellite Healthcare", description: "Healthcare for suburban communities", category: ServiceCategory.CONSULTATION, price: 2500 },
        { name: "Family Planning", description: "Reproductive health services", category: ServiceCategory.CONSULTATION, price: 3000 }
      ]
    },
    {
      licenseNumber: "LIFECARE-FCT-016",
      name: "LifeCare Hospital Abuja",
      description: "Private hospital offering personalized healthcare with modern equipment, specialist consultations, and patient-centered care.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-9-8765432",
      email: "info@lifecareabuja.com",
      website: "https://lifecareabuja.com",
      specializations: ["Cardiology", "Gastroenterology", "Endocrinology", "Dermatology", "Psychiatry"],
      address: {
        street: "Plot 1021, Herbert Macaulay Way",
        city: "Central Area",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0400,
        longitude: 7.4900
      },
      rating: 4.3,
      establishedYear: 2008,
      services: [
        { name: "Executive Health", description: "Premium healthcare packages", category: ServiceCategory.CONSULTATION, price: 45000 },
        { name: "Mental Health", description: "Psychological and psychiatric care", category: ServiceCategory.CONSULTATION, price: 25000 }
      ]
    },
    {
      licenseNumber: "PREMIER-FCT-017",
      name: "Premier Specialist Hospital",
      description: "Specialist hospital focusing on advanced medical procedures, diagnostic services, and surgical treatments with experienced consultants.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8123456789",
      email: "info@premierhospitalabuja.com",
      website: "https://premierhospitalabuja.com",
      specializations: ["Neurosurgery", "Cardiac Surgery", "Plastic Surgery", "Urology", "Orthopedics", "ENT"],
      address: {
        street: "Plot 254, Cadastral Zone A0",
        city: "Central Area",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0467,
        longitude: 7.4933
      },
      rating: 4.5,
      establishedYear: 2010,
      services: [
        { name: "Specialist Surgery", description: "Advanced surgical procedures", category: ServiceCategory.SURGERY, price: 500000 },
        { name: "Diagnostic Imaging", description: "MRI, CT scan, ultrasound", category: ServiceCategory.DIAGNOSTIC, price: 25000 }
      ]
    },
    {
      licenseNumber: "ROYAL-FCT-018",
      name: "Royal Cross Hospital",
      description: "Faith-based hospital providing compassionate healthcare with modern facilities, missionary medical services, and community outreach programs.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8034567890",
      email: "info@royalcrosshospital.org",
      website: "https://royalcrosshospital.org",
      specializations: ["Family Medicine", "Internal Medicine", "Pediatrics", "Obstetrics & Gynecology", "Community Health"],
      address: {
        street: "Plot 456, Gombe Street",
        city: "Area 3",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0533,
        longitude: 7.4800
      },
      rating: 4.0,
      establishedYear: 2006,
      services: [
        { name: "Mission Healthcare", description: "Affordable faith-based care", category: ServiceCategory.CONSULTATION, price: 5000 },
        { name: "Community Outreach", description: "Free medical missions", category: ServiceCategory.CONSULTATION, price: 0 }
      ]
    },
    {
      licenseNumber: "SUNSHINE-FCT-019",
      name: "Sunshine Hospital and Maternity",
      description: "Specialized maternity and women's health hospital with comprehensive obstetric care, neonatal services, and family planning.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8045678901",
      email: "info@sunshinematernity.com",
      website: "https://sunshinematernity.com",
      specializations: ["Obstetrics & Gynecology", "Neonatology", "Family Planning", "Reproductive Medicine", "Pediatrics"],
      address: {
        street: "Plot 789, Yakubu Gowon Way",
        city: "Asokoro",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0567,
        longitude: 7.5100
      },
      rating: 4.2,
      establishedYear: 2004,
      services: [
        { name: "Natural Birth", description: "Normal delivery services", category: ServiceCategory.MATERNITY, price: 60000 },
        { name: "C-Section", description: "Cesarean section delivery", category: ServiceCategory.SURGERY, price: 120000 },
        { name: "NICU", description: "Neonatal intensive care", category: ServiceCategory.EMERGENCY, price: 35000 }
      ]
    },
    {
      licenseNumber: "MEDICAL-FCT-020",
      name: "Medical Art Center",
      description: "Multi-specialty medical center offering comprehensive healthcare, diagnostic services, and outpatient treatments in a modern facility.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8056789012",
      email: "info@medicalartcenter.com",
      website: "https://medicalartcenter.com",
      specializations: ["Internal Medicine", "Surgery", "Radiology", "Laboratory Medicine", "Physiotherapy"],
      address: {
        street: "Plot 101, Aminu Kano Crescent",
        city: "Wuse II",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0633,
        longitude: 7.4867
      },
      rating: 3.8,
      establishedYear: 2007,
      services: [
        { name: "Medical Imaging", description: "Comprehensive diagnostic imaging", category: ServiceCategory.DIAGNOSTIC, price: 20000 },
        { name: "Physiotherapy", description: "Physical rehabilitation services", category: ServiceCategory.CONSULTATION, price: 8000 }
      ]
    },
    {
      licenseNumber: "CRYSTAL-FCT-021",
      name: "Crystal Specialist Hospital",
      description: "Modern private hospital with focus on minimally invasive procedures, advanced diagnostics, and personalized patient care.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8067890123",
      email: "info@crystalhospitalabuja.com",
      website: "https://crystalhospitalabuja.com",
      specializations: ["Laparoscopic Surgery", "Endoscopy", "Interventional Cardiology", "Gastroenterology", "Pulmonology"],
      address: {
        street: "Plot 202, Cadastral Zone B6",
        city: "Maitama",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0800,
        longitude: 7.4967
      },
      rating: 4.4,
      establishedYear: 2013,
      services: [
        { name: "Minimally Invasive Surgery", description: "Laparoscopic procedures", category: ServiceCategory.SURGERY, price: 300000 },
        { name: "Endoscopy", description: "Diagnostic and therapeutic endoscopy", category: ServiceCategory.DIAGNOSTIC, price: 45000 }
      ]
    },
    {
      licenseNumber: "HARMONY-FCT-022",
      name: "Harmony Advanced Medical Centre",
      description: "State-of-the-art medical facility offering advanced treatments, clinical research, and international standard healthcare services.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8078901234",
      email: "info@harmonymedicalng.com",
      website: "https://harmonymedicalng.com",
      specializations: ["Oncology", "Hematology", "Nephrology", "Clinical Research", "Palliative Care"],
      address: {
        street: "Plot 303, Muhammadu Buhari Way",
        city: "Central Area",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0433,
        longitude: 7.4833
      },
      rating: 4.6,
      establishedYear: 2015,
      services: [
        { name: "Cancer Treatment", description: "Comprehensive oncology care", category: ServiceCategory.CONSULTATION, price: 250000 },
        { name: "Clinical Trials", description: "Medical research participation", category: ServiceCategory.CONSULTATION, price: 0 }
      ]
    },
    {
      licenseNumber: "PARKVIEW-FCT-023",
      name: "Parkview Hospital Abuja",
      description: "Premium healthcare facility with focus on executive health, medical tourism, and high-end medical services for discerning patients.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8089012345",
      email: "info@parkviewabuja.com",
      website: "https://parkviewabuja.com",
      specializations: ["Executive Health", "Medical Tourism", "Cosmetic Surgery", "Anti-aging Medicine", "VIP Healthcare"],
      address: {
        street: "Plot 404, Diplomatic Zone",
        city: "Maitama",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0867,
        longitude: 7.5033
      },
      rating: 4.7,
      establishedYear: 2017,
      services: [
        { name: "Executive Package", description: "Premium healthcare package", category: ServiceCategory.CONSULTATION, price: 100000 },
        { name: "Medical Tourism", description: "International patient services", category: ServiceCategory.CONSULTATION, price: 150000 }
      ]
    },
    {
      licenseNumber: "GREENLAND-FCT-024",
      name: "Greenland Hospital and Diagnostic Centre",
      description: "Comprehensive healthcare facility with advanced diagnostic capabilities, emergency services, and specialized medical treatments.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8090123456",
      email: "info@greenlandhospital.ng",
      website: "https://greenlandhospital.ng",
      specializations: ["Emergency Medicine", "Diagnostic Medicine", "General Surgery", "Internal Medicine", "Pediatrics"],
      address: {
        street: "Plot 505, Ahmadu Bello Way",
        city: "Area 11",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0333,
        longitude: 7.4767
      },
      rating: 3.9,
      establishedYear: 2009,
      services: [
        { name: "24/7 Emergency", description: "Round-the-clock emergency care", category: ServiceCategory.EMERGENCY, price: 0 },
        { name: "Full Body Scan", description: "Comprehensive health screening", category: ServiceCategory.DIAGNOSTIC, price: 40000 }
      ]
    },
    {
      licenseNumber: "DIVINE-FCT-025",
      name: "Divine Saviour Hospital",
      description: "Faith-based healthcare institution providing holistic care with spiritual support, modern medical facilities, and community health services.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8101234567",
      email: "info@divinesaviour.org.ng",
      website: "https://divinesaviour.org.ng",
      specializations: ["Family Medicine", "Internal Medicine", "Pediatrics", "Surgery", "Spiritual Care"],
      address: {
        street: "Plot 606, Oladipo Diya Street",
        city: "Gudu",
        state: "FCT",
        postalCode: "900001",
        latitude: 8.9833,
        longitude: 7.4167
      },
      rating: 4.1,
      establishedYear: 2005,
      services: [
        { name: "Holistic Care", description: "Medical care with spiritual support", category: ServiceCategory.CONSULTATION, price: 7000 },
        { name: "Chapel Services", description: "Spiritual counseling and prayer", category: ServiceCategory.CONSULTATION, price: 0 }
      ]
    },
    {
      licenseNumber: "EXCELLENCE-FCT-026",
      name: "Excellence Medical Centre",
      description: "Quality healthcare facility focused on delivering excellent medical services with modern technology and experienced medical professionals.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8112345678",
      email: "info@excellencemedical.ng",
      website: "https://excellencemedical.ng",
      specializations: ["Internal Medicine", "Surgery", "Obstetrics & Gynecology", "Pediatrics", "Ophthalmology"],
      address: {
        street: "Plot 707, Ralph Bunche Street",
        city: "Zone 4",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0533,
        longitude: 7.4900
      },
      rating: 3.8,
      establishedYear: 2011,
      services: [
        { name: "Quality Care", description: "Excellence in medical services", category: ServiceCategory.CONSULTATION, price: 10000 },
        { name: "Eye Care", description: "Comprehensive ophthalmology services", category: ServiceCategory.CONSULTATION, price: 15000 }
      ]
    },
    {
      licenseNumber: "VICTORY-FCT-027",
      name: "Victory Hospital and Maternity",
      description: "Specialized hospital focusing on women's health, maternity care, child health, and family medicine with compassionate care.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8123456789",
      email: "info@victoryhospital.ng",
      website: "https://victoryhospital.ng",
      specializations: ["Obstetrics & Gynecology", "Neonatology", "Pediatrics", "Family Medicine", "Women's Health"],
      address: {
        street: "Plot 808, Tafawa Balewa Way",
        city: "Garki",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0400,
        longitude: 7.4833
      },
      rating: 4.0,
      establishedYear: 2003,
      services: [
        { name: "Safe Delivery", description: "Maternal and child health services", category: ServiceCategory.MATERNITY, price: 45000 },
        { name: "Child Vaccination", description: "Pediatric immunization services", category: ServiceCategory.CONSULTATION, price: 3000 }
      ]
    },
    {
      licenseNumber: "METRO-FCT-028",
      name: "Metro Hospital Abuja",
      description: "Urban hospital providing comprehensive healthcare services to city residents with modern facilities and 24-hour emergency services.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8134567890",
      email: "info@metrohospitalabuja.com",
      website: "https://metrohospitalabuja.com",
      specializations: ["Emergency Medicine", "Internal Medicine", "Surgery", "Radiology", "Pharmacy"],
      address: {
        street: "Plot 909, Shehu Shagari Way",
        city: "Zone 3",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0467,
        longitude: 7.4700
      },
      rating: 3.7,
      establishedYear: 2008,
      services: [
        { name: "Urban Healthcare", description: "City-focused medical services", category: ServiceCategory.CONSULTATION, price: 6000 },
        { name: "Pharmacy Services", description: "On-site pharmaceutical services", category: ServiceCategory.CONSULTATION, price: 2000 }
      ]
    },
    {
      licenseNumber: "GOLDEN-FCT-029",
      name: "Golden Cross Hospital",
      description: "Multi-specialty hospital offering quality healthcare with emphasis on patient comfort, modern equipment, and experienced medical staff.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8145678901",
      email: "info@goldencross.ng",
      website: "https://goldencross.ng",
      specializations: ["Cardiology", "Endocrinology", "Rheumatology", "Dermatology", "ENT"],
      address: {
        street: "Plot 110, Constitution Avenue",
        city: "Central Area",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0400,
        longitude: 7.4867
      },
      rating: 4.2,
      establishedYear: 2012,
      services: [
        { name: "Specialist Care", description: "Multi-specialty consultations", category: ServiceCategory.CONSULTATION, price: 18000 },
        { name: "Skin Care", description: "Dermatology and cosmetic services", category: ServiceCategory.CONSULTATION, price: 12000 }
      ]
    },
    {
      licenseNumber: "HOPE-FCT-030",
      name: "Hope Medical Centre",
      description: "Community-focused medical center providing affordable healthcare, preventive medicine, and health education programs for all.",
      facilityLevel: FacilityLevel.PRIMARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8156789012",
      email: "info@hopemedical.ng",
      website: "https://hopemedical.ng",
      specializations: ["Family Medicine", "Preventive Medicine", "Community Health", "Health Education", "Basic Surgery"],
      address: {
        street: "Plot 111, Dawaki Road",
        city: "Dawaki",
        state: "FCT",
        postalCode: "901101",
        latitude: 9.1167,
        longitude: 7.3833
      },
      rating: 3.6,
      establishedYear: 2010,
      services: [
        { name: "Affordable Care", description: "Low-cost healthcare services", category: ServiceCategory.CONSULTATION, price: 3000 },
        { name: "Health Education", description: "Community health awareness programs", category: ServiceCategory.CONSULTATION, price: 0 }
      ]
    },
    {
      licenseNumber: "UNITY-FCT-031",
      name: "Unity Hospital and Diagnostic Centre",
      description: "Modern healthcare facility offering diagnostic services, outpatient care, and minor procedures with focus on quality and accessibility.",
      facilityLevel: FacilityLevel.SECONDARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8167890123",
      email: "info@unityhospital.ng",
      website: "https://unityhospital.ng",
      specializations: ["Diagnostic Medicine", "Internal Medicine", "General Surgery", "Obstetrics & Gynecology", "Laboratory Medicine"],
      address: {
        street: "Plot 112, Airport Road",
        city: "Lugbe",
        state: "FCT",
        postalCode: "901101",
        latitude: 8.9833,
        longitude: 7.3667
      },
      rating: 3.8,
      establishedYear: 2014,
      services: [
        { name: "Diagnostic Services", description: "Comprehensive diagnostic testing", category: ServiceCategory.DIAGNOSTIC, price: 12000 },
        { name: "Minor Surgery", description: "Outpatient surgical procedures", category: ServiceCategory.SURGERY, price: 75000 }
      ]
    },
    {
      licenseNumber: "RAINBOW-FCT-032",
      name: "Rainbow Children's Hospital",
      description: "Specialized pediatric hospital dedicated to children's health with child-friendly facilities, pediatric specialists, and family-centered care.",
      facilityLevel: FacilityLevel.TERTIARY,
      ownershipType: OwnershipType.PRIVATE,
      phone: "+234-8178901234",
      email: "info@rainbowchildren.ng",
      website: "https://rainbowchildren.ng",
      specializations: ["Pediatrics", "Neonatology", "Pediatric Surgery", "Child Psychology", "Pediatric Cardiology"],
      address: {
        street: "Plot 113, Cadastral Zone A7",
        city: "Wuse II",
        state: "FCT",
        postalCode: "900001",
        latitude: 9.0700,
        longitude: 7.4800
      },
      rating: 4.5,
      establishedYear: 2016,
      services: [
        { name: "Child Healthcare", description: "Comprehensive pediatric services", category: ServiceCategory.CONSULTATION, price: 15000 },
        { name: "Pediatric Surgery", description: "Surgical procedures for children", category: ServiceCategory.SURGERY, price: 250000 },
        { name: "Child Psychology", description: "Mental health services for children", category: ServiceCategory.CONSULTATION, price: 20000 }
      ]
    }
  ]

  for (const hospitalData of hospitals) {
    const hospital = await prisma.hospital.upsert({
      where: { licenseNumber: hospitalData.licenseNumber },
      update: {},
      create: {
        licenseNumber: hospitalData.licenseNumber,
        name: hospitalData.name,
        description: hospitalData.description,
        facilityLevel: hospitalData.facilityLevel,
        ownershipType: hospitalData.ownershipType,
        phone: hospitalData.phone,
        email: hospitalData.email,
        website: hospitalData.website,
        isVerified: true,
        isEmergencyAvailable: true,
        specializations: hospitalData.specializations,
        rating: hospitalData.rating,
        establishedYear: hospitalData.establishedYear,
        operatingHours: {
          monday: { isOpen: true, openTime: '06:00', closeTime: '22:00', isEmergencyOpen: true },
          tuesday: { isOpen: true, openTime: '06:00', closeTime: '22:00', isEmergencyOpen: true },
          wednesday: { isOpen: true, openTime: '06:00', closeTime: '22:00', isEmergencyOpen: true },
          thursday: { isOpen: true, openTime: '06:00', closeTime: '22:00', isEmergencyOpen: true },
          friday: { isOpen: true, openTime: '06:00', closeTime: '22:00', isEmergencyOpen: true },
          saturday: { isOpen: true, openTime: '08:00', closeTime: '20:00', isEmergencyOpen: true },
          sunday: { isOpen: true, openTime: '10:00', closeTime: '18:00', isEmergencyOpen: true }
        },
        address: {
          create: {
            street: hospitalData.address.street,
            city: hospitalData.address.city,
            state: hospitalData.address.state,
            postalCode: hospitalData.address.postalCode,
            country: 'Nigeria',
            latitude: hospitalData.address.latitude,
            longitude: hospitalData.address.longitude
          }
        },
        services: {
          create: hospitalData.services.map(service => ({
            name: service.name,
            description: service.description,
            category: service.category,
            price: service.price,
            isAvailable: true
          }))
        }
      }
    })
    
    console.log(`✅ Created hospital: ${hospital.name}`)
  }

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
