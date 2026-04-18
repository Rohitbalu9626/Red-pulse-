import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config
from sockets.events import socketio
import json
import logging

def send_sos_alert(request_data, matched_donors):
    """
    Trigger Multi-Channel SOS Alert to matched donors.
    """
    hospital_name = request_data.get('hospital_name', 'Emergency Center')
    blood_type = request_data.get('blood_type')
    units = request_data.get('units_needed')
    
    # 1. Broadcast via WebSocket to active app users
    # We could restrict this to just matched donor IDs if we tracked socket IDs,
    # For now, broadcast an SOS namespace/event
    sos_payload = {
        "hospital_name": hospital_name,
        "blood_type": blood_type,
        "units": units,
        "distance": "Varies by donor",
        "urgency": "CRITICAL / SOS",
        "donors_alerted": len(matched_donors)
    }
    socketio.emit('sos_alert', sos_payload)
    logging.info(f"WebSocket SOS Alert Emitted: {sos_payload}")
    
    # 2. Emulate sending Email to all matched donors
    emails = [d['entity'].email for d in matched_donors if d['entity'].email]
    
    if emails and Config.SMTP_SERVER and Config.SMTP_USERNAME:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"🆘 URGENT: {blood_type} Blood Needed at {hospital_name}"
            msg["From"] = Config.SMTP_USERNAME
            
            # Use BCC or iterate to send individually for privacy
            msg["Bcc"] = ", ".join(emails)
            
            html = f"""
            <html>
            <body>
                <h2>🆘 CRITICAL BLOOD EMERGENCY 🆘</h2>
                <p><strong>{hospital_name}</strong> urgently requires <strong>{units} units of {blood_type}</strong> blood!</p>
                <p>Based on your location, you are nearby and your blood type is a match.</p>
                <br>
                <a href="http://app.redpulse.local/sos-respond" style="padding: 10px 20px; background-color: red; color: white; text-decoration: none; border-radius: 5px;">I Can Donate NOW</a>
            </body>
            </html>
            """
            part = MIMEText(html, "html")
            msg.attach(part)
            
            # Send using SMTP
            server = smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT)
            server.starttls()
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.sendmail(Config.SMTP_USERNAME, emails, msg.as_string())
            server.quit()
            logging.info(f"Emergency SOS Email sent to {len(emails)} donors.")
        except Exception as e:
            logging.error(f"Failed to send SOS Email: {e}")
            
    # 3. SMS logic via Twilio
    if Config.TWILIO_ACCOUNT_SID and Config.TWILIO_AUTH_TOKEN and Config.TWILIO_PHONE_NUMBER:
        try:
            from twilio.rest import Client
            client = Client(Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
            
            sms_body = f"🆘 RED PULSE SOS: {hospital_name} urgently needs {units} units of {blood_type} blood. You are a match. Please respond immediately!"
            
            sms_sent_count = 0
            for d in matched_donors:
                phone = d['entity'].phone
                if phone:
                    try:
                        # Ensure proper E.164 format if not already enforced (e.g. +1234567890)
                        client.messages.create(
                            body=sms_body,
                            from_=Config.TWILIO_PHONE_NUMBER,
                            to=phone
                        )
                        sms_sent_count += 1
                    except Exception as inner_e:
                        logging.error(f"Failed to send SMS to {phone}: {inner_e}")
            logging.info(f"Emergency SOS Twilio SMS sent to {sms_sent_count} donors.")
        except Exception as e:
            logging.error(f"Failed to initialize Twilio client: {e}")
