"use client"

import type { Application, Job } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Building, MapPin, Clock, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"

interface JobApplicationCardProps {
  application: Application
  job: Job
}

export function JobApplicationCard({ application, job }: JobApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "reviewing":
        return "bg-blue-500"
      case "shortlisted":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "hired":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(application.status)}`} />
                <span className="text-sm text-muted-foreground">
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{job.companyName}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {job.location} ({job.locationType})
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Applied{" "}
                  {formatDistanceToNow(
                    (() => {
                      const val = application.appliedAt;
                      if (
                        val &&
                        typeof val === "object" &&
                        "toDate" in val &&
                        typeof (val as { toDate: unknown }).toDate === "function"
                      ) {
                        return (val as { toDate: () => Date }).toDate();
                      } else if (val instanceof Date) {
                        return val;
                      } else if (
                        val &&
                        typeof val === "object" &&
                        "seconds" in val &&
                        typeof (val as { seconds: unknown }).seconds === "number"
                      ) {
                        return new Date((val as { seconds: number }).seconds * 1000);
                      } else {
                        return new Date();
                      }
                    })()
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/jobs/${job.id}`}>View Job</Link>
            </Button>

            <Button asChild variant="outline" size="sm">
              <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                Resume
              </a>
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href="/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
