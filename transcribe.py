#!/Users/nicktrombley/.pyenv/versions/3.13.0/bin/python3

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Transcribe Audio
# @raycast.mode compact
# @raycast.packageName Audio Utils
# @raycast.icon 🎙️
#
# Required parameters:
# @raycast.argument1 { "type": "text", "placeholder": "Audio file path" }
#
# Documentation:
# @raycast.description Transcribe audio file to SRT and JSON using OpenAI Whisper API
# @raycast.author Your Name
# @raycast.authorURL https://github.com/yourusername

from openai import OpenAI
import subprocess
import os
import glob
import json
import warnings
from typing import Dict, Any
import sys
from pathlib import Path

# Source zshrc and get environment variables
env_vars = subprocess.check_output('source ~/.zshrc && env', shell=True, executable='/bin/zsh')
for line in env_vars.decode().split('\n'):
    if '=' in line:
        key, value = line.split('=', 1)
        os.environ[key] = value

warnings.filterwarnings('ignore', message='Pydantic serializer warning')
client = OpenAI()

def split_audio(input_file: str, chunk_duration: str = "600") -> list[str]:
    """Split audio file into chunks using ffmpeg."""
    if not os.path.exists("temp_chunks"):
        os.makedirs("temp_chunks")
    
    cmd = [
        "ffmpeg", "-i", input_file,
        "-f", "segment",
        "-segment_time", chunk_duration,
        "-c", "copy",
        "temp_chunks/chunk_%03d.mp3"
    ]
    
    subprocess.run(cmd, check=True)
    return sorted(glob.glob("temp_chunks/chunk_*.mp3"))

def clean_segment(segment: Dict[str, Any], time_offset: float = 0) -> Dict[str, Any]:
    """Clean and format a single segment."""
    return {
        "start": round(segment["start"] + time_offset, 3),
        "end": round(segment["end"] + time_offset, 3),
        "text": segment["text"].strip()
    }

def transcribe_audio(file_path: str) -> Dict[str, Any] | None:
    """Transcribe audio file using OpenAI Whisper API."""
    with open(file_path, "rb") as audio_file:
        try:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                timeout=120,
                response_format="verbose_json"
            )
            
            if hasattr(transcription, 'model_dump'):
                result = transcription.model_dump()
            else:
                result = dict(transcription)
                
            if 'duration' in result:
                result['duration'] = float(result['duration'])
            
            if 'segments' in result:
                for segment in result['segments']:
                    if 'start' in segment:
                        segment['start'] = float(segment['start'])
                    if 'end' in segment:
                        segment['end'] = float(segment['end'])
            
            return result
            
        except Exception as e:
            print(f"Error transcribing {file_path}: {str(e)}")
            return None

def format_timestamp_srt(seconds: float) -> str:
    """Convert seconds to SRT timestamp format: HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"

def cleanup_temp_files() -> None:
    """Clean up temporary files and directory."""
    if os.path.exists("temp_chunks"):
        for f in glob.glob("temp_chunks/*"):
            os.remove(f)
        os.rmdir("temp_chunks")

def main():
    if len(sys.argv) != 2:
        print("Please provide an audio file path.")
        sys.exit(1)

    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        sys.exit(1)

    base_output = str(Path(input_file).with_suffix(''))
    srt_output = f"{base_output}.srt"
    json_output = f"{base_output}-transcript.json"

    try:
        print("Starting transcription...")
        chunk_files = split_audio(input_file)
        print(f"Split audio into {len(chunk_files)} chunks")
        
        combined_json = {
            "segments": [],
            "language": None,
            "duration": 0
        }
        
        total_duration = 0
        
        for chunk_file in chunk_files:
            print(f"Transcribing chunk...")
            result = transcribe_audio(chunk_file)
            
            if result and "segments" in result:
                combined_json["segments"].extend([
                    clean_segment(segment, total_duration)
                    for segment in result["segments"]
                ])
                
                if not combined_json["language"]:
                    combined_json["language"] = result.get("language", "unknown")
                
                if result["segments"]:
                    total_duration = combined_json["segments"][-1]["end"]
                    combined_json["duration"] = total_duration
        
        with open(json_output, 'w', encoding='utf-8') as f:
            json.dump(combined_json, f, ensure_ascii=False, indent=2)
        
        with open(srt_output, 'w', encoding='utf-8') as f:
            for i, segment in enumerate(combined_json["segments"], 1):
                f.write(f"{i}\n")
                f.write(f"{format_timestamp_srt(segment['start'])} --> {format_timestamp_srt(segment['end'])}\n")
                f.write(f"{segment['text']}\n\n")
        
        cleanup_temp_files()
        
        print(f"Transcription completed and saved to:")
        print(f"  SRT: {srt_output}")
        print(f"  JSON: {json_output}")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        cleanup_temp_files()
        sys.exit(1)

if __name__ == "__main__":
    main()
