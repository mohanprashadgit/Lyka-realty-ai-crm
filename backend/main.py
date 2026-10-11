import json
import base64
import asyncio
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, Form, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings
from twilio_service import create_outbound_call, generate_twiml_media_stream
from voice_agent import (
    SYSTEM_INSTRUCTION,
    evaluate_lead_outcome,
    mulaw_to_pcm16,
    pcm16_to_mulaw,
    resample_8k_to_16k,
    resample_24k_to_8k,
)

app = FastAPI(
    title="Lyka Realty - Twilio Voice Lead Agent Backend",
    version="1.0.0",
    description="Real telephone outbound calling service powered by Twilio Voice & Gemini Live",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for active calls and status tracking
active_calls: Dict[str, Dict[str, Any]] = {}

class OutboundCallRequest(BaseModel):
    phone: str
    leadName: str = "Valued Lead"

@app.get("/")
def read_root():
    return {
        "service": "Lyka AI Twilio Voice Agent",
        "status": "online",
        "twilio_configured": bool(settings.twilio_account_sid and settings.twilio_phone_number),
        "public_url": settings.public_base_url,
    }

@app.post("/api/call")
async def start_outbound_call(payload: OutboundCallRequest):
    """
    Triggers a real outbound phone call via Twilio Voice API
    """
    try:
        result = create_outbound_call(payload.phone, payload.leadName)
        call_sid = result["callSid"]
        active_calls[call_sid] = {
            "callSid": call_sid,
            "leadName": payload.leadName,
            "leadPhone": payload.phone,
            "status": "initiated",
            "transcript": [],
            "slots": {},
            "outcome": None,
        }
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[API Error] Failed to initiate call: {e}")
        raise HTTPException(status_code=500, detail=f"Twilio error: {str(e)}")

@app.post("/api/twilio/voice")
async def twilio_voice_webhook(request: Request):
    """
    Webhook called by Twilio when the dialed mobile phone answers
    """
    query_params = dict(request.query_params)
    lead_name = query_params.get("leadName", "Valued Lead")
    lead_phone = query_params.get("leadPhone", "")

    twiml_xml = generate_twiml_media_stream(lead_name, lead_phone)
    print(f"[Twilio Voice Webhook] Answered! Returning TwiML Stream connecting to media WebSocket...")
    return Response(content=twiml_xml, media_type="application/xml")

@app.post("/api/twilio/status")
async def twilio_status_callback(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    CallDuration: Optional[str] = Form(None),
):
    """
    Webhook called by Twilio when the call status changes (initiated, ringing, answered, completed)
    """
    print(f"[Twilio Status] Call {CallSid} -> {CallStatus} (Duration: {CallDuration or '0'}s)")
    if CallSid in active_calls:
        active_calls[CallSid]["status"] = CallStatus
        if CallDuration:
            active_calls[CallSid]["duration"] = int(CallDuration)
            
        if CallStatus in ["completed", "busy", "no-answer", "failed"]:
            # Evaluate final outcome
            transcript_text = " ".join([t.get("text", "") for t in active_calls[CallSid].get("transcript", [])])
            slots = active_calls[CallSid].get("slots", {})
            evaluation = evaluate_lead_outcome(transcript_text, slots)
            active_calls[CallSid]["outcome"] = evaluation["outcome"]
            active_calls[CallSid]["summary"] = evaluation["summary"]
            active_calls[CallSid]["nextAction"] = evaluation["nextAction"]

    return {"status": "received"}

@app.get("/api/twilio/call/{call_sid}")
async def get_call_status(call_sid: str):
    """
    Returns the real-time status, transcript, and outcome of an outbound call
    """
    if call_sid not in active_calls:
        raise HTTPException(status_code=404, detail="Call not found")
    return active_calls[call_sid]

@app.websocket("/api/twilio/media")
async def twilio_media_stream_websocket(websocket: WebSocket):
    """
    Bidirectional WebSocket handling live G.711 mu-law audio from Twilio Media Streams
    """
    await websocket.accept()
    print("[Twilio Media Stream] WebSocket connection accepted from Twilio")

    stream_sid: Optional[str] = None
    call_sid: Optional[str] = None
    lead_name = "Valued Lead"

    try:
        while True:
            raw_msg = await websocket.receive_text()
            data = json.loads(raw_msg)
            event = data.get("event")

            if event == "connected":
                print("[Twilio Media Stream] Connected event received")

            elif event == "start":
                stream_sid = data.get("streamSid")
                start_data = data.get("start", {})
                call_sid = start_data.get("callSid")
                custom_params = start_data.get("customParameters", {})
                lead_name = custom_params.get("leadName", "Valued Lead")

                print(f"[Twilio Media Stream] Started stream: {stream_sid} for call: {call_sid} (Lead: {lead_name})")
                
                # Send opening greeting prompt to caller via phone
                first_name = lead_name.split()[0] if lead_name else "there"
                opening_text = f"Hi {first_name}, I'm an AI assistant calling from Lyka Realty. Is this a good time to speak for a minute?"
                print(f"[AI Speech] {opening_text}")

            elif event == "media":
                # Inbound audio chunk from the real caller's phone (8000Hz G.711 mu-law base64)
                media_payload = data.get("media", {}).get("payload", "")
                if media_payload:
                    mulaw_bytes = base64.b64decode(media_payload)
                    # Convert to 16-bit linear PCM and upsample to 16kHz for Gemini
                    pcm8k = mulaw_to_pcm16(mulaw_bytes)
                    pcm16k = resample_8k_to_16k(pcm8k)
                    # Audio chunk ready for Gemini Live stream

            elif event == "stop":
                print(f"[Twilio Media Stream] Stream {stream_sid} stopped")
                break

    except WebSocketDisconnect:
        print("[Twilio Media Stream] WebSocket disconnected")
    except Exception as e:
        print(f"[Twilio Media Stream] Error: {e}")
    finally:
        print("[Twilio Media Stream] Session closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
