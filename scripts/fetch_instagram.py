"""Fetch the latest Instagram posts for the "Från gymmet" section.

Runs in a GitHub Action. Pulls recent media from the Instagram API
(Instagram Login, graph.instagram.com), downloads each image, resizes it
and stores it in the repo under feeds/instagram/, then writes
feeds/instagram.json for the site to read.

Visitors never talk to Instagram or any widget service: the site only
loads files from its own domain. No view limits, no third-party cookies.

Safety rules (same lesson as the calendar feeds: a silent empty feed is
the worst failure mode):
- No token configured -> exit 0 and leave everything untouched.
- API error or zero posts -> keep the last good feed and exit 1, so the
  run goes red and GitHub sends a notification.
"""
import io
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()
MAX_POSTS = 8
IMG_SIZE = 640
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "feeds" / "instagram"
OUT_JSON = ROOT / "feeds" / "instagram.json"
FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"


def get_json(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def get_bytes(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def short_caption(text, limit=140):
    text = " ".join((text or "").split())
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def main():
    if not TOKEN:
        print("IG_ACCESS_TOKEN not set, skipping. Existing feed left untouched.")
        return 0

    url = "https://graph.instagram.com/me/media?" + urllib.parse.urlencode(
        {"fields": FIELDS, "limit": 20, "access_token": TOKEN}
    )
    try:
        data = get_json(url).get("data", [])
    except Exception as e:  # noqa: BLE001
        print(f"ERROR: Instagram API request failed: {e}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    items = []
    for m in data:
        if len(items) >= MAX_POSTS:
            break
        # Videos and reels only expose a still via thumbnail_url.
        src = m.get("thumbnail_url") if m.get("media_type") == "VIDEO" else m.get("media_url")
        if not src:
            continue
        try:
            im = Image.open(io.BytesIO(get_bytes(src)))
            im = ImageOps.exif_transpose(im).convert("RGB")
            im = ImageOps.fit(im, (IMG_SIZE, IMG_SIZE), Image.LANCZOS, centering=(0.5, 0.4))
            name = f"{m['id']}.jpg"
            im.save(OUT_DIR / name, quality=78, optimize=True, progressive=True)
        except Exception as e:  # noqa: BLE001
            print(f"WARN: skipped post {m.get('id')}: {e}", file=sys.stderr)
            continue
        items.append(
            {
                "id": m["id"],
                "img": f"feeds/instagram/{name}",
                "url": m.get("permalink", ""),
                "type": m.get("media_type", "IMAGE"),
                "caption": short_caption(m.get("caption")),
                "timestamp": m.get("timestamp", ""),
            }
        )

    if not items:
        print("ERROR: API returned no usable posts. Keeping the last good feed.", file=sys.stderr)
        return 1

    keep = {i["img"].rsplit("/", 1)[1] for i in items}
    for f in OUT_DIR.glob("*.jpg"):
        if f.name not in keep:
            f.unlink()

    OUT_JSON.write_text(json.dumps({"posts": items}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} posts.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
