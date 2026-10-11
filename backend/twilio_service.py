import urllib.parse
from typing import Dict, Any, Optional
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
from config import settings

def get_twilio_client() -> Optional[Client]:
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return None
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)

def create_outbound_call(to_phone: str, lead_name: str = "Valued Lead") -> Dict[str, Any]:
    """
    Creates an outbound phone call via Twilio Voice API
    """
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        raise ValueError("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured in environment variables.")

    if not settings.twilio_phone_number:
        raise ValueError("TWILIO_PHONE_NUMBER must be set to your Twilio phone number (e.g. +1xxxxxxxxxx).")

    # Format destination phone number (must be E.164)
    clean_phone = to_phone.strip()
    if not clean_phone.startswith("+"):
        # Default to adding '+' if missing
        clean_phone = f"+{clean_phone}"

    client = get_twilio_client()
    if not client:
        raise ValueError("Failed to initialize Twilio client with provided credentials.")

    base_url = settings.public_base_url.rstrip("/")
    lead_query = urllib.parse.urlencode({"leadName": lead_name, "leadPhone": clean_phone})
    voice_webhook_url = f"{base_url}/api/twilio/voice?{lead_query}"
    status_callback_url = f"{base_url}/api/twilio/status"

    print(f"[Twilio] Dialing {clean_phone} from {settings.twilio_phone_number}...")
    print(f"[Twilio] Voice URL: {voice_webhook_url}")

    call = client.calls.create(
        to=clean_phone,
        from_=settings.twilio_phone_number,
        url=voice_webhook_url,
        status_callback=status_callback_url,
        status_callback_method="POST",
    )

    return {
        "success": True,
        "callSid": call.sid,
        "status": call.status,
        "to": clean_phone,
        "from": settings.twilio_phone_number,
    }

def generate_twiml_media_stream(lead_name: str, lead_phone: str) -> str:
    """
    Generates TwiML connecting the active PSTN call to a bidirectional Twilio Media Stream
    """
    base_url = settings.public_base_url.rstrip("/")
    # Convert http(s) to ws(s)
    if base_url.startswith("https://"):
        ws_url = "wss://" + base_url[8:] + "/api/twilio/media"
    elif base_url.startswith("http://"):
        ws_url = "ws://" + base_url[7:] + "/api/twilio/media"
    else:
        ws_url = f"wss://{base_url}/api/twilio/media"

    response = VoiceResponse()
    connect = Connect()
    stream = Stream(url=ws_url)
    stream.parameter(name="leadName", value=lead_name)
    stream.parameter(name="leadPhone", value=lead_phone)
    connect.append(stream)
    response.append(connect)

    return str(response)
