"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitLead } from "@/lib/actions/submit-lead";
import { useTrackEvent } from "@/components/analytics/AnalyticsProvider";
import { getCookie, parseUtmFromSearch } from "@/lib/cookies";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`submit-btn${pending ? " loading" : ""}`}
      disabled={pending}
    >
      <span className="btn-text">Send My Request →</span>
      <div className="spinner" />
    </button>
  );
}

function errCls(
  fieldErrors: Record<string, string[]> | undefined,
  key: string
) {
  return fieldErrors?.[key]?.length ? "error" : "";
}

function showErr(
  fieldErrors: Record<string, string[]> | undefined,
  key: string
) {
  return fieldErrors?.[key]?.length ? "field-error show" : "field-error";
}

export function ContactPage() {
  const [state, formAction] = useFormState(submitLead, undefined);
  const track = useTrackEvent();
  const started = useRef(false);
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });
  const [ids, setIds] = useState({ vid: "", sid: "" });

  useEffect(() => {
    setUtm(parseUtmFromSearch());
    setIds({
      vid: getCookie("bc_vid") ?? "",
      sid: getCookie("bc_sid") ?? "",
    });
    const today = new Date().toISOString().slice(0, 10);
    document
      .querySelectorAll<HTMLInputElement>('input[type="date"]')
      .forEach((el) => {
        if (!el.min) el.min = today;
      });
  }, []);

  const onFormFocus = () => {
    if (!started.current) {
      started.current = true;
      track("form_start", { path: "/contact" });
    }
  };

  if (state?.ok) {
    return (
      <>
        <nav>
          <Link href="/" className="nav-logo">
            <div className="nav-mark">
              <svg
                width="22"
                height="20"
                viewBox="0 0 26 22"
                fill="none"
                stroke="white"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 3 L1 18 L12 21 L12 6 Z" />
                <path d="M25 3 L25 18 L14 21 L14 6 Z" />
                <line x1="12" y1="6" x2="14" y2="6" />
                <polyline points="7,17 11,13 15,16 22,7" />
                <polyline points="18,7 22,7 22,11" />
              </svg>
            </div>
            <div>
              <div className="nav-name">
                <strong>Book</strong>Cover
              </div>
              <div className="nav-sub">
                Managed Member Engagement &amp; Retention Services
              </div>
            </div>
          </Link>
          <Link href="/" className="nav-back">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Overview
          </Link>
        </nav>
        <div className="page-hero">
          <div className="page-hero-inner">
            <div className="success-state show" style={{ paddingTop: 24 }}>
              <div className="success-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1A7A4A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3>Request Received — Thank You</h3>
              <p>
                Your dedicated BookCover consultant will reach out to confirm
                your conversation at the time you&apos;ve selected. We&apos;re
                looking forward to learning more about your members.
              </p>
              <Link href="/" className="back-link">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Overview
              </Link>
            </div>
          </div>
        </div>
        <footer>
          <div>
            <div className="f-name">BookCover</div>
            <div className="f-sub">
              Managed Member Engagement &amp; Retention Services for Health Plans
            </div>
          </div>
          <div className="f-copy">© 2026 BookCover. All rights reserved.</div>
        </footer>
      </>
    );
  }

  const fe = state?.fieldErrors;

  return (
    <>
      <nav>
        <Link href="/" className="nav-logo">
          <div className="nav-mark">
            <svg
              width="22"
              height="20"
              viewBox="0 0 26 22"
              fill="none"
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 3 L1 18 L12 21 L12 6 Z" />
              <path d="M25 3 L25 18 L14 21 L14 6 Z" />
              <line x1="12" y1="6" x2="14" y2="6" />
              <polyline points="7,17 11,13 15,16 22,7" />
              <polyline points="18,7 22,7 22,11" />
            </svg>
          </div>
          <div>
            <div className="nav-name">
              <strong>Book</strong>Cover
            </div>
            <div className="nav-sub">
              Managed Member Engagement &amp; Retention Services
            </div>
          </div>
        </Link>
        <Link href="/" className="nav-back">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Overview
        </Link>
      </nav>

      <div className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-badge">
            <div className="badge-dot" />
            <span>Let&apos;s Work Together</span>
          </div>
          <h1>
            Tell Us About
            <br />
            Your <span className="gold">Members.</span>
          </h1>
          <p>
            We work with a select group of health plans each year. Fill in the
            form and your dedicated BookCover consultant will be in touch at the
            time that works best for you.
          </p>
        </div>
      </div>

      <div className="contact-wrap">
        <div className="form-card" id="form-card">
          {state?.ok === false && state.message && (
            <p
              style={{
                color: "var(--red)",
                marginBottom: 16,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {state.message}
            </p>
          )}
          <form action={formAction} onFocus={onFormFocus}>
            <input type="hidden" name="visitorId" value={ids.vid} />
            <input type="hidden" name="sessionId" value={ids.sid} />
            <input type="hidden" name="utm_source" value={utm.source} />
            <input type="hidden" name="utm_medium" value={utm.medium} />
            <input type="hidden" name="utm_campaign" value={utm.campaign} />

            <span className="form-section-label">Your Contact Information</span>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">
                  First Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Jane"
                  autoComplete="given-name"
                  className={errCls(fe, "firstName")}
                />
                <span className={showErr(fe, "firstName")} id="err-firstName">
                  {fe?.firstName?.[0]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="lastName">
                  Last Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Smith"
                  autoComplete="family-name"
                  className={errCls(fe, "lastName")}
                />
                <span className={showErr(fe, "lastName")} id="err-lastName">
                  {fe?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">
                  Title / Role <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="VP of Member Retention"
                  autoComplete="organization-title"
                  className={errCls(fe, "title")}
                />
                <span className={showErr(fe, "title")} id="err-title">
                  {fe?.title?.[0]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="org">
                  Organization Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="org"
                  name="organization"
                  placeholder="HealthPlan Inc."
                  autoComplete="organization"
                  className={errCls(fe, "organization")}
                />
                <span className={showErr(fe, "organization")} id="err-org">
                  {fe?.organization?.[0]}
                </span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  Work Email Address <span className="req">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="jane@healthplan.com"
                  autoComplete="email"
                  className={errCls(fe, "email")}
                />
                <span className={showErr(fe, "email")} id="err-email">
                  {fe?.email?.[0]}
                </span>
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="(555) 000-0000"
                  autoComplete="tel"
                />
              </div>
            </div>

            <span className="form-section-label">About Your Program</span>
            <div className="form-group">
              <label>
                Lines of Business{" "}
                <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                  (select all that apply)
                </span>
              </label>
              <div className="check-grid" style={{ marginTop: 4 }}>
                {[
                  ["lob-ma", "Medicare Advantage"],
                  ["lob-supp", "Medicare Supplement"],
                  ["lob-dsnp", "Medicaid / D-SNP"],
                  ["lob-aca", "ACA / Individual Market"],
                  ["lob-pdp", "Part D / PDP"],
                  ["lob-other", "Other"],
                ].map(([id, label]) => (
                  <div key={id} className="check-item">
                    <input type="checkbox" id={id} name="lob" value={label} />
                    <label htmlFor={id}>{label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Approximate Member Count</label>
              <div className="radio-group" style={{ marginTop: 4 }}>
                {[
                  ["mc-1", "Under 50,000", "Under 50,000 members"],
                  ["mc-2", "50,000 – 250,000", "50,000 – 250,000 members"],
                  ["mc-3", "250,000 – 1,000,000", "250,000 – 1,000,000 members"],
                  ["mc-4", "Over 1,000,000", "Over 1,000,000 members"],
                ].map(([id, val, lab]) => (
                  <div key={id} className="radio-item">
                    <input
                      type="radio"
                      id={id}
                      name="memberCount"
                      value={val}
                    />
                    <label htmlFor={id}>{lab}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="challenge">
                What&apos;s the biggest retention challenge you&apos;re facing
                right now?
              </label>
              <textarea
                id="challenge"
                name="challenge"
                placeholder="e.g. We struggle to identify at-risk members before AEP..."
              />
            </div>

            <span className="form-section-label">Schedule Your Conversation</span>
            <div className="datetime-row" style={{ marginBottom: 18 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="prefDate">
                  Preferred Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  id="prefDate"
                  name="preferredDate"
                  className={errCls(fe, "preferredDate")}
                />
                <span className={showErr(fe, "preferredDate")} id="err-prefDate">
                  {fe?.preferredDate?.[0]}
                </span>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="prefTime">
                  Preferred Time <span className="req">*</span>
                </label>
                <select
                  id="prefTime"
                  name="preferredTime"
                  defaultValue=""
                  className={errCls(fe, "preferredTime")}
                >
                  <option value="" disabled>
                    Select a time
                  </option>
                  <option value="Morning (8am – 10am)">
                    Morning (8am – 10am)
                  </option>
                  <option value="Mid-Morning (10am – 12pm)">
                    Mid-Morning (10am – 12pm)
                  </option>
                  <option value="Early Afternoon (12pm – 2pm)">
                    Early Afternoon (12pm – 2pm)
                  </option>
                  <option value="Afternoon (2pm – 4pm)">
                    Afternoon (2pm – 4pm)
                  </option>
                  <option value="Late Afternoon (4pm – 6pm)">
                    Late Afternoon (4pm – 6pm)
                  </option>
                </select>
                <span className={showErr(fe, "preferredTime")} id="err-prefTime">
                  {fe?.preferredTime?.[0]}
                </span>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="timezone">
                  Timezone <span className="req">*</span>
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue=""
                  className={errCls(fe, "timezone")}
                >
                  <option value="" disabled>
                    Select timezone
                  </option>
                  <option value="Eastern (ET)">Eastern (ET)</option>
                  <option value="Central (CT)">Central (CT)</option>
                  <option value="Mountain (MT)">Mountain (MT)</option>
                  <option value="Pacific (PT)">Pacific (PT)</option>
                  <option value="Alaska (AKT)">Alaska (AKT)</option>
                  <option value="Hawaii (HT)">Hawaii (HT)</option>
                </select>
                <span className={showErr(fe, "timezone")} id="err-timezone">
                  {fe?.timezone?.[0]}
                </span>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hearAbout">How did you hear about BookCover?</label>
                <select id="hearAbout" name="howHeard" defaultValue="">
                  <option value="" disabled>
                    Select one
                  </option>
                  <option value="Industry conference or event">
                    Industry conference or event
                  </option>
                  <option value="Colleague or peer referral">
                    Colleague or peer referral
                  </option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Web search">Web search</option>
                  <option value="Industry publication or article">
                    Industry publication or article
                  </option>
                  <option value="BookCover outreach">BookCover outreach</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="altDate">Alternate Date (optional)</label>
                <input type="date" id="altDate" name="alternateDate" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="notes">
                Anything else you&apos;d like us to know before we connect?
              </label>
              <textarea
                id="notes"
                name="additionalNotes"
                placeholder="Share any context that will help us prepare..."
              />
            </div>
            <SubmitButton />
            <p className="form-note">
              We typically respond within one business day. Your information is
              used solely to schedule and prepare for our conversation — we
              don&apos;t share it with third parties.
            </p>
          </form>
        </div>

        <div className="sidebar">
          <div className="sidebar-card">
            <span className="sidebar-eyebrow">What Happens Next</span>
            <h3>Your path to a dedicated retention consultant</h3>
            <div className="sidebar-steps">
              {[
                [
                  "1",
                  "We review your request",
                  "Your information is reviewed by our team and matched to the consultant best suited to your lines of business and member population.",
                ],
                [
                  "2",
                  "We confirm your time",
                  "You'll receive a calendar invitation for your preferred date and time, typically within one business day of your request.",
                ],
                [
                  "3",
                  "We come prepared",
                  "Your consultant reviews your program details before the call so we spend our time on strategy, not introductions.",
                ],
                [
                  "4",
                  "We define the opportunity together",
                  "Our first conversation is about understanding your members, your team, and your retention challenges — not pitching software.",
                ],
              ].map(([num, title, txt]) => (
                <div key={num} className="sidebar-step">
                  <div className="step-num">{num}</div>
                  <div>
                    <div className="step-title">{title}</div>
                    <div className="step-txt">{txt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="sidebar-card">
            <span className="sidebar-eyebrow">What We Bring to Every Engagement</span>
            <div className="trust-list">
              {[
                "A dedicated retention consultant assigned to your account",
                "Expert member scoring and engagement analysis",
                "Managed outreach campaigns we run on your behalf",
                "Regular strategy sessions and transparent reporting",
                "White-label member experience under your brand",
                "HIPAA-compliant, CMS-guideline aligned service delivery",
              ].map((t) => (
                <div key={t} className="trust-item">
                  <svg
                    className="trust-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>
            <div className="sidebar-divider" />
            <div className="contact-direct">
              Prefer to reach us directly?
              <br />
              <a href="mailto:carriers@bookcover.com">carriers@bookcover.com</a>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div>
          <div className="f-name">BookCover</div>
          <div className="f-sub">
            Managed Member Engagement &amp; Retention Services for Health Plans
          </div>
        </div>
        <div className="f-copy">© 2026 BookCover. All rights reserved.</div>
      </footer>
    </>
  );
}
