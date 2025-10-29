import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { prisma } from '@/lib/db/prisma'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface RTCIceCandidate {
  candidate?: string
  sdpMLineIndex?: number | null
  sdpMid?: string | null
}

interface RTCSessionDescription {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback'
  sdp: string
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: { server: NetServer & { io?: ServerIO } } }) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const httpServer = res.socket.server
    const io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
    })
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)
      
      socket.on('join-appointment', async (appointmentId: string) => {
        try {
          socket.join(`appointment-${appointmentId}`)
          console.log(`Socket ${socket.id} joined appointment ${appointmentId}`)
          
          // Find the consultation chat for this appointment
          const consultation = await prisma.consultationChat.findFirst({
            where: { appointmentId },
            include: {
              messages: {
                orderBy: { createdAt: 'asc' }
              }
            }
          })
          
          if (consultation) {
            // Transform messages to match frontend interface
            const transformedMessages = await Promise.all(
              consultation.messages.map(async (msg) => {
                // Fetch sender information separately
                const senderUser = await prisma.user.findUnique({
                  where: { id: msg.senderId },
                  include: { profile: true }
                })

                return {
                  id: msg.id,
                  message: msg.content, // Use message field to match new messages
                  senderId: msg.senderId,
                  senderRole: msg.senderRole,
                  createdAt: msg.createdAt.toISOString(),
                  isRead: msg.isRead,
                  type: msg.type,
                  sender: {
                    profile: {
                      firstName: senderUser?.profile?.firstName || 'Unknown',
                      lastName: senderUser?.profile?.lastName || 'User'
                    }
                  }
                }
              })
            )
            console.log('📤 Sending chat history:', transformedMessages.length, 'messages')
            console.log('📤 First message sample:', transformedMessages[0])
            socket.emit('chat-history', transformedMessages)
          } else {
            // Get appointment to extract patientId and doctorId
            const appointment = await prisma.appointment.findUnique({
              where: { id: appointmentId }
            })
            
            if (appointment) {
              // Create consultation chat if it doesn't exist
              await prisma.consultationChat.create({
                data: {
                  appointmentId,
                  patientId: appointment.patientId,
                  doctorId: appointment.doctorId
                }
              })
            }
            socket.emit('chat-history', [])
          }
        } catch (error) {
          console.error('Error joining appointment:', error)
          socket.emit('error', 'Failed to join chat')
        }
      })

      // Handle video call readiness
      socket.on('user-ready', (data: { appointmentId: string, userRole: string }) => {
        console.log(`User ready for video call: ${data.userRole} in appointment ${data.appointmentId}`)
        // Notify other users in the appointment that this user is ready
        socket.to(`appointment-${data.appointmentId}`).emit('peer-ready', {
          userRole: data.userRole,
          socketId: socket.id
        })
      })

      // Handle room check for existing peers
      socket.on('check-room', (appointmentId: string) => {
        const room = io.sockets.adapter.rooms.get(`appointment-${appointmentId}`)
        const clientCount = room ? room.size : 0
        console.log(`Room ${appointmentId} has ${clientCount} clients`)
        
        if (clientCount > 1) {
          // There are other clients in the room, notify this socket
          socket.emit('room-has-peers', { appointmentId, peerCount: clientCount - 1 })
        }
      })

      socket.on('send-message', async (data: {
        appointmentId: string
        senderId: string
        senderRole: 'DOCTOR' | 'PATIENT'
        message: string
        type: 'TEXT' | 'PRESCRIPTION' | 'FILE'
      }) => {
        try {
          // Find or create consultation chat
          let consultation = await prisma.consultationChat.findFirst({
            where: { appointmentId: data.appointmentId }
          })

          if (!consultation) {
            // Get appointment to extract patientId and doctorId
            const appointment = await prisma.appointment.findUnique({
              where: { id: data.appointmentId }
            })
            
            if (appointment) {
              consultation = await prisma.consultationChat.create({
                data: {
                  appointmentId: data.appointmentId,
                  patientId: appointment.patientId,
                  doctorId: appointment.doctorId
                }
              })
            } else {
              socket.emit('error', 'Appointment not found')
              return
            }
          }

          const chatMessage = await prisma.chatMessage.create({
            data: {
              consultationId: consultation.id,
              senderId: data.senderId,
              senderRole: data.senderRole,
              content: data.message,
              type: data.type || 'TEXT'
            }
          })

          // Get sender profile information separately
          const senderUser = await prisma.user.findUnique({
            where: { id: data.senderId },
            include: { profile: true }
          })

          // Transform the message to match frontend interface
          const transformedMessage = {
            id: chatMessage.id,
            message: chatMessage.content, // Use message field to match chat history
            senderId: chatMessage.senderId,
            senderRole: chatMessage.senderRole,
            createdAt: chatMessage.createdAt.toISOString(),
            isRead: chatMessage.isRead,
            type: chatMessage.type,
            sender: {
              profile: {
                firstName: senderUser?.profile?.firstName || 'Unknown',
                lastName: senderUser?.profile?.lastName || 'User'
              }
            }
          }

          // Broadcast to all users in this appointment
          console.log('📤 Broadcasting new message:', transformedMessage)
          io.to(`appointment-${data.appointmentId}`).emit('new-message', transformedMessage)
        } catch (error) {
          console.error('Error sending message:', error)
          socket.emit('error', 'Failed to send message')
        }
      })

      socket.on('start-video-call', (appointmentId: string) => {
        socket.to(`appointment-${appointmentId}`).emit('incoming-call', {
          from: socket.id,
          appointmentId
        })
      })

      socket.on('accept-call', (data: { to: string, appointmentId: string }) => {
        socket.to(data.to).emit('call-accepted', {
          from: socket.id,
          appointmentId: data.appointmentId
        })
      })

      socket.on('ice-candidate', (data: { appointmentId?: string, to?: string, candidate: RTCIceCandidate }) => {
        if (data.appointmentId) {
          // Broadcast to appointment room
          socket.to(`appointment-${data.appointmentId}`).emit('ice-candidate', {
            from: socket.id,
            candidate: data.candidate
          })
        } else if (data.to) {
          // Send to specific socket
          socket.to(data.to).emit('ice-candidate', {
            from: socket.id,
            candidate: data.candidate
          })
        }
      })

      socket.on('offer', (data: { appointmentId?: string, to?: string, offer: RTCSessionDescription }) => {
        if (data.appointmentId) {
          // Broadcast to appointment room
          socket.to(`appointment-${data.appointmentId}`).emit('offer', {
            from: socket.id,
            offer: data.offer
          })
        } else if (data.to) {
          // Send to specific socket
          socket.to(data.to).emit('offer', {
            from: socket.id,
            offer: data.offer
          })
        }
      })

      socket.on('answer', (data: { appointmentId?: string, to?: string, answer: RTCSessionDescription }) => {
        if (data.appointmentId) {
          // Broadcast to appointment room
          socket.to(`appointment-${data.appointmentId}`).emit('answer', {
            from: socket.id,
            answer: data.answer
          })
        } else if (data.to) {
          // Send to specific socket
          socket.to(data.to).emit('answer', {
            from: socket.id,
            answer: data.answer
          })
        }
      })

      socket.on('end-call', (appointmentId: string) => {
        socket.to(`appointment-${appointmentId}`).emit('call-ended')
      })

      // Typing indicators
      socket.on('typing-start', (data: { appointmentId: string, userRole: string, userName: string }) => {
        socket.to(`appointment-${data.appointmentId}`).emit('user-typing', {
          userRole: data.userRole,
          userName: data.userName,
          isTyping: true
        })
      })

      socket.on('typing-stop', (data: { appointmentId: string, userRole: string }) => {
        socket.to(`appointment-${data.appointmentId}`).emit('user-typing', {
          userRole: data.userRole,
          isTyping: false
        })
      })

      // Mark messages as read
      socket.on('mark-messages-read', async (data: { appointmentId: string, userId: string }) => {
        try {
          const consultation = await prisma.consultationChat.findFirst({
            where: { appointmentId: data.appointmentId }
          })

          if (consultation) {
            await prisma.chatMessage.updateMany({
              where: {
                consultationId: consultation.id,
                senderId: { not: data.userId },
                isRead: false
              },
              data: { isRead: true }
            })

            socket.to(`appointment-${data.appointmentId}`).emit('messages-read', {
              userId: data.userId
            })
          }
        } catch (error) {
          console.error('Error marking messages as read:', error)
        }
      })

      // Handle explicit room leaving
      socket.on('leave-appointment', (appointmentId: string) => {
        console.log(`Socket ${socket.id} leaving appointment ${appointmentId}`)
        socket.leave(`appointment-${appointmentId}`)
        
        // Check remaining clients in room
        const room = io.sockets.adapter.rooms.get(`appointment-${appointmentId}`)
        const clientCount = room ? room.size : 0
        console.log(`Room ${appointmentId} now has ${clientCount} clients after leave`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }
  res.end()
}

export default SocketHandler