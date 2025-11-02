import { Toaster } from "@/components/ui/sonner";

import {
	Outlet,
	createRootRouteWithContext,
	useRouterState,
	useRouteContext,
	Scripts,
	HeadContent, 
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "../components/header";
import appCss from "../index.css?url";
import Loader from "@/components/loader";
import { createServerFn } from '@tanstack/react-start'
import { QueryClient } from '@tanstack/react-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexReactClient } from 'convex/react'
import { getCookie, getRequest } from '@tanstack/react-start/server'
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { fetchSession, getCookieName } from '@convex-dev/better-auth/react-start'
import { authClient } from "@/lib/auth-client";



// Get auth information for SSR using available cookies
const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { createAuth } = await import('@tuto/backend/convex/auth')
  const { session } = await fetchSession(getRequest())
  const sessionCookieName = getCookieName(createAuth)
  const token = getCookie(sessionCookieName)
  return {
    userId: session?.user.id,
    token,
  }
})


export interface RouterAppContext {
	queryClient: QueryClient;
	convexClient: ConvexReactClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Tuto",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
    beforeLoad: async (ctx) => {
		// all queries, mutations and action made with TanStack Query will be
		// authenticated by an identity token.
		const { userId, token } = await fetchAuth()
		// During SSR only (the only time serverHttpClient exists),
		// set the auth token to make HTTP queries with.
		if (token) {
		  ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
		}
		return { userId, token }
	  },
	component: RootComponent,
});


function RootComponent() {
	const context = useRouteContext({ from: Route.id })
	return (
	  <ConvexBetterAuthProvider
		client={context.convexClient}
		authClient={authClient}
	  >
		<RootDocument>
		  <Outlet />
		</RootDocument>
	  </ConvexBetterAuthProvider>
	)
  }

  function RootDocument({ children }: { children: React.ReactNode }) {
	return (
	  <html lang="en" className="dark">
		<head>
		  <HeadContent />
		</head>
		<body className="bg-neutral-950 text-neutral-50">
		  {children}
		  <Scripts />
		</body>
	  </html>
	)
  }
