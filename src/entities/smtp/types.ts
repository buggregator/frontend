export interface SMTPUser {
  name?: string,
  email: string,
}

// Another version of the body (Apple Watch, AMP, calendar, delivery report…),
// in message order (#6829). Absent on an ordinary message.
export interface SMTPPart {
  type: string,
  label: string,
  content: string,
  size: number,
  truncated?: boolean,
}

export interface SMTPCalendarPerson {
  name?: string,
  email?: string,
}

export interface SMTPCalendarAttendee extends SMTPCalendarPerson {
  status?: string,
  role?: string,
}

// The invite from a text/calendar part or an .ics attachment. Times: RFC 3339
// when the zone is known; local `2026-12-03T14:00:00` + `tz` when it is not;
// `2026-12-05` when all_day.
export interface SMTPCalendar {
  summary: string,
  method?: string,
  start?: string,
  end?: string,
  tz?: string,
  all_day?: boolean,
  location?: string,
  description?: string,
  url?: string,
  status?: string,
  uid?: string,
  sequence?: string,
  rrule?: string,
  organizer?: SMTPCalendarPerson,
  attendees?: SMTPCalendarAttendee[],
}

export interface SMTP {
  // The Message-ID; null when the email has none.
  id: string | null,
  from?: SMTPUser[],
  reply_to?: SMTPUser[],
  subject: string,
  to?: SMTPUser[],
  cc?: SMTPUser[],
  bcc?: SMTPUser[],
  text: string,
  html: string,
  raw: string,
  // The list preview carries `{type, label}` only.
  parts?: Array<Pick<SMTPPart, 'type' | 'label'> & Partial<SMTPPart>>,
  calendar?: SMTPCalendar,
}
