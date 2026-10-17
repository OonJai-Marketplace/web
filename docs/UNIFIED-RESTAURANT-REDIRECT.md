# Public website compatibility URL

This branch preserves the existing public website and adds a guarded redirect to the unified Restaurant repository's `public-restaurant/` page. It redirects only on the production GitHub Pages hostname and only after the new release's readiness marker is reachable. Query parameters and the current tab fragment are retained. The existing website remains the fallback if the new site is not yet published or its readiness check fails.

Publish after applying the Restaurant-only `public_storefront127` migration and publishing Restaurant release 127. This branch requires no separate database changes and does not send messages or place orders.

The added inline script passes JavaScript syntax checks. The destination source and public-content loader passed the checks recorded in the Restaurant repository. Physical-device redirect and message-app handoff remain unverified in this session.
