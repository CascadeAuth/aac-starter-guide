Canonical: https://docs.cascadeauth.com/privacy/

Applies to: AAC platform · developer beta

Documentation revision: da68729e34b2ed4a1b8d9089b562f844198ef575

---

# Privacy

This page explains documentation access records and first-party onboarding
measurement, why we use them, and how long we keep them. The website sections
apply to every page under `https://docs.cascadeauth.com/`, to the
company home page at `https://cascadeauth.com/` (and `https://www.cascadeauth.com/`,
which forwards to it), which the same edge serves, and to the
`https://docs.cascadeauth.dev/` address that forwards to the documentation.

## What is recorded

The site is static pages served through a content delivery edge. The edge
writes one access-log entry per request. Each entry contains:

- the IP address the request came from;
- the country the edge derived from that address, and the network operator's
  number;
- the browser or program identification string the client sent (the
  User-Agent);
- the site name you asked for (the documentation site or the company home
  page) and the page or file requested, without any query string, the time
  and the response status;
- the referring address, if your browser sent one, exactly as it was sent.
  For a link followed within this site that is the full address of the
  previous page, including any query string it had;
- the request method and protocol, the size of the response, which edge
  location answered and whether it answered from its cache.

Cookies and other request headers are not recorded. The site sets no
cookies, loads no analytics or third-party scripts, and uses no
fingerprinting. The forwarding address keeps no access logs.

## Why

We use the access logs to understand where the documentation is read from and
by what kind of reader: people, search engines, or AI agents and other
automated readers.
This helps us decide what to write next and where readers are. We also use
them to investigate availability problems and abuse.

## How long

Raw access logs are deleted **90 days** after they are written. From them we
produce aggregated reports that contain counts only, by country, approximate
region and city, reader type, page and day. The reports contain no IP
addresses and are kept.

Region and city are derived from the IP address using the DB-IP Lite
database by [DB-IP](https://db-ip.com), under the Creative Commons
Attribution 4.0 (CC BY 4.0) license, and are approximate.

## Where

The edge and the log storage run on Amazon Web Services. The pages themselves
are published from GitHub Pages, which serves the content to the edge; GitHub's
own service records are governed by [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## Onboarding and first execution

AAC CLI registration and setup automatically send a small set of first-party
observations to the AAC control plane selected in your configuration. These
let us understand whether setup reaches a first successful agent execution.
They contain a random journey identifier shared by profiles in one CLI home,
start/failure/cancellation categories, preparation status, and optional
client-declared source/context labels. The server links newly created tenants
to that journey. With central telemetry configured, the sender can report a
successful dispatch whose receipt it verified. A graph view alone does not
count as successful execution.

The onboarding records contain no contact address, sign-in identity, IP,
browser history, private key, credential or workflow payload. The private
journey-update key is stored locally; only its hash is kept by the collector.
Tenant identifiers are used internally to link progress and never appear in
the aggregate reports. Receipt contents remain local. This measurement does
not link your website browsing to CLI use, use cookies or fingerprinting,
or send events to a third-party analytics service. Other operational records,
including website access logs and API access/security logs, keep their existing
purpose and retention. API logs can record request paths, including tenant
identifiers in tenant-scoped routes. Observation keys and bodies are not added
to application logs. The 30-day rule below applies to the dedicated onboarding
tables, not to these separate operational records.

Individual onboarding records expire **30 days after the first observation**;
retries do not extend that period. Reports exclude expired records immediately.
The admin service deletes them at startup and hourly; a service outage can
delay physical cleanup. Existing database backup retention still applies,
and expired records are purged after restoration before reporting. Aggregate
reports contain counts and timing summaries only and may be kept longer.
The CLI replaces expired local journey state on its next use; an inactive
CLI home remains under your control.

Collection is best effort and does not change registration or setup outcomes.
A journey represents an installation and endpoint, not a verified person;
the same person using another installation can count again. Source labels
are client-declared, and missing source stays unknown. We do not treat
internal tests or assisted runs as evidence of organic adoption.

## Contact

Questions about this page: <support@cascadeauth.com>.
