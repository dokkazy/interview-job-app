import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search, FileText, MessageSquare, Video, Building, Users } from "lucide-react"

export function HowItWorks() {
  return (
    <section className="my-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">How JobConnect Works</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Our platform connects job seekers and recruiters through a streamlined process with real-time communication
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold flex items-center">
            <Users className="mr-2 h-5 w-5" />
            For Job Seekers
          </h3>
          <div className="grid gap-4">
            <StepCard
              number={1}
              title="Create Your Profile"
              description="Sign up and build your professional profile with your skills, experience, and resume"
              icon={<FileText className="h-10 w-10" />}
            />
            <StepCard
              number={2}
              title="Discover Opportunities"
              description="Browse job listings or receive personalized recommendations based on your profile"
              icon={<Search className="h-10 w-10" />}
            />
            <StepCard
              number={3}
              title="Apply With Ease"
              description="Submit applications with just a few clicks and track their status in real-time"
              icon={<Building className="h-10 w-10" />}
            />
            <StepCard
              number={4}
              title="Connect & Interview"
              description="Chat with recruiters and participate in video interviews directly on the platform"
              icon={<Video className="h-10 w-10" />}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold flex items-center">
            <Building className="mr-2 h-5 w-5" />
            For Recruiters
          </h3>
          <div className="grid gap-4">
            <StepCard
              number={1}
              title="Post Job Listings"
              description="Create detailed job postings with all the information candidates need to apply"
              icon={<Building className="h-10 w-10" />}
            />
            <StepCard
              number={2}
              title="Review Applications"
              description="Easily manage and evaluate incoming applications in one organized dashboard"
              icon={<FileText className="h-10 w-10" />}
            />
            <StepCard
              number={3}
              title="Message Candidates"
              description="Initiate conversations with promising candidates through our messaging system"
              icon={<MessageSquare className="h-10 w-10" />}
            />
            <StepCard
              number={4}
              title="Conduct Video Interviews"
              description="Schedule and conduct video interviews without leaving the platform"
              icon={<Video className="h-10 w-10" />}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

interface StepCardProps {
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

function StepCard({ number, title, description, icon }: StepCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          <div className="flex items-center justify-center bg-primary text-primary-foreground p-4 w-16">
            <span className="text-xl font-bold">{number}</span>
          </div>
          <div className="p-4 flex-1">
            <div className="flex items-start justify-between">
              <h4 className="font-medium mb-2">{title}</h4>
              <div className="text-primary">{icon}</div>
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
