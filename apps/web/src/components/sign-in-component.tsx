import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			await authClient.signIn.email(
				{
					email,
					password,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/test-auth",
						});
						toast.success("Sign in successful");
					},
					onError: (error) => {
						const errorMessage = error.error.message || error.error.statusText || "Failed to sign in";
						setError(errorMessage);
						toast.error(errorMessage);
					},
				},
			);
		} catch (err) {
			const errorMessage = "An unexpected error occurred";
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="mx-auto w-full mt-10 max-w-md p-6">
			<h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>

				{error && (
					<p className="text-sm text-red-500">{error}</p>
				)}

				<Button
					type="submit"
					className="w-full"
					disabled={isLoading || !email || !password}
				>
					{isLoading ? "Signing in..." : "Sign In"}
				</Button>
			</form>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={onSwitchToSignUp}
					className="text-indigo-600 hover:text-indigo-800"
				>
					Need an account? Sign Up
				</Button>
			</div>
		</div>
	);
}
