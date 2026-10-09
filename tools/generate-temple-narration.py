"""Generate static narration with edge-tts, then master with ffmpeg.
Run from repository root: python tools/generate-temple-narration.py
Requires edge-tts and ffmpeg. No runtime speech-service dependency.
"""
import asyncio, json, subprocess, tempfile
from pathlib import Path
import edge_tts

CUES = {
 'zh': [
  '推开这道门，走进闽地世代相传的信仰与记忆。',
  '锣鼓声起，神驾出巡。在福州，乡里的人们以一场游神，祈愿四时安宁。',
  '从开道仪仗，到世子神将。一尊尊神像，承载着一方水土的故事。',
  '此刻，殿门为你而开。循着灯火，走近诸神，听见传承的回响。'
 ],
 'en': [
  'Beyond these doors live the faith and memories of generations in Fujian.',
  'Drums sound. The procession begins. In Fuzhou, communities gather to pray for peace throughout the year.',
  'From procession leaders to princes and guardians, each figure carries a story of this land.',
  'The doors are open. Follow the lantern light and discover the stories within.'
 ]
}
async def main():
  output = Path('assets/audio/entrance'); output.mkdir(parents=True, exist_ok=True)
  manifest = {}
  with tempfile.TemporaryDirectory() as temp:
    for lang, texts in CUES.items():
      voice = 'zh-CN-YunjianNeural' if lang == 'zh' else 'en-US-ChristopherNeural'
      manifest[lang] = []
      for i, text in enumerate(texts):
        raw = Path(temp) / f'{lang}-{i}.mp3'
        await edge_tts.Communicate(text, voice, rate='-12%', pitch='-3Hz').save(str(raw))
        target = output / f'{lang}-{i+1}.mp3'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(raw),
          '-af','highpass=f=70,equalizer=f=150:t=q:w=1:g=1.5,aecho=0.8:0.85:55|105:0.055|0.025,loudnorm=I=-18:TP=-2:LRA=9',
          '-codec:a','libmp3lame','-b:a','128k',str(target)], check=True)
        duration = float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(target)]))
        manifest[lang].append({'text':text,'src':str(target),'duration':duration})
        print(f'{target}: {duration:.2f}s',flush=True)
  Path('temple-narration.js').write_text('export const narration = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n')
  (output/'README.md').write_text('Generated with edge-tts (Microsoft Edge online neural voices).\nChinese: zh-CN-YunjianNeural. English: en-US-ChristopherNeural.\nRate -12%, pitch -3Hz. Light early reflections and -18 LUFS mastering.\nRegenerate from repository root with tools/generate-temple-narration.py.\n')
asyncio.run(main())
