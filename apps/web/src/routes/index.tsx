import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "@tuto/backend/convex/_generated/api";
import { CONVEX_HTTP_URL } from "@/lib/constant";

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
				</div>
			</div>
		</div>
	);
}
