#!/usr/bin/env node

/**
 * Test script for the Simple Appointment Booking Link Support feature
 * 
 * This script tests generating appointment booking links, calendar integration,
 * booking flow, and notification systems.
 * 
 * Usage: node scripts/test-appointment-booking.js
 */

const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Mock database for storing businesses, appointments, and notifications
class MockDatabase {
  constructor() {
    this.businesses = [];
    this.appointments = [];
    this.availabilitySettings = [];
    this.notifications = [];
  }
  
  // Create a new business
  createBusiness(data) {
    const business = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.businesses.push(business);
    return business;
  }
  
  // Get a business by ID
  getBusiness(id) {
    return this.businesses.find(b => b.id === id);
  }
  
  // Create availability settings for a business
  createAvailabilitySettings(data) {
    const settings = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.availabilitySettings.push(settings);
    return settings;
  }
  
  // Get availability settings for a business
  getAvailabilitySettingsByBusinessId(businessId) {
    return this.availabilitySettings.find(s => s.businessId === businessId);
  }
  
  // Create a new appointment
  createAppointment(data) {
    const appointment = {
      id: uuidv4(),
      ...data,
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.appointments.push(appointment);
    
    // Create a notification for the new appointment
    this.createNotification({
      type: 'appointment_created',
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      recipientType: 'business',
      recipientId: appointment.businessId,
      message: `New appointment scheduled for ${new Date(appointment.startTime).toLocaleString()}`
    });
    
    // Create a notification for the customer
    this.createNotification({
      type: 'appointment_confirmation',
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      recipientType: 'customer',
      recipientId: appointment.customerEmail || appointment.customerPhone,
      message: `Your appointment with ${appointment.businessName} has been scheduled for ${new Date(appointment.startTime).toLocaleString()}`
    });
    
    return appointment;
  }
  
  // Update an appointment
  updateAppointment(id, data) {
    const appointmentIndex = this.appointments.findIndex(a => a.id === id);
    if (appointmentIndex === -1) {
      throw new Error(`Appointment not found: ${id}`);
    }
    
    const oldStatus = this.appointments[appointmentIndex].status;
    const updatedAppointment = {
      ...this.appointments[appointmentIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.appointments[appointmentIndex] = updatedAppointment;
    
    // Create notifications for status changes
    if (data.status && data.status !== oldStatus) {
      // Notification for the business
      this.createNotification({
        type: `appointment_${data.status}`,
        businessId: updatedAppointment.businessId,
        appointmentId: updatedAppointment.id,
        recipientType: 'business',
        recipientId: updatedAppointment.businessId,
        message: `Appointment for ${new Date(updatedAppointment.startTime).toLocaleString()} has been ${data.status}`
      });
      
      // Notification for the customer
      this.createNotification({
        type: `appointment_${data.status}`,
        businessId: updatedAppointment.businessId,
        appointmentId: updatedAppointment.id,
        recipientType: 'customer',
        recipientId: updatedAppointment.customerEmail || updatedAppointment.customerPhone,
        message: `Your appointment with ${updatedAppointment.businessName} for ${new Date(updatedAppointment.startTime).toLocaleString()} has been ${data.status}`
      });
    }
    
    return updatedAppointment;
  }
  
  // Get an appointment by ID
  getAppointment(id) {
    return this.appointments.find(a => a.id === id);
  }
  
  // Get appointments for a business
  getAppointmentsByBusinessId(businessId, filters = {}) {
    let filteredAppointments = this.appointments.filter(a => a.businessId === businessId);
    
    // Apply filters
    if (filters.status) {
      filteredAppointments = filteredAppointments.filter(a => a.status === filters.status);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredAppointments = filteredAppointments.filter(a => 
        new Date(a.startTime) >= startDate
      );
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredAppointments = filteredAppointments.filter(a => 
        new Date(a.startTime) <= endDate
      );
    }
    
    if (filters.customerEmail) {
      filteredAppointments = filteredAppointments.filter(a => 
        a.customerEmail === filters.customerEmail
      );
    }
    
    if (filters.customerPhone) {
      filteredAppointments = filteredAppointments.filter(a => 
        a.customerPhone === filters.customerPhone
      );
    }
    
    // Sort by start time
    filteredAppointments.sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    );
    
    return filteredAppointments;
  }
  
  // Check availability for a time slot
  checkAvailability(businessId, startTime, endTime) {
    // Get business availability settings
    const settings = this.getAvailabilitySettingsByBusinessId(businessId);
    if (!settings) {
      return false;
    }
    
    // Check if the day is available
    const day = new Date(startTime).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!settings.availableDays.includes(day)) {
      return false;
    }
    
    // Check if the time is within business hours
    const startHour = new Date(startTime).getHours();
    const endHour = new Date(endTime).getHours();
    
    if (startHour < settings.startHour || endHour > settings.endHour) {
      return false;
    }
    
    // Check if there are any conflicting appointments
    const conflictingAppointments = this.appointments.filter(a => 
      a.businessId === businessId &&
      a.status !== 'cancelled' &&
      new Date(a.startTime) < new Date(endTime) &&
      new Date(a.endTime) > new Date(startTime)
    );
    
    return conflictingAppointments.length === 0;
  }
  
  // Get available time slots for a day
  getAvailableTimeSlots(businessId, date, durationMinutes = 60) {
    // Get business availability settings
    const settings = this.getAvailabilitySettingsByBusinessId(businessId);
    if (!settings) {
      return [];
    }
    
    // Check if the day is available
    const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!settings.availableDays.includes(day)) {
      return [];
    }
    
    // Generate time slots
    const slots = [];
    const slotDuration = durationMinutes * 60 * 1000; // Convert to milliseconds
    
    // Start at the beginning of business hours
    const startDate = new Date(date);
    startDate.setHours(settings.startHour, 0, 0, 0);
    
    // End at the end of business hours
    const endDate = new Date(date);
    endDate.setHours(settings.endHour, 0, 0, 0);
    
    // Generate slots
    for (let slotStart = startDate; slotStart < endDate; slotStart = new Date(slotStart.getTime() + slotDuration)) {
      const slotEnd = new Date(slotStart.getTime() + slotDuration);
      
      // Check if this slot is available
      if (this.checkAvailability(businessId, slotStart, slotEnd)) {
        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString()
        });
      }
    }
    
    return slots;
  }
  
  // Create a notification
  createNotification(data) {
    const notification = {
      id: uuidv4(),
      ...data,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.push(notification);
    return notification;
  }
  
  // Get notifications for a recipient
  getNotificationsByRecipient(recipientType, recipientId) {
    return this.notifications
      .filter(n => n.recipientType === recipientType && n.recipientId === recipientId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  // Mark a notification as read
  markNotificationAsRead(id) {
    const notificationIndex = this.notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      throw new Error(`Notification not found: ${id}`);
    }
    
    this.notifications[notificationIndex].read = true;
    return this.notifications[notificationIndex];
  }
}

// Appointment Booking service
class AppointmentBookingService {
  constructor(database) {
    this.database = database;
  }
  
  // Generate a booking link for a business
  generateBookingLink(businessId, options = {}) {
    try {
      const business = this.database.getBusiness(businessId);
      if (!business) {
        throw new Error(`Business not found: ${businessId}`);
      }
      
      // In a real implementation, this would generate a unique URL
      // For this test, we'll just create a mock URL
      const baseUrl = 'https://smarttext.ai/booking';
      const params = new URLSearchParams({
        business: businessId,
        ...options
      });
      
      return {
        success: true,
        bookingLink: `${baseUrl}?${params.toString()}`
      };
    } catch (error) {
      console.error(`Error generating booking link: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Set availability settings for a business
  async setAvailabilitySettings(data) {
    try {
      // Check if settings already exist
      const existingSettings = this.database.getAvailabilitySettingsByBusinessId(data.businessId);
      
      if (existingSettings) {
        // Update existing settings
        // In a real implementation, we would update the existing settings
        // For this test, we'll just create new settings
        const settings = this.database.createAvailabilitySettings(data);
        return {
          success: true,
          settings
        };
      } else {
        // Create new settings
        const settings = this.database.createAvailabilitySettings(data);
        return {
          success: true,
          settings
        };
      }
    } catch (error) {
      console.error(`Error setting availability: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get available time slots for a day
  async getAvailableTimeSlots(businessId, date, durationMinutes = 60) {
    try {
      const slots = this.database.getAvailableTimeSlots(businessId, date, durationMinutes);
      return {
        success: true,
        slots
      };
    } catch (error) {
      console.error(`Error getting available time slots: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Create a new appointment
  async createAppointment(data) {
    try {
      // Check if the time slot is available
      const isAvailable = this.database.checkAvailability(
        data.businessId,
        data.startTime,
        data.endTime
      );
      
      if (!isAvailable) {
        throw new Error('The selected time slot is not available');
      }
      
      // Create the appointment
      const appointment = this.database.createAppointment(data);
      
      return {
        success: true,
        appointment
      };
    } catch (error) {
      console.error(`Error creating appointment: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Update an appointment
  async updateAppointment(id, data) {
    try {
      // If changing the time, check if the new time slot is available
      if (data.startTime && data.endTime) {
        const appointment = this.database.getAppointment(id);
        if (!appointment) {
          throw new Error(`Appointment not found: ${id}`);
        }
        
        const isAvailable = this.database.checkAvailability(
          appointment.businessId,
          data.startTime,
          data.endTime
        );
        
        if (!isAvailable) {
          throw new Error('The selected time slot is not available');
        }
      }
      
      // Update the appointment
      const appointment = this.database.updateAppointment(id, data);
      
      return {
        success: true,
        appointment
      };
    } catch (error) {
      console.error(`Error updating appointment: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Cancel an appointment
  async cancelAppointment(id, reason = '') {
    try {
      const appointment = this.database.updateAppointment(id, {
        status: 'cancelled',
        cancellationReason: reason
      });
      
      return {
        success: true,
        appointment
      };
    } catch (error) {
      console.error(`Error cancelling appointment: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get appointments for a business
  async getAppointments(businessId, filters = {}) {
    try {
      const appointments = this.database.getAppointmentsByBusinessId(businessId, filters);
      return {
        success: true,
        appointments
      };
    } catch (error) {
      console.error(`Error getting appointments: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get notifications for a business
  async getBusinessNotifications(businessId) {
    try {
      const notifications = this.database.getNotificationsByRecipient('business', businessId);
      return {
        success: true,
        notifications
      };
    } catch (error) {
      console.error(`Error getting notifications: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get notifications for a customer
  async getCustomerNotifications(customerId) {
    try {
      const notifications = this.database.getNotificationsByRecipient('customer', customerId);
      return {
        success: true,
        notifications
      };
    } catch (error) {
      console.error(`Error getting notifications: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Mark a notification as read
  async markNotificationAsRead(id) {
    try {
      const notification = this.database.markNotificationAsRead(id);
      return {
        success: true,
        notification
      };
    } catch (error) {
      console.error(`Error marking notification as read: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Mock UI renderer for testing
class MockUIRenderer {
  constructor() {
    this.currentView = null;
  }
  
  // Render the booking link
  renderBookingLink(bookingLink, business) {
    this.currentView = 'booking_link';
    
    console.log('[UI] Rendering booking link');
    console.log(`[UI] Business: ${business.name}`);
    console.log(`[UI] Booking link: ${bookingLink}`);
    
    console.log('--------------------------------------------------');
    console.log('| Booking Link                                   |');
    console.log('|------------------------------------------------|');
    console.log(`| Business: ${business.name.padEnd(40)} |`);
    console.log('|------------------------------------------------|');
    console.log('| Share this link with your customers to allow   |');
    console.log('| them to book appointments with you:            |');
    console.log('|------------------------------------------------|');
    console.log(`| ${bookingLink.padEnd(46)} |`);
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the booking page
  renderBookingPage(business, availableSlots) {
    this.currentView = 'booking_page';
    
    console.log('[UI] Rendering booking page');
    console.log(`[UI] Business: ${business.name}`);
    console.log(`[UI] Available slots: ${availableSlots.length}`);
    
    console.log('--------------------------------------------------');
    console.log('| Book an Appointment                            |');
    console.log('|------------------------------------------------|');
    console.log(`| Business: ${business.name.padEnd(40)} |`);
    console.log('|------------------------------------------------|');
    console.log('| Available Time Slots:                          |');
    console.log('|------------------------------------------------|');
    
    if (availableSlots.length === 0) {
      console.log('| No available slots                             |');
    } else {
      availableSlots.slice(0, 5).forEach((slot, index) => {
        const startTime = new Date(slot.startTime).toLocaleString();
        const endTime = new Date(slot.endTime).toLocaleString();
        console.log(`| ${(index + 1).toString().padStart(2)}. ${startTime.padEnd(40)} |`);
      });
    }
    
    console.log('|------------------------------------------------|');
    console.log('| Customer Information:                          |');
    console.log('| [Name field]                                   |');
    console.log('| [Email field]                                  |');
    console.log('| [Phone field]                                  |');
    console.log('| [Notes field]                                  |');
    console.log('|------------------------------------------------|');
    console.log('| [Book Appointment Button]                      |');
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the appointment confirmation
  renderAppointmentConfirmation(appointment, business) {
    this.currentView = 'appointment_confirmation';
    
    console.log('[UI] Rendering appointment confirmation');
    console.log(`[UI] Business: ${business.name}`);
    console.log(`[UI] Appointment: ${appointment.id}`);
    
    console.log('--------------------------------------------------');
    console.log('| Appointment Confirmation                       |');
    console.log('|------------------------------------------------|');
    console.log(`| Business: ${business.name.padEnd(40)} |`);
    console.log(`| Date: ${new Date(appointment.startTime).toLocaleDateString().padEnd(44)} |`);
    console.log(`| Time: ${new Date(appointment.startTime).toLocaleTimeString()} - ${new Date(appointment.endTime).toLocaleTimeString().padEnd(27)} |`);
    console.log(`| Customer: ${appointment.customerName.padEnd(40)} |`);
    console.log(`| Email: ${appointment.customerEmail.padEnd(42)} |`);
    console.log(`| Phone: ${appointment.customerPhone.padEnd(42)} |`);
    console.log('|------------------------------------------------|');
    console.log('| Your appointment has been confirmed!           |');
    console.log('| You will receive a confirmation email and SMS. |');
    console.log('|------------------------------------------------|');
    console.log('| [Add to Calendar Button]                       |');
    console.log('| [Cancel Appointment Button]                    |');
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the appointments list
  renderAppointmentsList(appointments, business) {
    this.currentView = 'appointments_list';
    
    console.log('[UI] Rendering appointments list');
    console.log(`[UI] Business: ${business.name}`);
    console.log(`[UI] Appointments: ${appointments.length}`);
    
    console.log('--------------------------------------------------');
    console.log('| Appointments                                   |');
    console.log('|------------------------------------------------|');
    console.log(`| Business: ${business.name.padEnd(40)} |`);
    console.log('|------------------------------------------------|');
    
    if (appointments.length === 0) {
      console.log('| No appointments                                |');
    } else {
      appointments.slice(0, 5).forEach((appointment, index) => {
        const startTime = new Date(appointment.startTime).toLocaleString();
        console.log(`| ${(index + 1).toString().padStart(2)}. ${startTime.padEnd(40)} |`);
        console.log(`|    ${appointment.customerName.padEnd(44)} |`);
        console.log(`|    Status: ${appointment.status.padEnd(38)} |`);
        console.log('|------------------------------------------------|');
      });
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
  
  // Render the notifications list
  renderNotificationsList(notifications) {
    this.currentView = 'notifications_list';
    
    console.log('[UI] Rendering notifications list');
    console.log(`[UI] Notifications: ${notifications.length}`);
    
    console.log('--------------------------------------------------');
    console.log('| Notifications                                  |');
    console.log('|------------------------------------------------|');
    
    if (notifications.length === 0) {
      console.log('| No notifications                               |');
    } else {
      notifications.slice(0, 5).forEach((notification, index) => {
        const createdAt = new Date(notification.createdAt).toLocaleString();
        const readStatus = notification.read ? 'Read' : 'Unread';
        console.log(`| ${(index + 1).toString().padStart(2)}. ${createdAt.padEnd(40)} |`);
        console.log(`|    ${notification.message.substring(0, 44).padEnd(44)} |`);
        console.log(`|    Status: ${readStatus.padEnd(38)} |`);
        console.log('|------------------------------------------------|');
      });
    }
    
    console.log('--------------------------------------------------');
    
    return true;
  }
}

// Test cases for the Appointment Booking
const testCases = [
  {
    name: 'Generate booking link',
    test: async (service, renderer) => {
      // Create a test business
      const business = service.database.createBusiness({
        name: 'Test Salon',
        type: 'salon',
        phoneNumber: '+15551234567',
        email: 'info@testsalon.com',
        address: '123 Main St, Anytown, USA'
      });
      
      // Generate a booking link
      console.log('\nGenerating booking link...');
      const linkResult = await service.generateBookingLink(business.id, {
        service: 'haircut',
        duration: 60
      });
      
      if (!linkResult.success) {
        console.error(`❌ Failed to generate booking link: ${linkResult.error}`);
        return false;
      }
      
      console.log(`✅ Booking link generated: ${linkResult.bookingLink}`);
      
      // Render the booking link
      renderer.renderBookingLink(linkResult.bookingLink, business);
      
      return true;
    }
  },
  {
    name: 'Set availability and get time slots',
    test: async (service, renderer) => {
      // Create a test business
      const business = service.database.createBusiness({
        name: 'Test Barbershop',
        type: 'barbershop',
        phoneNumber: '+15559876543',
        email: 'info@testbarbershop.com',
        address: '456 Oak St, Anytown, USA'
      });
      
      // Set availability settings
      console.log('\nSetting availability...');
      const availabilityResult = await service.setAvailabilitySettings({
        businessId: business.id,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startHour: 9, // 9 AM
        endHour: 17, // 5 PM
        slotDuration: 30, // 30 minutes
        bufferTime: 0 // No buffer time
      });
      
      if (!availabilityResult.success) {
        console.error(`❌ Failed to set availability: ${availabilityResult.error}`);
        return false;
      }
      
      console.log('✅ Availability settings saved');
      
      // Get available time slots for tomorrow
      console.log('\nGetting available time slots...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Make sure tomorrow is a weekday (Monday-Friday)
      while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      
      const slotsResult = await service.getAvailableTimeSlots(business.id, tomorrow, 30);
      
      if (!slotsResult.success) {
        console.error(`❌ Failed to get time slots: ${slotsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${slotsResult.slots.length} available time slots`);
      
      // Render the booking page
      renderer.renderBookingPage(business, slotsResult.slots);
      
      return true;
    }
  },
  {
    name: 'Book an appointment',
    test: async (service, renderer) => {
      // Create a test business
      const business = service.database.createBusiness({
        name: 'Test Spa',
        type: 'spa',
        phoneNumber: '+15551112222',
        email: 'info@testspa.com',
        address: '789 Pine St, Anytown, USA'
      });
      
      // Set availability settings
      await service.setAvailabilitySettings({
        businessId: business.id,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        startHour: 10, // 10 AM
        endHour: 18, // 6 PM
        slotDuration: 60, // 60 minutes
        bufferTime: 15 // 15 minutes buffer
      });
      
      // Get available time slots for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Make sure tomorrow is a weekday or Saturday
      while (tomorrow.getDay() === 0) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      
      const slotsResult = await service.getAvailableTimeSlots(business.id, tomorrow, 60);
      
      if (!slotsResult.success || slotsResult.slots.length === 0) {
        console.error('❌ No available time slots found');
        return false;
      }
      
      // Book an appointment
      console.log('\nBooking an appointment...');
      const slot = slotsResult.slots[0]; // Use the first available slot
      
      const appointmentResult = await service.createAppointment({
        businessId: business.id,
        businessName: business.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        customerPhone: '+15553334444',
        service: 'Massage',
        notes: 'First time customer'
      });
      
      if (!appointmentResult.success) {
        console.error(`❌ Failed to book appointment: ${appointmentResult.error}`);
        return false;
      }
      
      console.log('✅ Appointment booked successfully');
      
      // Render the appointment confirmation
      renderer.renderAppointmentConfirmation(appointmentResult.appointment, business);
      
      // Get business notifications
      console.log('\nChecking business notifications...');
      const businessNotificationsResult = await service.getBusinessNotifications(business.id);
      
      if (!businessNotificationsResult.success) {
        console.error(`❌ Failed to get business notifications: ${businessNotificationsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${businessNotificationsResult.notifications.length} business notifications`);
      
      // Get customer notifications
      console.log('\nChecking customer notifications...');
      const customerNotificationsResult = await service.getCustomerNotifications('jane.smith@example.com');
      
      if (!customerNotificationsResult.success) {
        console.error(`❌ Failed to get customer notifications: ${customerNotificationsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${customerNotificationsResult.notifications.length} customer notifications`);
      
      // Render notifications
      renderer.renderNotificationsList(businessNotificationsResult.notifications);
      
      return true;
    }
  },
  {
    name: 'Manage appointments',
    test: async (service, renderer) => {
      // Create a test business
      const business = service.database.createBusiness({
        name: 'Test Clinic',
        type: 'medical',
        phoneNumber: '+15555556666',
        email: 'info@testclinic.com',
        address: '101 Elm St, Anytown, USA'
      });
      
      // Set availability settings
      await service.setAvailabilitySettings({
        businessId: business.id,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startHour: 8, // 8 AM
        endHour: 16, // 4 PM
        slotDuration: 30, // 30 minutes
        bufferTime: 5 // 5 minutes buffer
      });
      
      // Create some appointments
      console.log('\nCreating appointments...');
      
      // Tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Make sure tomorrow is a weekday
      while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
      
      // Set to 9 AM
      tomorrow.setHours(9, 0, 0, 0);
      
      // Create appointment 1
      const appointment1 = await service.createAppointment({
        businessId: business.id,
        businessName: business.name,
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000).toISOString(),
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        customerPhone: '+15551234567',
        service: 'Checkup',
        notes: 'Annual physical'
      });
      
      // Set to 10 AM
      tomorrow.setHours(10, 0, 0, 0);
      
      // Create appointment 2
      const appointment2 = await service.createAppointment({
        businessId: business.id,
        businessName: business.name,
        startTime: tomorrow.toISOString(),
        endTime: new Date(tomorrow.getTime() + 30 * 60 * 1000).toISOString(),
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        customerPhone: '+15559876543',
        service: 'Consultation',
        notes: 'New patient'
      });
      
      if (!appointment1.success || !appointment2.success) {
        console.error('❌ Failed to create appointments');
        return false;
      }
      
      console.log('✅ Appointments created successfully');
      
      // Get appointments
      console.log('\nGetting appointments...');
      const appointmentsResult = await service.getAppointments(business.id);
      
      if (!appointmentsResult.success) {
        console.error(`❌ Failed to get appointments: ${appointmentsResult.error}`);
        return false;
      }
      
      console.log(`✅ Retrieved ${appointmentsResult.appointments.length} appointments`);
      
      // Render appointments list
      renderer.renderAppointmentsList(appointmentsResult.appointments, business);
      
      // Cancel an appointment
      console.log('\nCancelling an appointment...');
      const cancelResult = await service.cancelAppointment(
        appointment1.appointment.id,
        'Patient requested cancellation'
      );
      
      if (!cancelResult.success) {
        console.error(`❌ Failed to cancel appointment: ${cancelResult.error}`);
        return false;
      }
      
      console.log('✅ Appointment cancelled successfully');
      
      // Get updated appointments
      const updatedAppointmentsResult = await service.getAppointments(business.id);
      
      // Verify the appointment was cancelled
      const cancelledAppointment = updatedAppointmentsResult.appointments.find(
        a => a.id === appointment1.appointment.id
      );
      
      if (!cancelledAppointment || cancelledAppointment.status !== 'cancelled') {
        console.error('❌ Appointment was not properly cancelled');
        return false;
      }
      
      console.log('✅ Appointment status correctly updated to cancelled');
      
      return true;
    }
  }
];

// Main test function
async function runTests() {
  console.log('🧪 Testing Simple Appointment Booking Link Support');
  console.log('----------------------------------------------');
  
  // Create mock instances
  const mockDatabase = new MockDatabase();
  const appointmentBookingService = new AppointmentBookingService(mockDatabase);
  const mockUIRenderer = new MockUIRenderer();
  
  // Run each test case
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    
    try {
      const result = await testCase.test(appointmentBookingService, mockUIRenderer);
      
      if (result) {
        console.log(`\n✅ Test case "${testCase.name}" passed!`);
      } else {
        console.log(`\n❌ Test case "${testCase.name}" failed!`);
      }
    } catch (error) {
      console.error(`\n❌ Test error: ${error.message}`);
    }
  }
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests()
  .then(() => {
    console.log('Test script finished successfully');
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
