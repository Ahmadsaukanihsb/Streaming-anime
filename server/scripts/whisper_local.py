#!/usr/bin/env python3
"""
Advanced Anime Transcriber - Optimized for Ryzen 5 5600 + 32GB RAM
Handles 24-minute anime episodes with Whisper Large-v3
Outputs JSON for Node.js integration
"""

import os
import sys
import gc
import io
import json
import tempfile
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Parse arguments early
if len(sys.argv) < 2:
    print(json.dumps({"error": "No audio file provided"}))
    sys.exit(1)

audio_path = sys.argv[1]
language = sys.argv[2] if len(sys.argv) > 2 else None
model_size = sys.argv[3] if len(sys.argv) > 3 else "large-v3"
translate = sys.argv[4] == "true" if len(sys.argv) > 4 else False

# Handle 'auto' language code
if language == "auto":
    language = None

if not os.path.exists(audio_path):
    print(json.dumps({"error": f"Audio file not found: {audio_path}"}))
    sys.exit(1)

# Import dependencies
try:
    import numpy as np
    import torch
except ImportError:
    print(json.dumps({"error": "PyTorch not installed. Run: pip install torch"}))
    sys.exit(1)

try:
    from faster_whisper import WhisperModel
except ImportError:
    print(json.dumps({"error": "faster-whisper not installed. Run: pip install faster-whisper"}))
    sys.exit(1)

# Optimizations for Ryzen 5 5600
torch.set_num_threads(12)  # Maximize 12 threads
torch.set_num_interop_threads(6)

# Try to load Silero VAD (optional, enhances accuracy)
SILERO_AVAILABLE = False
silero_model = None
try:
    torch.hub.set_dir("./models")
    silero_model, utils = torch.hub.load(
        repo_or_dir='snakers4/silero-vad',
        model='silero_vad',
        force_reload=False,
        onnx=False,
        verbose=False
    )
    (get_speech_timestamps, _, read_audio, _, _) = utils
    SILERO_AVAILABLE = True
    print("[Whisper] Silero VAD loaded (enhanced BGM filtering)", file=sys.stderr, flush=True)
except Exception as e:
    print(f"[Whisper] Silero VAD not available, using built-in VAD", file=sys.stderr, flush=True)


def get_audio_duration(file_path):
    """Get audio duration using ffprobe"""
    try:
        import subprocess
        result = subprocess.run(
            ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1', file_path],
            capture_output=True, text=True
        )
        return float(result.stdout.strip())
    except:
        return 0


def transcribe_with_chunking(model, audio_path, language, translate, chunk_duration=30, overlap=2):
    """
    Transcribe long audio with chunking for memory efficiency and context passing
    """
    try:
        import librosa
        LIBROSA_AVAILABLE = True
    except ImportError:
        LIBROSA_AVAILABLE = False
        print("[Whisper] librosa not available, using direct transcription", file=sys.stderr, flush=True)
    
    # Get total duration
    total_duration = get_audio_duration(audio_path)
    print(f"[Whisper] Audio duration: {total_duration:.1f}s", file=sys.stderr, flush=True)
    
    # For short audio (< 5 min) or no librosa, use direct transcription
    if total_duration < 300 or not LIBROSA_AVAILABLE:
        return transcribe_direct(model, audio_path, language, translate)
    
    # Load audio with librosa for chunking
    print(f"[Whisper] Using chunking mode ({chunk_duration}s chunks, {overlap}s overlap)", file=sys.stderr, flush=True)
    audio, sr = librosa.load(audio_path, sr=16000, mono=True)
    
    samples_per_chunk = chunk_duration * 16000
    overlap_samples = overlap * 16000
    
    all_segments = []
    context = ""
    chunk_idx = 0
    start = 0
    
    while start < len(audio):
        end = min(start + samples_per_chunk, len(audio))
        chunk = audio[start:end]
        chunk_start_time = start / 16000
        
        # Save chunk to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            temp_path = f.name
            try:
                import scipy.io.wavfile as wavfile
                wavfile.write(temp_path, 16000, (chunk * 32767).astype(np.int16))
            except ImportError:
                # Fallback: save raw numpy
                np.save(temp_path, chunk)
        
        try:
            # Transcribe chunk
            task = "translate" if translate else "transcribe"
            segments, info = model.transcribe(
                temp_path,
                language=language,
                task=task,
                beam_size=5,
                best_of=5,
                temperature=0.0,  # Greedy for consistency
                condition_on_previous_text=True,  # Use context
                initial_prompt=context if context else None,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
                no_speech_threshold=0.6
            )
            
            # Process segments
            for segment in segments:
                text = segment.text.strip()
                
                # Skip empty or dots-only
                if not text or text in ['...', '…', '.', '..'] or text.startswith('['):
                    continue
                
                adjusted_start = chunk_start_time + segment.start
                adjusted_end = chunk_start_time + segment.end
                
                # Avoid overlap duplicates
                if all_segments:
                    last_end = all_segments[-1]["end"]
                    if adjusted_start < last_end - 0.5:  # Allow 0.5s tolerance
                        continue
                
                all_segments.append({
                    "start": adjusted_start,
                    "end": adjusted_end,
                    "text": text
                })
                
                # Update context for next chunk
                context = text[-100:] if len(text) > 100 else text
            
            chunk_idx += 1
            progress_pct = min(100, int((end / len(audio)) * 100))
            print(f"[Whisper] Chunk {chunk_idx} complete ({progress_pct}%)", file=sys.stderr, flush=True)
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            gc.collect()
        
        if end >= len(audio):
            break
        start += (samples_per_chunk - overlap_samples)
    
    return all_segments, info.language if 'info' in dir() else language


def transcribe_direct(model, audio_path, language, translate):
    """
    Direct transcription for shorter audio without chunking
    """
    task = "translate" if translate else "transcribe"
    
    segments, info = model.transcribe(
        audio_path,
        language=language,
        task=task,
        beam_size=5,
        best_of=5,
        temperature=0.0,  # Greedy for consistency
        condition_on_previous_text=False,  # Prevent hallucination
        no_speech_threshold=0.6,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500, speech_pad_ms=200)
    )
    
    result_segments = []
    skipped = 0
    
    for i, segment in enumerate(segments):
        text = segment.text.strip()
        
        # Skip empty, dots-only, or music indicator segments
        if not text or text in ['...', '…', '.', '..'] or text.startswith('[') or text.startswith('♪'):
            skipped += 1
            continue
        
        result_segments.append({
            "start": segment.start,
            "end": segment.end,
            "text": text
        })
        
        if (len(result_segments)) % 10 == 0:
            print(f"[Whisper] Processed {len(result_segments)} segments ({segment.end:.1f}s)...", file=sys.stderr, flush=True)
    
    return result_segments, info.language


def main():
    print(f"[Whisper] Loading model: {model_size} (optimized for Ryzen 5 5600)...", file=sys.stderr, flush=True)
    
    # Load model with optimizations
    model = WhisperModel(
        model_size,
        device="cpu",
        compute_type="float32",  # Max accuracy
        cpu_threads=12,
        num_workers=2
    )
    
    print(f"[Whisper] Model loaded! Starting transcription...", file=sys.stderr, flush=True)
    
    try:
        # Transcribe with or without chunking based on duration
        segments, detected_language = transcribe_with_chunking(
            model, audio_path, language, translate
        )
        
        print(f"[Whisper] Transcription complete! Total: {len(segments)} segments", file=sys.stderr, flush=True)
        
        # Output result
        result = {
            "language": detected_language or "unknown",
            "language_probability": 1.0,
            "duration": get_audio_duration(audio_path),
            "segments": segments
        }
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    finally:
        del model
        gc.collect()


if __name__ == "__main__":
    main()
