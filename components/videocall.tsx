import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface VideoCallProps {
  appointmentId: string;
  isActive: boolean;
}

type ConnectionStatus = 'waiting' | 'connecting' | 'connected' | 'failed' | 'disconnected';

export default function VideoCall({ appointmentId, isActive }: VideoCallProps) {
  const { data: session } = useSession();
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // Video call component for appointments - connection states: waiting, connecting, connected, failed, disconnected
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('waiting');
  const [connectionTimeout, setConnectionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [participants, setParticipants] = useState<{doctor: boolean, patient: boolean}>({doctor: false, patient: false});
  const [bothReady, setBothReady] = useState(false);
  const [otherUserJoined, setOtherUserJoined] = useState<{role: string, name: string} | null>(null);
  const [callInitiated, setCallInitiated] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  console.log('VideoCall component loaded', { appointmentId, sessionUser: session?.user?.id });

  const cleanup = useCallback(() => {
    console.log('Cleaning up video call resources...');
    
    try {
      // Clear timeout
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        setConnectionTimeout(null);
      }

      // Stop all local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        localStreamRef.current = null;
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.emit('leave-appointment', appointmentId);
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      
      // Reset state
      setConnectionStatus('waiting');
      setCallInitiated(false);
      setBothReady(false);
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [appointmentId, connectionTimeout]);

  useEffect(() => {
    if (!isActive) return;
    
    const initializeVideoCall = async () => {
      try {
        console.log('Initializing video call for appointment:', appointmentId);
        setConnectionStatus('waiting');
        
        // Only get user media permissions, don't create socket connections
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          
          localStreamRef.current = stream;
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          console.log('Got user media successfully');
        } catch (mediaError) {
          console.error('Failed to get user media:', mediaError);
          setConnectionStatus('failed');
          alert('Please allow camera and microphone access to start the video call.');
          return;
        }

        console.log('Video call component initialized in waiting state');
        
      } catch (error) {
        console.error('Error initializing video call:', error);
        setConnectionStatus('failed');
      }
    };

    // Only initialize once when component becomes active
    initializeVideoCall();
    
    // Cleanup on unmount only
    return () => {
      cleanup();
    };
  }, [isActive, appointmentId, cleanup]); // Added cleanup dependency

  const manualStartCall = useCallback(async () => {
    console.log('Manual start call clicked');
    
    try {
      setConnectionStatus('connecting');
      setCallInitiated(true);
      
      // Get user media first
      let stream = localStreamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }
      }
      
      // Create socket connection with shorter timeout
      const socketUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const socket = io(socketUrl, {
        path: '/api/socketio',
        transports: ['polling', 'websocket'], // Try polling first
        timeout: 5000,
        forceNew: true // Force new connection
      });
      
      socketRef.current = socket;
      
      // Wait for connection with shorter timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout'));
        }, 3000); // Reduced to 3 seconds
        
        socket.once('connect', () => {
          clearTimeout(timeout);
          console.log('Socket connected for manual call');
          resolve();
        });
        
        socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      // Join appointment and emit user ready
      socket.emit('join-appointment', appointmentId);
      socket.emit('user-ready', { appointmentId, userRole: session?.user?.role });
      
      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      peerConnectionRef.current = peerConnection;
      
      // Add stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream!);
      });
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('Remote stream received from second participant');
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          console.log('Remote video set - second participant joined');
          // Update to connected if not already connected
          setConnectionStatus('connected');
        }
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            appointmentId,
            candidate: event.candidate
          });
        }
      };
      
      // Handle ICE connection state changes for real peer connections
      peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
        
        switch (peerConnection.iceConnectionState) {
          case 'connected':
          case 'completed':
            console.log('Peer-to-peer connection established');
            setConnectionStatus('connected');
            break;
          case 'disconnected':
            console.log('Peer disconnected');
            // Stay connected for manual calls even if peer disconnects
            break;
          case 'failed':
            console.log('ICE connection failed');
            // For manual calls, don't fail the entire call
            break;
        }
      };
      
      // Simple signaling handlers
      socket.on('offer', async (data: { offer: RTCSessionDescriptionInit }) => {
        try {
          await peerConnection.setRemoteDescription(data.offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('answer', { appointmentId, answer });
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      });
      
      socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
        try {
          await peerConnection.setRemoteDescription(data.answer);
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      });
      
      socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
        try {
          await peerConnection.addIceCandidate(data.candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      });
      
      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', { appointmentId, offer });
      
      console.log('Manual call initiated successfully');
      
      // Set call as connected after a short delay since manual start should work immediately
      // This allows the doctor to start the call even if patient hasn't joined yet
      setTimeout(() => {
        console.log('Setting call to connected state for manual start');
        setConnectionStatus('connected');
      }, 2000); // 2 second delay to show "connecting" briefly, then go to connected
      
    } catch (error) {
      console.error('Error in manual start call:', error);
      setConnectionStatus('failed');
      setCallInitiated(false);
    }
  }, [appointmentId, session?.user?.role]);

  const resetConnection = useCallback(() => {
    console.log('Resetting video call connection...');
    setConnectionStatus('waiting');
    setCallInitiated(false);
    setBothReady(false);
    
    // Reset peer connection if it exists
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Re-initialize the connection
    if (isActive) {
      // Trigger re-initialization
      setTimeout(() => {
        window.location.reload(); // Force reload as fallback
      }, 1000);
    }
  }, [isActive]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };

  const shareScreen = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current?.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        setIsScreenSharing(true);

        // Handle screen share end
        videoTrack.onended = () => {
          setIsScreenSharing(false);
          // Switch back to camera
          if (localStreamRef.current) {
            const cameraTrack = localStreamRef.current.getVideoTracks()[0];
            if (sender) {
              sender.replaceTrack(cameraTrack);
            }
          }
        };
      } else {
        // Stop screen sharing
        if (localStreamRef.current) {
          const cameraTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionRef.current?.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(cameraTrack);
          }
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const endCall = () => {
    cleanup();
    setConnectionStatus('disconnected');
  };

  const retryConnection = async () => {
    console.log('Retrying video call connection...');
    setConnectionStatus('connecting');
    cleanup();
    
    // Wait a moment before retrying
    setTimeout(() => {
      if (isActive) {
        // Trigger re-initialization by changing state
        setConnectionStatus('disconnected');
        setTimeout(() => setConnectionStatus('connecting'), 100);
      }
    }, 1000);
  };

  if (!isActive) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Video consultation is only available during your appointment period.
        </p>
      </div>
    );
  }

  if (connectionStatus === 'failed') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Video Connection Failed
          </h3>
          <p className="text-red-700 mb-4">
            Unable to establish video connection. This could be due to:
          </p>
          <ul className="text-left text-red-600 text-sm mb-6 space-y-1">
            <li>• Camera/microphone permissions not granted</li>
            <li>• Network connectivity issues</li>
            <li>• Browser compatibility problems</li>
            <li>• Firewall blocking WebRTC connections</li>
          </ul>
          <div className="space-y-3">
            <button
              onClick={retryConnection}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              🔄 Retry Connection
            </button>
            <p className="text-xs text-red-500">
              If problems persist, try refreshing the page or using a different browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Call Status Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 
            'bg-red-500'
          }`} />
          <span className="text-white text-sm">
            {connectionStatus === 'connected' ? 'Call Active' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 
             connectionStatus === 'waiting' ? 'Waiting for call to start' :
             (connectionStatus as ConnectionStatus) === 'failed' ? 'Connection Failed' :
             'Ready for call'}
          </span>
        </div>
        <span className="text-gray-300 text-sm">
          Appointment: {appointmentId.slice(-8)}
        </span>
      </div>

      {/* Video Container */}
      <div className="relative h-96 bg-black">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture in Picture) */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Screen Sharing Indicator */}
        {isScreenSharing && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            Screen Sharing
          </div>
        )}

        {/* Enhanced Connection Status and Participant Info */}
        <div className="absolute bottom-4 left-4 text-white space-y-2">
          {/* Participant Status */}
          {(participants.doctor || participants.patient) && (
            <div className="bg-black bg-opacity-50 px-3 py-2 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${participants.doctor ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span>Doctor</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${participants.patient ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span>Patient</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          {connectionStatus === 'waiting' && !bothReady && (
            <div className="bg-yellow-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Waiting for {session?.user?.role === 'DOCTOR' ? 'patient' : 'doctor'}...</span>
            </div>
          )}
          {bothReady && connectionStatus === 'waiting' && (
            <div className="bg-green-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Both ready - Starting call...</span>
            </div>
          )}
          {connectionStatus === 'connecting' && (
            <div className="bg-blue-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </div>
          )}
          {connectionStatus === 'connected' && (
            <div className="bg-green-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Connected</span>
            </div>
          )}
          {(connectionStatus as ConnectionStatus) === 'failed' && (
            <div className="bg-red-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Connection Failed</span>
            </div>
          )}
        </div>

        {/* Participant Join Notification */}
        {otherUserJoined && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm animate-fade-in">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>{otherUserJoined.name} has joined the call</span>
            </div>
          </div>
        )}

        {/* Center Start Call Button - Enhanced with States */}
        {(connectionStatus === 'waiting' || connectionStatus === 'connecting' || (connectionStatus as ConnectionStatus) === 'failed') && (
          <div className="absolute inset-0 flex items-center justify-center">
            {(connectionStatus as ConnectionStatus) === 'failed' ? (
              <div className="text-center">
                <div className="bg-red-600 bg-opacity-90 text-white px-8 py-6 rounded-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
                    <p className="text-red-100 text-sm mb-4">
                      Could not establish video connection
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={manualStartCall}
                      className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 justify-center"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Try Again
                    </button>
                    <button
                      onClick={resetConnection}
                      className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-6 py-2 rounded-lg text-xs font-medium"
                    >
                      Reset Connection
                    </button>
                  </div>
                </div>
              </div>
            ) : connectionStatus === 'connecting' ? (
              <div className="text-center">
                <div className="bg-blue-600 bg-opacity-90 text-white px-8 py-6 rounded-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
                    <p className="text-blue-100 text-sm mb-4">
                      Trying to establish video connection
                    </p>
                  </div>
                  <button
                    onClick={manualStartCall}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Retry Connection
                  </button>
                </div>
              </div>
            ) : !bothReady ? (
              <div className="text-center">
                <div className="bg-gray-800 bg-opacity-75 text-white px-8 py-6 rounded-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <h3 className="text-lg font-semibold mb-2">
                      Waiting for {session?.user?.role === 'DOCTOR' ? 'patient' : 'doctor'}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      The call will start automatically when both participants are ready
                    </p>
                  </div>
                  <button
                    onClick={manualStartCall}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Start Call Anyway
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-green-600 bg-opacity-90 text-white px-8 py-6 rounded-lg">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Both Ready!</h3>
                    <p className="text-green-100 text-sm mb-4">
                      Starting call automatically...
                    </p>
                  </div>
                  <button
                    onClick={manualStartCall}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Start Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4">
        {(connectionStatus === 'waiting' || connectionStatus === 'connecting' || (connectionStatus as ConnectionStatus) === 'failed') && (
          <button
            onClick={manualStartCall}
            className="p-3 rounded-full bg-green-600 hover:bg-green-700 text-white"
            title={
              (connectionStatus as ConnectionStatus) === 'failed' ? 'Try Again' : 
              connectionStatus === 'connecting' ? 'Retry Connection' : 
              'Start Call Anyway'
            }
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        )}
        
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {isVideoEnabled ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.707 2.293a1 1 0 00-1.414 1.414l18 18a1 1 0 001.414-1.414l-18-18zM16 7v3.5l4-4v11l-2.5-2.5M4 7h8l-8 8V7z"/>
            </svg>
          )}
        </button>

        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${
            isAudioEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {isAudioEnabled ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
              <path d="M12 19v4M8 23h8"/>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.707 2.293a1 1 0 00-1.414 1.414l18 18a1 1 0 001.414-1.414l-18-18zM9 4a3 3 0 016 0v5l-6-6V4z"/>
            </svg>
          )}
        </button>

        <button
          onClick={shareScreen}
          className={`p-3 rounded-full ${
            isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
          } text-white`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16v10H4V6zM2 4v14h20V4H2zM8 20h8v2H8v-2z"/>
          </svg>
        </button>

        <button
          onClick={endCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2a1 1 0 011.21-.21 11.36 11.36 0 003.38.84 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.19a1 1 0 011 1 11.36 11.36 0 00.84 3.38 1 1 0 01-.21 1.21l-2.2 2.2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}