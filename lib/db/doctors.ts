import { prisma } from './prisma'
import { Prisma, AppointmentStatus, AppointmentType } from '@prisma/client'

export interface DoctorSearchParams {
  query?: string
  specialization?: string
  country?: string
  consultationType?: 'VIRTUAL' | 'IN_PERSON'
  minExperience?: number
  maxFee?: number
  minRating?: number
  sortBy?: 'relevance' | 'experience' | 'price' | 'rating'
  limit?: number
  offset?: number
}

export async function searchDoctors(params: DoctorSearchParams) {
  const {
    query,
    specialization,
    country,
    consultationType,
    minExperience = 0,
    maxFee,
    minRating = 0,
    sortBy = 'relevance',
    limit = 20,
    offset = 0
  } = params

  try {
    const where: Prisma.DoctorWhereInput = {
      isAvailable: true,
      user: {
        isActive: true,
        isVerified: true
      }
    }

    // Text search
    if (query) {
      where.OR = [
        {
          user: {
            profile: {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } }
              ]
            }
          }
        },
        { specialization: { contains: query, mode: 'insensitive' } },
        { subSpecializations: { hasSome: [query] } },
        { bio: { contains: query, mode: 'insensitive' } }
      ]
    }

    // Filters
    if (specialization) {
      where.specialization = { equals: specialization, mode: 'insensitive' }
    }

    if (country) {
      where.country = { equals: country, mode: 'insensitive' }
    }

    if (minExperience > 0) {
      where.experience = { gte: minExperience }
    }

    if (maxFee) {
      where.consultationFee = { lte: maxFee }
    }

    if (minRating > 0) {
      where.rating = { gte: minRating }
    }

    // For Nigerian doctors, check consultation type
    if (consultationType && country === 'Nigeria') {
      // This would need to be implemented based on your consultation type logic
    }

    // Fixed sorting
    let orderBy: Prisma.DoctorOrderByWithRelationInput[] = [{ rating: 'desc' }]
    switch (sortBy) {
      case 'experience':
        orderBy = [{ experience: 'desc' }]
        break
      case 'price':
        orderBy = [{ consultationFee: 'asc' }]
        break
      case 'rating':
        orderBy = [{ rating: 'desc' }]
        break
      case 'relevance':
      default:
        orderBy = [
          { rating: 'desc' },
          { totalConsultations: 'desc' },
          { experience: 'desc' }
        ]
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true
            }
          },
          availability: {
            where: { isActive: true }
          },
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              patient: {
                include: {
                  user: {
                    include: {
                      profile: {
                        select: {
                          firstName: true,
                          lastName: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              reviews: true,
              appointments: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      }),
      prisma.doctor.count({ where })
    ])

    return {
      doctors,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error searching doctors:', error)
    throw new Error('Failed to search doctors')
  }
}

export async function getDoctorById(id: string) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            patient: {
              include: {
                user: {
                  include: {
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        appointments: {
          where: {
            scheduledDate: { gte: new Date() }, // Fixed: scheduledAt -> scheduledDate
            status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'] }
          },
          take: 5,
          orderBy: { scheduledDate: 'asc' } // Fixed: scheduledAt -> scheduledDate
        },
        _count: {
          select: {
            reviews: true,
            appointments: true
          }
        }
      }
    })

    return doctor
  } catch (error) {
    console.error('Error fetching doctor:', error)
    throw new Error('Failed to fetch doctor details')
  }
}

export async function getDoctorAvailableSlots(
  doctorId: string,
  date: Date
) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        availability: {
          where: {
            isActive: true,
            dayOfWeek: date.getDay() === 0 ? 7 : date.getDay() // Sunday = 7
          }
        }
      }
    })

    if (!doctor || !doctor.availability.length) {
      return []
    }

    // Get existing appointments for that date with enhanced conflict detection
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledDate: { // Fixed: scheduledAt -> scheduledDate
          gte: startOfDay,
          lte: endOfDay
        },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] } // Include all active statuses
      },
      select: { scheduledDate: true } // Fixed: scheduledAt -> scheduledDate
    })

    // Generate available slots
    const availability = doctor.availability[0]
    const slots = []
    const [startHour] = availability.startTime.split(':').map(Number) // Removed unused startMin
    const [endHour, endMin] = availability.endTime.split(':').map(Number)

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 60) { // 1-hour slots
        if (hour === endHour - 1 && min >= endMin) break

        // Create the slot time as if it's Nigerian time (what user sees)
        // For example: if user sees 6:00 PM slot, this represents 6:00 PM Nigerian time
        const displayHour = hour
        const displayMinute = min
        
  // Build the exact UTC instant for this Nigerian wall-clock time without
  // depending on the server's local timezone. Nigeria is UTC+1 and has no DST.
  // If the visible slot is 16:00 WAT, the UTC instant is 15:00Z.
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const utcDateTime = new Date(Date.UTC(year, month, day, hour - 1, min, 0, 0))

  // Skip if slot is in the past by comparing in UTC directly
  const nowUTC = new Date()
  if (utcDateTime <= nowUTC) continue

        // Enhanced conflict detection - check for overlapping appointments and exact matches
        const slotEndUTC = new Date(utcDateTime.getTime() + (60 * 60 * 1000)); // 1 hour duration
        
        const hasConflict = existingAppointments.some(apt => {
          const appointmentStart = new Date(apt.scheduledDate);
          const appointmentEnd = new Date(appointmentStart.getTime() + (60 * 60 * 1000));
          
          // Check for overlapping times or exact matches
          return (utcDateTime.getTime() === appointmentStart.getTime()) ||  // Exact match
                 (utcDateTime < appointmentEnd && slotEndUTC > appointmentStart); // Overlap
        });

        if (!hasConflict) {
          // Format display time with AM/PM for better readability (show Nigerian time)
          const displayHour12 = displayHour === 0 ? 12 : displayHour > 12 ? displayHour - 12 : displayHour;
          const ampm = displayHour >= 12 ? 'PM' : 'AM';
          const displayTime = `${displayHour12.toString()}:${displayMinute.toString().padStart(2, '0')} ${ampm}`;
          
          slots.push({
            time: utcDateTime.toISOString(), // Store as UTC for consistency with database
            displayTime // This shows the Nigerian time to users
          })
        }
      }
    }

    return slots
  } catch (error) {
    console.error('Error fetching available slots:', error)
    throw new Error('Failed to fetch available slots')
  }
}

export async function createAppointment(data: {
  patientId: string
  doctorId: string
  scheduledDate: Date // Fixed: scheduledAt -> scheduledDate
  type: AppointmentType
  notes?: string
  fee: number // Added the required fee property
}) {
  try {
    // Enhanced appointment conflict detection with better overlap checking
    const appointmentStart = new Date(data.scheduledDate);
    const appointmentEnd = new Date(appointmentStart.getTime() + (60 * 60 * 1000)); // 1 hour duration

    // Check for any existing appointments that would conflict with this new appointment
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: data.doctorId,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS]
        },
        // Check for overlapping time slots
        OR: [
          {
            // New appointment starts during existing appointment
            AND: [
              { scheduledDate: { lte: appointmentStart } },
              {
                // Calculate end time of existing appointment (assuming 1 hour)
                scheduledDate: { gt: new Date(appointmentStart.getTime() - (60 * 60 * 1000)) }
              }
            ]
          },
          {
            // New appointment ends during existing appointment
            AND: [
              { scheduledDate: { gte: appointmentStart } },
              { scheduledDate: { lt: appointmentEnd } }
            ]
          },
          {
            // Exact time match
            scheduledDate: appointmentStart
          }
        ]
      }
    });

    if (conflictingAppointments.length > 0) {
      throw new Error('This time slot is already booked or overlaps with an existing appointment. Please choose a different time.');
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...data,
        status: AppointmentStatus.SCHEDULED,
        meetingId: generateMeetingId() // Fixed: meetingLink -> meetingId
      },
      include: {
        doctor: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        patient: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      }
    })

    // Send email confirmation
    try {
      const EmailService = (await import('../email/service')).default
      const emailService = new EmailService()
      await emailService.sendAppointmentConfirmation({
        patient: appointment.patient,
        doctor: appointment.doctor,
        appointment: {
          ...appointment,
          symptoms: appointment.symptoms || undefined,
          notes: appointment.notes || undefined,
          meetingUrl: appointment.meetingUrl || undefined
        }
      })
      console.log('✅ Appointment confirmation email sent')
    } catch (emailError) {
      console.error('❌ Failed to send appointment confirmation email:', emailError)
      // Don't fail the appointment creation if email fails
    }

    return appointment
  } catch (error) {
    console.error('Error creating appointment:', error)
    throw new Error('Failed to create appointment')
  }
}

export async function getDoctorStats() {
  try {
    const [
      totalDoctors,
      availableDoctors,
      countries,
      specializations,
      topRatedDoctors
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { isAvailable: true } }),
      prisma.doctor.groupBy({
        by: ['country'],
        _count: { country: true }
      }),
      prisma.doctor.groupBy({
        by: ['specialization'],
        _count: { specialization: true },
        orderBy: { _count: { specialization: 'desc' } }
      }),
      prisma.doctor.findMany({
        where: { isAvailable: true },
        include: {
          user: { include: { profile: true } }
        },
        orderBy: { rating: 'desc' },
        take: 5
      })
    ])

    return {
      total: totalDoctors,
      available: availableDoctors,
      countries: countries.map(c => ({ name: c.country, count: c._count.country })),
      specializations: specializations.map(s => ({
        name: s.specialization,
        count: s._count.specialization
      })),
      topRated: topRatedDoctors
    }
  } catch (error) {
    console.error('Error fetching doctor stats:', error)
    throw new Error('Failed to fetch doctor statistics')
  }
}

function generateMeetingId(): string { // Fixed: generateMeetingLink -> generateMeetingId
  // Generate meeting ID - in production, you'd use Google Meet API
  const meetingId = Math.random().toString(36).substring(2, 15)
  return meetingId
}

// Doctor Dashboard Functions
export async function getDoctorDashboardData(doctorId: string) {
  try {
    const [
      upcomingAppointments,
      recentAppointments,
      monthlyStats,
      reviews,
      earnings
    ] = await Promise.all([
      // Upcoming appointments
      prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledDate: { gte: new Date() }, // Fixed: scheduledAt -> scheduledDate
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'] }
        },
        include: {
          patient: {
            include: {
              user: { include: { profile: true } }
            }
          }
        },
        orderBy: { scheduledDate: 'asc' }, // Fixed: scheduledAt -> scheduledDate
        take: 10
      }),

      // Recent appointments
      prisma.appointment.findMany({
        where: {
          doctorId,
          status: 'COMPLETED'
        },
        include: {
          patient: {
            include: {
              user: { include: { profile: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }, // Fixed: completedAt -> updatedAt (or createdAt)
        take: 5
      }),

      // Monthly stats
      getMonthlyAppointmentStats(doctorId),

      // Recent reviews
      prisma.doctorReview.findMany({
        where: { doctorId },
        include: {
          patient: {
            include: {
              user: { include: { profile: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Monthly earnings
      getMonthlyEarnings(doctorId)
    ])

    return {
      upcomingAppointments: upcomingAppointments.map(appointment => ({
        ...appointment,
        scheduledDate: appointment.scheduledDate.toISOString()
      })),
      recentAppointments: recentAppointments.map(appointment => ({
        ...appointment,
        scheduledDate: appointment.scheduledDate.toISOString()
      })),
      monthlyStats,
      reviews,
      earnings
    }
  } catch (error) {
    console.error('Error fetching doctor dashboard data:', error)
    throw new Error('Failed to fetch dashboard data')
  }
}

async function getMonthlyAppointmentStats(doctorId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats = await prisma.appointment.groupBy({
    by: ['status'],
    where: {
      doctorId,
      createdAt: { gte: startOfMonth }
    },
    _count: { status: true }
  })

  return {
    scheduled: stats.find(s => s.status === 'SCHEDULED')?._count.status || 0,
    completed: stats.find(s => s.status === 'COMPLETED')?._count.status || 0,
    cancelled: stats.find(s => s.status === 'CANCELLED')?._count.status || 0,
    total: stats.reduce((sum, s) => sum + s._count.status, 0)
  }
}

async function getMonthlyEarnings(doctorId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { consultationFee: true }
  })

  const completedAppointments = await prisma.appointment.count({
    where: {
      doctorId,
      status: 'COMPLETED',
      updatedAt: { gte: startOfMonth } // Fixed: completedAt -> updatedAt
    }
  })

  return {
    thisMonth: completedAppointments * (doctor?.consultationFee || 0),
    appointments: completedAppointments
  }
}
