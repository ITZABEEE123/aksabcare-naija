// Import the session hook to know who is currently logged in
import { useSession } from 'next-auth/react';
// Import React hooks for managing state, side effects, and DOM references
import { useState, useEffect, useRef } from 'react';
// Import Socket.IO for real-time messaging
import io, { Socket } from 'socket.io-client';

// This interface defines what a chat message looks like
// Think of it like a blueprint that every message must follow
interface Message {
  id: string;                                    // Unique identifier for this message (like a barcode)
  senderId: string;                             // Who sent this message (user ID)
  senderRole: 'DOCTOR' | 'PATIENT';            // Is the sender a doctor or patient?
  content: string;                              // The actual text of the message
  message?: string;                             // Alternative field name for content
  createdAt: string;                            // When was this message sent (as a date string)
  type: 'TEXT' | 'FILE';                       // Is this a text message or a file attachment?
  sender?: {
    profile: {
      firstName: string;
      lastName: string;
    }
  }
}

// This interface defines what props (inputs) this Chat component needs
interface ChatProps {
  appointmentId: string;                        // Which appointment this chat belongs to
  isActive: boolean;                           // Is this chat currently active/visible?
}

// This is the main Chat component that handles all messaging functionality
export default function Chat({ appointmentId, isActive }: ChatProps) {
  // Get information about who is currently logged in
  const { data: session } = useSession();
  
  // State variables to manage the chat:
  const [messages, setMessages] = useState<Message[]>([]);        // All messages in this chat
  const [newMessage, setNewMessage] = useState('');               // Text the user is currently typing
  const [loading, setLoading] = useState(false);                 // Are we loading messages from database?
  const [sending, setSending] = useState(false);                 // Are we currently sending a message?
  const [socket, setSocket] = useState<Socket | null>(null);     // Socket.IO connection
  
  // This reference points to the bottom of the messages list
  // We use it to automatically scroll to show the newest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && appointmentId && session?.user) {
      // Initialize Socket.IO connection
      const socketInstance = io(process.env.NEXT_PUBLIC_BASE_URL!, {
        path: '/api/socketio'
      });

      setSocket(socketInstance);

      // Join appointment room
      socketInstance.emit('join-appointment', appointmentId);

      // Listen for chat history
      socketInstance.on('chat-history', (chatHistory: Message[]) => {
        console.log('Received chat history:', chatHistory);
        setMessages(chatHistory);
        setLoading(false);
      });

      // Listen for new messages
      socketInstance.on('new-message', (message: Message) => {
        console.log('Received new message:', message);
        setMessages(prev => [...prev, message]);
      });

      // Clean up on unmount
      return () => {
        socketInstance.disconnect();
        setSocket(null);
      };
    }
  }, [appointmentId, isActive, session?.user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || sending || !socket || !session?.user) return;
    
    setSending(true);
    try {
      // Send message via Socket.IO
      socket.emit('send-message', {
        appointmentId,
        senderId: session.user.id,
        senderRole: session.user.role as 'DOCTOR' | 'PATIENT',
        message: newMessage,
        type: 'TEXT'
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isActive) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Chat is only available during your appointment period.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white p-3">
        <h3 className="font-semibold">Consultation Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === session?.user?.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
          placeholder="Type your message..."
          disabled={sending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-black placeholder:text-gray-500"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}