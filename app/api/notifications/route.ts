import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET: Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: {
      userId: string;
      isRead?: boolean;
    } = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    // Get notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          doctorReminder: {
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
              appointment: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + notifications.length < totalCount
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH: Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all user's notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({ 
        message: 'All notifications marked as read',
        success: true 
      });
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds array is required' },
        { status: 400 }
      );
    }

    // Mark specific notifications as read
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id // Ensure user can only update their own notifications
      },
      data: {
        isRead: true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Notifications marked as read',
      success: true 
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}