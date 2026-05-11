"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTrackEvent } from "@/components/analytics/AnalyticsProvider";
import { getCookie, parseUtmFromSearch } from "@/lib/cookies";

const REDIRECT_MS = 2800;
const FETCH_MS = 60000;

type ModalState =
  | { open: false }
  | {
      open: true;
      title: string;
      body: string;
      isError: boolean;
      redirect: boolean;
    };

export function ContactPage() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const startedRef = useRef(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const track = useTrackEvent();

  const [loading, setLoading] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });
  const [ids, setIds] = useState({ vid: "", sid: "" });

  useEffect(() => {
    setUtm(parseUtmFromSearch());
    setIds({
      vid: getCookie("bc_vid") ?? "",
      sid: getCookie("bc_sid") ?? "",
    });
  }, []);

  useEffect(() => {
    if (loading) {
      document.body.classList.add("interest-no-scroll");
    } else {
      document.body.classList.remove("interest-no-scroll");
    }
    return () => {
      document.body.classList.remove("interest-no-scroll");
    };
  }, [loading]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const showResultModal = (
    title: string,
    body: string,
    isError: boolean,
    redirect: boolean
  ) => {
    setModal({ open: true, title, body, isError, redirect });
    if (redirect) {
      redirectTimerRef.current = setTimeout(() => {
        window.location.href = "/";
      }, REDIRECT_MS);
    }
  };

  const handleFormFocus = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", { path: "/contact" });
    }
  };

  const dismissModal = () => setModal({ open: false });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    const fd = new FormData(form);
    const get = (k: string) => ((fd.get(k) as string) ?? "").trim();
    const payload = {
      name: get("name"),
      email: get("email"),
      company: get("company"),
      phone: get("phone"),
      role: get("role"),
      message: get("message"),
      visitorId: ids.vid,
      sessionId: ids.sid,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
    };

    if (!payload.name || !payload.email) {
      showResultModal(
        "Missing information",
        "Please enter your full name and work email.",
        true,
        false
      );
      return;
    }

    setLoading(true);
    setSubmitDisabled(true);
    let lockUntilRedirect = false;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_MS);

    try {
      const res = await fetch("/api/bookcover-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });

      let data: { error?: string } = {};
      try {
        data = (await res.json()) as { error?: string };
      } catch {
        data = {};
      }

      setLoading(false);

      if (!res.ok) {
        showResultModal(
          "Something went wrong",
          data.error ??
            "Submission failed. Please try again or email info@cercalabs.com.",
          true,
          true
        );
        lockUntilRedirect = true;
        return;
      }

      track("form_submit", { path: "/contact", role: payload.role || null });
      form.reset();
      showResultModal(
        "Thank you",
        "Your interest is on file. The CercaLabs team will be in touch.",
        false,
        true
      );
      lockUntilRedirect = true;
    } catch (err) {
      setLoading(false);
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const msg = isAbort
        ? "The request took too long. Check your connection and try again, or email info@cercalabs.com."
        : err instanceof Error
          ? err.message
          : "Submission failed. Please try again.";
      console.error("[interest-form]", err);
      showResultModal("Something went wrong", msg, true, true);
      lockUntilRedirect = true;
    } finally {
      clearTimeout(timer);
      if (!lockUntilRedirect) {
        setSubmitDisabled(false);
      }
    }
  };

  return (
    <div className="interest-page">
      <div className="interest-wrap">
        <Link className="interest-back" href="/">
          ← Back to home
        </Link>

        <div className="interest-card">
          <h1>Join the interest list</h1>
          <p className="sub">
            Tell us a bit about you. We&rsquo;ll follow up from CercaLabs and
            keep your details for launch updates only.
          </p>

          <form
            id="bookcover-interest-form"
            ref={formRef}
            noValidate
            autoComplete="on"
            onSubmit={handleSubmit}
            onFocus={handleFormFocus}
          >
            <input type="hidden" name="visitorId" value={ids.vid} />
            <input type="hidden" name="sessionId" value={ids.sid} />
            <input type="hidden" name="utm_source" value={utm.source} />
            <input type="hidden" name="utm_medium" value={utm.medium} />
            <input type="hidden" name="utm_campaign" value={utm.campaign} />

            <div className="interest-field">
              <label htmlFor="name">
                Full name <span className="req">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                autoComplete="name"
              />
            </div>

            <div className="interest-field">
              <label htmlFor="email">
                Work email <span className="req">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
              />
            </div>

            <div className="interest-field">
              <label htmlFor="company">
                Company / agency / organization
              </label>
              <input
                type="text"
                id="company"
                name="company"
                autoComplete="organization"
              />
            </div>

            <div className="interest-field">
              <label htmlFor="phone">Phone</label>
              <input type="tel" id="phone" name="phone" autoComplete="tel" />
            </div>

            <div className="interest-field">
              <label htmlFor="role">I&rsquo;m interested as</label>
              <select id="role" name="role" defaultValue="">
                <option value="">Select one</option>
                <option value="Carrier - Government Products">
                  Carrier - Government Products
                </option>
                <option value="Carrier - Commercial Products">
                  Carrier - Commercial Products
                </option>
                <option value="Hospital / Provider health system">
                  Hospital / Provider health system
                </option>
                <option value="Independent or field agent">
                  Independent or field agent
                </option>
                <option value="Agency or FMO">Agency or FMO</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="interest-field">
              <label htmlFor="message">Anything else we should know?</label>
              <textarea
                id="message"
                name="message"
                placeholder="Optional — book size, timeline, questions…"
              />
            </div>

            <button
              type="submit"
              className="interest-submit"
              id="submit-btn"
              disabled={submitDisabled}
            >
              <span className="interest-submit-label">Submit</span>
            </button>
          </form>
        </div>
      </div>

      <div
        id="loading-overlay"
        className="interest-loading-overlay"
        hidden={!loading}
        aria-hidden={!loading}
        aria-busy={loading}
      >
        <div className="interest-loading-inner">
          <div className="interest-spinner" aria-hidden="true" />
          <p className="interest-loading-text">Submitting&hellip;</p>
        </div>
      </div>

      <div
        id="result-modal"
        className={`interest-modal-backdrop${
          modal.open && modal.isError ? " is-error" : ""
        }`}
        hidden={!modal.open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-modal-title"
      >
        <div className="interest-modal">
          <h2 id="result-modal-title" className="interest-modal-title">
            {modal.open ? modal.title : ""}
          </h2>
          <p id="result-modal-body" className="interest-modal-body">
            {modal.open ? modal.body : ""}
          </p>
          {modal.open && modal.redirect && (
            <p
              id="result-modal-redirect"
              className="interest-modal-redirect"
            >
              Redirecting to the home page&hellip;
            </p>
          )}
          {modal.open && !modal.redirect && (
            <button
              type="button"
              id="result-modal-dismiss"
              className="interest-modal-dismiss"
              onClick={dismissModal}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
