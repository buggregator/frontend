import type { Meta, StoryObj } from "@storybook/vue3-vite";
import SmtpInsights from "./smtp-insights.vue";

export default {
  title: "Entities/SMTP/SmtpInsights",
  component: SmtpInsights,
} as Meta<typeof SmtpInsights>;

export const Default: StoryObj<typeof SmtpInsights> = {
  args: {
    groups: [
      {
        title: "Deliverability",
        findings: [
          { severity: "pass", title: "All required headers present" },
          { severity: "warning", title: "No plain-text alternative", detail: "Best practice is to include a text/plain part alongside text/html." },
          { severity: "info", title: "Subject line is 82 chars", detail: "Subjects over 78 characters may be truncated on mobile devices." },
        ],
      },
      {
        title: "Content QA",
        findings: [
          { severity: "warning", title: "1 empty link href(s)", detail: 'Links with empty href="" will not navigate anywhere.' },
          { severity: "info", title: "2 HTTP link(s) (not HTTPS)", detail: "Consider using HTTPS for all links." },
          { severity: "warning", title: "3 image(s) missing alt text", detail: "Screen readers and image-blocked clients need alt attributes." },
        ],
      },
      {
        title: "Compatibility",
        findings: [
          { severity: "pass", title: "Dark mode support detected" },
          { severity: "error", title: "External stylesheet detected", detail: "External CSS files are not supported in email clients. Use inline styles." },
        ],
      },
      {
        title: "Security",
        findings: [
          { severity: "info", title: "1 likely tracking pixel(s)", detail: "Small or hidden images are commonly used for open tracking." },
          { severity: "info", title: "References 2 external domain(s)", detail: "laravel.com, example.com" },
        ],
      },
    ],
  },
};

export const AllPassing: StoryObj<typeof SmtpInsights> = {
  args: {
    groups: [
      { title: "Deliverability", findings: [{ severity: "pass", title: "No deliverability issues found" }] },
      { title: "Content QA", findings: [{ severity: "pass", title: "Content looks good" }] },
      { title: "Compatibility", findings: [{ severity: "pass", title: "No compatibility issues found" }] },
      { title: "Security", findings: [{ severity: "pass", title: "No security concerns found" }] },
    ],
  },
};
