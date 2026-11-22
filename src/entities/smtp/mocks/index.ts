import smtpAmpMock from './smtp-amp.json';
import smtpCancelMock from './smtp-cancel.json';
import smtpIcsAllDayMock from './smtp-ics-all-day.json';
import smtpInviteMock from './smtp-invite.json';
import smtpOrderMock from './smtp-order.json';
import smtpTextMock from './smtp-text.json';
import smtpWatchMock from './smtp-watch.json';
import smtpWelcomeMock from './smtp-welcome.json';

// smtp-invite, -cancel, -watch, -amp, -ics-all-day: real events of the
// server (#6828 fixtures in modules/smtp/testdata) sent over SMTP (#6829).
export {
  smtpAmpMock,
  smtpCancelMock,
  smtpIcsAllDayMock,
  smtpInviteMock,
  smtpOrderMock,
  smtpTextMock,
  smtpWatchMock,
  smtpWelcomeMock,
}
