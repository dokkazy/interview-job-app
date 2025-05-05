import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HeroSection } from "@/components/sections/home/hero-section"
import { FeaturedJobs } from "@/components/sections/home/featured-jobs"
import { HowItWorks } from "@/components/sections/home/how-it-works"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <HeroSection />
      <FeaturedJobs />
      <HowItWorks />

      <section className="my-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/register?role=job-seeker">I&apos;m a Job Seeker</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/register?role=recruiter">I&apos;m a Recruiter</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
