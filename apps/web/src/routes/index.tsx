import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@tuto/backend/convex/_generated/api";
import { CONVEX_HTTP_URL } from "@/lib/constant";
import { useToken } from "@/lib/hooks";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));
	const testData = useQuery({
		queryKey: ["testData"],
		queryFn: async () => {
			const res = await fetch(`${CONVEX_HTTP_URL}/`);
			console.log(res);
			return await res.json();
		},
	});

	// Test the getToken endpoint
	const tokenTest = useQuery({
		queryKey: ["tokenTest"],
		queryFn: async () => {
			const res = await fetch(`${CONVEX_HTTP_URL}/getToken?roomName=testrooooom&userName=test-userrrrrr`);
			console.log("Token test response:", res);
			if (!res.ok) {
				throw new Error(`Token test failed: ${res.status}`);
			}
			return await res.text();
		},
		enabled: false, // Only run when manually triggered
	});
	
	console.log(testData.data);
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
			<div className="container mx-auto max-w-2xl px-6 py-16">
				<div className="space-y-8">
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
							Get Stack
						</h1>
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							API Status
						</p>
						<p className="text-sm text-zinc-600 dark:text-zinc-400">{testData.data?.message}</p>
					</div>

					<div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
						<div className="flex items-center gap-3">
							<div
								className={`h-2.5 w-2.5 rounded-full ${
									healthCheck.data === "OK"
										? "bg-green-500"
										: healthCheck.isLoading
											? "bg-orange-400"
											: "bg-red-500"
								}`}
							/>
							<span className="text-sm text-zinc-700 dark:text-zinc-300">
								{healthCheck.isLoading
									? "Checking..."
									: healthCheck.data === "OK"
										? "Connected"
										: "Error"}
							</span>
						</div>
					</div>

					<div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
						<div className="space-y-4">
							<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
								LiveKit Token Test
							</h3>
							<button
								onClick={() => tokenTest.refetch()}
								disabled={tokenTest.isLoading}
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
							>
								{tokenTest.isLoading ? "Testing..." : "Test Token Endpoint"}
							</button>
							{tokenTest.data && (
								<div className="text-sm text-green-600 dark:text-green-400">
									✅ Token received: {tokenTest.data.substring(0, 20)}...
								</div>
							)}
							{tokenTest.error && (
								<div className="text-sm text-red-600 dark:text-red-400">
									❌ Error: {tokenTest.error.message}
								</div>
							)}
						</div>
					</div>

					<div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
						<div className="space-y-4">
							<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
								LearnBetter Meetings
							</h3>
							<p className="text-sm text-zinc-600 dark:text-zinc-400">
								Start or join video conference meetings
							</p>
							<a
								href="/meetings"
								className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
							>
								Go to Meetings
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
