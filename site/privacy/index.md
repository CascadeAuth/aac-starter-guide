Canonical: https://docs.cascadeauth.com/privacy/

Applies to: AAC platform · developer beta

Documentation revision: 34e822d9423a0eee7af28f48f4d6ed5942ca5069

---

# Privacy

This page explains what the AAC documentation site records when you read it,
why, and for how long. It applies to every page under `https://docs.cascadeauth.com/`
and to the `https://docs.cascadeauth.dev/` address that forwards to it.

## What is recorded

The site is static pages served through a content delivery edge. The edge
writes one access-log entry per request. Each entry contains:

- the IP address the request came from;
- the country the edge derived from that address, and the network operator's
  number;
- the browser or program identification string the client sent (the
  User-Agent);
- the page or file requested, without any query string, the time and the
  response status;
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

## Contact

Questions about this page: <support@cascadeauth.com>.
