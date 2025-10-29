import { prisma } from '@/lib/db/prisma';

export interface AccountConflictResult {
  hasConflict: boolean;
  conflictType?: 'DOCTOR_EMAIL_CONFLICT' | 'PATIENT_EMAIL_CONFLICT' | 'DOCTOR_PROFILE_EXISTS' | 'PATIENT_PROFILE_EXISTS';
  message?: string;
}

/**
 * Check if there's a conflict when trying to register/switch roles
 * @param email - Email address to check
 * @param targetRole - The role the user wants to have
 * @param userId - Optional user ID for existing users (for role switching)
 */
export async function checkAccountConflict(
  email: string, 
  targetRole: 'DOCTOR' | 'PATIENT',
  userId?: string
): Promise<AccountConflictResult> {
  
  if (targetRole === 'PATIENT') {
    // Check if this email belongs to an existing doctor
    const existingDoctor = await prisma.doctor.findFirst({
      where: {
        user: {
          email: email
        }
      },
      include: {
        user: true
      }
    });

    if (existingDoctor) {
      return {
        hasConflict: true,
        conflictType: 'DOCTOR_EMAIL_CONFLICT',
        message: 'This email is registered as a doctor account. Doctors cannot create patient accounts with the same email. Please use a different email for your patient account or contact support.'
      };
    }

    // If userId provided, check if this user already has a doctor profile
    if (userId) {
      const userDoctorProfile = await prisma.doctor.findUnique({
        where: { userId }
      });

      if (userDoctorProfile) {
        return {
          hasConflict: true,
          conflictType: 'DOCTOR_PROFILE_EXISTS',
          message: 'Cannot switch to patient role. This account has an existing doctor profile. Please use a different account for patient registration.'
        };
      }
    }
  }

  if (targetRole === 'DOCTOR') {
    // Check if this email belongs to an existing patient
    const existingPatient = await prisma.patient.findFirst({
      where: {
        user: {
          email: email
        }
      },
      include: {
        user: true
      }
    });

    if (existingPatient) {
      return {
        hasConflict: true,
        conflictType: 'PATIENT_EMAIL_CONFLICT',
        message: 'This email is already registered as a patient account. Please use a different email for your doctor account or contact support.'
      };
    }

    // If userId provided, check if this user already has a patient profile
    if (userId) {
      const userPatientProfile = await prisma.patient.findUnique({
        where: { userId }
      });

      if (userPatientProfile) {
        return {
          hasConflict: true,
          conflictType: 'PATIENT_PROFILE_EXISTS',
          message: 'Cannot switch to doctor role. This account has an existing patient profile. Please use a different account for doctor registration.'
        };
      }
    }
  }

  return {
    hasConflict: false
  };
}

/**
 * Check if a user can access a specific role-based feature
 * @param userId - User ID to check
 * @param requiredRole - Required role for the feature
 */
export async function validateUserRole(userId: string, requiredRole: 'DOCTOR' | 'PATIENT' | 'ADMIN'): Promise<{
  isValid: boolean;
  userRole?: string;
  hasProfile?: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      doctor: true,
      patient: true
    }
  });

  if (!user) {
    return { isValid: false };
  }

  const hasRequiredProfile = requiredRole === 'DOCTOR' 
    ? !!user.doctor 
    : requiredRole === 'PATIENT' 
    ? !!user.patient 
    : true; // Admin doesn't require specific profile

  return {
    isValid: user.role === requiredRole && hasRequiredProfile,
    userRole: user.role,
    hasProfile: hasRequiredProfile
  };
}

/**
 * Get user account summary with all roles and profiles
 * @param userId - User ID to check
 */
export async function getUserAccountSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      doctor: {
        include: {
          user: {
            include: {
              profile: true
            }
          }
        }
      },
      patient: {
        include: {
          user: {
            include: {
              profile: true
            }
          }
        }
      },
      profile: true
    }
  });

  return {
    user,
    hasMultipleRoles: !!(user?.doctor && user?.patient),
    accountType: user?.doctor ? 'doctor' : user?.patient ? 'patient' : 'none'
  };
}