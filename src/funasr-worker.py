import base64
import json
import re
import sys

import numpy as np
from funasr_onnx import SenseVoiceSmall


model_dir = sys.argv[1]
threads = int(sys.argv[2])
model = SenseVoiceSmall(model_dir, quantize=True, intra_op_num_threads=threads)

for line in sys.stdin:
    try:
        request = json.loads(line)
        samples = np.frombuffer(base64.b64decode(request["samples"]), dtype=np.float32)
        result = model(samples, language=request.get("language", "auto"), textnorm="withitn")
        text = result[0]
        text = re.sub(r"<\|[^|]+\|>", "", text)
        text = text.replace("�", "")
        print(json.dumps({"text": text.strip()}, ensure_ascii=False), flush=True)
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), flush=True)
