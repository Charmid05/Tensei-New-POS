# Kitchen Sound Files

This directory contains audio files for kitchen notifications. The system will automatically generate fallback sounds if these files are not present.

## Required Sound Files

Place the following audio files in this directory:

### 1. `new-order.mp3`
- **Purpose:** Plays when a new order is received in the kitchen
- **Recommended:** Pleasant chime or bell sound (2-3 notes, ascending)
- **Duration:** 0.5-1.0 seconds
- **Volume:** Clear but not jarring

### 2. `order-ready.mp3`  
- **Purpose:** Plays when an order is ready for pickup (dine-in)
- **Recommended:** Success notification sound (positive, completion tone)
- **Duration:** 0.3-0.8 seconds
- **Volume:** Attention-getting but professional

### 3. `takeaway-ready.mp3`
- **Purpose:** Plays when a takeaway order is ready for customer pickup
- **Recommended:** Distinctive pattern different from order-ready (e.g., 3-tone sequence)
- **Duration:** 0.5-1.0 seconds
- **Volume:** Clear and distinctive for customer area

## File Format Requirements

- **Format:** MP3 (preferred) or WAV
- **Sample Rate:** 44.1kHz or higher
- **Bit Rate:** 128kbps or higher
- **Channels:** Mono or Stereo

## Fallback System

If audio files are not found, the system will automatically generate programmatic sounds:

- **New Order:** 800Hz → 1000Hz ascending chime
- **Order Ready:** 600Hz → 800Hz → 1000Hz success pattern  
- **Takeaway Ready:** 400Hz → 600Hz → 400Hz distinctive pattern

## Sound Settings

Kitchen staff can control these sounds through the Sound Settings panel:

- ✅ Enable/disable all sounds
- 🔊 Adjust volume (0-100%)
- 🎵 Enable/disable individual sound types
- 🧪 Test each sound type

## Installation Instructions

1. Obtain appropriate sound files (purchase from sound library or create custom)
2. Ensure files are named exactly as specified above
3. Place files in this directory: `frontend/public/sounds/kitchen/`
4. Restart the frontend server to load new sounds
5. Test sounds using the Kitchen Sound Settings panel

## Licensing Note

Ensure any sound files used comply with your licensing requirements. Consider:
- Royalty-free sound libraries
- Creative Commons licensed audio
- Custom recorded sounds
- Generated/synthesized sounds

## Troubleshooting

If sounds are not playing:
1. Check browser audio permissions
2. Verify file names match exactly
3. Ensure audio files are valid and not corrupted
4. Check browser console for loading errors
5. Test with generated sounds first (remove audio files temporarily)

The system is designed to work without external sound files, using generated sounds as a reliable fallback.
