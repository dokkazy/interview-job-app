"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Job } from "@/lib/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Building, MapPin, Clock, Edit, Users, Eye, XCircle } from "lucide-react"
import Link from "next/link"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

interface JobListingCardProps {
  job: Job
  showApplicantsCount?: boolean
  applicationsCount?: number
}

export function JobListingCard({
  job,
  showApplicantsCount = true,
  applicationsCount: initialCount,
}: JobListingCardProps) {
  const [applicationsCount, setApplicationsCount] = useState<number | undefined>(initialCount)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    async function fetchApplicationsCount() {
      if (!showApplicantsCount || initialCount !== undefined) return

      try {
        const applicationsQuery = query(collection(db, "applications"), where("jobId", "==", job.id))

        const applicationsSnapshot = await getDocs(applicationsQuery)
        setApplicationsCount(applicationsSnapshot.size)
      } catch (error) {
        console.error("Error fetching applications count:", error)
      }
    }

    fetchApplicationsCount()
  }, [job.id, showApplicantsCount, initialCount])

  const handleCloseJob = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (closing) return

    setClosing(true)

    try {
      await updateDoc(doc(db, "jobs", job.id), {
        status: "closed",
      })

      toast.success("The job listing has been closed")

      // Refresh the page to update the UI
      window.location.reload()
    } catch (error) {
      console.error("Error closing job:", error)
      toast.error("There was a problem closing the job. Please try again later.")
    } finally {
      setClosing(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <Badge variant={job.status === "active" ? "default" : "outline"}>
                {job.status === "active" ? "Active" : job.status === "draft" ? "Draft" : "Closed"}
              </Badge>
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
                  Posted{" "}
                  {formatDistanceToNow(
                    (() => {
                      const val = job.postedAt;
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

            {showApplicantsCount && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                <span>
                  {applicationsCount !== undefined
                    ? `${applicationsCount} application${applicationsCount !== 1 ? "s" : ""}`
                    : "Loading applications..."}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 px-6 py-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/jobs/${job.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>

        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/jobs/edit/${job.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>

        {job.status === "active" && (
          <Button variant="outline" size="sm" onClick={handleCloseJob}>
            <XCircle className="mr-2 h-4 w-4" />
            {closing ? "Closing..." : "Close"}
          </Button>
        )}

        {showApplicantsCount && applicationsCount && applicationsCount > 0 && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/jobs/${job.id}/applications`}>
              <Users className="mr-2 h-4 w-4" />
              View Applicants
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
