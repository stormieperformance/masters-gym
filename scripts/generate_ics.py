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

CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=1060172934&single=true&output=csv'
CSV_TEMP_PERIODS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=1900013866&single=true&output=csv'
CSV_TEMP_CLASSES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=262188045&single=true&output=csv'
CSV_EXCEPTIONS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSx5DO8VUAhMLv96t_zPgSghNPBuK683Hchwlc1MYh_XlmkNOCcphDAcNde1g42-Q/pub?gid=826852807&single=true&output=csv'
OUTPUT_DIR = 'feeds'
DEFAULT_DURATION_MINUTES = 60
TIMEZONE = 'Europe/Stockholm'

# How far ahead the recurrence runs. Without an end date a weekly RRULE repeats
# forever, so someone scrolling to 2031 still sees gym classes. Because this
# script re-runs every 30 minutes, the end date moves forward with it: a rolling
# window that never actually runs out, but never shows more than this either.
HORIZON_DAYS = 183

# --- Column names, as they appear in the sheet's header row -----------------
# Parsed by NAME, not position, so columns can be reordered in the sheet
# without breaking anything. Renaming a header WILL break it.
COL_DAY, COL_START, COL_END = 'Dag', 'Start', 'Slut'
COL_NAME, COL_LEVEL, COL_ACTIVE = 'Pass', 'Nivå', 'Aktiv'
COL_STATUS = 'Status'

# --- Category config --------------------------------------------------------
# Each category maps to one TRUE/FALSE column in the sheet. 'column': None
# means "everything", which is how the full feed works. A class may belong to
# several categories; it simply appears in each of those feeds.
# 'columns' lists every header this category will accept, so a column can be
# renamed in the sheet without a flag day: add the new name here first, rename
# in the sheet afterwards, drop the old name whenever convenient.
CATEGORIES = [
    {'id': 'full',         'columns': [],                            'name_sv': 'Fullständigt schema', 'name_en': 'Full schedule'},
    {'id': 'nyborjare',    'columns': ['Nybörjare'],                 'name_sv': 'Nybörjare',           'name_en': 'Beginners'},
    {'id': 'fortsattning', 'columns': ['Fortsättning'],              'name_sv': 'Fortsättning',        'name_en': 'Intermediate'},
    {'id': 'barn',         'columns': ['Barn & Junior'],             'name_sv': 'Barn & Junior',       'name_en': 'Kids & Juniors'},
    {'id': 'oppna',        'columns': ['Alla nivåer', 'Öppna pass'], 'name_sv': 'Alla nivåer',         'name_en': 'All levels'},
]
CATEGORY_COLUMNS = [c for cat in CATEGORIES for c in cat['columns']]

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


def is_cancelled(status_value):
    """Mirrors the frontend's isCancelled(): a Status cell containing the
    Swedish word for 'cancelled' (any casing/inflection). The column doesn't
    exist in the sheet yet as of 2026-08-17, so this is a no-op until staff
    start using it — same column name the website already watches for."""
    return 'inställ' in str(status_value).strip().lower()


def parse_csv(raw):
    """Parse the schedule CSV into row dicts, keyed by header name."""
    reader = csv.reader(io.StringIO(raw))
    all_rows = list(reader)
    if not all_rows:
        return []

    header = [h.strip() for h in all_rows[0]]
    # Match headers case-insensitively and whitespace-tolerantly. Staff retype
    # these by hand; 'Alla Nivåer' vs 'Alla nivåer' must not silently empty a feed.
    def norm(h):
        return ' '.join(str(h).split()).casefold()
    idx = {norm(name): i for i, name in enumerate(header)}
    missing = [c for c in (COL_DAY, COL_START, COL_NAME) if norm(c) not in idx]
    if missing:
        raise ValueError(f'Sheet is missing required column(s): {", ".join(missing)}. '
                         f'Found headers: {header}')

    rows, skipped, inactive, cancelled, uncategorised = [], 0, 0, 0, []
    for cols in all_rows[1:]:
        if len(cols) < len(header):
            cols = cols + [''] * (len(header) - len(cols))
        get = lambda name: cols[idx[norm(name)]].strip() if norm(name) in idx else ''

        day = get(COL_DAY).lower()
        start, end = get(COL_START), get(COL_END)
        name = get(COL_NAME)
        if not day or not start or not name:
            skipped += 1
            continue
        if norm(COL_ACTIVE) in idx and not is_true(get(COL_ACTIVE)):
            inactive += 1
            continue
        if norm(COL_STATUS) in idx and is_cancelled(get(COL_STATUS)):
            cancelled += 1
            continue

        cats = {norm(c): is_true(get(c)) for c in CATEGORY_COLUMNS if norm(c) in idx}
        if not any(cats.values()):
            uncategorised.append(f'{day} {start} {name}')

        rows.append({
            'day': day,
            'time': f'{start}-{end}' if end else start,
            'name': name,
            'level': get(COL_LEVEL),
            'categories': cats,
        })

    print(f'--- parsed: kept={len(rows)} skipped_incomplete={skipped} inactive={inactive} cancelled={cancelled} ---',
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


def fetch_raw_csv(url):
    """Like fetch_rows but returns the raw CSV text, not parsed schedule rows —
    used for the three new tabs, which have a different shape than the
    normal schedule. Any failure here degrades gracefully (empty result)
    rather than breaking the normal schedule feeds."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.read().decode('utf-8-sig')
    except Exception as e:
        print(f'WARNING: could not fetch {url}: {e}', file=sys.stderr)
        return ''


def parse_date(value):
    """Parse a YYYY-MM-DD date string from the sheet. Staff must type dates
    in this format (same convention as HH:MM for times) — returns None for
    anything blank or unparseable rather than raising."""
    value = (value or '').strip()
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def rows_for_period(temp_classes_raw, period_name):
    """Full schedule rows (same shape/categories as the normal schedule) for
    one named temporary period. Filters the raw Tillfälliga_Pass CSV down to
    that period's rows, then routes the result back through parse_csv so the
    category/Aktiv/Status logic is never duplicated."""
    if not temp_classes_raw:
        return []
    reader = csv.reader(io.StringIO(temp_classes_raw))
    all_rows = list(reader)
    if not all_rows:
        return []
    header = [h.strip() for h in all_rows[0]]

    def norm(h):
        return ' '.join(str(h).split()).casefold()

    headers_norm = [norm(h) for h in header]
    if 'period' not in headers_norm:
        return []
    period_idx = headers_norm.index('period')
    matching = [header] + [
        r for r in all_rows[1:]
        if len(r) > period_idx and r[period_idx].strip() == period_name
    ]
    if len(matching) <= 1:
        return []
    buf = io.StringIO()
    csv.writer(buf).writerows(matching)
    return parse_csv(buf.getvalue())


def fetch_periods_in_horizon():
    """Every active temporary period whose date range overlaps the
    generation window — not just ones active today, so an upcoming holiday
    schedule is already visible in subscribed calendars before it starts."""
    raw = fetch_raw_csv(CSV_TEMP_PERIODS)
    if not raw:
        return []
    reader = csv.reader(io.StringIO(raw))
    all_rows = list(reader)
    if not all_rows:
        return []
    header = [h.strip() for h in all_rows[0]]

    def norm(h):
        return ' '.join(str(h).split()).casefold()

    idx = {norm(h): i for i, h in enumerate(header)}
    if not all(c in idx for c in ('namn', 'start', 'slut')):
        print('WARNING: Tillfälliga_Perioder is missing Namn/Start/Slut, skipping.', file=sys.stderr)
        return []

    horizon_start = datetime.now().date()
    horizon_end = horizon_start + timedelta(days=HORIZON_DAYS)
    periods = []
    for cols in all_rows[1:]:
        get = lambda name: cols[idx[name]].strip() if idx.get(name) is not None and len(cols) > idx[name] else ''
        aktiv_i = idx.get('aktiv')
        if aktiv_i is not None and len(cols) > aktiv_i and not is_true(cols[aktiv_i]):
            continue
        name = get('namn')
        start, end = parse_date(get('start')), parse_date(get('slut'))
        if not (name and start and end):
            continue
        if end < horizon_start or start > horizon_end:
            continue
        periods.append({'name': name, 'start': start, 'end': end})
    return periods


def fetch_exceptions():
    """Returns {date: [{'pass': name, 'typ': text}, ...]}. Only cancellations
    are mechanically applied to the calendar feed — the simplified Undantag
    sheet has no time/rename fields, so a 'moved' or 'added' exception can't
    be turned into a real calendar event; staff communicate those through
    the Meddelande text shown on the website instead."""
    raw = fetch_raw_csv(CSV_EXCEPTIONS)
    if not raw:
        return {}
    reader = csv.reader(io.StringIO(raw))
    all_rows = list(reader)
    if not all_rows:
        return {}
    header = [h.strip() for h in all_rows[0]]

    def norm(h):
        return ' '.join(str(h).split()).casefold()

    idx = {norm(h): i for i, h in enumerate(header)}
    if not all(c in idx for c in ('datum', 'pass')):
        print('WARNING: Undantag is missing Datum/Pass, skipping.', file=sys.stderr)
        return {}

    by_date = {}
    for cols in all_rows[1:]:
        get = lambda name: cols[idx[name]].strip() if idx.get(name) is not None and len(cols) > idx[name] else ''
        d = parse_date(get('datum'))
        if not d:
            continue
        by_date.setdefault(d, []).append({'pass': get('pass'), 'typ': get('typ')})
    return by_date


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


def compute_exdates(row, anchor, periods, exceptions_by_date):
    """Every occurrence of this recurring row, within the horizon, that
    should be excluded from its weekly RRULE — either because a temporary
    period takes over that date, or a one-off exception cancels it."""
    excl = []
    d = anchor
    end = anchor + timedelta(days=HORIZON_DAYS)
    name_lower = row['name'].strip().lower()
    while d <= end:
        in_period = any(p['start'] <= d <= p['end'] for p in periods)
        cancelled = any(
            e['pass'].strip().lower() == name_lower and is_cancelled(e['typ'])
            for e in exceptions_by_date.get(d, [])
        )
        if in_period or cancelled:
            excl.append(d)
        d += timedelta(days=7)
    return excl


def build_vevent(category_id, row, periods=(), exceptions_by_date=None):
    exceptions_by_date = exceptions_by_date or {}
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
    # UNTIL must be UTC per RFC 5545; end of day is plenty precise here.
    until = (dtstart + timedelta(days=HORIZON_DAYS)).strftime('%Y%m%dT235959Z')
    summary = row['name'] + (f" ({row['level']})" if row['level'] else '')

    lines = [
        'BEGIN:VEVENT',
        f'UID:{stable_uid(category_id, day, row["time"], row["name"])}',
        f'DTSTART;TZID={TIMEZONE}:{dtstart.strftime("%Y%m%dT%H%M%S")}',
        f'DTEND;TZID={TIMEZONE}:{dtend.strftime("%Y%m%dT%H%M%S")}',
        f'RRULE:FREQ=WEEKLY;BYDAY={SWEDISH_DAY_TO_ICAL[day]};UNTIL={until}',
    ]
    for exd in compute_exdates(row, anchor, periods, exceptions_by_date):
        exdt = datetime(exd.year, exd.month, exd.day, h, m)
        lines.append(f'EXDATE;TZID={TIMEZONE}:{exdt.strftime("%Y%m%dT%H%M%S")}')
    lines += [
        f'SUMMARY:{escape_text(summary)}',
        'LOCATION:Masters Gym\\, Norra Agnegatan 36\\, Stockholm',
        f'DTSTAMP:{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")}',
        'END:VEVENT',
    ]
    return '\r\n'.join(fold_line(l) for l in lines)


def build_oneoff_vevent(category_id, row, on_date):
    """A single non-recurring occurrence — used for temporary-period
    classes, which only exist for the dates their period covers."""
    hm, duration_min = parse_time(row['time'])
    if hm is None:
        return None
    h, m = hm
    dtstart = datetime(on_date.year, on_date.month, on_date.day, h, m)
    dtend = dtstart + timedelta(minutes=duration_min)
    summary = row['name'] + (f" ({row['level']})" if row['level'] else '')
    uid_raw = f'{category_id}|oneoff|{on_date.isoformat()}|{row["time"]}|{row["name"]}'
    uid = hashlib.sha1(uid_raw.encode('utf-8')).hexdigest() + '@mastersgym'

    lines = [
        'BEGIN:VEVENT',
        f'UID:{uid}',
        f'DTSTART;TZID={TIMEZONE}:{dtstart.strftime("%Y%m%dT%H%M%S")}',
        f'DTEND;TZID={TIMEZONE}:{dtend.strftime("%Y%m%dT%H%M%S")}',
        f'SUMMARY:{escape_text(summary)}',
        'LOCATION:Masters Gym\\, Norra Agnegatan 36\\, Stockholm',
        f'DTSTAMP:{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")}',
        'END:VEVENT',
    ]
    return '\r\n'.join(fold_line(l) for l in lines)


def build_calendar(category, rows, periods, temp_classes_raw, exceptions_by_date):
    cols = category['columns']
    if not cols:
        matched = rows                                    # full feed: everything active
    else:
        matched = [r for r in rows
                   if any(r['categories'].get(' '.join(c.split()).casefold()) for c in cols)]

    vevents = [v for v in (build_vevent(category['id'], r, periods, exceptions_by_date) for r in matched) if v]

    # One-off events for each active/upcoming temporary period, so a
    # Christmas or summer schedule actually shows up in subscribed
    # calendars for the dates it covers, not just as a gap in the normal one.
    for period in periods:
        period_rows = rows_for_period(temp_classes_raw, period['name'])
        if not cols:
            period_matched = period_rows
        else:
            period_matched = [r for r in period_rows
                               if any(r['categories'].get(' '.join(c.split()).casefold()) for c in cols)]
        for row in period_matched:
            day = row['day']
            if day not in SWEDISH_DAY_TO_PYTHON_WEEKDAY:
                continue
            target_weekday = SWEDISH_DAY_TO_PYTHON_WEEKDAY[day]
            name_lower = row['name'].strip().lower()
            d = period['start']
            while d <= period['end']:
                if d.weekday() == target_weekday:
                    cancelled = any(
                        e['pass'].strip().lower() == name_lower and is_cancelled(e['typ'])
                        for e in exceptions_by_date.get(d, [])
                    )
                    if not cancelled:
                        v = build_oneoff_vevent(category['id'], row, d)
                        if v:
                            vevents.append(v)
                d += timedelta(days=1)

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

    # These three are allowed to come back empty (unpublished tab, no rows
    # yet, transient fetch failure) — the normal schedule must never be
    # blocked by an optional layer on top of it.
    periods = fetch_periods_in_horizon()
    temp_classes_raw = fetch_raw_csv(CSV_TEMP_CLASSES)
    exceptions_by_date = fetch_exceptions()
    if periods:
        print(f'--- {len(periods)} temporary period(s) in horizon: '
              f'{", ".join(p["name"] for p in periods)} ---', file=sys.stderr)
    if exceptions_by_date:
        print(f'--- {len(exceptions_by_date)} date(s) with exceptions ---', file=sys.stderr)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for category in CATEGORIES:
        ics = build_calendar(category, rows, periods, temp_classes_raw, exceptions_by_date)
        path = os.path.join(OUTPUT_DIR, f'{category["id"]}.ics')
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(ics)
        print(f'Wrote {path} ({ics.count("BEGIN:VEVENT")} classes)')


if __name__ == '__main__':
    main()
