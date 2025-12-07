import { Toaster } from "@/components/ui/sonner";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import {
	HeadContent,
	Outlet,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import appCss from "../index.css?url";
import type { QueryClient } from "@tanstack/react-query";

import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@tuto/api/routers/index";
import { ThemeProvider } from "@/components/theme-provider";

if (import.meta.env.DEV) {
	import("react-grab");
}

export interface RouterAppContext {
	trpc: TRPCOptionsProxy<AppRouter>;
	queryClient: QueryClient;
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

	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
				{import.meta.env.DEV && (
					<script type="module">
						{`import("react-grab");`}
					</script>
				)}
			</head>
			<body>
				<ThemeProvider> 
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Outlet />
					</div>
					<Toaster richColors />
					<TanStackRouterDevtools position="bottom-left" />
					<ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
					<Scripts />
				</ThemeProvider>
			</body>
		</html>
	);
}
