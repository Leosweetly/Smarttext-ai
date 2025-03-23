
    import { getBusinessByPhoneNumber } from './lib/data/business.js';
    import { getTwilioNumberStatus } from './lib/twilio/phone-manager.js';
    import twilio from 'twilio';
    
    export async function getBusinessInfo(phoneNumber) {
      return await getBusinessByPhoneNumber(phoneNumber);
    }
    
    export async function getTwilioStatus(phoneNumber) {
      return await getTwilioNumberStatus(phoneNumber);
    }
    
    export function generateTestTwiML(from, to) {
      const VoiceResponse = twilio.twiml.VoiceResponse;
      const response = new VoiceResponse();
      
      response.say(
        { voice: 'alice' },
        'This is a test of the call forwarding functionality.'
      );
      
      const dial = response.dial({
        timeout: 10,
        callerId: from
      });
      dial.number(to);
      
      return response.toString();
    }
  