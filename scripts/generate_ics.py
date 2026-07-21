#!/usr/bin/env python3
"""
Generates recurring .ics calendar subscription feeds from the Masters Gym
Google Sheets schedule (the same published CSV the live website already reads).

Google Sheet remains the single source of truth. This script:
  1. Fetches the published schedule CSV.
  2. Groups classes into categories (easily extendable below).
  3. Writes one .ics file per category into /feeds/, using RRULE so each
     class recurs weekly rather than listing every future date.

Run manually:  python3 scripts/generate_ics.py
Run automatically: see .github/workflows/generate-schedule-feeds.yml
"""

import csv
import hashlib
import io
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRb-OaHSzncTmm3MpQGyfTa5VOVuPFLA9OsrKNCtr5ktsAF1RHgcuBLO1QE2sUnewxJ9UGK4cnjzkDX/pub?gid=0&single=true&output=csv'
OUTPUT_DIR = 'feeds'
DEFAULT_DURATION_MINUTES = 60
TIMEZONE = 'Europe/Stockholm'

# --- Category config -------------------------------------------------------
# To add a new category later: add one line here. `keywords` are matched
# (case-insensitive substring) against the "Pass" column. `exclude` keywords
# are checked too, so e.g. Boxning can exclude Kickboxning/Thaiboxning rows
# that also happen to contain "box". Leave keywords empty for "everything".
CATEGORIES = [
    {'id': 'full',      'name_sv': 'Fullständigt schema', 'name_en': 'Full schedule',   'keywords': [],              'exclude': []},
    {'id': 'muaythai',  'name_sv': 'Thaiboxning',          'name_en': 'Muay Thai',        'keywords': ['thai'],        'exclude': []},
    {'id': 'boxning',   'name_sv': 'Boxning',              'name_en': 'Boxing',           'keywords': ['box'],         'exclude': ['kick', 'thai']},
    {'id': 'nyborjare', 'name_sv': 'Nybörjarpass',         'name_en': 'Beginner classes', 'keywords': ['nybörjar'],    'exclude': []},
]

SWEDISH_DAY_TO_ICAL = {
    'måndag': 'MO', 'tisdag': 'TU', 'onsdag': 'WE', 'torsdag': 'TH',
    'fredag': 'FR', 'lördag': 'SA', 'söndag': 'SU',
}
SWEDISH_DAY_TO_PYTHON_WEEKDAY = {
    'måndag': 0, 'tisdag': 1, 'onsdag': 2, 'torsdag': 3,
    'fredag': 4, 'lördag': 5, 'söndag': 6,
}


def fetch_rows():
    """Fetch and parse the published schedule CSV. Returns list of dict rows."""
    req = urllib.request.Request(CSV_URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read().decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(raw))
    rows = []
    for r in reader:
        day = (r.get('Dag') or '').strip().lower()
        time_str = (r.get('Tid') or '').strip()
        name = (r.get('Pass') or '').strip()
        status = (r.get('Status') or '').strip()
        level = (r.get('Nivå') or r.get('Niv\u00e5') or '').strip()
        if not day or not time_str or not name:
            continue
        if 'inställ' in status.lower():
            # Skip rows explicitly marked cancelled in the sheet. Note: this
            # only affects generation time, not already-subscribed calendars
            # for that instance's date, since RRULE is a repeating template
            # rather than a list of dated exceptions.
            continue
        rows.append({'day': day, 'time': time_str, 'name': name, 'level': level})
    return rows


def parse_time(time_str):
    """Parse '18:10' or '18:10-19:10' into (start_hm, duration_minutes)."""
    parts = time_str.replace('–', '-').split('-')
    start = parts[0].strip()
    try:
        h, m = [int(x) for x in start.split(':')]
    except ValueError:
        return None, DEFAULT_DURATION_MINUTES
    duration = DEFAULT_DURATION_MINUTES
    if len(parts) == 2:
        try:
            eh, em = [int(x) for x in parts[1].strip().split(':')]
            duration = (eh * 60 + em) - (h * 60 + m)
            if duration <= 0:
                duration = DEFAULT_DURATION_MINUTES
        except ValueError:
            pass
    return (h, m), duration


def next_date_for_weekday(python_weekday):
    """Return the next date (today or later) that falls on the given weekday."""
    today = datetime.now().date()
    days_ahead = (python_weekday - today.weekday()) % 7
    return today + timedelta(days=days_ahead)


def stable_uid(category_id, day, time_str, name):
    """Deterministic UID so re-generating the feed doesn't create duplicate
    events in a subscriber's calendar app."""
    raw = f'{category_id}|{day}|{time_str}|{name}'
    return hashlib.sha1(raw.encode('utf-8')).hexdigest() + '@mastersgym'


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
    anchor_date = next_date_for_weekday(SWEDISH_DAY_TO_PYTHON_WEEKDAY[day])
    dtstart = datetime(anchor_date.year, anchor_date.month, anchor_date.day, h, m)
    dtend = dtstart + timedelta(minutes=duration_min)
    uid = stable_uid(category_id, day, row['time'], row['name'])
    summary = row['name'] + (f" ({row['level']})" if row['level'] else '')

    lines = [
        'BEGIN:VEVENT',
        f'UID:{uid}',
        f'DTSTART;TZID={TIMEZONE}:{dtstart.strftime("%Y%m%dT%H%M%S")}',
        f'DTEND;TZID={TIMEZONE}:{dtend.strftime("%Y%m%dT%H%M%S")}',
        f'RRULE:FREQ=WEEKLY;BYDAY={SWEDISH_DAY_TO_ICAL[day]}',
        f'SUMMARY:{summary}',
        'LOCATION:Masters Gym\\, Norra Agnegatan 36\\, Stockholm',
        f'DTSTAMP:{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")}',
        'END:VEVENT',
    ]
    return '\r\n'.join(fold_line(l) for l in lines)


def build_calendar(category, rows):
    matched = []
    for row in rows:
        name_lower = row['name'].lower()
        if category['exclude'] and any(x in name_lower for x in category['exclude']):
            continue
        if category['keywords'] and not any(k in name_lower for k in category['keywords']):
            continue
        matched.append(row)

    vevents = [build_vevent(category['id'], r) for r in matched]
    vevents = [v for v in vevents if v]

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
    footer = ['END:VCALENDAR']
    return '\r\n'.join(header + vevents + footer) + '\r\n'


def main():
    import os
    try:
        rows = fetch_rows()
    except Exception as e:
        import traceback
        print(f'ERROR fetching schedule CSV: {e}', file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)

    if not rows:
        print('ERROR: no schedule rows parsed, refusing to overwrite existing feeds', file=sys.stderr)
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
