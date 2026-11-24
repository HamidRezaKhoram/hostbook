#!/usr/bin/env bash
# One-time: sign the dev container in to Firebase so scripts/deploy-rules.sh can deploy.
# Run it in your own terminal (it's interactive): open the link it prints, approve, paste the code back.
# The login is kept in the hostbook-config container volume.
exec "$(dirname "$0")/ct.sh" npx firebase login --no-localhost
