'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Appointment {
  id: string;
  scheduledAt: string;
  patientId: string;
  patient: {
    id: string;
    user: {
      profile: {
        firstName: string;
        lastName: string;
      };
      email: string;
    };
  };
  notes?: string;
  consultationType: string;
}

interface Reminder {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId: string;
  type: string;
  message: string;
  sentAt: string;
  status: string;
  patient: {
    user: {
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
  appointment: {
    scheduledDate: string;
    type: string;
  };
  notification?: {
    isRead: boolean;
  };
}

export default function DoctorRemindersPage() {
  useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingAppointments();
    fetchReminders();
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await fetch('/api/doctor/appointments/upcoming');
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/reminders');
      const data = await response.json();
      setReminders(data.reminders || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setLoading(false);
    }
  };

  const sendManualReminder = async (appointmentId: string, customMessage?: string) => {
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointmentId,
          type: 'APPOINTMENT',
          message: customMessage // Optional custom message
        })
      });

      if (response.ok) {
        alert('Reminder sent successfully!');
        fetchReminders();
      } else {
        const errorData = await response.json();
        if (errorData.code === 'DAILY_LIMIT_EXCEEDED') {
          alert('Daily reminder limit reached! You can only send 3 reminders per patient per day.');
        } else {
          alert(errorData.error || 'Failed to send reminder');
        }
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Error sending reminder');
    }
  };

  const isAppointmentToday = (scheduledAt: string) => {
    const today = new Date().toDateString();
    const appointmentDate = new Date(scheduledAt).toDateString();
    return today === appointmentDate;
  };

  const isAppointmentTomorrow = (scheduledAt: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = new Date(scheduledAt).toDateString();
    return tomorrow.toDateString() === appointmentDate;
  };

  const getTodayAppointments = () => {
    return appointments.filter(apt => isAppointmentToday(apt.scheduledAt));
  };

  const getTomorrowAppointments = () => {
    return appointments.filter(apt => isAppointmentTomorrow(apt.scheduledAt));
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return appointments.filter(apt => {
      const appointmentDate = new Date(apt.scheduledAt);
      return appointmentDate > today;
    }).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Reminders</h1>
          <p className="text-gray-600">
            Manage and track reminders for your upcoming appointments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Appointments</p>
                <p className="text-3xl font-bold text-blue-600">{getTodayAppointments().length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tomorrow&apos;s Appointments</p>
                <p className="text-3xl font-bold text-green-600">{getTomorrowAppointments().length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3v18h18V4zm-2 16H5V8h14v12z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Upcoming</p>
                <p className="text-3xl font-bold text-purple-600">{appointments.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </span>
              Today&apos;s Appointments
            </h2>
            
            {getTodayAppointments().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTodayAppointments().map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.patient.user.profile.firstName} {appointment.patient.user.profile.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{appointment.patient.user.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                        {appointment.consultationType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.scheduledAt).toLocaleTimeString()}
                      </p>
                      <button
                        onClick={() => sendManualReminder(appointment.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        Send Reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tomorrow's Appointments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3v18h18V4zm-2 16H5V8h14v12z"/>
                </svg>
              </span>
              Tomorrow&apos;s Appointments
            </h2>
            
            {getTomorrowAppointments().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3v18h18V4zm-2 16H5V8h14v12z"/>
                  </svg>
                </div>
                <p className="text-gray-500">No appointments scheduled for tomorrow</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTomorrowAppointments().map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {appointment.patient.user.profile.firstName} {appointment.patient.user.profile.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{appointment.patient.user.email}</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                        {appointment.consultationType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.scheduledAt).toLocaleTimeString()}
                      </p>
                      <button
                        onClick={() => sendManualReminder(appointment.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        Send Reminder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="p-2 bg-purple-100 rounded-lg mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            </span>
            Upcoming Appointments
          </h2>
          
          {getUpcomingAppointments().length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
              </div>
              <p className="text-gray-500">No upcoming appointments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Patient</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getUpcomingAppointments().map((appointment) => (
                    <tr key={appointment.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient.user.profile.firstName} {appointment.patient.user.profile.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{appointment.patient.user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(appointment.scheduledAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(appointment.scheduledAt).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                          {appointment.consultationType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => sendManualReminder(appointment.id)}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                        >
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reminder History */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Reminder History</h2>
          
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No reminders sent yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date Sent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Patient & Appointment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {reminders.slice(0, 10).map((reminder) => (
                    <tr key={reminder.id} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(reminder.sentAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {reminder.type}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-sm rounded-full font-medium ${
                          reminder.status === 'SENT' || reminder.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800' 
                            : reminder.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reminder.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {reminder.patient.user.profile.firstName} {reminder.patient.user.profile.lastName}
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(reminder.appointment.scheduledDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={reminder.message}>
                          {reminder.message}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}