import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const navigate = useNavigate()
	const { data: session } = authClient.useSession()

	useEffect(() => {
		if (session?.user.name) {
			navigate({ to: "/dashboard" })
		}
	}, [session?.user.name])
	return (
		<div className="min-h-screen flex flex-col font-sans">
			<header className="absolute top-6 left-0 w-full z-50 animate-fade-in">
				<div className="container mx-auto px-4 h-16 flex items-center justify-between">
					<div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
						<span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">tuto</span>
					</div>
					<div className="flex items-center gap-4">
						<Link to="/login" className="text-sm font-medium hover:text-primary transition-all duration-300 hover:scale-105">
							Login
						</Link>
						<Link
							to="/meetings"
							className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
						>
							Get Started
						</Link>
						<ModeToggle />
					</div>
				</div>
			</header>

			<main className="flex-1">
				<section className="relative py-24 md:py-32 overflow-hidden">
					<div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
					<div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent"></div>
					<div className="container mx-auto px-4 text-center animate-fade-in">
						<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent animate-slide-up">
							Live Classes, <br className="hidden md:block" />
							<span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Effortlessly</span>
						</h1>
						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up [animation-delay:100ms]">
							A platform for teachers to conduct live classes with students. Record your sessions automatically and make them available instantly.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:200ms]">
							<Link
								to="/meetings"
								className="group w-full sm:w-auto h-11 px-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/40"
							>
								Start Teaching <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
							</Link>
							<Link
								to="/login"
								className="w-full sm:w-auto h-11 px-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-center font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
							>
								Join as Student
							</Link>
						</div>
					</div>
				</section>
				<section className="py-20 bg-muted/30 border-y border-border/50">
					<div className="container mx-auto px-4">
						<div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
							<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for Teaching</h2>
							<p className="text-muted-foreground text-lg">
								Everything you need to create engaging live classes and share knowledge with your students.
							</p>
						</div>
						<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
							<FeatureCard
								title="Live Classes"
								description="Create and join live sessions instantly. High-quality video and audio for seamless interaction between teachers and students."
							/>
							<FeatureCard
								title="Auto Recording"
								description="Every class is automatically recorded. Students can review lessons anytime, making learning more flexible and accessible."
							/>
							<FeatureCard
								title="Simple & Clean"
								description="A minimal interface that lets you focus on what matters - teaching and learning. No distractions, just pure education."
							/>
						</div>
					</div>
				</section>

				<section className="py-20">
					<div className="container mx-auto px-4">
						<div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
							<h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
							<p className="text-muted-foreground text-lg">
								Simple steps to start teaching or learning online
							</p>
						</div>
						<div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
							<div className="text-center animate-fade-in [animation-delay:100ms] group">
								<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
									1
								</div>
								<h3 className="font-semibold text-lg mb-2">Create or Join</h3>
								<p className="text-muted-foreground">Teachers create classes, students join with a simple link</p>
							</div>
							<div className="text-center animate-fade-in [animation-delay:200ms] group">
								<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
									2
								</div>
								<h3 className="font-semibold text-lg mb-2">Teach Live</h3>
								<p className="text-muted-foreground">Conduct interactive sessions with video, audio, and screen sharing</p>
							</div>
							<div className="text-center animate-fade-in [animation-delay:300ms] group">
								<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
									3
								</div>
								<h3 className="font-semibold text-lg mb-2">Access Recordings</h3>
								<p className="text-muted-foreground">Recordings are automatically saved and available immediately after class</p>
							</div>
						</div>
					</div>
				</section>

				<section className="py-20 bg-muted/30">
					<div className="container mx-auto px-4 animate-fade-in">
						<div className="relative rounded-3xl overflow-hidden bg-primary px-6 py-16 md:px-16 md:py-20 text-center max-w-4xl mx-auto group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500">
							<div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
							<div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							<div className="relative z-10">
								<h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
									Ready to start teaching?
								</h2>
								<p className="text-primary-foreground/80 text-lg mb-8">
									Join tuto today and transform the way you teach online
								</p>
								<Link
									to="/meetings"
									className="inline-flex h-12 items-center justify-center rounded-md bg-background text-foreground px-8 text-sm font-medium shadow-lg transition-all duration-300 hover:bg-background/90 hover:scale-105 hover:shadow-xl"
								>
									Get Started for Free
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t border-border bg-background py-8">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2 font-bold text-lg">
							<span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">tuto</span>
						</div>
						<p>© 2024 Tuto. A platform for live teaching.</p>
						<div className="flex gap-6">
							<a href="#" className="hover:text-foreground transition-all duration-300 hover:scale-105">Privacy</a>
							<a href="#" className="hover:text-foreground transition-all duration-300 hover:scale-105">Terms</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

function FeatureCard({ title, description }: { title: string; description: string }) {
	return (
		<div className="group p-6 rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 animate-fade-in">
			<div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			<h3 className="relative font-semibold text-xl mb-3 group-hover:text-primary transition-colors duration-300">{title}</h3>
			<p className="relative text-muted-foreground leading-relaxed">{description}</p>
		</div>
	);
}
