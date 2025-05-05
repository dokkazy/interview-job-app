import Image from "next/image"

export function HeroSection() {
  return (
    <section className="py-20 flex flex-col md:flex-row items-center gap-10">
      <div className="flex-1 space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">Find Your Dream Job or Perfect Candidate</h1>
        <p className="text-xl text-muted-foreground">
          Connect with opportunities and talent in real-time with video interviews and instant messaging.
        </p>
      </div>
      <div className="flex-1 relative h-[400px] w-full">
        <Image
          src="/hero.webp"
          alt="Job seekers and recruiters connecting"
          fill
          className="object-contain"
          priority
        />
      </div>
    </section>
  )
}
