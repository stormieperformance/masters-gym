#!/usr/bin/env python3
"""
Generates recurring .ics calendar subscription feeds from the Masters Gym
Google Sheets schedule (the same published CSV the live website reads).

The Google Sheet remains the single source of truth. This script:
  1. Fetches the published schedule CSV.
  2. Reads categories from the sheet's own TRUE/FALSE columns.
  3. Writes one .ics file per category into /feeds/, using RRULE so each
     class recurs weekly rather than listing every future date.

Run manually:  python3 scripts/generate_ics.py
Run automatically: see the workflow in .github/workflows/
"""

import csv
import hashlib
import io
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWT14GD9ZrIPtwTEcpRKcPyKuBIIPvI9NvgxGw5yXLvBe_zhG_Klh-vRtu-48Au3eXEknnGel8qsyz/pub?gid=919728725&single=true&output=csv'
OUTPUT_DIR = 'feeds'
DEFAULT_DURATION_MINUTES = 60
TIMEZONE = 'Europe/Stockholm'

# --- Column names, as they appear in the sheet's header row -----------------
# Parsed by NAME, not position, so columns can be reordered in the sheet
# without breaking anything. Renaming a header WILL break it.
COL_DAY, COL_START, COL_END = 'Dag', 'Start', 'Slut'
COL_NAME, COL_LEVEL, COL_ACTIVE = 'Pass', 'Nivå', 'Aktiv'

# --- Category config --------------------------------------------------------
# Each category maps to one TRUE/FALSE column in the sheet. 'column': None
# means "everything", which is how the full feed works. A class may belong to
# several categories; it simply appears in each of those feeds.
CATEGORIES = [
    {'id': 'full',         'column': None,             'name_sv': 'Fullständigt schema', 'name_en': 'Full schedule'},
    {'id': 'nyborjare',    'column': 'Nybörjare',      'name_sv': 'Nybörjare',           'name_en': 'Beginners'},
    {'id': 'fortsattning', 'column': 'Fortsättning',   'name_sv': 'Fortsättning',        'name_en': 'Intermediate'},
    {'id': 'barn',         'column': 'Barn & Junior',  'name_sv': 'Barn & Junior',       'name_en': 'Kids & Juniors'},
    {'id': 'oppna',        'column': 'Öppna pass',     'name_sv': 'Öppna pass',          'name_en': 'Open classes'},
    {'id': 'sparring',     'column': 'Sparring',       'name_sv': 'Sparring',            'name_en': 'Sparring'},
]
CATEGORY_COLUMNS = [c['column'] for c in CATEGORIES if c['column']]

SWEDISH_DAY_TO_ICAL = {
    'måndag': 'MO', 'tisdag': 'TU', 'onsdag': 'WE', 'torsdag': 'TH',
    'fredag': 'FR', 'lördag': 'SA', 'söndag': 'SU',
}
SWEDISH_DAY_TO_PYTHON_WEEKDAY = {
    'måndag': 0, 'tisdag': 1, 'onsdag': 2, 'torsdag': 3,
    'fredag': 4, 'lördag': 5, 'söndag': 6,
}


def is_true(value):
    """Google Sheets checkboxes export as TRUE/FALSE. Be liberal about it."""
    return str(value).strip().lower() in ('true', 'sant', 'ja', 'x', '1', 'yes')


def parse_csv(raw):
    """Parse the schedule CSV into row dicts, keyed by header name."""
    reader = csv.reader(io.StringIO(raw))
    all_rows = list(reader)
    if not all_rows:
        return []

    header = [h.strip() for h in all_rows[0]]
    missing = [c for c in (COL_DAY, COL_START, COL_NAME) if c not in header]
    if missing:
        raise ValueError(f'Sheet is missing required column(s): {", ".join(missing)}. '
                         f'Found headers: {header}')
    idx = {name: i for i, name in enumerate(header)}

    rows, skipped, inactive, uncategorised = [], 0, 0, []
    for cols in all_rows[1:]:
        if len(cols) < len(header):
            cols = cols + [''] * (len(header) - len(cols))
        get = lambda name: cols[idx[name]].strip() if name in idx else ''

        day = get(COL_DAY).lower()
        start, end = get(COL_START), get(COL_END)
        name = get(COL_NAME)
        if not day or not start or not name:
            skipped += 1
            continue
        if COL_ACTIVE in idx and not is_true(get(COL_ACTIVE)):
            inactive += 1
            continue

        cats = {c: is_true(get(c)) for c in CATEGORY_COLUMNS if c in idx}
        if not any(cats.values()):
            uncategorised.append(f'{day} {start} {name}')

        rows.append({
            'day': day,
            'time': f'{start}-{end}' if end else start,
            'name': name,
            'level': get(COL_LEVEL),
            'categories': cats,
        })

    print(f'--- parsed: kept={len(rows)} skipped_incomplete={skipped} inactive={inactive} ---',
          file=sys.stderr)
    if uncategorised:
        print(f'--- WARNING: {len(uncategorised)} class(es) have no category ticked and will '
              f'appear ONLY in the full feed: ---', file=sys.stderr)
        for u in uncategorised:
            print(f'      {u}', file=sys.stderr)
    return rows


def fetch_rows():
    req = urllib.request.Request(CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return parse_csv(resp.read().decode('utf-8-sig'))


def parse_time(time_str):
    """Parse '18:10' or '18:10-19:10' into ((h, m), duration_minutes)."""
    parts = time_str.replace('–', '-').split('-')
    try:
        h, m = [int(x) for x in parts[0].strip().split(':')[:2]]
    except ValueError:
        return None, DEFAULT_DURATION_MINUTES
    duration = DEFAULT_DURATION_MINUTES
    if len(parts) == 2:
        try:
            eh, em = [int(x) for x in parts[1].strip().split(':')[:2]]
            duration = (eh * 60 + em) - (h * 60 + m)
            if duration <= 0:
                duration = DEFAULT_DURATION_MINUTES
        except ValueError:
            pass
    return (h, m), duration


def next_date_for_weekday(python_weekday):
    today = datetime.now().date()
    return today + timedelta(days=(python_weekday - today.weekday()) % 7)


def stable_uid(category_id, day, time_str, name):
    """Deterministic UID so re-generating a feed doesn't duplicate events.
    The category id is part of it on purpose: a class that appears in two
    feeds must not collide for someone subscribed to both."""
    raw = f'{category_id}|{day}|{time_str}|{name}'
    return hashlib.sha1(raw.encode('utf-8')).hexdigest() + '@mastersgym'


def escape_text(value):
    """Escape per RFC 5545 for text properties like SUMMARY."""
    return (value.replace('\\', '\\\\').replace(';', '\\;')
                 .replace(',', '\\,').replace('\n', '\\n'))


def fold_line(line):
    """iCalendar lines must be folded at 75 octets."""
    if len(line.encode('utf-8')) <= 75:
        return line
    out = []
    while len(line.encode('utf-8')) > 75:
        out.append(line[:74])
        line = ' ' + line[74:]
    out.append(line)
    return '\r\n'.join(out)


def build_vevent(category_id, row):
    day = row['day']
    if day not in SWEDISH_DAY_TO_ICAL:
        return None
    hm, duration_min = parse_time(row['time'])
    if hm is None:
        return None
    h, m = hm
    anchor = next_date_for_weekday(SWEDISH_DAY_TO_PYTHON_WEEKDAY[day])
    dtstart = datetime(anchor.year, anchor.month, anchor.day, h, m)
    dtend = dtstart + timedelta(minutes=duration_min)
    summary = row['name'] + (f" ({row['level']})" if row['level'] else '')

    lines = [
        'BEGIN:VEVENT',
        f'UID:{stable_uid(category_id, day, row["time"], row["name"])}',
        f'DTSTART;TZID={TIMEZONE}:{dtstart.strftime("%Y%m%dT%H%M%S")}',
        f'DTEND;TZID={TIMEZONE}:{dtend.strftime("%Y%m%dT%H%M%S")}',
        f'RRULE:FREQ=WEEKLY;BYDAY={SWEDISH_DAY_TO_ICAL[day]}',
        f'SUMMARY:{escape_text(summary)}',
        'LOCATION:Masters Gym\\, Norra Agnegatan 36\\, Stockholm',
        f'DTSTAMP:{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")}',
        'END:VEVENT',
    ]
    return '\r\n'.join(fold_line(l) for l in lines)


def build_calendar(category, rows):
    col = category['column']
    if col is None:
        matched = rows                                    # full feed: everything active
    else:
        matched = [r for r in rows if r['categories'].get(col)]

    vevents = [v for v in (build_vevent(category['id'], r) for r in matched) if v]
    header = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Masters Gym//Schedule Feed//SV',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        f'X-WR-CALNAME:Masters Gym \u2013 {category["name_sv"]}',
        f'X-WR-TIMEZONE:{TIMEZONE}',
        'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
        'X-PUBLISHED-TTL:PT1H',
    ]
    return '\r\n'.join(header + vevents + ['END:VCALENDAR']) + '\r\n'


def main():
    try:
        rows = fetch_rows()
    except Exception as e:
        import traceback
        print(f'ERROR fetching or parsing schedule CSV: {e}', file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)

    if not rows:
        print('ERROR: no schedule rows parsed, refusing to overwrite existing feeds',
              file=sys.stderr)
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for category in CATEGORIES:
        ics = build_calendar(category, rows)
        path = os.path.join(OUTPUT_DIR, f'{category["id"]}.ics')
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(ics)
        print(f'Wrote {path} ({ics.count("BEGIN:VEVENT")} classes)')


if __name__ == '__main__':
    main()
