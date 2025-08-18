'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface CoachingCalendarProps {
  onBookingComplete?: (bookingId: string) => void;
}

export default function CoachingCalendar({ onBookingComplete }: CoachingCalendarProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [businessStage, setBusinessStage] = useState('');
  const [mainChallenge, setMainChallenge] = useState('');
  const [goals, setGoals] = useState('');
  const [timezone, setTimezone] = useState('');

  // Get user's timezone
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
  }, []);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/coaching-booking?date=${date}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.availableSlots);
      } else {
        toast.error('Failed to fetch available time slots');
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Error loading available times');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user || !user.id || !user.email) {
      toast.error('Please log in to book a session');
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!businessStage) {
      toast.error('Please select your business stage');
      return;
    }

    if (!mainChallenge.trim()) {
      toast.error('Please describe your main challenge');
      return;
    }

    if (!goals.trim()) {
      toast.error('Please describe your goals');
      return;
    }

    setSubmitting(true);
    try {
      // Create the preferred_date_time in the format the API expects
      const preferredDateTime = `${selectedDate}T${selectedTime}:00`;
      
      const response = await fetch('/api/coaching-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName.trim(),
          email: user.email,
          phone: userPhone.trim() || undefined,
          business_stage: businessStage,
          main_challenge: mainChallenge.trim(),
          goals: goals.trim(),
          preferred_date_time: preferredDateTime,
          additional_notes: notes.trim() || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.emailsSent?.admin && data.emailsSent?.customer) {
          toast.success('🔥 Booking request submitted! Check your email for confirmation.');
        } else {
          toast.success('🔥 Booking request submitted successfully! You will be contacted within 24 hours.');
        }
        
        // Reset form
        setSelectedDate('');
        setSelectedTime('');
        setNotes('');
        setUserName('');
        setUserPhone('');
        setBusinessStage('');
        setMainChallenge('');
        setGoals('');
        
        // Call callback if provided
        if (onBookingComplete) {
          onBookingComplete(data.bookingId);
        }
      } else {
        toast.error(data.error || 'Failed to submit booking');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Error submitting booking request');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate next 30 days for date selection (excluding weekends)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })
        });
      }
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  return (
    <div className="bg-gray-900/50 border border-gray-600 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        📅 Schedule Your Coaching Session
      </h3>
      
      {/* User Name Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your Name *
        </label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Phone Number (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          value={userPhone}
          onChange={(e) => setUserPhone(e.target.value)}
          placeholder="Enter your phone number"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Business Stage */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Business Stage *
        </label>
        <select
          value={businessStage}
          onChange={(e) => setBusinessStage(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select your business stage...</option>
          <option value="idea-stage">Idea Stage</option>
          <option value="startup">Startup</option>
          <option value="growing-business">Growing Business</option>
          <option value="established-business">Established Business</option>
          <option value="scaling-business">Scaling Business</option>
        </select>
      </div>

      {/* Main Challenge */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Main Challenge *
        </label>
        <textarea
          value={mainChallenge}
          onChange={(e) => setMainChallenge(e.target.value)}
          placeholder="Describe your main business challenge that you'd like help with..."
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Goals */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Goals *
        </label>
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="What specific outcomes are you looking to achieve from this session?"
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Date *
        </label>
        <select
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedTime(''); // Reset time when date changes
          }}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a date...</option>
          {availableDates.map((date) => (
            <option key={date.value} value={date.value}>
              {date.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Time * ({timezone})
          </label>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-400">Loading available times...</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.length > 0 ? (
                availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTime === time
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {time}
                  </button>
                ))
              ) : (
                <div className="col-span-3 text-center py-4 text-gray-400">
                  No available time slots for this date
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific topics you'd like to discuss or questions you have..."
          rows={3}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Session Info */}
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
        <h4 className="text-blue-200 font-medium mb-2">Session Details:</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Duration: 60 minutes</li>
          <li>• Type: AI Business Strategy Session</li>
          <li>• Platform: Google Meet (link will be provided)</li>
          <li>• Recording: Session will be recorded for your reference</li>
        </ul>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleBooking}
        disabled={!selectedDate || !selectedTime || !userName.trim() || !businessStage || !mainChallenge.trim() || !goals.trim() || submitting}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Submitting Request...
          </>
        ) : (
          <>
            📅 Request Booking
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Your booking request will be reviewed and confirmed within 24 hours.
      </p>
    </div>
  );
}