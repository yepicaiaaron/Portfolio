from pathlib import Path
import cv2
import numpy as np

root=Path(__file__).parent
for name in ('wave','boat'):
    cap=cv2.VideoCapture(str(root/'dist/assets'/f'digit-{name}-guide.mp4'))
    fps=cap.get(cv2.CAP_PROP_FPS)
    count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frames=[]
    previews=[]
    for i in range(48):
        # The latter half of the wave output invents lettering; use only its clean opening.
        end=min(count-1,30) if name=='wave' else count-1
        cap.set(cv2.CAP_PROP_POS_FRAMES,round(i*end/47))
        ok,frame=cap.read()
        if not ok: raise RuntimeError(f'Cannot decode {name}:{i}')
        small=cv2.resize(cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY),(128,72),interpolation=cv2.INTER_AREA)
        frames.append(small)
        if i in (0,16,32,47): previews.append(cv2.resize(frame,(480,270)))
    np.stack(frames).tofile(str(root/'dist/assets'/f'digit-{name}.bin'))
    cv2.imwrite(str(root.parent/f'{name}-guide-review.jpg'),np.concatenate(previews,axis=1))
    cap.release()
    print(name, count, fps, 'frames decoded; luminance bytes:',48*128*72)
