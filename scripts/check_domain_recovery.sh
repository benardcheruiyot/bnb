#!/usr/bin/env bash
set -euo pipefail

# Quick DNS + HTTP/HTTPS checks after migration
#
# Usage:
#   ./scripts/check_domain_recovery.sh extracash.mkopaji.com 153.75.247.188

DOMAIN="${1:-}"
EXPECTED_IP="${2:-}"

if [[ -z "$DOMAIN" || -z "$EXPECTED_IP" ]]; then
  echo "Usage: $0 <domain> <expected-ip>"
  exit 1
fi

if command -v dig >/dev/null 2>&1; then
  DNS_GOOGLE="$(dig +short A "$DOMAIN" @8.8.8.8 | tail -n1)"
  DNS_CLOUDFLARE="$(dig +short A "$DOMAIN" @1.1.1.1 | tail -n1)"
else
  DNS_GOOGLE="$(nslookup "$DOMAIN" 8.8.8.8 2>/dev/null | awk '/^Address: / {print $2}' | tail -n1)"
  DNS_CLOUDFLARE="$(nslookup "$DOMAIN" 1.1.1.1 2>/dev/null | awk '/^Address: / {print $2}' | tail -n1)"
fi

echo "Domain: $DOMAIN"
echo "Expected IP: $EXPECTED_IP"
echo "Google DNS A: ${DNS_GOOGLE:-<none>}"
echo "Cloudflare DNS A: ${DNS_CLOUDFLARE:-<none>}"

if [[ "$DNS_GOOGLE" == "$EXPECTED_IP" || "$DNS_CLOUDFLARE" == "$EXPECTED_IP" ]]; then
  echo "DNS check: PASS"
else
  echo "DNS check: WARN (propagation may still be in progress)"
fi

echo
echo "HTTP checks"
set +e
curl -I "http://$DOMAIN" --max-time 12
HTTP_RC=$?
curl -I "https://$DOMAIN" --max-time 12
HTTPS_RC=$?
curl -sS "https://$DOMAIN/api/health" --max-time 12
HEALTH_RC=$?
set -e

echo
if [[ $HTTP_RC -eq 0 ]]; then echo "HTTP: PASS"; else echo "HTTP: FAIL"; fi
if [[ $HTTPS_RC -eq 0 ]]; then echo "HTTPS: PASS"; else echo "HTTPS: FAIL"; fi
if [[ $HEALTH_RC -eq 0 ]]; then echo "API health: PASS"; else echo "API health: FAIL"; fi
