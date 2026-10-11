import audioop
import base64
import json
from typing import Dict, Any, List

SYSTEM_INSTRUCTION = """
You are Lyka, an AI real estate assistant calling from Lyka Realty.
You sound warm, professional, friendly, and natural.

CRITICAL RULES:
1. Always state clearly: "Hi, I'm an AI assistant calling from Lyka Realty. Is this a good time to speak for a minute?"
2. Never pretend to be human.
3. Never invent property prices, availability, offers, or returns.
4. Keep answers short: 1-2 conversational sentences.
5. Qualify the prospect along 5 core dimensions:
   - Interest (buying, selling, or investing)
   - Buyer Type (first-time buyer, upgrading, investor)
   - Property Type (apartment, villa, 2BHK/3BHK)
   - Budget & Location
   - Timeline (immediate, 1-3 months, 3+ months)
6. If the person says "stop", "don't call me", "remove my number", or "not interested":
   Respectfully say: "I completely understand. I will remove your number from our contact list immediately. Have a great day."
   and conclude the call.
7. If the caller requests a human agent, warmly promise an immediate callback from a senior specialist.
""".strip()

def evaluate_lead_outcome(transcript_text: str, slots: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic scoring for real telephone calls:
    HOT: Interested + budget given + timeline <= 3 months + at least 4 of 5 slots
    WARM: Interested, but timeline > 3 months or budget unclear (at least 2 slots)
    COLD: Not interested or fewer than 2 slots
    OPT_OUT: Explicit DNC request
    """
    lower_text = transcript_text.lower()
    
    # Opt-out detection
    opt_out_keywords = ["don't call", "dont call", "stop calling", "remove my number", "take me off", "do not call", "unsubscribe"]
    if any(k in lower_text for k in opt_out_keywords):
        return {
            "outcome": "OPT_OUT",
            "summary": "Caller explicitly requested to be removed from the calling list (DNC).",
            "nextAction": "Permanently suppress phone number from outbound queues."
        }
        
    # Negative response detection
    not_interested_keywords = ["not interested", "dont need", "don't want", "no thanks", "wrong number", "not looking"]
    if any(k in lower_text for k in not_interested_keywords):
        return {
            "outcome": "COLD",
            "summary": "Caller was reached but indicated they have no property requirements at this time.",
            "nextAction": "Archive or enroll into long-term quarterly market updates."
        }
        
    # Count slots
    answered = 0
    if slots.get("interest"): answered += 1
    if slots.get("buyerType"): answered += 1
    if slots.get("propertyType"): answered += 1
    if slots.get("budget"): answered += 1
    if slots.get("timeline"): answered += 1
    
    timeline = str(slots.get("timeline", "")).lower()
    is_short_timeline = any(w in timeline for w in ["immediate", "30", "1 month", "2 month", "3 month", "soon", "now"])
    has_budget = bool(slots.get("budget"))
    
    if has_budget and is_short_timeline and answered >= 4:
        return {
            "outcome": "HOT",
            "summary": f"Actively searching for {slots.get('propertyType', 'property')} in {slots.get('location', 'preferred area')} with budget {slots.get('budget')}. Moving within 3 months.",
            "nextAction": "Immediate Senior Sales Agent callback with curated project listings."
        }
    elif answered >= 2:
        return {
            "outcome": "WARM",
            "summary": f"Interested in {slots.get('propertyType', 'real estate')} in {slots.get('location', 'area')}. Budget/Timeline flexible.",
            "nextAction": "Follow-up in 2-3 weeks via WhatsApp catalog."
        }
    else:
        return {
            "outcome": "COLD",
            "summary": f"Call connected but limited details were obtained ({answered}/5 slots answered).",
            "nextAction": "Keep in lead database for general marketing."
        }

def mulaw_to_pcm16(mulaw_bytes: bytes) -> bytes:
    """Converts 8kHz G.711 mu-law bytes to 16-bit Linear PCM (8kHz)"""
    return audioop.ulaw2lin(mulaw_bytes, 2)

def pcm16_to_mulaw(pcm_bytes: bytes) -> bytes:
    """Converts 16-bit Linear PCM bytes to 8kHz G.711 mu-law bytes"""
    return audioop.lin2ulaw(pcm_bytes, 2)

def resample_24k_to_8k(pcm24k_bytes: bytes) -> bytes:
    """Resamples 24000Hz 16-bit PCM down to 8000Hz 16-bit PCM"""
    converted, _ = audioop.ratecv(pcm24k_bytes, 2, 1, 24000, 8000, None)
    return converted

def resample_8k_to_16k(pcm8k_bytes: bytes) -> bytes:
    """Resamples 8000Hz 16-bit PCM up to 16000Hz 16-bit PCM"""
    converted, _ = audioop.ratecv(pcm8k_bytes, 2, 1, 8000, 16000, None)
    return converted
