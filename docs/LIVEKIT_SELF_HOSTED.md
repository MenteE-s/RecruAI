# Self-hosted LiveKit for RecruAI

Status: the application and compose wiring are ready. The media host, DNS,
security-group rules, keys, and Vercel flag are still external setup.

## Topology

- **API host**: `docker-compose.aws.yml` (existing API, Kafka, Redis, nginx).
- **Media containers**: `livekit` (SFU + TURN) and `egress` (recording), in the
  `video` Compose profile. They are intentionally not started by default.
- **Browser signaling**: `wss://api.recruai.menteeai.org/livekit/` → nginx →
  `livekit:7880`. nginx strips `/livekit/` so the LiveKit client's `/livekit/rtc`
  request reaches LiveKit's `/rtc` endpoint.
- **Media**: WebRTC UDP `50000-50050`, ICE TCP `7881`, ICE TCP/UDP `7882`,
  TURN TCP/UDP `3478`. These go directly to the host, not through nginx.

The current API instance is a 2 GB `t3.small`. Do **not** enable the video
profile there: LiveKit + Egress + Kafka + Redis + the API do not fit. Resize to
at least `t3.medium` with 4 GB RAM, or move Kafka/Redis to managed services
before enabling video. For a real launch, a dedicated media instance is safer.

## 1. Provision the host

1. Resize the instance or provision a dedicated media host. A 4 GB / 2 vCPU
   instance is the minimum for a small beta with recording.
2. Open these inbound rules in the security group:
   - TCP `7881`
   - TCP and UDP `7882`
   - TCP and UDP `3478`
   - UDP `50000-50050`
3. Keep the signaling port `7880` private; nginx reaches it on the Docker
   network. Do not expose it publicly.

## 2. Generate production keys

```bash
docker run --rm livekit/livekit-server generate-keys
```

Store the key and secret in GitHub Actions secrets:

| Secret | Value |
| --- | --- |
| `LIVEKIT_URL` | `ws://livekit:7880` (internal server API) |
| `LIVEKIT_PUBLIC_URL` | `wss://api.recruai.menteeai.org/livekit/` |
| `LIVEKIT_API_KEY` | generated key |
| `LIVEKIT_API_SECRET` | generated secret |

Do not use the development `devkey` / `devsecret…` values in production.

## 3. Enable the flag

1. In the GitHub repository, add the **variable** `VIDEO_ENABLED=1` (not a
   secret).
2. Set the Vercel production environment variable:
   `REACT_APP_VIDEO_ENABLED=true`.
3. Redeploy the frontend and run the AWS deploy workflow.

The render script fails the deploy if `VIDEO_ENABLED=1` but any LiveKit URL or
key is missing. The backend also validates that `LIVEKIT_PUBLIC_URL` is a
`ws://` or `wss://` URL and warns if production uses insecure `ws://`.

## 4. Verify

- `https://api.recruai.menteeai.org/livekit/` should reach LiveKit (an HTTP
  error/upgrade response is expected; `502` means nginx cannot reach the SFU).
- Open a scheduled video interview while signed in as a participant. The token
  request is `POST /api/interviews/<id>/video-token`.
- Join from two browsers/devices and confirm both camera/microphone streams.
- Start and stop a recording. Check `docker compose logs egress` and the
  `/uploads/recordings/` volume through the interview's recording URL.
- Verify the LiveKit webhook reaches `/api/livekit/webhook`; the recording URL
  is written to the interview only after the `egress_ended` event.

## 5. Recordings and retention

Egress writes MP4 files to the `recordings` Docker volume. The backend and
scheduler mount the same volume so playback and account-purge deletion work.
This is single-host storage: back it up and define a retention period before
using it with real candidates. For multiple media nodes, replace the local file
output with S3 and configure Egress/S3 credentials.

## 6. Rollback

1. Set the GitHub variable `VIDEO_ENABLED=0` and redeploy the backend. The
   deploy stops `livekit` and `egress`.
2. Set Vercel `REACT_APP_VIDEO_ENABLED=false` and redeploy the frontend.
3. The interview screen shows the existing "video interviews are disabled"
   state; text/AI interviews continue to work.

## Known limits

- One LiveKit node and one Egress worker; no HA or horizontal SFU scaling yet.
- TURN is enabled on UDP/TCP `3478`; TURN/TLS `5349` is not configured.
- Recording is local-disk only; no automatic off-host backup.
- The beta billing flag is independent: video can be enabled while
  `REACT_APP_BILLING_ENABLED=false`.
